"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type HistogramData,
  type LineData,
} from "lightweight-charts";
import type { OhlcvBar } from "@/lib/api-client";
import type { TAAnalysisResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { rawColors } from "@/styles/tokens";

interface TradingChartProps {
  bars: OhlcvBar[];
  ticker: string;
  taAnalysis?: TAAnalysisResponse | null;
  height?: number;
}

type Timeframe = "1D" | "1W" | "1M";
type Indicator = "RSI" | "MACD" | "BB";

// ── Math helpers ─────────────────────────────────────────────────────────────

function computeSma(bars: OhlcvBar[], period: number): LineData[] {
  return bars
    .map((_, i) => {
      if (i < period - 1) return null;
      const slice = bars.slice(i - period + 1, i + 1);
      const avg = slice.reduce((s, b) => s + b.close, 0) / period;
      return { time: bars[i].date as Time, value: avg };
    })
    .filter((d): d is LineData => d !== null);
}

function computeRsi(bars: OhlcvBar[], period = 14): LineData[] {
  if (bars.length < period + 1) return [];
  const result: LineData[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = bars[i].close - bars[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < bars.length; i++) {
    if (i > period) {
      const change = bars[i].close - bars[i - 1].close;
      avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ time: bars[i].date as Time, value: 100 - 100 / (1 + rs) });
  }
  return result;
}

function computeBollinger(
  bars: OhlcvBar[],
  period = 20,
  stdMult = 2
): { upper: LineData[]; mid: LineData[]; lower: LineData[] } {
  const upper: LineData[] = [];
  const mid: LineData[] = [];
  const lower: LineData[] = [];

  for (let i = period - 1; i < bars.length; i++) {
    const slice = bars.slice(i - period + 1, i + 1);
    const mean = slice.reduce((s, b) => s + b.close, 0) / period;
    const variance = slice.reduce((s, b) => s + (b.close - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    const t = bars[i].date as Time;
    upper.push({ time: t, value: mean + stdMult * std });
    mid.push({ time: t, value: mean });
    lower.push({ time: t, value: mean - stdMult * std });
  }
  return { upper, mid, lower };
}

function computeMacd(
  bars: OhlcvBar[],
  fast = 12,
  slow = 26,
  signal = 9
): { macdLine: LineData[]; signalLine: LineData[]; histogram: HistogramData[] } {
  function ema(data: number[], len: number): number[] {
    const k = 2 / (len + 1);
    const result: number[] = [];
    let prev = data[0];
    result.push(prev);
    for (let i = 1; i < data.length; i++) {
      prev = data[i] * k + prev * (1 - k);
      result.push(prev);
    }
    return result;
  }

  const closes = bars.map((b) => b.close);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  const macdValues: number[] = emaSlow.map((s, i) => emaFast[i] - s);
  const signalValues = ema(macdValues.slice(slow - 1), signal);

  const macdLine: LineData[] = [];
  const signalLine: LineData[] = [];
  const histogram: HistogramData[] = [];

  for (let i = slow - 1; i < bars.length; i++) {
    const t = bars[i].date as Time;
    const m = macdValues[i];
    macdLine.push({ time: t, value: m });

    const si = i - (slow - 1) - (signal - 1);
    if (si >= 0 && si < signalValues.length) {
      const sig = signalValues[si];
      signalLine.push({ time: t, value: sig });
      const h = m - sig;
      histogram.push({
        time: t,
        value: h,
        color: h >= 0 ? rawColors.chart.macdHistUp : rawColors.chart.macdHistDown,
      });
    }
  }

  return { macdLine, signalLine, histogram };
}

// ── Resampling ────────────────────────────────────────────────────────────────

function resampleToWeekly(bars: OhlcvBar[]): OhlcvBar[] {
  if (bars.length === 0) return [];
  const weeks = new Map<string, OhlcvBar[]>();
  for (const bar of bars) {
    const d = new Date(bar.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(bar);
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, wbars]) => ({
      date,
      open:   wbars[0].open,
      high:   Math.max(...wbars.map((b) => b.high)),
      low:    Math.min(...wbars.map((b) => b.low)),
      close:  wbars[wbars.length - 1].close,
      volume: wbars.reduce((s, b) => s + b.volume, 0),
    }));
}

function resampleToMonthly(bars: OhlcvBar[]): OhlcvBar[] {
  if (bars.length === 0) return [];
  const months = new Map<string, OhlcvBar[]>();
  for (const bar of bars) {
    const key = bar.date.slice(0, 7); // "YYYY-MM"
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(bar);
  }
  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, mbars]) => ({
      date:   `${key}-01`,
      open:   mbars[0].open,
      high:   Math.max(...mbars.map((b) => b.high)),
      low:    Math.min(...mbars.map((b) => b.low)),
      close:  mbars[mbars.length - 1].close,
      volume: mbars.reduce((s, b) => s + b.volume, 0),
    }));
}

// ── Toolbar buttons ───────────────────────────────────────────────────────────

function TfButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded px-2.5 py-1 font-mono text-xs font-medium transition-all",
        active
          ? "bg-accent-teal/20 text-accent-teal border border-accent-teal/40"
          : "border border-border text-text-secondary hover:border-accent-teal/40 hover:text-accent-teal"
      )}
    >
      {label}
    </button>
  );
}

function IndButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-xs font-medium transition-all",
        active
          ? "bg-elevated text-text-primary border border-border"
          : "border border-transparent text-text-muted hover:text-text-secondary"
      )}
    >
      {label}
    </button>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function TradingChart({ bars, ticker, taAnalysis, height = 420 }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [indicators, setIndicators] = useState<Set<Indicator>>(new Set(["RSI"]));
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(false);
  const [hoverOhlc, setHoverOhlc] = useState<{
    open: number; high: number; low: number; close: number; date: string;
  } | null>(null);

  const getBars = useCallback((): OhlcvBar[] => {
    if (timeframe === "1W") return resampleToWeekly(bars);
    if (timeframe === "1M") return resampleToMonthly(bars);
    return bars;
  }, [bars, timeframe]);

  function toggleIndicator(ind: Indicator) {
    setIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });
  }

  // Build/rebuild main chart on bars or indicator changes
  useEffect(() => {
    if (!containerRef.current) return;
    const displayBars = getBars();
    if (displayBars.length === 0) return;

    const container = containerRef.current;

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: rawColors.chart.bg },
        textColor: rawColors.chart.textLabel,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: rawColors.chart.grid },
        horzLines: { color: rawColors.chart.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
        horzLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: rawColors.chart.border,
        textColor: rawColors.chart.textLabel,
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: rawColors.chart.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      width: container.clientWidth,
      height,
    });
    chartRef.current = chart;

    // ── Candlestick ──────────────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:        rawColors.chart.up,
      downColor:      rawColors.chart.down,
      borderUpColor:  rawColors.chart.up,
      borderDownColor:rawColors.chart.down,
      wickUpColor:    rawColors.chart.up,
      wickDownColor:  rawColors.chart.down,
    });
    candleSeriesRef.current = candleSeries;

    const candleData: CandlestickData[] = displayBars.map((b) => ({
      time:  b.date as Time,
      open:  b.open,
      high:  b.high,
      low:   b.low,
      close: b.close,
    }));
    candleSeries.setData(candleData);

    // ── Volume histogram ──────────────────────────────────────────────────
    const volSeries = chart.addSeries(HistogramSeries, {
      color: rawColors.chart.up,
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    const volData: HistogramData[] = displayBars.map((b) => ({
      time:  b.date as Time,
      value: b.volume,
      color: b.close >= b.open ? rawColors.chart.volumeUp : rawColors.chart.volumeDown,
    }));
    volSeries.setData(volData);

    // ── SMA overlays ──────────────────────────────────────────────────────
    if (showSma20 && displayBars.length >= 20) {
      const s = chart.addSeries(LineSeries, {
        color: rawColors.chart.sma20, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: true, title: "SMA20",
      });
      s.setData(computeSma(displayBars, 20));
    }
    if (showSma50 && displayBars.length >= 50) {
      const s = chart.addSeries(LineSeries, {
        color: rawColors.chart.sma50, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: true, title: "SMA50",
      });
      s.setData(computeSma(displayBars, 50));
    }
    if (showSma200 && displayBars.length >= 200) {
      const s = chart.addSeries(LineSeries, {
        color: rawColors.chart.sma200, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: true, title: "SMA200",
      });
      s.setData(computeSma(displayBars, 200));
    }

    // ── Bollinger Bands ───────────────────────────────────────────────────
    if (indicators.has("BB") && displayBars.length >= 20) {
      const { upper, mid, lower } = computeBollinger(displayBars, 20);
      const bbUpper = chart.addSeries(LineSeries, {
        color: rawColors.chart.bb, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: false, title: "BB Upper",
      });
      bbUpper.setData(upper);
      const bbMid = chart.addSeries(LineSeries, {
        color: rawColors.chart.bbMid, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: false, title: "BB Mid",
      });
      bbMid.setData(mid);
      const bbLower = chart.addSeries(LineSeries, {
        color: rawColors.chart.bb, lineWidth: 1,
        priceLineVisible: false, lastValueVisible: false, title: "BB Lower",
      });
      bbLower.setData(lower);
    }

    // ── Pattern price lines from TA analysis ──────────────────────────────
    if (taAnalysis?.signals && candleSeries) {
      for (const signal of taAnalysis.signals) {
        if (!signal.key_levels) continue;
        const color =
          signal.direction === "bullish" ? rawColors.chart.patternBull
          : signal.direction === "bearish" ? rawColors.chart.patternBear
          : rawColors.chart.patternNeutral;

        for (const [levelName, price] of Object.entries(signal.key_levels)) {
          if (typeof price !== "number") continue;
          candleSeries.createPriceLine({
            price,
            color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${signal.name} (${levelName})`,
          });
        }
      }
    }

    // ── Crosshair hover legend ────────────────────────────────────────────
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverOhlc(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (data) {
        setHoverOhlc({
          open:  data.open,
          high:  data.high,
          low:   data.low,
          close: data.close,
          date:  String(param.time),
        });
      } else {
        setHoverOhlc(null);
      }
    });

    chart.timeScale().fitContent();

    // ── Resize observer ───────────────────────────────────────────────────
    const obs = new ResizeObserver(([entry]) => {
      if (entry) chart.applyOptions({ width: entry.contentRect.width });
    });
    obs.observe(container);

    return () => {
      obs.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [getBars, height, showSma20, showSma50, showSma200, indicators, taAnalysis]);

  // ── RSI sub-chart ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("RSI") || !rsiContainerRef.current) return;
    const displayBars = getBars();
    const rsiData = computeRsi(displayBars, 14);
    if (rsiData.length === 0) return;

    const container = rsiContainerRef.current;
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: rawColors.chart.bg },
        textColor: rawColors.chart.textLabel,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: rawColors.chart.grid },
        horzLines: { color: rawColors.chart.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
        horzLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: rawColors.chart.border, textColor: rawColors.chart.textLabel },
      timeScale: { borderColor: rawColors.chart.border, timeVisible: false, secondsVisible: false },
      width: container.clientWidth,
      height: 100,
    });
    rsiChartRef.current = chart;

    const rsiSeries = chart.addSeries(LineSeries, {
      color: rawColors.chart.rsi,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "RSI 14",
    });
    rsiSeries.setData(rsiData);

    // Overbought / Oversold lines
    const maxT = rsiData[rsiData.length - 1]?.time;
    const minT = rsiData[0]?.time;
    if (maxT && minT) {
      rsiSeries.createPriceLine({ price: 70, color: rawColors.chart.rsiOb, lineWidth: 1, lineStyle: LineStyle.Dashed, title: "OB" });
      rsiSeries.createPriceLine({ price: 30, color: rawColors.chart.rsiOs, lineWidth: 1, lineStyle: LineStyle.Dashed, title: "OS" });
    }

    chart.timeScale().fitContent();

    const obs = new ResizeObserver(([entry]) => {
      if (entry) chart.applyOptions({ width: entry.contentRect.width });
    });
    obs.observe(container);

    return () => {
      obs.disconnect();
      chart.remove();
      rsiChartRef.current = null;
    };
  }, [indicators, getBars]);

  // ── MACD sub-chart ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!indicators.has("MACD") || !macdContainerRef.current) return;
    const displayBars = getBars();
    if (displayBars.length < 35) return;

    const { macdLine, signalLine, histogram } = computeMacd(displayBars);
    const container = macdContainerRef.current;

    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: rawColors.chart.bg },
        textColor: rawColors.chart.textLabel,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: rawColors.chart.grid },
        horzLines: { color: rawColors.chart.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
        horzLine: { color: rawColors.chart.crosshair, width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: rawColors.chart.border, textColor: rawColors.chart.textLabel },
      timeScale: { borderColor: rawColors.chart.border, timeVisible: false, secondsVisible: false },
      width: container.clientWidth,
      height: 100,
    });
    macdChartRef.current = chart;

    const histSeries = chart.addSeries(HistogramSeries, {
      color: rawColors.chart.macd,
      priceScaleId: "right",
    });
    histSeries.setData(histogram);

    const macdSeries = chart.addSeries(LineSeries, {
      color: rawColors.chart.macd,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "MACD",
    });
    macdSeries.setData(macdLine);

    const sigSeries = chart.addSeries(LineSeries, {
      color: rawColors.chart.macdSignal,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "Signal",
    });
    sigSeries.setData(signalLine);

    chart.timeScale().fitContent();

    const obs = new ResizeObserver(([entry]) => {
      if (entry) chart.applyOptions({ width: entry.contentRect.width });
    });
    obs.observe(container);

    return () => {
      obs.disconnect();
      chart.remove();
      macdChartRef.current = null;
    };
  }, [indicators, getBars]);

  if (bars.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-panel text-sm text-text-secondary"
        style={{ height }}
      >
        No chart data available for {ticker}. Data loads nightly.
      </div>
    );
  }

  const lastBar = bars[bars.length - 1];
  const prevBar = bars.length > 1 ? bars[bars.length - 2] : null;
  const priceChange = prevBar ? lastBar.close - prevBar.close : 0;
  const priceChangePct = prevBar ? (priceChange / prevBar.close) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-border overflow-hidden">
      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-panel px-3 py-2">
        {/* Ticker + price */}
        <div className="flex items-center gap-2 mr-3">
          <span className="font-mono text-sm font-bold text-text-primary">{ticker}</span>
          <span className="font-mono text-sm font-semibold" style={{ color: isPositive ? "var(--color-bull)" : "var(--color-bear)" }}>
            ${lastBar.close.toFixed(2)}
          </span>
          <span className="font-mono text-xs" style={{ color: isPositive ? "var(--color-bull)" : "var(--color-bear)" }}>
            {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{priceChangePct.toFixed(2)}%)
          </span>
        </div>

        {/* Timeframe */}
        <div className="flex items-center gap-1">
          {(["1D", "1W", "1M"] as Timeframe[]).map((tf) => (
            <TfButton key={tf} label={tf} active={timeframe === tf} onClick={() => setTimeframe(tf)} />
          ))}
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Indicator toggles */}
        <div className="flex items-center gap-1">
          <IndButton
            label="SMA20"
            active={showSma20}
            onClick={() => setShowSma20((v) => !v)}
          />
          <IndButton
            label="SMA50"
            active={showSma50}
            onClick={() => setShowSma50((v) => !v)}
          />
          <IndButton
            label="SMA200"
            active={showSma200}
            onClick={() => setShowSma200((v) => !v)}
          />
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <div className="flex items-center gap-1">
          {(["RSI", "MACD", "BB"] as Indicator[]).map((ind) => (
            <IndButton
              key={ind}
              label={ind}
              active={indicators.has(ind)}
              onClick={() => toggleIndicator(ind)}
            />
          ))}
        </div>
      </div>

      {/* ── Hover legend ─────────────────────────────────────────────────── */}
      {hoverOhlc && (
        <div className="flex items-center gap-3 border-b border-border bg-panel/80 px-3 py-1 text-xs font-mono">
          <span className="text-text-muted">{hoverOhlc.date}</span>
          <span className="text-text-secondary">O: <span className="text-text-primary">{hoverOhlc.open.toFixed(2)}</span></span>
          <span className="text-text-secondary">H: <span className="text-signal-long">{hoverOhlc.high.toFixed(2)}</span></span>
          <span className="text-text-secondary">L: <span className="text-signal-short">{hoverOhlc.low.toFixed(2)}</span></span>
          <span className="text-text-secondary">C: <span className={hoverOhlc.close >= hoverOhlc.open ? "text-signal-long" : "text-signal-short"}>{hoverOhlc.close.toFixed(2)}</span></span>
        </div>
      )}

      {/* ── Main chart ───────────────────────────────────────────────────── */}
      <div ref={containerRef} className="w-full" />

      {/* ── RSI pane ─────────────────────────────────────────────────────── */}
      {indicators.has("RSI") && (
        <div className="border-t border-border">
          <div className="flex items-center gap-2 bg-panel px-3 py-1">
            <span className="text-2xs font-semibold text-text-muted">RSI 14</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div ref={rsiContainerRef} className="w-full" />
        </div>
      )}

      {/* ── MACD pane ────────────────────────────────────────────────────── */}
      {indicators.has("MACD") && (
        <div className="border-t border-border">
          <div className="flex items-center gap-2 bg-panel px-3 py-1">
            <span className="text-2xs font-semibold text-text-muted">MACD (12, 26, 9)</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div ref={macdContainerRef} className="w-full" />
        </div>
      )}
    </div>
  );
}
