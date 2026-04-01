/**
 * app/dashboard/page.tsx — RayZar Frontend
 * TrendSpider-inspired signal dashboard — Server Component.
 *
 * Fetches signals and market regime from the FastAPI backend (EC2 → RDS).
 * Renders server-side for fast initial load; client components handle
 * sorting, filtering, and search interactivity.
 */

import { Suspense } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Signal, MarketRegime } from "@/lib/api-client";
import { MarketTicker } from "@/components/layout/market-ticker";
import { SearchBar } from "@/components/ui/search-bar";
import { ModelSelector } from "@/features/signals/components/model-selector";
import { FINANCIAL_DISCLAIMER } from "@/config/legal";

export const metadata = {
  title: "Dashboard — RayZar AI",
  description: "Institutional-grade trading signals powered by ensemble ML models.",
};

interface DashboardPageProps {
  searchParams: Promise<{
    page?: string;
    signal_class?: string;
    regime?: string;
  }>;
}

function RegimePill({ regime }: { regime: MarketRegime | null }) {
  if (!regime) return null;
  const r = regime.regime.toLowerCase();
  let color = "#6b7280";
  let bg = "rgba(107,114,128,0.15)";
  let border = "rgba(107,114,128,0.3)";
  if (r.includes("bull") || r.includes("risk-on")) {
    color = "#10b981"; bg = "rgba(16,185,129,0.12)"; border = "rgba(16,185,129,0.3)";
  } else if (r.includes("bear") || r.includes("risk-off")) {
    color = "#ef4444"; bg = "rgba(239,68,68,0.12)"; border = "rgba(239,68,68,0.3)";
  } else if (r.includes("recover") || r.includes("transition")) {
    color = "#f59e0b"; bg = "rgba(245,158,11,0.12)"; border = "rgba(245,158,11,0.3)";
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5"
      style={{ background: bg, borderColor: border }}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: color }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
        {regime.regime}
      </span>
      <span className="text-2xs text-text-muted">
        {regime.signal_date}
      </span>
    </div>
  );
}

function SignalCountBadges({ signals }: { signals: Signal[] }) {
  const bullish = signals.filter((s) =>
    s.signal_class === "STRONG_LONG" || s.signal_class === "LONG"
  ).length;
  const bearish = signals.filter((s) =>
    s.signal_class === "STRONG_SHORT" || s.signal_class === "SHORT"
  ).length;
  const neutral = signals.filter((s) => s.signal_class === "NEUTRAL").length;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1 rounded-full bg-signal-long/10 px-2.5 py-1 text-signal-long">
        <span className="font-mono font-bold">{bullish}</span> Bullish
      </span>
      <span className="flex items-center gap-1 rounded-full bg-text-muted/10 px-2.5 py-1 text-text-secondary">
        <span className="font-mono font-bold">{neutral}</span> Neutral
      </span>
      <span className="flex items-center gap-1 rounded-full bg-signal-short/10 px-2.5 py-1 text-signal-short">
        <span className="font-mono font-bold">{bearish}</span> Bearish
      </span>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const signalClass = params.signal_class ?? "";

  // Fetch data in parallel
  const [signalsResult, regimeResult, topSignalsResult, watchlistResult] = await Promise.allSettled([
    apiClient.getSignals({ page, page_size: 200, signal_class: signalClass || undefined }),
    apiClient.getMarketRegime(),
    apiClient.getTopSignals(20),
    apiClient.getWatchlist(),
  ]);

  const signalsData =
    signalsResult.status === "fulfilled" && signalsResult.value.success
      ? signalsResult.value.data
      : null;

  const regime =
    regimeResult.status === "fulfilled" &&
    regimeResult.value.success &&
    regimeResult.value.data
      ? regimeResult.value.data
      : null;

  const topSignals =
    topSignalsResult.status === "fulfilled" && topSignalsResult.value.success
      ? (topSignalsResult.value.data ?? [])
      : (signalsData?.signals.slice(0, 20) ?? []);

  const allSignals = signalsData?.signals ?? [];

  const watchedTickers: string[] =
    watchlistResult.status === "fulfilled" && watchlistResult.value.success
      ? (watchlistResult.value.data ?? []).map((w) => w.ticker)
      : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Market Ticker Strip ─────────────────────────────────────────── */}
      <MarketTicker signals={topSignals} />

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-panel px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-text-primary">Signal Dashboard</h1>
              {regime && <RegimePill regime={regime} />}
            </div>
            <SignalCountBadges signals={allSignals} />
          </div>

          <div className="flex items-center gap-3">
            <SearchBar className="w-64" />
          </div>
        </div>
      </div>

      {/* ── Body: Sidebar + Table ───────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-0 px-0">
        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="hidden w-60 shrink-0 border-r border-border bg-panel lg:block">
          <div className="sticky top-0 flex flex-col gap-0">
            {/* Watchlist header */}
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Watchlist
              </h2>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-text-muted">
                Sign in to track your watchlist.
              </p>
            </div>

            {/* Screener filters header */}
            <div className="border-y border-border px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Screener Filters
              </h2>
            </div>

            {/* Direction filter */}
            <div className="px-4 py-3 space-y-2 border-b border-border">
              <p className="text-xs font-medium text-text-secondary">Direction</p>
              <div className="flex flex-col gap-1">
                {[
                  { label: "All", value: "", color: "#8b949e" },
                  { label: "Strong Long", value: "STRONG_LONG", color: "#10b981" },
                  { label: "Long", value: "LONG", color: "#10b981" },
                  { label: "Neutral", value: "NEUTRAL", color: "#6b7280" },
                  { label: "Short", value: "SHORT", color: "#ef4444" },
                  { label: "Strong Short", value: "STRONG_SHORT", color: "#ef4444" },
                ].map((opt) => {
                  const isActive = signalClass === opt.value;
                  return (
                    <Link
                      key={opt.value}
                      href={`/dashboard?signal_class=${opt.value}`}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-elevated"
                      style={{
                        background: isActive ? `${opt.color}18` : undefined,
                        color: isActive ? opt.color : "#8b949e",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: opt.color }}
                      />
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Regime info */}
            <div className="px-4 py-3 space-y-2 border-b border-border">
              <p className="text-xs font-medium text-text-secondary">Market Regime</p>
              {regime ? (
                <div className="space-y-1">
                  <p className="font-mono text-xs font-semibold text-text-primary">
                    {regime.regime}
                  </p>
                  <p className="text-2xs text-text-muted">
                    {regime.signal_count} signals · {regime.signal_date}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-text-muted">No regime data</p>
              )}
            </div>

            {/* Quick stats */}
            <div className="px-4 py-3 space-y-2">
              <p className="text-xs font-medium text-text-secondary">Overview</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-card/50 p-2 text-center">
                  <p className="font-mono text-sm font-bold text-text-primary">
                    {allSignals.length}
                  </p>
                  <p className="text-2xs text-text-muted">Total</p>
                </div>
                <div className="rounded-lg border border-border bg-card/50 p-2 text-center">
                  <p className="font-mono text-sm font-bold text-signal-long">
                    {allSignals.filter((s) => s.signal_class === "STRONG_LONG" || s.signal_class === "LONG").length}
                  </p>
                  <p className="text-2xs text-text-muted">Bullish</p>
                </div>
                <div className="rounded-lg border border-border bg-card/50 p-2 text-center">
                  <p className="font-mono text-sm font-bold text-signal-short">
                    {allSignals.filter((s) => s.signal_class === "STRONG_SHORT" || s.signal_class === "SHORT").length}
                  </p>
                  <p className="text-2xs text-text-muted">Bearish</p>
                </div>
                <div className="rounded-lg border border-border bg-card/50 p-2 text-center">
                  <p className="font-mono text-sm font-bold text-text-secondary">
                    {allSignals.filter((s) => s.signal_class === "NEUTRAL").length}
                  </p>
                  <p className="text-2xs text-text-muted">Neutral</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6">
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center text-text-muted text-sm">
                Loading signals...
              </div>
            }
          >
            <ModelSelector
              initialSignals={allSignals}
              regime={regime}
              watchedTickers={watchedTickers}
              activeClass={signalClass}
            />
          </Suspense>

          {/* Financial disclaimer */}
          <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-text-muted">
            {FINANCIAL_DISCLAIMER}
          </p>
        </main>
      </div>
    </div>
  );
}
