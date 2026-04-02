"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Signal } from "@/lib/api-client";

const SIGNAL_COLORS: Record<string, { color: string; bg: string }> = {
  STRONG_LONG:  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  LONG:         { color: "#34d399", bg: "rgba(52,211,153,0.10)" },
  NEUTRAL:      { color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
  SHORT:        { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  STRONG_SHORT: { color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
  NO_TRADE:     { color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

function SignalBadge({ cls }: { cls: string }) {
  const { color, bg } = SIGNAL_COLORS[cls] ?? SIGNAL_COLORS.NEUTRAL;
  return (
    <span
      className="rounded px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {cls.replace("_", " ")}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 65 ? "#f59e0b" : "#6b7280";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="font-mono text-xs font-semibold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

interface Props {
  signals: Signal[];
  total: number;
  page: number;
}

const PAGE_SIZE = 100;

export function ScreenerTable({ signals, total, page }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (signals.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-panel py-16 text-center">
        <p className="text-text-muted text-sm">No signals match your filters.</p>
        <p className="text-text-muted text-xs mt-1">Try adjusting or clearing the filters above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Count bar */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>
          Showing <span className="text-text-secondary font-semibold">{signals.length}</span> of <span className="text-text-secondary font-semibold">{total}</span> signals
        </span>
        {totalPages > 1 && (
          <span>Page {page} of {totalPages}</span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Ticker</th>
              <th className="px-4 py-3 font-medium">Signal</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Sector</th>
              <th className="px-4 py-3 font-medium">Regime</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((sig) => (
              <tr
                key={sig.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-white/[0.02]"
              >
                {/* Ticker */}
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${sig.ticker}`}
                    className="font-mono font-bold transition-colors"
                    style={{ color: "var(--color-teal)" }}
                  >
                    {sig.ticker}
                  </Link>
                  <div className="text-[10px] text-text-muted mt-0.5 font-mono">
                    {sig.asset_class}
                  </div>
                </td>

                {/* Signal */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <SignalBadge cls={sig.signal_class} />
                    {sig.no_trade_reason && (
                      <div className="text-[10px] text-text-muted truncate max-w-[120px]" title={sig.no_trade_reason}>
                        {sig.no_trade_reason}
                      </div>
                    )}
                  </div>
                </td>

                {/* Score */}
                <td className="px-4 py-3">
                  <ScoreBar score={sig.rayzar_score} />
                </td>

                {/* Confidence */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-text-secondary">
                    {(sig.confidence * 100).toFixed(1)}%
                  </span>
                </td>

                {/* Sector */}
                <td className="px-4 py-3">
                  <span className="text-xs text-text-muted">
                    {sig.sector ?? "—"}
                  </span>
                </td>

                {/* Regime */}
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-text-muted">
                    {sig.regime ?? "—"}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <span className="text-xs text-text-muted font-mono">
                    {sig.signal_date}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary disabled:opacity-30 border border-border hover:bg-white/5 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-text-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary disabled:opacity-30 border border-border hover:bg-white/5 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
