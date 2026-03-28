"use client";

/**
 * features/charts/components/ohlcv-chart.tsx — RayZar Frontend
 * TradingView Lightweight Charts v5 candlestick chart for a single ticker.
 *
 * Renders:
 *  - Candlestick series (OHLCV)
 *  - 20-day SMA overlay (yellow)
 *  - 50-day SMA overlay (blue)
 *  - Volume histogram below
 *
 * DATA NOTE:
 * OHLCV bars come from GET /api/v1/ohlcv/{ticker} which reads AWS RDS.
 * The RDS data is written nightly by download_data.py on the owner's Mac via
 * IBKR TWS. This component is READ-ONLY — it never writes to the backend.
 */

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type CandlestickData,
  type Time,
  type HistogramData,
  type LineData,
} from "lightweight-charts";
import type { OhlcvBar } from "@/lib/api-client";

interface OhlcvChartProps {
  bars: OhlcvBar[];
  ticker: string;
}

function computeSma(bars: OhlcvBar[], period: number): LineData[] {
  return bars
    .map((_, i) => {
      if (i < period - 1) return null;
      const slice = bars.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, b) => sum + b.close, 0) / period;
      return { time: bars[i].date as Time, value: avg };
    })
    .filter((d): d is LineData => d !== null);
}

export function OhlcvChart({ bars, ticker }: OhlcvChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;

    const container = containerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#a0a0a0",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#1a1a1a" },
        horzLines: { color: "#1a1a1a" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#555", width: 1, style: 3 },
        horzLine: { color: "#555", width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: "#2a2a2a",
        textColor: "#a0a0a0",
      },
      timeScale: {
        borderColor: "#2a2a2a",
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: 420,
    });
    chartRef.current = chart;

    // ── Candlestick series ────────────────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const candleData: CandlestickData[] = bars.map((b) => ({
      time: b.date as Time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    candleSeries.setData(candleData);

    // ── Volume histogram ──────────────────────────────────────────────────
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volumeData: HistogramData[] = bars.map((b) => ({
      time: b.date as Time,
      value: b.volume,
      color: b.close >= b.open ? "#22c55e33" : "#ef444433",
    }));
    volumeSeries.setData(volumeData);

    // ── 20-day SMA ────────────────────────────────────────────────────────
    if (bars.length >= 20) {
      const sma20 = chart.addSeries(LineSeries, {
        color: "#eab308",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "SMA 20",
      });
      sma20.setData(computeSma(bars, 20));
    }

    // ── 50-day SMA ────────────────────────────────────────────────────────
    if (bars.length >= 50) {
      const sma50 = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "SMA 50",
      });
      sma50.setData(computeSma(bars, 50));
    }

    chart.timeScale().fitContent();

    // ── Resize observer ───────────────────────────────────────────────────
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        chart.applyOptions({ width: entries[0].contentRect.width });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [bars, ticker]);

  if (bars.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] text-sm text-gray-500">
        No chart data available yet for {ticker}.
        <br />
        Data is loaded nightly via the IBKR pipeline.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
