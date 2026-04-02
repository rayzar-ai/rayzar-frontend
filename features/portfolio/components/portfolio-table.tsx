"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { PortfolioPosition } from "@/lib/api-client";

const SIGNAL_COLORS: Record<string, { color: string; bg: string }> = {
  STRONG_LONG:  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  LONG:         { color: "#34d399", bg: "rgba(52,211,153,0.10)" },
  NEUTRAL:      { color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
  SHORT:        { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  STRONG_SHORT: { color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
  NO_TRADE:     { color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

function SignalBadge({ cls }: { cls: string | null }) {
  if (!cls) return <span className="text-xs text-text-muted">—</span>;
  const { color, bg } = SIGNAL_COLORS[cls] ?? SIGNAL_COLORS.NEUTRAL;
  return (
    <span
      className="rounded px-1.5 py-0.5 text-xs font-semibold"
      style={{ color, background: bg }}
    >
      {cls.replace("_", " ")}
    </span>
  );
}

function PnlCell({ pct, value }: { pct: number | null; value: number | null }) {
  if (pct === null) return <span className="text-xs text-text-muted">—</span>;
  const up = pct >= 0;
  const color = up ? "#10b981" : "#ef4444";
  return (
    <div>
      <div className="font-mono text-sm font-semibold" style={{ color }}>
        {up ? "+" : ""}{pct.toFixed(2)}%
      </div>
      {value !== null && (
        <div className="font-mono text-xs" style={{ color }}>
          {up ? "+" : ""}${Math.abs(value).toFixed(0)}
        </div>
      )}
    </div>
  );
}

function PriceCell({ label, price }: { label: string; price: number | null }) {
  if (!price) return null;
  return (
    <div className="text-xs text-text-muted">
      {label}: <span className="font-mono text-text-secondary">${price.toFixed(2)}</span>
    </div>
  );
}

interface Props {
  initialPositions: PortfolioPosition[];
}

export function PortfolioTable({ initialPositions }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleRemove(ticker: string) {
    setRemoving(ticker);
    await apiClient.removePosition(ticker);
    setRemoving(null);
    startTransition(() => router.refresh());
  }

  const totalPnl = initialPositions.reduce((sum, p) => sum + (p.pnl_value ?? 0), 0);
  const totalValue = initialPositions.reduce(
    (sum, p) => sum + (p.current_price ?? 0) * (p.quantity ?? 0),
    0
  );

  if (initialPositions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-panel py-16 text-center">
        <p className="text-text-muted text-sm">No open positions.</p>
        <p className="text-text-muted text-xs mt-1">Add your first position using the form above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Portfolio summary bar */}
      <div className="flex flex-wrap gap-6 rounded-xl border border-border bg-panel px-5 py-3">
        <div>
          <div className="text-xs text-text-muted">Positions</div>
          <div className="font-mono text-lg font-semibold text-text-primary">{initialPositions.length}</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Total Value</div>
          <div className="font-mono text-lg font-semibold text-text-primary">
            ${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Unrealized P&amp;L</div>
          <div
            className="font-mono text-lg font-semibold"
            style={{ color: totalPnl >= 0 ? "#10b981" : "#ef4444" }}
          >
            {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Positions table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Ticker</th>
              <th className="px-4 py-3 font-medium">Signal</th>
              <th className="px-4 py-3 font-medium">Entry</th>
              <th className="px-4 py-3 font-medium">Current</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">P&amp;L</th>
              <th className="px-4 py-3 font-medium">Levels</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {initialPositions.map((pos) => (
              <tr
                key={pos.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-white/[0.02]"
              >
                {/* Ticker */}
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${pos.ticker}`}
                    className="font-mono font-bold text-text-primary hover:text-teal-400 transition-colors"
                    style={{ color: "var(--color-teal)" }}
                  >
                    {pos.ticker}
                  </Link>
                  {pos.notes && (
                    <div className="text-xs text-text-muted mt-0.5 truncate max-w-[120px]" title={pos.notes}>
                      {pos.notes}
                    </div>
                  )}
                </td>

                {/* Signal */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <SignalBadge cls={pos.signal_class} />
                    {pos.rayzar_score !== null && (
                      <div className="text-xs text-text-muted">Score {pos.rayzar_score}</div>
                    )}
                  </div>
                </td>

                {/* Entry */}
                <td className="px-4 py-3">
                  <div className="font-mono text-sm text-text-primary">
                    {pos.entry_price ? `$${pos.entry_price.toFixed(2)}` : "—"}
                  </div>
                </td>

                {/* Current */}
                <td className="px-4 py-3">
                  <div className="font-mono text-sm text-text-primary">
                    {pos.current_price ? `$${pos.current_price.toFixed(2)}` : "—"}
                  </div>
                </td>

                {/* Qty */}
                <td className="px-4 py-3">
                  <div className="font-mono text-sm text-text-secondary">
                    {pos.quantity ?? "—"}
                  </div>
                </td>

                {/* P&L */}
                <td className="px-4 py-3">
                  <PnlCell pct={pos.pnl_pct} value={pos.pnl_value} />
                </td>

                {/* Stop / Targets */}
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <PriceCell label="Stop" price={pos.stop_loss} />
                    <PriceCell label="T1" price={pos.target_1} />
                    <PriceCell label="T2" price={pos.target_2} />
                    {!pos.stop_loss && !pos.target_1 && (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <div className="text-xs text-text-muted">
                    {pos.entry_date ?? "—"}
                  </div>
                </td>

                {/* Remove */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(pos.ticker)}
                    disabled={removing === pos.ticker}
                    className="rounded px-2 py-1 text-xs text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  >
                    {removing === pos.ticker ? "…" : "Remove"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
