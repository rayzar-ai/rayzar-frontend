"use client";

/**
 * features/charts/components/trading-chart.tsx — RayZar Frontend
 *
 * Layer 1 (2.5a): 7 timeframes, EMA21/50 MA Cloud, VWAP, S/R, prediction arrow,
 *                  earnings markers, volume-vs-avg colouring, AI chat placeholder.
 * Layer 2+3 (2.5b): [Simple][Pro] toggle, 6 click interactions (info drawer),
 *                   Pro overlays (gamma walls, Fibonacci, VWAP bands),
 *                   7 indicator sub-panes (RSI, MACD, ATR, OBV, Stoch, ADX, VolDelta).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type CandlestickData,
  type Time,
  type HistogramData,
  type LineData,
  type SeriesMarker,
} from "lightweight-charts";
import type { OhlcvBar, Signal, EarningsQuarter, OptionsSnapshot, PatternOverlay, InsiderActivity } from "@/lib/api-client";
import type { TAAnalysisResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { rawColors } from "@/styles/tokens";
import { useSignalsStore } from "@/store/signals-store";

// ── Props ─────────────────────────────────────────────────────────────────────

interface TradingChartProps {
  bars: OhlcvBar[];
  ticker: string;
  taAnalysis?: TAAnalysisResponse | null;
  signal?: Signal | null;
  earningsHistory?: EarningsQuarter[];
  optionsSnapshot?: OptionsSnapshot | null;
  insiderActivity?: InsiderActivity | null;
  sectorBars?: OhlcvBar[] | null;
  sectorEtf?: string | null;
  height?: number;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Timeframe  = "5m" | "15m" | "1H" | "4H" | "D" | "W" | "M";
type Indicator  = "RSI" | "MACD" | "BB" | "ATR" | "OBV" | "Stoch" | "ADX" | "VolDelta" | "SectorRS";

/** Context panel shown on chart click. */
interface ClickInfo {
  kind:  "sr" | "earnings" | "signal" | "volume" | "pattern";
  title: string;
  rows:  { label: string; value: string; color?: string }[];
  x: number;
  y: number;
}

// ── Math helpers ──────────────────────────────────────────────────────────────

function computeEma(bars: OhlcvBar[], period: number): LineData[] {
  if (bars.length < period) return [];
  const k    = 2 / (period + 1);
  const seed = bars.slice(0, period).reduce((s, b) => s + b.close, 0) / period;
  const result: LineData[] = [{ time: bars[period - 1].date as Time, value: seed }];
  let ema = seed;
  for (let i = period; i < bars.length; i++) {
    ema = bars[i].close * k + ema * (1 - k);
    result.push({ time: bars[i].date as Time, value: ema });
  }
  return result;
}

function computeVwap(bars: OhlcvBar[]): LineData[] {
  let cumTpv = 0, cumVol = 0;
  return bars.map((b) => {
    const tp = (b.high + b.low + b.close) / 3;
    cumTpv += tp * b.volume;
    cumVol += b.volume;
    return { time: b.date as Time, value: cumVol > 0 ? cumTpv / cumVol : b.close };
  });
}

function computeVwapBands(bars: OhlcvBar[]) {
  let cumTpv = 0, cumVol = 0, cumTp2v = 0;
  const rows = bars.map((b) => {
    const tp = (b.high + b.low + b.close) / 3;
    cumTpv  += tp * b.volume;
    cumVol  += b.volume;
    cumTp2v += tp * tp * b.volume;
    const vwap = cumVol > 0 ? cumTpv / cumVol : b.close;
    const std  = cumVol > 0 ? Math.sqrt(Math.max(0, cumTp2v / cumVol - vwap * vwap)) : 0;
    return { time: b.date as Time, vwap, u1: vwap + std, l1: vwap - std, u2: vwap + 2 * std, l2: vwap - 2 * std };
  });
  return {
    vwap:   rows.map((r) => ({ time: r.time, value: r.vwap })),
    upper1: rows.map((r) => ({ time: r.time, value: r.u1 })),
    lower1: rows.map((r) => ({ time: r.time, value: r.l1 })),
    upper2: rows.map((r) => ({ time: r.time, value: r.u2 })),
    lower2: rows.map((r) => ({ time: r.time, value: r.l2 })),
  };
}

function computeSRLevels(bars: OhlcvBar[], swing = 3): number[] {
  if (bars.length < swing * 2 + 1) return [];
  const levels: number[] = [];
  for (let i = swing; i < bars.length - swing; i++) {
    const lh = bars.slice(i - swing, i).map((b) => b.high);
    const rh = bars.slice(i + 1, i + swing + 1).map((b) => b.high);
    const ll = bars.slice(i - swing, i).map((b) => b.low);
    const rl = bars.slice(i + 1, i + swing + 1).map((b) => b.low);
    if (bars[i].high >= Math.max(...lh) && bars[i].high >= Math.max(...rh)) levels.push(bars[i].high);
    if (bars[i].low  <= Math.min(...ll) && bars[i].low  <= Math.min(...rl)) levels.push(bars[i].low);
  }
  const sorted = levels.sort((a, b) => a - b);
  const deduped: number[] = [];
  for (const level of sorted) {
    const last = deduped[deduped.length - 1];
    if (last === undefined || Math.abs(level - last) / last > 0.005) deduped.push(level);
  }
  return deduped;
}

function computeFibLevels(bars: OhlcvBar[]): { price: number; label: string }[] {
  if (bars.length < 2) return [];
  const recent = bars.slice(-Math.min(90, bars.length));
  const high   = Math.max(...recent.map((b) => b.high));
  const low    = Math.min(...recent.map((b) => b.low));
  const range  = high - low;
  return [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0].map((f) => ({
    price: high - f * range,
    label: `Fib ${(f * 100).toFixed(1)}%`,
  }));
}

function computeVolAvg10(bars: OhlcvBar[]): number[] {
  return bars.map((_, i) => {
    if (i < 9) return 0;
    return bars.slice(i - 9, i + 1).reduce((s, b) => s + b.volume, 0) / 10;
  });
}

function computeSma(bars: OhlcvBar[], period: number): LineData[] {
  return bars
    .map((_, i) => {
      if (i < period - 1) return null;
      const avg = bars.slice(i - period + 1, i + 1).reduce((s, b) => s + b.close, 0) / period;
      return { time: bars[i].date as Time, value: avg };
    })
    .filter((d): d is LineData => d !== null);
}

function computeRsi(bars: OhlcvBar[], period = 14): LineData[] {
  if (bars.length < period + 1) return [];
  const result: LineData[] = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const c = bars[i].close - bars[i - 1].close;
    if (c > 0) avgGain += c; else avgLoss += Math.abs(c);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period; i < bars.length; i++) {
    if (i > period) {
      const c = bars[i].close - bars[i - 1].close;
      avgGain = (avgGain * (period - 1) + Math.max(c, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-c, 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: bars[i].date as Time, value: 100 - 100 / (1 + rs) });
  }
  return result;
}

function computeBollinger(bars: OhlcvBar[], period = 20, stdMult = 2) {
  const upper: LineData[] = [], mid: LineData[] = [], lower: LineData[] = [];
  for (let i = period - 1; i < bars.length; i++) {
    const slice = bars.slice(i - period + 1, i + 1);
    const mean  = slice.reduce((s, b) => s + b.close, 0) / period;
    const std   = Math.sqrt(slice.reduce((s, b) => s + (b.close - mean) ** 2, 0) / period);
    const t     = bars[i].date as Time;
    upper.push({ time: t, value: mean + stdMult * std });
    mid.push({ time: t, value: mean });
    lower.push({ time: t, value: mean - stdMult * std });
  }
  return { upper, mid, lower };
}

function computeMacd(bars: OhlcvBar[], fast = 12, slow = 26, sig = 9) {
  function ema(data: number[], len: number) {
    const k = 2 / (len + 1);
    const r: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) r.push(data[i] * k + r[i - 1] * (1 - k));
    return r;
  }
  const closes  = bars.map((b) => b.close);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdVals = emaSlow.map((s, i) => emaFast[i] - s);
  const sigVals  = ema(macdVals.slice(slow - 1), sig);
  const macdLine: LineData[] = [], signalLine: LineData[] = [], histogram: HistogramData[] = [];
  for (let i = slow - 1; i < bars.length; i++) {
    const t  = bars[i].date as Time;
    const m  = macdVals[i];
    macdLine.push({ time: t, value: m });
    const si = i - (slow - 1) - (sig - 1);
    if (si >= 0 && si < sigVals.length) {
      const sv = sigVals[si];
      signalLine.push({ time: t, value: sv });
      const h  = m - sv;
      histogram.push({ time: t, value: h, color: h >= 0 ? rawColors.chart.macdHistUp : rawColors.chart.macdHistDown });
    }
  }
  return { macdLine, signalLine, histogram };
}

function computeAtr(bars: OhlcvBar[], period = 14): LineData[] {
  if (bars.length < period + 1) return [];
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    trs.push(Math.max(
      bars[i].high - bars[i].low,
      Math.abs(bars[i].high - bars[i - 1].close),
      Math.abs(bars[i].low  - bars[i - 1].close),
    ));
  }
  let atr = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  const result: LineData[] = [{ time: bars[period].date as Time, value: atr }];
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push({ time: bars[i + 1].date as Time, value: atr });
  }
  return result;
}

function computeObv(bars: OhlcvBar[]): LineData[] {
  let obv = 0;
  return bars.map((b, i) => {
    if (i > 0) {
      if (b.close > bars[i - 1].close)      obv += b.volume;
      else if (b.close < bars[i - 1].close) obv -= b.volume;
    }
    return { time: b.date as Time, value: obv };
  });
}

function computeStoch(bars: OhlcvBar[], kPeriod = 14, dPeriod = 3) {
  const k: LineData[] = [];
  for (let i = kPeriod - 1; i < bars.length; i++) {
    const slice = bars.slice(i - kPeriod + 1, i + 1);
    const hi = Math.max(...slice.map((b) => b.high));
    const lo = Math.min(...slice.map((b) => b.low));
    k.push({ time: bars[i].date as Time, value: hi === lo ? 50 : ((bars[i].close - lo) / (hi - lo)) * 100 });
  }
  const d: LineData[] = k
    .map((_, i) => {
      if (i < dPeriod - 1) return null;
      const avg = k.slice(i - dPeriod + 1, i + 1).reduce((s, v) => s + v.value, 0) / dPeriod;
      return { time: k[i].time, value: avg };
    })
    .filter((v): v is LineData => v !== null);
  return { k, d };
}

function computeAdx(bars: OhlcvBar[], period = 14): LineData[] {
  if (bars.length < period * 2 + 2) return [];
  const trs: number[] = [0], pdm: number[] = [0], mdm: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    const tr  = Math.max(bars[i].high - bars[i].low, Math.abs(bars[i].high - bars[i-1].close), Math.abs(bars[i].low - bars[i-1].close));
    const up  = bars[i].high - bars[i-1].high;
    const dn  = bars[i-1].low - bars[i].low;
    trs.push(tr);
    pdm.push(up > dn && up > 0 ? up : 0);
    mdm.push(dn > up && dn > 0 ? dn : 0);
  }
  let atr = trs.slice(1, period + 1).reduce((s, v) => s + v, 0);
  let apd = pdm.slice(1, period + 1).reduce((s, v) => s + v, 0);
  let amd = mdm.slice(1, period + 1).reduce((s, v) => s + v, 0);
  const dxVals: number[] = [];
  for (let i = period + 1; i < bars.length; i++) {
    atr = atr - atr / period + trs[i];
    apd = apd - apd / period + pdm[i];
    amd = amd - amd / period + mdm[i];
    const pdi = atr > 0 ? 100 * apd / atr : 0;
    const mdi = atr > 0 ? 100 * amd / atr : 0;
    const sum = pdi + mdi;
    dxVals.push(sum > 0 ? 100 * Math.abs(pdi - mdi) / sum : 0);
  }
  if (dxVals.length < period) return [];
  let adxVal = dxVals.slice(0, period).reduce((s, v) => s + v, 0) / period;
  const result: LineData[] = [];
  const base = period * 2;
  if (base < bars.length) result.push({ time: bars[base].date as Time, value: adxVal });
  for (let i = period; i < dxVals.length; i++) {
    adxVal = (adxVal * (period - 1) + dxVals[i]) / period;
    const bIdx = i + period + 1;
    if (bIdx < bars.length) result.push({ time: bars[bIdx].date as Time, value: adxVal });
  }
  return result;
}

function computeVolDelta(bars: OhlcvBar[]): HistogramData[] {
  return bars.map((b) => ({
    time:  b.date as Time,
    value: ((b.close - b.open) / (b.high - b.low || 1)) * b.volume,
    color: b.close >= b.open ? "rgba(16,185,129,0.7)" : "rgba(239,68,68,0.7)",
  }));
}

function computeRelativeStrength(
  stockBars: OhlcvBar[],
  sectorBars: OhlcvBar[],
): { stock: LineData[]; sector: LineData[] } {
  if (stockBars.length === 0 || sectorBars.length === 0) return { stock: [], sector: [] };
  const sectorMap = new Map(sectorBars.map((b) => [b.date, b.close]));
  // Find first common date
  const firstCommon = stockBars.find((b) => sectorMap.has(b.date));
  if (!firstCommon) return { stock: [], sector: [] };
  const base = firstCommon.close;
  const sectorBase = sectorMap.get(firstCommon.date)!;
  const stock: LineData[] = [];
  const sector: LineData[] = [];
  for (const b of stockBars) {
    const sc = sectorMap.get(b.date);
    if (sc === undefined) continue;
    stock.push({ time: b.date as Time, value: (b.close / base) * 100 });
    sector.push({ time: b.date as Time, value: (sc / sectorBase) * 100 });
  }
  return { stock, sector };
}

// ── Resampling ─────────────────────────────────────────────────────────────────

function resampleToWeekly(bars: OhlcvBar[]): OhlcvBar[] {
  if (bars.length === 0) return [];
  const weeks = new Map<string, OhlcvBar[]>();
  for (const bar of bars) {
    const d    = new Date(bar.date);
    const day  = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const key  = new Date(d.setDate(diff)).toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(bar);
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, wb]) => ({
      date,
      open:   wb[0].open,
      high:   Math.max(...wb.map((b) => b.high)),
      low:    Math.min(...wb.map((b) => b.low)),
      close:  wb[wb.length - 1].close,
      volume: wb.reduce((s, b) => s + b.volume, 0),
    }));
}

function resampleToMonthly(bars: OhlcvBar[]): OhlcvBar[] {
  if (bars.length === 0) return [];
  const months = new Map<string, OhlcvBar[]>();
  for (const bar of bars) {
    const key = bar.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(bar);
  }
  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, mb]) => ({
      date:   `${key}-01`,
      open:   mb[0].open,
      high:   Math.max(...mb.map((b) => b.high)),
      low:    Math.min(...mb.map((b) => b.low)),
      close:  mb[mb.length - 1].close,
      volume: mb.reduce((s, b) => s + b.volume, 0),
    }));
}

function getDisplayBars(allBars: OhlcvBar[], tf: Timeframe): OhlcvBar[] {
  if (tf === "W") return resampleToWeekly(allBars);
  if (tf === "M") return resampleToMonthly(allBars);
  const windows: Record<Timeframe, number> = { "5m": 5, "15m": 15, "1H": 30, "4H": 90, "D": allBars.length, "W": allBars.length, "M": allBars.length };
  return allBars.slice(-windows[tf]);
}

// ── UI helper: build a sub-chart (shared config) ──────────────────────────────

function buildSubChart(container: HTMLElement, heightPx = 100): IChartApi {
  return createChart(container, {
    layout: {
      background: { type: ColorType.Solid, color: rawColors.chart.bg },
      textColor: rawColors.chart.textLabel,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 10,
    },
    grid: { vertLines: { color: rawColors.chart.grid }, horzLines: { color: rawColors.chart.grid } },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
      horzLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
    },
    rightPriceScale: { borderColor: rawColors.chart.border, textColor: rawColors.chart.textLabel },
    timeScale: { borderColor: rawColors.chart.border, timeVisible: false, secondsVisible: false },
    width: container.clientWidth,
    height: heightPx,
  });
}

// ── Toolbar buttons ───────────────────────────────────────────────────────────

function TfButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "rounded px-2 py-1 font-mono text-xs font-medium transition-all",
      active
        ? "bg-accent-teal/20 text-accent-teal border border-accent-teal/40"
        : "border border-border text-text-secondary hover:border-accent-teal/40 hover:text-accent-teal",
    )}>
      {label}
    </button>
  );
}

function ToggleBtn({ label, active, onClick, disabled, title }: {
  label: string; active: boolean; onClick: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={cn(
      "rounded px-2 py-1 text-xs font-medium transition-all",
      disabled ? "cursor-not-allowed opacity-30" : "",
      !disabled && active  ? "bg-elevated text-text-primary border border-border" : "",
      !disabled && !active ? "border border-transparent text-text-muted hover:text-text-secondary" : "",
    )}>
      {label}
    </button>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "px-3 py-1 text-xs font-semibold transition-all first:rounded-l last:rounded-r border",
      active
        ? "bg-accent-teal/20 text-accent-teal border-accent-teal/40 z-10"
        : "bg-elevated text-text-muted border-border hover:text-text-secondary",
    )}>
      {label}
    </button>
  );
}

// ── Click Info Drawer ─────────────────────────────────────────────────────────

function ClickInfoDrawer({ info, onClose }: { info: ClickInfo; onClose: () => void }) {
  return (
    <div
      className="absolute z-50 rounded-lg border border-border bg-elevated shadow-xl p-3 min-w-[160px] max-w-[220px] text-xs"
      style={{ top: info.y + 12, left: Math.min(info.x + 12, 9999) }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-text-primary">{info.title}</span>
        <button onClick={onClose} className="ml-2 text-text-muted hover:text-text-secondary">✕</button>
      </div>
      {info.rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-text-muted shrink-0">{row.label}</span>
          <span className="font-mono text-right" style={row.color ? { color: row.color } : { color: rawColors.text.secondary }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Sub-pane wrapper ──────────────────────────────────────────────────────────

function SubPaneHeader({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="border-t border-border">
      <div className="flex items-center gap-2 bg-panel px-3 py-1">
        <span className="text-2xs font-semibold text-text-muted">{label}</span>
        {children}
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TradingChart({
  bars,
  ticker,
  taAnalysis,
  signal,
  earningsHistory = [],
  optionsSnapshot,
  insiderActivity,
  sectorBars,
  sectorEtf,
  height = 420,
}: TradingChartProps) {
  // ── Refs ────────────────────────────────────────────────────────────────────
  const containerRef      = useRef<HTMLDivElement>(null);
  const chartWrapRef      = useRef<HTMLDivElement>(null);
  const rsiRef            = useRef<HTMLDivElement>(null);
  const macdRef           = useRef<HTMLDivElement>(null);
  const atrRef            = useRef<HTMLDivElement>(null);
  const obvRef            = useRef<HTMLDivElement>(null);
  const stochRef          = useRef<HTMLDivElement>(null);
  const adxRef            = useRef<HTMLDivElement>(null);
  const volDeltaRef       = useRef<HTMLDivElement>(null);
  const sectorRsRef       = useRef<HTMLDivElement>(null);

  const chartRef      = useRef<IChartApi | null>(null);
  const rsiChartRef   = useRef<IChartApi | null>(null);
  const macdChartRef  = useRef<IChartApi | null>(null);
  const atrChartRef   = useRef<IChartApi | null>(null);
  const obvChartRef   = useRef<IChartApi | null>(null);
  const stochChartRef = useRef<IChartApi | null>(null);
  const adxChartRef   = useRef<IChartApi | null>(null);
  const vdChartRef    = useRef<IChartApi | null>(null);
  const sectorRsChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const overlayPriceLinesRef = useRef<IPriceLine[]>([]);
  const backgroundSeriesRef = useRef<ISeriesApi<"Line">[]>([]); // EMA/SMA/VWAP — hidden during pattern overlay
  const baseMarkersRef = useRef<SeriesMarker<Time>[]>([]);

  // ── Store ────────────────────────────────────────────────────────────────────
  const activePatternOverlay = useSignalsStore((s) => s.activePatternOverlay);

  // ── State ───────────────────────────────────────────────────────────────────
  const [timeframe, setTimeframe]   = useState<Timeframe>("D");
  const [proMode, setProMode]       = useState(false);
  const [showEma, setShowEma]       = useState(true);
  const [showSma200, setShowSma200] = useState(false);
  const [showVwap, setShowVwap]     = useState(false);
  const [showSR, setShowSR]         = useState(true);
  const [showFib, setShowFib]       = useState(false);
  const [showGamma, setShowGamma]   = useState(true);
  const [indicators, setIndicators] = useState<Set<Indicator>>(new Set(["RSI", "SectorRS"]));
  const [clickInfo, setClickInfo]   = useState<ClickInfo | null>(null);
  const [hoverOhlc, setHoverOhlc]   = useState<{
    open: number; high: number; low: number; close: number; date: string;
  } | null>(null);

  const isIntraday = ["5m", "15m", "1H", "4H"].includes(timeframe);

  const getDisplayBarsCallback = useCallback(
    (): OhlcvBar[] => getDisplayBars(bars, timeframe),
    [bars, timeframe],
  );

  function toggleIndicator(ind: Indicator) {
    setIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind); else next.add(ind);
      return next;
    });
  }

  // ── MA Cloud direction ──────────────────────────────────────────────────────
  const displayBarsNow = getDisplayBarsCallback();
  const ema21Last = showEma && displayBarsNow.length >= 21 ? computeEma(displayBarsNow, 21).at(-1)?.value ?? null : null;
  const ema50Last = showEma && displayBarsNow.length >= 50 ? computeEma(displayBarsNow, 50).at(-1)?.value ?? null : null;
  const cloudBull = ema21Last !== null && ema50Last !== null && ema21Last > ema50Last;
  const cloudBear = ema21Last !== null && ema50Last !== null && ema21Last < ema50Last;

  // ── Main chart effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const displayBars = getDisplayBarsCallback();
    if (displayBars.length === 0) return;
    const container = containerRef.current;

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: rawColors.chart.bg },
        textColor: rawColors.chart.textLabel,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11,
      },
      grid: { vertLines: { color: rawColors.chart.grid }, horzLines: { color: rawColors.chart.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
        horzLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: rawColors.chart.border, textColor: rawColors.chart.textLabel, scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: { borderColor: rawColors.chart.border, timeVisible: true, secondsVisible: false, rightOffset: 5 },
      width: container.clientWidth,
      height,
    });
    chartRef.current = chart;

    // Candlestick
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: rawColors.chart.up, downColor: rawColors.chart.down,
      borderUpColor: rawColors.chart.up, borderDownColor: rawColors.chart.down,
      wickUpColor: rawColors.chart.up, wickDownColor: rawColors.chart.down,
    });
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(displayBars.map((b) => ({ time: b.date as Time, open: b.open, high: b.high, low: b.low, close: b.close })));

    // Volume — colour vs 10-bar avg
    const volSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "volume" });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    const volAvg10 = computeVolAvg10(displayBars);
    volSeries.setData(displayBars.map((b, i) => {
      const aboveAvg = volAvg10[i] > 0 && b.volume > volAvg10[i];
      return {
        time:  b.date as Time,
        value: b.volume,
        color: b.close >= b.open
          ? aboveAvg ? "rgba(16,185,129,0.55)" : "rgba(16,185,129,0.18)"
          : aboveAvg ? "rgba(239,68,68,0.55)"  : "rgba(239,68,68,0.18)",
      };
    }));

    // Reset background series list on chart rebuild
    backgroundSeriesRef.current = [];

    // EMA 21/50
    if (showEma) {
      if (displayBars.length >= 21) {
        const s = chart.addSeries(LineSeries, { color: rawColors.accent.teal, lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "EMA21" });
        s.setData(computeEma(displayBars, 21));
        backgroundSeriesRef.current.push(s);
      }
      if (displayBars.length >= 50) {
        const s = chart.addSeries(LineSeries, { color: rawColors.accent.amber, lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "EMA50" });
        s.setData(computeEma(displayBars, 50));
        backgroundSeriesRef.current.push(s);
      }
    }

    // SMA 200
    if (showSma200 && displayBars.length >= 200) {
      const s = chart.addSeries(LineSeries, { color: rawColors.chart.sma200, lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "SMA200" });
      s.setData(computeSma(displayBars, 200));
      backgroundSeriesRef.current.push(s);
    }

    // VWAP (Simple: intraday views; Pro: + bands)
    if (showVwap && isIntraday) {
      if (proMode) {
        const { vwap, upper1, lower1, upper2, lower2 } = computeVwapBands(displayBars);
        const vs = chart.addSeries(LineSeries, { color: "rgba(245,158,11,0.9)", lineWidth: 2, lineStyle: LineStyle.Solid, priceLineVisible: false, lastValueVisible: true, title: "VWAP" });
        vs.setData(vwap);
        backgroundSeriesRef.current.push(vs);
        for (const [data, dash] of [[upper1, LineStyle.Dashed], [lower1, LineStyle.Dashed], [upper2, LineStyle.Dotted], [lower2, LineStyle.Dotted]] as [LineData[], LineStyle][]) {
          const s = chart.addSeries(LineSeries, { color: "rgba(245,158,11,0.35)", lineWidth: 1, lineStyle: dash, priceLineVisible: false, lastValueVisible: false });
          s.setData(data);
          backgroundSeriesRef.current.push(s);
        }
      } else {
        const s = chart.addSeries(LineSeries, { color: "rgba(245,158,11,0.85)", lineWidth: 2, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: true, title: "VWAP" });
        s.setData(computeVwap(displayBars));
        backgroundSeriesRef.current.push(s);
      }
    }

    // Bollinger Bands
    if (indicators.has("BB") && displayBars.length >= 20) {
      const { upper, mid, lower } = computeBollinger(displayBars, 20);
      for (const [data, title] of [[upper, "BB Upper"], [mid, "BB Mid"], [lower, "BB Lower"]] as [LineData[], string][]) {
        const s = chart.addSeries(LineSeries, { color: title === "BB Mid" ? rawColors.chart.bbMid : rawColors.chart.bb, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title });
        s.setData(data);
      }
    }

    // S/R Levels — max 3 closest resistance + 3 closest support to avoid chart clutter
    const srLevels = (showSR && displayBars.length >= 10) ? computeSRLevels(displayBars) : [];
    if (srLevels.length > 0) {
      const currentPrice = displayBars[displayBars.length - 1].close;
      const resistance = srLevels.filter((l) => l > currentPrice).slice(0, 3);  // lowest 3 above price
      const support = srLevels.filter((l) => l <= currentPrice).slice(-3);       // highest 3 below price
      for (const level of [...resistance, ...support]) {
        const isRes = level > currentPrice;
        candleSeries.createPriceLine({ price: level, color: isRes ? "rgba(239,68,68,0.5)" : "rgba(16,185,129,0.5)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });
      }
    }

    // Fibonacci (Pro only)
    if (proMode && showFib) {
      const fibLevels = computeFibLevels(displayBars);
      for (const { price, label } of fibLevels) {
        candleSeries.createPriceLine({ price, color: "rgba(139,92,246,0.5)", lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: label });
      }
    }

    // Gamma Walls (Pro only — call_wall green, put_wall red)
    if (proMode && showGamma && optionsSnapshot) {
      if (optionsSnapshot.call_wall !== null) {
        candleSeries.createPriceLine({ price: optionsSnapshot.call_wall, color: "rgba(16,185,129,0.8)", lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: "Γ Call Wall" });
      }
      if (optionsSnapshot.put_wall !== null) {
        candleSeries.createPriceLine({ price: optionsSnapshot.put_wall, color: "rgba(239,68,68,0.8)", lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: "Γ Put Wall" });
      }
      if (optionsSnapshot.max_pain !== null) {
        candleSeries.createPriceLine({ price: optionsSnapshot.max_pain, color: "rgba(245,158,11,0.6)", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "Max Pain" });
      }
    }

    // TA pattern price lines are shown only when a badge is clicked (see overlay effect below)

    // Markers: earnings + insider + prediction arrow
    const markers: SeriesMarker<Time>[] = [];
    if (earningsHistory.length > 0) {
      const dateSet = new Set(displayBars.map((b) => b.date));
      for (const eq of earningsHistory) {
        if (!dateSet.has(eq.report_date)) continue;
        const color = eq.beat === 1 ? rawColors.chart.up : eq.beat === 0 ? rawColors.chart.down : "#f59e0b";
        markers.push({ time: eq.report_date as Time, position: "belowBar", color, shape: "circle", text: "E", size: 1 });
      }
    }
    // Insider buy/sell markers: group by date, one marker per date
    if (insiderActivity?.transactions.length) {
      const dateSet = new Set(displayBars.map((b) => b.date));
      // Group transactions by date: track net buy/sell per date
      const byDate = new Map<string, { buys: number; sells: number }>();
      for (const txn of insiderActivity.transactions) {
        if (!dateSet.has(txn.date)) continue;
        const entry = byDate.get(txn.date) ?? { buys: 0, sells: 0 };
        if (txn.is_buy) entry.buys += 1;
        if (txn.is_sell) entry.sells += 1;
        byDate.set(txn.date, entry);
      }
      for (const [date, { buys, sells }] of byDate) {
        if (buys > 0) {
          markers.push({ time: date as Time, position: "aboveBar", color: "#10b981", shape: "arrowUp", text: "I", size: 1 });
        }
        if (sells > 0) {
          markers.push({ time: date as Time, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: "I", size: 1 });
        }
      }
    }
    if (signal && signal.signal_class !== "NEUTRAL" && signal.signal_class !== "NO_TRADE" && displayBars.length > 0) {
      const lastBar  = displayBars[displayBars.length - 1];
      const isLong   = signal.signal_class === "LONG" || signal.signal_class === "STRONG_LONG";
      const arrowSz  = Math.max(1, Math.min(3, Math.ceil(signal.confidence * 3)));
      markers.push({ time: lastBar.date as Time, position: isLong ? "aboveBar" : "belowBar", color: isLong ? rawColors.chart.up : rawColors.chart.down, shape: isLong ? "arrowUp" : "arrowDown", text: `${Math.round(signal.confidence * 100)}%`, size: arrowSz });
    }
    const sortedMarkers = [...markers].sort((a, b) => String(a.time).localeCompare(String(b.time)));
    baseMarkersRef.current = sortedMarkers;
    if (sortedMarkers.length > 0) {
      createSeriesMarkers(candleSeries, sortedMarkers);
    }

    // Crosshair hover
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) { setHoverOhlc(null); return; }
      const data = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (data) setHoverOhlc({ open: data.open, high: data.high, low: data.low, close: data.close, date: String(param.time) });
      else setHoverOhlc(null);
    });

    // ── Click interaction handler ──────────────────────────────────────────
    chart.subscribeClick((param) => {
      if (!param.point || !param.time) return;
      const clickedDate  = String(param.time);
      const clickedPrice = candleSeries.coordinateToPrice(param.point.y);
      if (clickedPrice === null) return;

      // 1. Prediction arrow click (last bar)
      if (signal && signal.signal_class !== "NEUTRAL" && displayBars.length > 0) {
        const lastDate = displayBars[displayBars.length - 1].date;
        if (clickedDate === lastDate) {
          setClickInfo({
            kind:  "signal",
            title: "Signal",
            rows: [
              { label: "Class",      value: signal.signal_class },
              { label: "Confidence", value: `${Math.round(signal.confidence * 100)}%` },
              { label: "RayZar Score", value: String(signal.rayzar_score) },
              { label: "Regime",     value: signal.regime },
              ...(signal.no_trade_reason ? [{ label: "Reason", value: signal.no_trade_reason, color: "#f59e0b" }] : []),
              ...(signal.reasoning ? [{ label: "Note", value: signal.reasoning.slice(0, 60) + (signal.reasoning.length > 60 ? "…" : "") }] : []),
            ],
            x: param.point.x, y: param.point.y,
          });
          return;
        }
      }

      // 2. Earnings marker click
      const earningsMatch = earningsHistory.find((eq) => eq.report_date === clickedDate);
      if (earningsMatch) {
        const surprise = earningsMatch.eps_surprise_pct;
        setClickInfo({
          kind:  "earnings",
          title: "Earnings",
          rows: [
            { label: "Date",     value: earningsMatch.report_date },
            { label: "EPS",      value: earningsMatch.eps_actual !== null ? earningsMatch.eps_actual.toFixed(2) : "—" },
            { label: "Est.",     value: earningsMatch.eps_estimate !== null ? earningsMatch.eps_estimate.toFixed(2) : "—" },
            { label: "Surprise", value: surprise !== null ? `${surprise >= 0 ? "+" : ""}${surprise.toFixed(1)}%` : "—", color: surprise !== null ? (surprise >= 0 ? "#10b981" : "#ef4444") : undefined },
            { label: "Result",   value: earningsMatch.beat === 1 ? "Beat" : earningsMatch.beat === 0 ? "Miss" : "—", color: earningsMatch.beat === 1 ? "#10b981" : earningsMatch.beat === 0 ? "#ef4444" : undefined },
          ],
          x: param.point.x, y: param.point.y,
        });
        return;
      }

      // 2b. Insider activity click
      if (insiderActivity?.transactions.length) {
        const insiderOnDate = insiderActivity.transactions.filter((t) => t.date === clickedDate);
        if (insiderOnDate.length > 0) {
          const buys  = insiderOnDate.filter((t) => t.is_buy);
          const sells = insiderOnDate.filter((t) => t.is_sell);
          const formatVal = (v: number | null) =>
            v != null ? (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1e3).toFixed(0)}K`) : "—";
          setClickInfo({
            kind:  "earnings",  // reuse earnings styling
            title: "Insider Activity",
            rows: [
              { label: "Date", value: clickedDate },
              ...(buys.length > 0
                ? [{ label: "Buys", value: `${buys.length} transaction${buys.length > 1 ? "s" : ""}`, color: "#10b981" }]
                : []),
              ...(sells.length > 0
                ? [{ label: "Sells", value: `${sells.length} transaction${sells.length > 1 ? "s" : ""}`, color: "#ef4444" }]
                : []),
              ...(buys[0] ? [{ label: "Insider", value: buys[0].insider.split(" ").slice(0, 2).join(" ") }] : sells[0] ? [{ label: "Insider", value: sells[0].insider.split(" ").slice(0, 2).join(" ") }] : []),
              ...(buys[0]?.value != null ? [{ label: "Buy Value", value: formatVal(buys[0].value), color: "#10b981" }] : []),
              ...(sells[0]?.value != null ? [{ label: "Sell Value", value: formatVal(sells[0].value), color: "#ef4444" }] : []),
            ],
            x: param.point.x, y: param.point.y,
          });
          return;
        }
      }

      // 3. SR level proximity click (within 1% of any SR level)
      if (srLevels.length > 0 && displayBars.length > 0) {
        const currentPrice = displayBars[displayBars.length - 1].close;
        const nearby = srLevels.find((l) => Math.abs(l - clickedPrice) / clickedPrice < 0.012);
        if (nearby !== undefined) {
          const isRes = nearby > currentPrice;
          setClickInfo({
            kind:  "sr",
            title: isRes ? "Resistance" : "Support",
            rows: [
              { label: "Price", value: `$${nearby.toFixed(2)}`, color: isRes ? "#ef4444" : "#10b981" },
              { label: "Type",  value: isRes ? "Resistance" : "Support" },
              { label: "vs Current", value: `${((nearby - currentPrice) / currentPrice * 100).toFixed(1)}%` },
            ],
            x: param.point.x, y: param.point.y,
          });
          return;
        }
      }

      // 4. Volume bar click (always available)
      const barAtTime = displayBars.find((b) => b.date === clickedDate);
      if (barAtTime) {
        const barIdx  = displayBars.findIndex((b) => b.date === clickedDate);
        const avg10   = volAvg10[barIdx] ?? 0;
        const ratio   = avg10 > 0 ? barAtTime.volume / avg10 : null;
        setClickInfo({
          kind:  "volume",
          title: "Volume",
          rows: [
            { label: "Date",   value: clickedDate },
            { label: "Volume", value: (barAtTime.volume / 1e6).toFixed(2) + "M" },
            { label: "10-bar avg", value: avg10 > 0 ? (avg10 / 1e6).toFixed(2) + "M" : "—" },
            { label: "vs Avg", value: (ratio !== null ? `${ratio >= 1 ? "+" : ""}${((ratio - 1) * 100).toFixed(0)}%` : "—"), color: (ratio !== null && ratio > 1.5 ? "#f59e0b" : undefined) },
          ],
          x: param.point.x, y: param.point.y,
        });
        return;
      }

      // Dismiss on empty click
      setClickInfo(null);
    });

    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([entry]) => { if (entry) chart.applyOptions({ width: entry.contentRect.width }); });
    obs.observe(container);

    return () => {
      obs.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [getDisplayBarsCallback, height, showEma, showSma200, showVwap, showSR, showFib, showGamma, isIntraday, proMode, indicators, taAnalysis, signal, earningsHistory, optionsSnapshot, insiderActivity]);

  // ── Pattern overlay effect ───────────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;

    // Remove previous overlay series
    for (const s of overlaySeriesRef.current) {
      try { chart?.removeSeries(s); } catch { /* already removed */ }
    }
    overlaySeriesRef.current = [];

    // Remove previous overlay price lines
    for (const pl of overlayPriceLinesRef.current) {
      try { candleSeries?.removePriceLine(pl); } catch { /* already removed */ }
    }
    overlayPriceLinesRef.current = [];

    // Use amber for pattern overlays (structural, not directional)
    const color = "#f59e0b";

    if (!chart || !candleSeries || !activePatternOverlay) {
      // Overlay cleared — restore base markers and background series
      if (candleSeries) createSeriesMarkers(candleSeries, baseMarkersRef.current);
      for (const s of backgroundSeriesRef.current) {
        try { s.applyOptions({ visible: true }); } catch { /* series removed */ }
      }
      return;
    }

    // Hide EMA/SMA/VWAP lines so only the pattern overlay is visible
    for (const s of backgroundSeriesRef.current) {
      try { s.applyOptions({ visible: false }); } catch { /* series removed */ }
    }

    // Merge pivot markers with existing earnings/signal markers
    if (activePatternOverlay.points && activePatternOverlay.points.length > 0) {
      const pivotMarkers: SeriesMarker<Time>[] = activePatternOverlay.points.map((pt, idx) => ({
        time: pt.date as Time,
        position: "aboveBar" as const,
        color,
        shape: "circle" as const,
        text: `P${idx + 1}`,
        size: 1,
      }));
      const merged = [...baseMarkersRef.current, ...pivotMarkers].sort((a, b) =>
        String(a.time).localeCompare(String(b.time))
      );
      createSeriesMarkers(candleSeries, merged);
    }

    // Render trendlines as LineSeries
    if (activePatternOverlay.trendlines && activePatternOverlay.trendlines.length > 0) {
      for (const tl of activePatternOverlay.trendlines) {
        if (!tl.p1 || !tl.p2) continue;
        const lineColor = tl.style === "dashed" ? `${color}bb` : color;
        const s = chart.addSeries(LineSeries, {
          color: lineColor,
          lineWidth: 1,
          lineStyle: tl.style === "dashed" ? LineStyle.Dashed : LineStyle.Solid,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
          title: "",
        });
        s.setData([
          { time: tl.p1.date as Time, value: tl.p1.price },
          { time: tl.p2.date as Time, value: tl.p2.price },
        ]);
        overlaySeriesRef.current.push(s);
      }
    }

    // Show key levels (target / neckline / breakout) for the active pattern only
    const activeSig = taAnalysis?.signals?.find((s) => s.name === activePatternOverlay.type);
    if (activeSig?.key_levels) {
      // Short label map — only the most useful levels
      const LABEL_MAP: Record<string, string> = {
        target: "Target", neckline: "Neckline", breakout: "Breakout",
        cup_rim: "Rim", stop: "Stop", pole_end: "Pole End",
      };
      for (const [levelName, price] of Object.entries(activeSig.key_levels)) {
        if (typeof price !== "number") continue;
        const label = LABEL_MAP[levelName];
        if (!label) continue; // skip minor levels (cup_bottom, handle_low, etc.)
        const isTarget = levelName === "target";
        const isStop = levelName === "stop";
        const lineColor = isTarget ? "rgba(245,158,11,0.9)" : isStop ? "rgba(239,68,68,0.7)" : "rgba(245,158,11,0.6)";
        const pl = candleSeries.createPriceLine({
          price,
          color: lineColor,
          lineWidth: 1,
          lineStyle: isStop ? LineStyle.Dashed : LineStyle.Solid,
          axisLabelVisible: true,
          title: label,
        });
        overlayPriceLinesRef.current.push(pl);
      }
    }
  }, [activePatternOverlay, taAnalysis]);

  // ── RSI sub-chart ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("RSI") || !rsiRef.current) return;
    const db = getDisplayBarsCallback();
    const data = computeRsi(db, 14);
    if (data.length === 0) return;
    if (rsiChartRef.current) { rsiChartRef.current.remove(); rsiChartRef.current = null; }
    const chart = buildSubChart(rsiRef.current, 100);
    rsiChartRef.current = chart;
    const s = chart.addSeries(LineSeries, { color: rawColors.chart.rsi, lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "RSI 14" });
    s.setData(data);
    s.createPriceLine({ price: 70, color: rawColors.chart.rsiOb, lineWidth: 1, lineStyle: LineStyle.Dashed, title: "OB" });
    s.createPriceLine({ price: 30, color: rawColors.chart.rsiOs, lineWidth: 1, lineStyle: LineStyle.Dashed, title: "OS" });
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(rsiRef.current);
    return () => { obs.disconnect(); chart.remove(); rsiChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback]);

  // ── MACD sub-chart ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("MACD") || !macdRef.current) return;
    const db = getDisplayBarsCallback();
    if (db.length < 35) return;
    const { macdLine, signalLine, histogram } = computeMacd(db);
    if (macdChartRef.current) { macdChartRef.current.remove(); macdChartRef.current = null; }
    const chart = buildSubChart(macdRef.current, 100);
    macdChartRef.current = chart;
    chart.addSeries(HistogramSeries, { color: rawColors.chart.macd, priceScaleId: "right" }).setData(histogram);
    chart.addSeries(LineSeries, { color: rawColors.chart.macd, lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "MACD" }).setData(macdLine);
    chart.addSeries(LineSeries, { color: rawColors.chart.macdSignal, lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "Signal" }).setData(signalLine);
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(macdRef.current!);
    return () => { obs.disconnect(); chart.remove(); macdChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback]);

  // ── ATR sub-chart ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("ATR") || !atrRef.current) return;
    const db   = getDisplayBarsCallback();
    const data = computeAtr(db, 14);
    if (data.length === 0) return;
    if (atrChartRef.current) { atrChartRef.current.remove(); atrChartRef.current = null; }
    const chart = buildSubChart(atrRef.current, 90);
    atrChartRef.current = chart;
    chart.addSeries(LineSeries, { color: "#a78bfa", lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "ATR 14" }).setData(data);
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(atrRef.current!);
    return () => { obs.disconnect(); chart.remove(); atrChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback]);

  // ── OBV sub-chart ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("OBV") || !obvRef.current) return;
    const db   = getDisplayBarsCallback();
    const data = computeObv(db);
    if (data.length === 0) return;
    if (obvChartRef.current) { obvChartRef.current.remove(); obvChartRef.current = null; }
    const chart = buildSubChart(obvRef.current, 90);
    obvChartRef.current = chart;
    chart.addSeries(LineSeries, { color: rawColors.accent.teal, lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "OBV" }).setData(data);
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(obvRef.current!);
    return () => { obs.disconnect(); chart.remove(); obvChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback]);

  // ── Stochastic sub-chart ────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("Stoch") || !stochRef.current) return;
    const db = getDisplayBarsCallback();
    const { k, d } = computeStoch(db, 14, 3);
    if (k.length === 0) return;
    if (stochChartRef.current) { stochChartRef.current.remove(); stochChartRef.current = null; }
    const chart = buildSubChart(stochRef.current, 90);
    stochChartRef.current = chart;
    chart.addSeries(LineSeries, { color: "#60a5fa", lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "%K" }).setData(k);
    chart.addSeries(LineSeries, { color: "#f97316", lineWidth: 1, priceLineVisible: false, lastValueVisible: true, title: "%D" }).setData(d);
    const kSeries = chart.addSeries(LineSeries, { color: "transparent", priceLineVisible: false, lastValueVisible: false });
    kSeries.setData(k);
    kSeries.createPriceLine({ price: 80, color: "rgba(239,68,68,0.4)", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "OB" });
    kSeries.createPriceLine({ price: 20, color: "rgba(16,185,129,0.4)", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "OS" });
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(stochRef.current!);
    return () => { obs.disconnect(); chart.remove(); stochChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback]);

  // ── ADX sub-chart ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("ADX") || !adxRef.current) return;
    const db   = getDisplayBarsCallback();
    const data = computeAdx(db, 14);
    if (data.length === 0) return;
    if (adxChartRef.current) { adxChartRef.current.remove(); adxChartRef.current = null; }
    const chart = buildSubChart(adxRef.current, 90);
    adxChartRef.current = chart;
    const s = chart.addSeries(LineSeries, { color: "#fb923c", lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: "ADX 14" });
    s.setData(data);
    s.createPriceLine({ price: 25, color: "rgba(251,146,60,0.4)", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Trend" });
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(adxRef.current!);
    return () => { obs.disconnect(); chart.remove(); adxChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback]);

  // ── VolDelta sub-chart ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("VolDelta") || !volDeltaRef.current) return;
    const db   = getDisplayBarsCallback();
    const data = computeVolDelta(db);
    if (data.length === 0) return;
    if (vdChartRef.current) { vdChartRef.current.remove(); vdChartRef.current = null; }
    const chart = buildSubChart(volDeltaRef.current, 90);
    vdChartRef.current = chart;
    chart.addSeries(HistogramSeries, { priceScaleId: "right" }).setData(data);
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(volDeltaRef.current!);
    return () => { obs.disconnect(); chart.remove(); vdChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback]);

  // ── Sector RS sub-chart ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("SectorRS") || !sectorRsRef.current || !sectorBars?.length) return;
    const db = getDisplayBarsCallback();
    const { stock, sector } = computeRelativeStrength(db, sectorBars);
    if (stock.length === 0) return;
    if (sectorRsChartRef.current) { sectorRsChartRef.current.remove(); sectorRsChartRef.current = null; }
    const chart = buildSubChart(sectorRsRef.current, 100);
    sectorRsChartRef.current = chart;
    chart.addSeries(LineSeries, {
      color: rawColors.accent.teal,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: ticker,
    }).setData(stock);
    chart.addSeries(LineSeries, {
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: true,
      title: sectorEtf ?? "Sector",
    }).setData(sector);
    chart.timeScale().fitContent();
    const obs = new ResizeObserver(([e]) => { if (e) chart.applyOptions({ width: e.contentRect.width }); });
    obs.observe(sectorRsRef.current!);
    return () => { obs.disconnect(); chart.remove(); sectorRsChartRef.current = null; };
  }, [indicators, getDisplayBarsCallback, sectorBars, sectorEtf, ticker]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (bars.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-panel text-sm text-text-secondary" style={{ height }}>
        No chart data for {ticker}. Data loads nightly.
      </div>
    );
  }

  const lastBar     = bars[bars.length - 1];
  const prevBar     = bars.length > 1 ? bars[bars.length - 2] : null;
  const priceChange = prevBar ? lastBar.close - prevBar.close : 0;
  const pricePct    = prevBar ? (priceChange / prevBar.close) * 100 : 0;
  const isUp        = priceChange >= 0;

  const PRO_INDS: Indicator[] = ["ATR", "OBV", "Stoch", "ADX", "VolDelta"];
  const hasSectorData = !!(sectorBars?.length);

  return (
    <div className="flex flex-col rounded-lg border border-border overflow-hidden">
      {/* ── Top toolbar: ticker + cloud + mode + timeframes ───────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-panel px-3 py-2">
        {/* Ticker + price */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-text-primary">{ticker}</span>
          <span className="font-mono text-sm font-semibold" style={{ color: isUp ? "var(--color-bull)" : "var(--color-bear)" }}>
            ${lastBar.close.toFixed(2)}
          </span>
          <span className="font-mono text-xs" style={{ color: isUp ? "var(--color-bull)" : "var(--color-bear)" }}>
            {isUp ? "+" : ""}{priceChange.toFixed(2)} ({isUp ? "+" : ""}{pricePct.toFixed(2)}%)
          </span>
        </div>

        {/* MA Cloud direction badge */}
        {showEma && (cloudBull || cloudBear) && (
          <span className="rounded border px-1.5 py-0.5 font-mono text-2xs font-semibold"
            style={cloudBull
              ? { color: "#10b981", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }
              : { color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
            {cloudBull ? "▲ Cloud" : "▼ Cloud"}
          </span>
        )}

        <div className="flex-1" />

        {/* Simple / Pro toggle */}
        <div className="flex -space-x-px">
          <ModeButton label="Simple" active={!proMode} onClick={() => setProMode(false)} />
          <ModeButton label="Pro" active={proMode} onClick={() => setProMode(true)} />
        </div>

        {/* Timeframe buttons */}
        <div className="flex items-center gap-1">
          {(["5m", "15m", "1H", "4H", "D", "W", "M"] as Timeframe[]).map((tf) => (
            <TfButton key={tf} label={tf} active={timeframe === tf} onClick={() => setTimeframe(tf)} />
          ))}
        </div>
      </div>

      {/* ── Overlay + indicator toggles row ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-panel/60 px-3 py-1.5">
        <span className="mr-1 text-2xs text-text-muted">Overlays:</span>
        <ToggleBtn label="EMA 21/50" active={showEma}     onClick={() => setShowEma((v) => !v)} />
        <ToggleBtn label="SMA 200"   active={showSma200}  onClick={() => setShowSma200((v) => !v)} />
        <ToggleBtn
          label="VWAP"
          active={showVwap}
          onClick={() => setShowVwap((v) => !v)}
          disabled={!isIntraday}
          title={!isIntraday ? "VWAP available on 5m / 15m / 1H / 4H" : proMode ? "VWAP + bands (Pro)" : undefined}
        />
        <ToggleBtn label="S/R"       active={showSR}      onClick={() => setShowSR((v) => !v)} />
        {proMode && (
          <>
            <ToggleBtn label="Fib"   active={showFib}     onClick={() => setShowFib((v) => !v)} />
            <ToggleBtn
              label="Γ Walls"
              active={showGamma}
              onClick={() => setShowGamma((v) => !v)}
              disabled={!optionsSnapshot}
              title={!optionsSnapshot ? "No options data" : undefined}
            />
          </>
        )}

        <div className="mx-1 h-3.5 w-px bg-border" />
        <span className="mr-1 text-2xs text-text-muted">Indicators:</span>
        {(["RSI", "MACD", "BB"] as Indicator[]).map((ind) => (
          <ToggleBtn key={ind} label={ind} active={indicators.has(ind)} onClick={() => toggleIndicator(ind)} />
        ))}
        <ToggleBtn
          label={sectorEtf ? `vs ${sectorEtf}` : "Sector RS"}
          active={indicators.has("SectorRS")}
          onClick={() => toggleIndicator("SectorRS")}
          disabled={!hasSectorData}
          title={!hasSectorData ? "No sector data available" : `Relative strength vs ${sectorEtf ?? "sector ETF"}`}
        />
        {proMode && PRO_INDS.map((ind) => (
          <ToggleBtn key={ind} label={ind} active={indicators.has(ind)} onClick={() => toggleIndicator(ind)} />
        ))}
      </div>

      {/* ── Crosshair OHLCV legend ─────────────────────────────────────────── */}
      {hoverOhlc && (
        <div className="flex items-center gap-3 border-b border-border bg-panel/80 px-3 py-1 text-xs font-mono">
          <span className="text-text-muted">{hoverOhlc.date}</span>
          <span className="text-text-secondary">O: <span className="text-text-primary">{hoverOhlc.open.toFixed(2)}</span></span>
          <span className="text-text-secondary">H: <span className="text-signal-long">{hoverOhlc.high.toFixed(2)}</span></span>
          <span className="text-text-secondary">L: <span className="text-signal-short">{hoverOhlc.low.toFixed(2)}</span></span>
          <span className="text-text-secondary">C: <span className={hoverOhlc.close >= hoverOhlc.open ? "text-signal-long" : "text-signal-short"}>{hoverOhlc.close.toFixed(2)}</span></span>
        </div>
      )}

      {/* ── Main chart + click info drawer ───────────────────────────────────── */}
      <div ref={chartWrapRef} className="relative w-full" onClick={() => setClickInfo(null)}>
        <div ref={containerRef} className="w-full" />
        {clickInfo && (
          <ClickInfoDrawer info={clickInfo} onClose={() => setClickInfo(null)} />
        )}
      </div>

      {/* ── Sub-panes ─────────────────────────────────────────────────────── */}
      {indicators.has("RSI") && (
        <SubPaneHeader label="RSI 14">
          <span className="rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-text-muted">OB 70 · OS 30</span>
        </SubPaneHeader>
      )}
      {indicators.has("RSI") && <div ref={rsiRef} className="w-full" />}

      {indicators.has("MACD") && <SubPaneHeader label="MACD (12, 26, 9)" />}
      {indicators.has("MACD") && <div ref={macdRef} className="w-full" />}

      {proMode && indicators.has("ATR") && <SubPaneHeader label="ATR 14 — Volatility" />}
      {proMode && indicators.has("ATR") && <div ref={atrRef} className="w-full" />}

      {proMode && indicators.has("OBV") && <SubPaneHeader label="OBV — On-Balance Volume" />}
      {proMode && indicators.has("OBV") && <div ref={obvRef} className="w-full" />}

      {proMode && indicators.has("Stoch") && (
        <SubPaneHeader label="Stochastic (14, 3)">
          <span className="rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-text-muted">OB 80 · OS 20</span>
        </SubPaneHeader>
      )}
      {proMode && indicators.has("Stoch") && <div ref={stochRef} className="w-full" />}

      {proMode && indicators.has("ADX") && (
        <SubPaneHeader label="ADX 14 — Trend Strength">
          <span className="rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-text-muted">Strong &gt; 25</span>
        </SubPaneHeader>
      )}
      {proMode && indicators.has("ADX") && <div ref={adxRef} className="w-full" />}

      {proMode && indicators.has("VolDelta") && <SubPaneHeader label="Volume Delta" />}
      {proMode && indicators.has("VolDelta") && <div ref={volDeltaRef} className="w-full" />}

      {indicators.has("SectorRS") && hasSectorData && (
        <SubPaneHeader label={`Relative Strength — ${ticker} vs ${sectorEtf ?? "Sector ETF"} (base 100)`}>
          <span className="rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-text-muted">
            <span style={{ color: rawColors.accent.teal }}>{ticker}</span>
            <span className="mx-1 text-text-muted">·</span>
            <span className="text-text-muted">{sectorEtf ?? "Sector"}</span>
          </span>
        </SubPaneHeader>
      )}
      {indicators.has("SectorRS") && hasSectorData && <div ref={sectorRsRef} className="w-full" />}

      {/* ── AI Chat placeholder ───────────────────────────────────────────── */}
      <div className="border-t border-border bg-panel/40 px-3 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xs font-semibold uppercase tracking-wider text-text-muted">AI Chat</span>
          <span className="rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-text-muted">MVP3</span>
        </div>
        <div className="flex items-center gap-2 opacity-40 pointer-events-none select-none">
          <input disabled placeholder={`Ask RayZar about ${ticker}...`}
            className="flex-1 rounded border border-border bg-elevated px-3 py-1.5 text-xs text-text-secondary placeholder:text-text-muted outline-none" />
          <button disabled className="rounded border border-border bg-elevated px-3 py-1.5 text-xs text-text-secondary">Ask</button>
        </div>
      </div>
    </div>
  );
}
