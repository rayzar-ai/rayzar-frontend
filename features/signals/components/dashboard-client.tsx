"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import type { Signal, MarketRegime } from "@/lib/api-client";
import { parseFeatureContext } from "@/lib/api-client";
import { SignalBadge } from "@/components/ui/signal-badge";
import { RayzarScore } from "@/components/ui/rayzar-score";
import { HealthScoreBar } from "@/components/ui/health-score-bar";
import { cn, formatDate } from "@/lib/utils";

type SortKey = "ticker" | "signal_class" | "rayzar_score" | "health_score" | "regime" | "signal_date";
type SortDir = "asc" | "desc";

interface DashboardClientProps {
  signals: Signal[];
  activeClass: string;
  regime: MarketRegime | null;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="h-3 w-3 text-text-muted" />;
  return sortDir === "asc"
    ? <ArrowUp className="h-3 w-3 text-accent-teal" />
    : <ArrowDown className="h-3 w-3 text-accent-teal" />;
}

function TaDirectionIcon({ direction }: { direction: string | null }) {
  if (direction === "bullish") return <TrendingUp className="h-3.5 w-3.5 text-signal-long" />;
  if (direction === "bearish") return <TrendingDown className="h-3.5 w-3.5 text-signal-short" />;
  return <Minus className="h-3.5 w-3.5 text-text-muted" />;
}

const SIGNAL_ORDER: Record<Signal["signal_class"], number> = {
  STRONG_LONG: 5, LONG: 4, NEUTRAL: 3, SHORT: 2, STRONG_SHORT: 1,
};

export function DashboardClient({ signals, activeClass, regime }: DashboardClientProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("rayzar_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [regimeFilter, setRegimeFilter] = useState<string>("");
  const [dirFilter, setDirFilter] = useState<string>(activeClass);
  const [searchQuery, setSearchQuery] = useState<string>("");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // Parse features_used for each signal
  const enrichedSignals = useMemo(() => {
    return signals.map((s) => ({
      ...s,
      _features: parseFeatureContext(s.features_used),
    }));
  }, [signals]);

  // Unique regimes for filter dropdown
  const uniqueRegimes = useMemo(() => {
    const set = new Set(signals.map((s) => s.regime).filter(Boolean));
    return Array.from(set).sort();
  }, [signals]);

  // Filter
  const filtered = useMemo(() => {
    return enrichedSignals.filter((s) => {
      if (dirFilter && s.signal_class !== dirFilter) return false;
      if (regimeFilter && s.regime !== regimeFilter) return false;
      if (searchQuery && !s.ticker.toUpperCase().includes(searchQuery.toUpperCase())) return false;
      return true;
    });
  }, [enrichedSignals, dirFilter, regimeFilter, searchQuery]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "ticker") {
        cmp = a.ticker.localeCompare(b.ticker);
      } else if (sortKey === "signal_class") {
        cmp = (SIGNAL_ORDER[a.signal_class] ?? 0) - (SIGNAL_ORDER[b.signal_class] ?? 0);
      } else if (sortKey === "rayzar_score") {
        cmp = a.rayzar_score - b.rayzar_score;
      } else if (sortKey === "health_score") {
        const aH = a._features?.health_score ?? -999;
        const bH = b._features?.health_score ?? -999;
        cmp = aH - bH;
      } else if (sortKey === "regime") {
        cmp = a.regime.localeCompare(b.regime);
      } else if (sortKey === "signal_date") {
        cmp = a.signal_date.localeCompare(b.signal_date);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function ThButton({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary"
        onClick={() => handleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filter / search bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick search */}
        <input
          type="text"
          placeholder="Filter ticker..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 rounded-lg border border-border bg-panel px-3 font-mono text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-teal/60 w-36"
        />

        {/* Direction filter */}
        <select
          value={dirFilter}
          onChange={(e) => setDirFilter(e.target.value)}
          className="h-8 rounded-lg border border-border bg-panel px-2 text-xs text-text-secondary outline-none focus:border-accent-teal/60"
        >
          <option value="">All Signals</option>
          <option value="STRONG_LONG">Strong Long</option>
          <option value="LONG">Long</option>
          <option value="NEUTRAL">Neutral</option>
          <option value="SHORT">Short</option>
          <option value="STRONG_SHORT">Strong Short</option>
        </select>

        {/* Regime filter */}
        {uniqueRegimes.length > 0 && (
          <select
            value={regimeFilter}
            onChange={(e) => setRegimeFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs text-text-secondary outline-none focus:border-accent-teal/60"
          >
            <option value="">All Regimes</option>
            {uniqueRegimes.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}

        {/* Result count */}
        <span className="ml-auto text-xs text-text-muted">
          {sorted.length} of {signals.length} signals
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-20 text-center">
          <div className="mb-3 text-3xl">📊</div>
          <h3 className="text-sm font-semibold text-text-primary">No signals match your filters</h3>
          <p className="mt-1 text-xs text-text-muted">
            Try changing the direction or regime filter above.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel/60 text-left">
                  <ThButton col="ticker" label="Ticker" />
                  <ThButton col="signal_class" label="Signal" />
                  <ThButton col="rayzar_score" label="Score" />
                  <ThButton col="health_score" label="Health" />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    TA Dir
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Personality
                  </th>
                  <ThButton col="regime" label="Regime" />
                  <ThButton col="signal_date" label="Date" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sorted.map((signal) => {
                  const features = signal._features;
                  const healthScore = features?.health_score ?? null;
                  const healthGrade = features?.health_grade ?? null;
                  const taDir = features?.ta_direction ?? null;
                  const personality = features?.personality_type ?? null;

                  return (
                    <tr
                      key={signal.id}
                      className="table-row-hover group"
                      onClick={() => router.push(`/stock/${signal.ticker}`)}
                    >
                      {/* Ticker */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/stock/${signal.ticker}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-sm font-bold text-text-primary hover:text-accent-teal"
                        >
                          {signal.ticker}
                        </Link>
                      </td>

                      {/* Signal badge */}
                      <td className="px-4 py-3">
                        <SignalBadge signalClass={signal.signal_class} />
                      </td>

                      {/* RayZar score */}
                      <td className="px-4 py-3">
                        <RayzarScore score={signal.rayzar_score} size="sm" />
                      </td>

                      {/* Health score bar (compact) */}
                      <td className="px-4 py-3">
                        <HealthScoreBar score={healthScore} grade={healthGrade} size="sm" />
                      </td>

                      {/* TA direction */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <TaDirectionIcon direction={taDir} />
                          <span className="capitalize text-xs text-text-secondary">
                            {taDir ?? "—"}
                          </span>
                        </span>
                      </td>

                      {/* Personality */}
                      <td className="px-4 py-3">
                        {personality ? (
                          <span className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-2xs text-text-secondary">
                            {personality}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>

                      {/* Regime */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">{signal.regime || "—"}</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {formatDate(signal.signal_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {sorted.map((signal) => {
              const features = signal._features;
              const healthScore = features?.health_score ?? null;
              const healthGrade = features?.health_grade ?? null;

              return (
                <Link
                  key={signal.id}
                  href={`/stock/${signal.ticker}`}
                  className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent-teal/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-base font-bold text-text-primary">
                        {signal.ticker}
                      </span>
                      <SignalBadge signalClass={signal.signal_class} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <RayzarScore score={signal.rayzar_score} size="lg" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <HealthScoreBar score={healthScore} grade={healthGrade} size="md" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                    <span>{signal.regime}</span>
                    <span>·</span>
                    <span>{formatDate(signal.signal_date)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
