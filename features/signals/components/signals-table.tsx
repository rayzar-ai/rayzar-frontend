"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Signal, PaginationMeta } from "@/lib/api-client";
import { parseFeatureContext } from "@/lib/api-client";
import { SignalBadge } from "@/components/ui/signal-badge";
import { RayzarScore } from "@/components/ui/rayzar-score";
import { RegimeBadge } from "@/components/ui/regime-badge";
import { WatchButton } from "@/components/ui/watch-button";
import { formatConfidence, formatDate } from "@/lib/utils";

interface SignalsTableProps {
  signals: Signal[];
  meta: PaginationMeta | null;
  currentPage: number;
}

export function SignalsTable({ signals, meta, currentPage }: SignalsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  // ── Empty state ──────────────────────────────────────────────────────
  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-20 text-center">
        <div className="mb-3 text-4xl">📊</div>
        <h3 className="text-base font-semibold text-text-heading">No signals yet</h3>
        <p className="mt-1 max-w-xs text-sm text-text-secondary">
          The nightly ML pipeline hasn&apos;t run yet, or no signals match the
          selected filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-panel/60 text-left text-xs uppercase tracking-wider text-text-secondary">
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">RayZar Score</th>
              <th className="px-4 py-3">Regime</th>
              <th className="px-4 py-3">Signal Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {signals.map((signal) => (
              <tr
                key={signal.id}
                className="group transition-colors hover:bg-elevated/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/stock/${signal.ticker}`}
                      className="font-mono font-semibold text-text-heading hover:text-signal-long"
                    >
                      {signal.ticker}
                    </Link>
                    {(() => {
                      const fc = parseFeatureContext(signal.features_used);
                      return (
                        <>
                          {fc?.earnings_proximity_flag && (
                            <span title={`Earnings in ${fc.days_to_earnings ?? "<14"} days`} className="text-xs text-amber-400 cursor-default">⚠️</span>
                          )}
                          {fc?.swing_candidate && (
                            <span title="Swing candidate" className="text-xs text-purple-400 cursor-default">↔</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <SignalBadge signalClass={signal.signal_class} />
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatConfidence(signal.confidence)}
                </td>
                <td className="px-4 py-3">
                  <RayzarScore score={signal.rayzar_score} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <RegimeBadge regime={signal.regime} />
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {formatDate(signal.signal_date)}
                </td>
                <td className="px-4 py-3">
                  <WatchButton ticker={signal.ticker} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────────── */}
      <div className="space-y-2 md:hidden">
        {signals.map((signal) => (
          <Link
            key={signal.id}
            href={`/stock/${signal.ticker}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-border-focus/50"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-text-heading">{signal.ticker}</span>
                  {(() => {
                    const fc = parseFeatureContext(signal.features_used);
                    return (
                      <>
                        {fc?.earnings_proximity_flag && (
                          <span title={`Earnings in ${fc.days_to_earnings ?? "<14"} days`} className="text-xs text-amber-400">⚠️</span>
                        )}
                        {fc?.swing_candidate && (
                          <span title="Swing candidate" className="text-xs text-purple-400">↔</span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="mt-1">
                  <SignalBadge signalClass={signal.signal_class} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">RayZar Score</p>
                <RayzarScore score={signal.rayzar_score} size="lg" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
              <span>Confidence: {formatConfidence(signal.confidence)}</span>
              <span>·</span>
              <RegimeBadge regime={signal.regime} />
              <span>·</span>
              <span>{formatDate(signal.signal_date)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-text-muted">
            Page {currentPage} of {meta.total_pages} · {meta.total} signals
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded border border-border px-3 py-1 text-text-secondary transition-colors hover:text-text-heading disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= meta.total_pages}
              className="rounded border border-border px-3 py-1 text-text-secondary transition-colors hover:text-text-heading disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
