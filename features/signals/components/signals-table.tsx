"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Signal, PaginationMeta } from "@/lib/api-client";
import { SignalBadge } from "@/components/ui/signal-badge";
import { RayzarScore } from "@/components/ui/rayzar-score";
import { RegimeBadge } from "@/components/ui/regime-badge";
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
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-800 bg-card py-20 text-center">
        <div className="mb-3 text-4xl">📊</div>
        <h3 className="text-base font-semibold text-white">No signals yet</h3>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          The nightly ML pipeline hasn&apos;t run yet, or no signals match the
          selected filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-800 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/60 text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">RayZar Score</th>
              <th className="px-4 py-3">Regime</th>
              <th className="px-4 py-3">Signal Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {signals.map((signal) => (
              <tr
                key={signal.id}
                className="group transition-colors hover:bg-gray-800/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${signal.ticker}`}
                    className="font-mono font-semibold text-white hover:text-green-400"
                  >
                    {signal.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <SignalBadge signalClass={signal.signal_class} />
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatConfidence(signal.confidence)}
                </td>
                <td className="px-4 py-3">
                  <RayzarScore score={signal.rayzar_score} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <RegimeBadge regime={signal.regime} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(signal.signal_date)}
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
            className="block rounded-lg border border-gray-800 bg-card p-4 transition-colors hover:border-gray-600"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-white">
                  {signal.ticker}
                </span>
                <div className="mt-1">
                  <SignalBadge signalClass={signal.signal_class} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">RayZar Score</p>
                <RayzarScore score={signal.rayzar_score} size="lg" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
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
          <p className="text-gray-500">
            Page {currentPage} of {meta.total_pages} · {meta.total} signals
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded border border-gray-700 px-3 py-1 text-gray-400 transition-colors hover:text-white disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= meta.total_pages}
              className="rounded border border-gray-700 px-3 py-1 text-gray-400 transition-colors hover:text-white disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
