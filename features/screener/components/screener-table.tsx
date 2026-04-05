"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Signal } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface Features {
  rsi14?: number;
  macd_hist_pct?: number;
  rvol20?: number;
  health_score?: number;
  health_grade?: string;
  ta_alignment_status?: string;
  final_long_prob?: number;
  final_short_prob?: number;
  stop_loss?: number;
  target_1?: number;
  risk_per_share?: number;
  risk_pct?: number;
  macro_regime_label?: string;
  sector_regime_label?: string;
  ta_direction?: string;
  earnings_proximity_flag?: number;
}

function getFeatures(sig: Signal): Features {
  if (!sig.features_used || typeof sig.features_used !== "object") return {};
  return sig.features_used as Features;
}

/** Composite priority score: ML (40%) + Health (30%) + TA alignment (30%) */
function priorityScore(sig: Signal): number {
  const f = getFeatures(sig);
  const isShort = sig.signal_class === "SHORT" || sig.signal_class === "STRONG_SHORT";

  const mlProb = isShort
    ? (f.final_short_prob ?? 1 - (f.final_long_prob ?? 0.5))
    : (f.final_long_prob ?? 0.5);
  const mlComponent = Math.min(1, Math.max(0, (mlProb - 0.5) * 2)); // 0–1 scale

  const healthRaw = f.health_score ?? 0;
  const healthComponent = Math.min(1, Math.max(0, (healthRaw + 50) / 100)); // -50..50 → 0..1

  const alignMap: Record<string, number> = {
    STRONG_AGREE: 1.0,
    AGREE: 0.67,
    PARTIAL: 0.33,
    DISAGREE: 0.0,
  };
  const alignComponent = alignMap[f.ta_alignment_status ?? "DISAGREE"] ?? 0;

  return Math.round((mlComponent * 0.4 + healthComponent * 0.3 + alignComponent * 0.3) * 100);
}

/** R/R ratio from features: Reward = target_1 - entry, Risk = risk_per_share */
function rrRatio(f: Features): number | null {
  if (!f.target_1 || !f.stop_loss || !f.risk_per_share || f.risk_per_share <= 0) return null;
  const entry = f.stop_loss + f.risk_per_share;
  const reward = f.target_1 - entry;
  if (reward <= 0) return null;
  return reward / f.risk_per_share;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIGNAL_COLORS: Record<string, { color: string; bg: string }> = {
  STRONG_LONG:  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  LONG:         { color: "#34d399", bg: "rgba(52,211,153,0.10)" },
  NEUTRAL:      { color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
  SHORT:        { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  STRONG_SHORT: { color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
  NO_TRADE:     { color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

const HEALTH_COLORS: Record<string, string> = {
  A: "#10b981", B: "#34d399", C: "#f59e0b", D: "#f87171", F: "#ef4444",
};

// ---------------------------------------------------------------------------
// Small display components
// ---------------------------------------------------------------------------

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
      <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-mono text-xs font-semibold" style={{ color }}>{score}</span>
    </div>
  );
}

function PriorityScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#6b7280";
  const bg = score >= 70 ? "rgba(16,185,129,0.12)" : score >= 50 ? "rgba(245,158,11,0.10)" : "rgba(107,114,128,0.08)";
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded px-2 py-0.5 font-mono text-xs font-bold"
        style={{ color, background: bg }}
      >
        {score}
      </span>
      <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function HealthCell({ f }: { f: Features }) {
  const score = f.health_score;
  const grade = f.health_grade;
  if (score == null && !grade) return <span className="text-xs text-text-muted">—</span>;
  const color = HEALTH_COLORS[grade ?? ""] ?? "#6b7280";
  return (
    <div className="flex items-center gap-1.5">
      {grade && (
        <span className="font-mono text-xs font-bold" style={{ color }}>{grade}</span>
      )}
      {score != null && (
        <span className="font-mono text-[10px] text-text-muted">({score > 0 ? "+" : ""}{Math.round(score)})</span>
      )}
    </div>
  );
}

function AlignmentDots({ status }: { status?: string }) {
  const filled = status === "STRONG_AGREE" ? 3 : status === "AGREE" ? 2 : status === "PARTIAL" ? 1 : 0;
  const color = filled === 3 ? "#10b981" : filled === 2 ? "#34d399" : filled === 1 ? "#f59e0b" : "#6b7280";
  return (
    <div className="flex items-center gap-0.5" title={status ?? "—"}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="text-sm leading-none" style={{ color: i < filled ? color : "#374151" }}>
          ●
        </span>
      ))}
    </div>
  );
}

function RSICell({ rsi }: { rsi?: number }) {
  if (rsi == null) return <span className="text-xs text-text-muted">—</span>;
  const r = Math.round(rsi);
  const color = r < 30 ? "#10b981" : r > 70 ? "#ef4444" : "#9ca3af";
  const label = r < 30 ? "OS" : r > 70 ? "OB" : "";
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs font-semibold" style={{ color }}>{r}</span>
      {label && (
        <span className="text-[9px] font-bold rounded px-1" style={{ color, background: `${color}20` }}>{label}</span>
      )}
    </div>
  );
}

function MACDCell({ macdPct }: { macdPct?: number }) {
  if (macdPct == null) return <span className="text-xs text-text-muted">—</span>;
  const bull = macdPct > 0;
  const color = bull ? "#10b981" : "#ef4444";
  const icon = bull ? "▲" : "▼";
  return (
    <span className="font-mono text-xs font-semibold" style={{ color }}>
      {icon} {(macdPct * 100).toFixed(1)}%
    </span>
  );
}

function VolumeCell({ rvol }: { rvol?: number }) {
  if (rvol == null) return <span className="text-xs text-text-muted">—</span>;
  const r = Math.round(rvol * 10) / 10;
  const color = r >= 2 ? "#10b981" : r >= 1.5 ? "#f59e0b" : "#6b7280";
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs font-semibold" style={{ color }}>{r}x</span>
      {r >= 2 && <span className="text-[9px] text-teal-400 font-bold">HIGH</span>}
    </div>
  );
}

function RRCell({ f }: { f: Features }) {
  const rr = rrRatio(f);
  if (rr == null) return <span className="text-xs text-text-muted">—</span>;
  const color = rr >= 3 ? "#10b981" : rr >= 2 ? "#34d399" : rr >= 1 ? "#f59e0b" : "#ef4444";
  return (
    <span className="font-mono text-xs font-semibold" style={{ color }}>
      {rr.toFixed(1)}:1
    </span>
  );
}

function RegimeCell({ f }: { f: Features }) {
  const macro = f.macro_regime_label;
  const sector = f.sector_regime_label;
  if (!macro && !sector) return <span className="text-xs text-text-muted">—</span>;
  return (
    <div className="space-y-0.5">
      {macro && <div className="text-[10px] font-mono text-text-muted truncate max-w-[100px]" title={macro}>{macro}</div>}
      {sector && <div className="text-[10px] font-mono text-text-muted truncate max-w-[100px]" title={sector}>{sector}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Priority filter
// ---------------------------------------------------------------------------

const TRADEABLE = new Set(["STRONG_LONG", "LONG", "STRONG_SHORT", "SHORT"]);
const LONG_CLASSES = new Set(["STRONG_LONG", "LONG"]);
const SHORT_CLASSES = new Set(["SHORT", "STRONG_SHORT"]);

function isPrioritySignal(sig: Signal): boolean {
  if (!TRADEABLE.has(sig.signal_class)) return false;
  const f = getFeatures(sig);
  const align = f.ta_alignment_status ?? "";
  if (!["STRONG_AGREE", "AGREE"].includes(align)) return false;
  if ((f.health_score ?? -999) < -20) return false;
  if (LONG_CLASSES.has(sig.signal_class) && (f.final_long_prob ?? 0) < 0.52) return false;
  if (SHORT_CLASSES.has(sig.signal_class) && (f.final_long_prob ?? 1) > 0.48) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
  const [tab, setTab] = useState<"priority" | "all">("priority");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const prioritySignals = signals
    .filter(isPrioritySignal)
    .sort((a, b) => priorityScore(b) - priorityScore(a));

  const displayed = tab === "priority" ? prioritySignals : signals;

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        <TabButton active={tab === "priority"} onClick={() => setTab("priority")}>
          Priority
          <span className="ml-1.5 rounded-full px-1.5 py-0 text-[10px] font-bold"
            style={{
              background: tab === "priority" ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.1)",
              color: tab === "priority" ? "#10b981" : "#6b7280",
            }}>
            {prioritySignals.length}
          </span>
        </TabButton>
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>
          All Signals
          <span className="ml-1.5 rounded-full px-1.5 py-0 text-[10px] font-bold"
            style={{
              background: tab === "all" ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.1)",
              color: tab === "all" ? "#10b981" : "#6b7280",
            }}>
            {total}
          </span>
        </TabButton>
      </div>

      {/* Priority tab legend */}
      {tab === "priority" && (
        <div className="flex flex-wrap gap-3 text-[10px] text-text-muted px-1">
          <span>Score = ML(40%) + Health(30%) + TA Align(30%)</span>
          <span className="text-teal-500">● = TA/ML agreement dots</span>
          <span>OS = RSI oversold  OB = overbought</span>
          <span>RVOL = relative volume vs 20d avg</span>
        </div>
      )}

      {/* Count bar */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>
          Showing{" "}
          <span className="text-text-secondary font-semibold">{displayed.length}</span>{" "}
          {tab === "priority" ? "priority" : "total"} signals
          {tab === "priority" && signals.length > 0 && (
            <span className="ml-1 text-text-muted">({signals.length} loaded)</span>
          )}
        </span>
        {tab === "all" && totalPages > 1 && (
          <span>Page {page} of {totalPages}</span>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel py-16 text-center">
          <p className="text-text-muted text-sm">
            {tab === "priority"
              ? "No priority signals today — no A-grade setups matching all criteria."
              : "No signals match your filters."}
          </p>
          {tab === "priority" && (
            <p className="text-text-muted text-xs mt-1">
              Try switching to All Signals or adjusting filters above.
            </p>
          )}
        </div>
      ) : tab === "priority" ? (
        <PriorityTable signals={displayed} />
      ) : (
        <AllSignalsTable signals={displayed} />
      )}

      {/* Pagination (all signals tab only) */}
      {tab === "all" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary disabled:opacity-30 border border-border hover:bg-white/5 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-text-muted">{page} / {totalPages}</span>
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

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors"
      style={{
        borderColor: active ? "var(--color-teal)" : "transparent",
        color: active ? "var(--color-teal)" : "var(--color-text-muted)",
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Priority table (A-grade signals, composite scored)
// ---------------------------------------------------------------------------

function PriorityTable({ signals }: { signals: Signal[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-muted bg-white/[0.02]">
            <th className="px-3 py-3 font-medium">#</th>
            <th className="px-3 py-3 font-medium">Ticker</th>
            <th className="px-3 py-3 font-medium">Signal</th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">Priority Score</th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">ML Prob</th>
            <th className="px-3 py-3 font-medium">Health</th>
            <th className="px-3 py-3 font-medium" title="TA/ML Alignment">Align</th>
            <th className="px-3 py-3 font-medium">R/R</th>
            <th className="px-3 py-3 font-medium">RSI</th>
            <th className="px-3 py-3 font-medium">MACD</th>
            <th className="px-3 py-3 font-medium">Volume</th>
            <th className="px-3 py-3 font-medium">Regime</th>
            <th className="px-3 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((sig, idx) => {
            const f = getFeatures(sig);
            const isShort = SHORT_CLASSES.has(sig.signal_class);
            const prob = isShort
              ? (f.final_short_prob ?? 1 - (f.final_long_prob ?? 0.5))
              : (f.final_long_prob ?? sig.confidence);
            const score = priorityScore(sig);

            return (
              <tr
                key={sig.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-3 py-3">
                  <span className="font-mono text-xs text-text-muted">{idx + 1}</span>
                </td>

                <td className="px-3 py-3">
                  <Link
                    href={`/stock/${sig.ticker}`}
                    className="font-mono font-bold transition-colors hover:underline"
                    style={{ color: "var(--color-teal)" }}
                  >
                    {sig.ticker}
                  </Link>
                  <div className="text-[10px] text-text-muted mt-0.5">{sig.sector ?? sig.asset_class}</div>
                </td>

                <td className="px-3 py-3">
                  <SignalBadge cls={sig.signal_class} />
                </td>

                <td className="px-3 py-3">
                  <PriorityScoreBadge score={score} />
                </td>

                <td className="px-3 py-3">
                  <span className="font-mono text-xs font-semibold" style={{ color: prob >= 0.6 ? "#10b981" : prob >= 0.55 ? "#f59e0b" : "#9ca3af" }}>
                    {(prob * 100).toFixed(1)}%
                  </span>
                </td>

                <td className="px-3 py-3">
                  <HealthCell f={f} />
                </td>

                <td className="px-3 py-3">
                  <AlignmentDots status={f.ta_alignment_status} />
                </td>

                <td className="px-3 py-3">
                  <RRCell f={f} />
                </td>

                <td className="px-3 py-3">
                  <RSICell rsi={f.rsi14} />
                </td>

                <td className="px-3 py-3">
                  <MACDCell macdPct={f.macd_hist_pct} />
                </td>

                <td className="px-3 py-3">
                  <VolumeCell rvol={f.rvol20} />
                </td>

                <td className="px-3 py-3">
                  <RegimeCell f={f} />
                </td>

                <td className="px-3 py-3">
                  <span className="text-xs text-text-muted font-mono">{sig.signal_date}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// All Signals table (original + new indicator columns)
// ---------------------------------------------------------------------------

function AllSignalsTable({ signals }: { signals: Signal[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-muted bg-white/[0.02]">
            <th className="px-3 py-3 font-medium">Ticker</th>
            <th className="px-3 py-3 font-medium">Signal</th>
            <th className="px-3 py-3 font-medium">Score</th>
            <th className="px-3 py-3 font-medium">Health</th>
            <th className="px-3 py-3 font-medium">Align</th>
            <th className="px-3 py-3 font-medium">RSI</th>
            <th className="px-3 py-3 font-medium">MACD</th>
            <th className="px-3 py-3 font-medium">Volume</th>
            <th className="px-3 py-3 font-medium">R/R</th>
            <th className="px-3 py-3 font-medium">Sector</th>
            <th className="px-3 py-3 font-medium">Regime</th>
            <th className="px-3 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((sig) => {
            const f = getFeatures(sig);
            return (
              <tr
                key={sig.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-3 py-3">
                  <Link
                    href={`/stock/${sig.ticker}`}
                    className="font-mono font-bold transition-colors hover:underline"
                    style={{ color: "var(--color-teal)" }}
                  >
                    {sig.ticker}
                  </Link>
                  <div className="text-[10px] text-text-muted mt-0.5">{sig.asset_class}</div>
                </td>

                <td className="px-3 py-3">
                  <div className="space-y-1">
                    <SignalBadge cls={sig.signal_class} />
                    {sig.no_trade_reason && (
                      <div className="text-[10px] text-text-muted truncate max-w-[120px]" title={sig.no_trade_reason}>
                        {sig.no_trade_reason}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-3 py-3">
                  <ScoreBar score={sig.rayzar_score} />
                </td>

                <td className="px-3 py-3">
                  <HealthCell f={f} />
                </td>

                <td className="px-3 py-3">
                  <AlignmentDots status={f.ta_alignment_status} />
                </td>

                <td className="px-3 py-3">
                  <RSICell rsi={f.rsi14} />
                </td>

                <td className="px-3 py-3">
                  <MACDCell macdPct={f.macd_hist_pct} />
                </td>

                <td className="px-3 py-3">
                  <VolumeCell rvol={f.rvol20} />
                </td>

                <td className="px-3 py-3">
                  <RRCell f={f} />
                </td>

                <td className="px-3 py-3">
                  <span className="text-xs text-text-muted">{sig.sector ?? "—"}</span>
                </td>

                <td className="px-3 py-3">
                  <RegimeCell f={f} />
                </td>

                <td className="px-3 py-3">
                  <span className="text-xs text-text-muted font-mono">{sig.signal_date}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
