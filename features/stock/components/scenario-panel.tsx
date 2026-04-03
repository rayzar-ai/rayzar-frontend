"use client";

/**
 * features/stock/components/scenario-panel.tsx — RayZar Frontend
 *
 * Monte Carlo Scenario Engine UI.
 * Calls GET /api/v1/scenario/{ticker} to run a 1000-path GBM simulation
 * and renders a fan chart (SVG) + Bull / Base / Bear scenario cards.
 *
 * Props:
 *   ticker        — stock symbol
 *   currentPrice  — passed from server component (from OHLCV bars)
 *   signalClass   — passed from server component (from Signal)
 *   hv20d         — 20-day hist vol annualised (from features_used)
 *   atr14Pct      — ATR-14 / price (from features_used)
 */

import { useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, Play, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScenarioData {
  ticker: string;
  current_price: number;
  signal_class: string | null;
  days: number[];
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
  bull_target: number;
  base_target: number;
  bear_target: number;
  bull_probability: number;
  base_probability: number;
  bear_probability: number;
  bull_narrative: string;
  base_narrative: string;
  bear_narrative: string;
  annual_vol_used: number;
  drift_annual: number;
  n_paths: number;
  n_days: number;
}

interface ScenarioPanelProps {
  ticker: string;
  currentPrice?: number | null;
  signalClass?: string | null;
  hv20d?: number | null;
  atr14Pct?: number | null;
}

// ── Fan Chart (SVG) ───────────────────────────────────────────────────────────

const CHART_W = 580;
const CHART_H = 220;
const PAD = { top: 16, right: 24, bottom: 36, left: 56 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

function FanChart({ data }: { data: ScenarioData }) {
  const { days, p10, p25, p50, p75, p90, current_price, n_days } = data;

  const priceMin = Math.min(...p10) * 0.995;
  const priceMax = Math.max(...p90) * 1.005;
  const priceRange = priceMax - priceMin;

  const mapX = (day: number) => PAD.left + (day / n_days) * INNER_W;
  const mapY = (price: number) =>
    PAD.top + ((priceMax - price) / priceRange) * INNER_H;

  function bandPath(upper: number[], lower: number[]): string {
    const topPoints = days.map((d, i) => `${mapX(d).toFixed(1)},${mapY(upper[i]).toFixed(1)}`);
    const botPoints = [...days].reverse().map((d, i) => {
      const revIdx = days.length - 1 - i;
      return `${mapX(d).toFixed(1)},${mapY(lower[revIdx]).toFixed(1)}`;
    });
    return `M ${topPoints.join(" L ")} L ${botPoints.join(" L ")} Z`;
  }

  function linePath(prices: number[]): string {
    return days
      .map((d, i) => `${i === 0 ? "M" : "L"} ${mapX(d).toFixed(1)},${mapY(prices[i]).toFixed(1)}`)
      .join(" ");
  }

  // Y-axis tick prices
  const nTicks = 5;
  const yTicks = Array.from({ length: nTicks }, (_, i) => {
    const price = priceMin + (priceRange / (nTicks - 1)) * i;
    return { price, y: mapY(price) };
  });

  // X-axis day labels
  const xTicks = [0, 2, 4, 6, 8, 10].filter((d) => d <= n_days);

  // Current price Y position (horizontal dashed reference line)
  const currentY = mapY(current_price);

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full"
      style={{ height: CHART_H }}
      aria-label="Monte Carlo price fan chart"
    >
      {/* Grid lines */}
      {yTicks.map(({ y }, i) => (
        <line
          key={i}
          x1={PAD.left}
          y1={y}
          x2={CHART_W - PAD.right}
          y2={y}
          stroke="#2a2a3a"
          strokeWidth="1"
        />
      ))}

      {/* Current price dashed line */}
      <line
        x1={PAD.left}
        y1={currentY}
        x2={CHART_W - PAD.right}
        y2={currentY}
        stroke="#6b7280"
        strokeWidth="1"
        strokeDasharray="4,4"
        opacity="0.7"
      />

      {/* Fan bands */}
      {/* p10–p90 outer band */}
      <path d={bandPath(p90, p10)} fill="#2dd4bf" fillOpacity="0.06" />
      {/* p25–p75 inner band */}
      <path d={bandPath(p75, p25)} fill="#2dd4bf" fillOpacity="0.14" />
      {/* p50–p75 upper half */}
      <path d={bandPath(p75, p50)} fill="#2dd4bf" fillOpacity="0.10" />

      {/* Median line (p50) */}
      <path
        d={linePath(p50)}
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Day 0 vertical line */}
      <line
        x1={mapX(0)}
        y1={PAD.top}
        x2={mapX(0)}
        y2={CHART_H - PAD.bottom}
        stroke="#4b5563"
        strokeWidth="1"
      />

      {/* Bull target dot (p75, day 10) */}
      <circle cx={mapX(n_days)} cy={mapY(data.bull_target)} r="3" fill="#10b981" />
      {/* Base target dot (p50, day 10) */}
      <circle cx={mapX(n_days)} cy={mapY(data.base_target)} r="3" fill="#2dd4bf" />
      {/* Bear target dot (p25, day 10) */}
      <circle cx={mapX(n_days)} cy={mapY(data.bear_target)} r="3" fill="#ef4444" />

      {/* Y-axis labels */}
      {yTicks.map(({ price, y }, i) => (
        <text
          key={i}
          x={PAD.left - 6}
          y={y + 4}
          textAnchor="end"
          fontSize="9"
          fill="#6b7280"
          fontFamily="monospace"
        >
          {price >= 1000
            ? `$${(price / 1000).toFixed(1)}k`
            : `$${price.toFixed(0)}`}
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((d) => (
        <text
          key={d}
          x={mapX(d)}
          y={CHART_H - PAD.bottom + 14}
          textAnchor="middle"
          fontSize="9"
          fill="#6b7280"
          fontFamily="monospace"
        >
          {d === 0 ? "Today" : `D${d}`}
        </text>
      ))}

      {/* Legend */}
      <text x={PAD.left + 4} y={PAD.top + 12} fontSize="8.5" fill="#6b7280">
        1 000 paths · GBM · p10/p25/p50/p75/p90 bands
      </text>
    </svg>
  );
}

// ── Scenario Card ─────────────────────────────────────────────────────────────

function ScenarioCard({
  label,
  icon: Icon,
  target,
  currentPrice,
  probability,
  narrative,
  accentColor,
  borderColor,
  bgColor,
}: {
  label: string;
  icon: typeof TrendingUp;
  target: number;
  currentPrice: number;
  probability: number;
  narrative: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
}) {
  const pct = ((target / currentPrice) - 1) * 100;
  const sign = pct >= 0 ? "+" : "";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3 flex flex-col",
        borderColor,
        bgColor
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
          <span className="text-xs font-semibold text-text-secondary">{label}</span>
        </div>
        <span
          className="text-xs font-bold rounded-full px-2 py-0.5"
          style={{ color: accentColor, background: `${accentColor}18` }}
        >
          {Math.round(probability * 100)}%
        </span>
      </div>

      <div>
        <p className="font-mono text-xl font-bold text-text-primary">
          ${target.toFixed(2)}
        </p>
        <p className="font-mono text-xs font-semibold" style={{ color: accentColor }}>
          {sign}{pct.toFixed(1)}% in 10 days
        </p>
      </div>

      <p className="text-xs leading-relaxed text-text-secondary flex-1">
        {narrative}
      </p>
    </div>
  );
}

// ── Simulation parameters bar ─────────────────────────────────────────────────

function SimParams({ data }: { data: ScenarioData }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-2xs text-text-muted font-mono">
      <span>Vol: {(data.annual_vol_used * 100).toFixed(1)}% ann.</span>
      <span>Drift: {(data.drift_annual * 100) >= 0 ? "+" : ""}{(data.drift_annual * 100).toFixed(1)}% ann.</span>
      <span>{data.n_paths.toLocaleString()} paths × {data.n_days} days</span>
      {data.signal_class && <span>Signal: {data.signal_class}</span>}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ScenarioPanel({
  ticker,
  currentPrice,
  signalClass,
  hv20d,
  atr14Pct,
}: ScenarioPanelProps) {
  const [data, setData] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (currentPrice == null) return;
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? "";

      const params = new URLSearchParams();
      params.set("current_price", currentPrice.toString());
      if (signalClass)  params.set("signal_class", signalClass);
      if (hv20d != null)    params.set("hv_20d", hv20d.toString());
      if (atr14Pct != null) params.set("atr14_pct", atr14Pct.toString());

      const res = await fetch(
        `${apiUrl}/api/v1/scenario/${ticker}?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "X-API-Key": apiKey } : {}),
          },
        }
      );

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }, [ticker, currentPrice, signalClass, hv20d, atr14Pct]);

  // ── Empty / no price state ────────────────────────────────────────────────
  if (currentPrice == null) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No price data available for {ticker}
      </div>
    );
  }

  // ── Pre-run state ─────────────────────────────────────────────────────────
  if (!data && !loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 px-6">
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-lg font-bold text-text-primary">
            Monte Carlo Scenario Engine
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Runs 1 000 price simulations using Geometric Brownian Motion calibrated
            to {ticker}&apos;s historical volatility and current signal class.
            Returns price fan chart and Bull / Base / Bear scenarios over 10 trading days.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1 text-xs text-text-muted">
            <span className="rounded border border-border px-2 py-1">1 000 paths</span>
            <span className="rounded border border-border px-2 py-1">GBM simulation</span>
            <span className="rounded border border-border px-2 py-1">p10–p90 bands</span>
            <span className="rounded border border-border px-2 py-1">Claude narratives</span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-text-muted">
            Entry price: <span className="font-mono font-semibold text-text-secondary">${currentPrice.toFixed(2)}</span>
            {signalClass && (
              <span className="ml-3">Signal: <span className="font-mono font-semibold text-text-secondary">{signalClass}</span></span>
            )}
          </p>
        </div>

        <button
          onClick={run}
          className="flex items-center gap-2 rounded-lg bg-accent-teal px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 active:opacity-80"
        >
          <Play className="h-4 w-4" />
          Run Simulation
        </button>

        {error && (
          <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>
        )}
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent-teal" />
        <p className="text-sm text-text-secondary">
          Running 1 000 Monte Carlo paths for {ticker}…
        </p>
        <p className="text-xs text-text-muted">Generating Claude narratives…</p>
      </div>
    );
  }

  // ── Results state ─────────────────────────────────────────────────────────
  if (!data) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              10-Day Price Scenarios — {ticker}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Monte Carlo GBM · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-accent-teal/50 hover:text-accent-teal transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-run
          </button>
        </div>

        {/* Fan Chart */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <FanChart data={data} />
          <SimParams data={data} />
        </div>

        {/* Scenario Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <ScenarioCard
            label="Bull Case"
            icon={TrendingUp}
            target={data.bull_target}
            currentPrice={data.current_price}
            probability={data.bull_probability}
            narrative={data.bull_narrative}
            accentColor="#10b981"
            borderColor="border-emerald-500/20"
            bgColor="bg-emerald-500/5"
          />
          <ScenarioCard
            label="Base Case"
            icon={Minus}
            target={data.base_target}
            currentPrice={data.current_price}
            probability={data.base_probability}
            narrative={data.base_narrative}
            accentColor="#2dd4bf"
            borderColor="border-border"
            bgColor="bg-card"
          />
          <ScenarioCard
            label="Bear Case"
            icon={TrendingDown}
            target={data.bear_target}
            currentPrice={data.current_price}
            probability={data.bear_probability}
            narrative={data.bear_narrative}
            accentColor="#ef4444"
            borderColor="border-red-500/20"
            bgColor="bg-red-500/5"
          />
        </div>

        {/* Probability bar */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Day-10 Outcome Distribution
          </p>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            <div
              style={{
                width: `${data.bull_probability * 100}%`,
                background: "#10b981",
              }}
            />
            <div
              style={{
                width: `${data.base_probability * 100}%`,
                background: "#2dd4bf",
                opacity: 0.6,
              }}
            />
            <div
              style={{
                width: `${data.bear_probability * 100}%`,
                background: "#ef4444",
              }}
            />
          </div>
          <div className="flex items-center gap-5 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Bull ≥+5% · {Math.round(data.bull_probability * 100)}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-teal opacity-60" />
              Base ±5% · {Math.round(data.base_probability * 100)}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Bear ≤-5% · {Math.round(data.bear_probability * 100)}%
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-2xs text-text-muted leading-relaxed text-center pb-2">
          Monte Carlo simulation for educational purposes only. Past volatility does not guarantee future price movement.
          Probabilities are model-generated estimates, not financial advice.
        </p>
      </div>
    </div>
  );
}
