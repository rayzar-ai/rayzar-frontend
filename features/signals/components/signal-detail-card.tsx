"use client";

/**
 * features/signals/components/signal-detail-card.tsx — RayZar Frontend
 * Displays full signal metadata for a single ticker on the stock detail page.
 */

import type { Signal } from "@/lib/api-client";
import { parseFeatureContext } from "@/lib/api-client";
import { SignalBadge } from "@/components/ui/signal-badge";
import { RayzarScore } from "@/components/ui/rayzar-score";
import { formatConfidence, formatDate } from "@/lib/utils";

interface SignalDetailCardProps {
  signal: Signal;
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-5 mb-2">
      {title}
    </p>
  );
}

function AlignmentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    STRONG_AGREE:    { label: "Strong Agree",   className: "bg-signal-long/15 text-signal-long border-signal-long/30" },
    WEAK_AGREE:      { label: "Weak Agree",      className: "bg-signal-long/8 text-signal-long/80 border-signal-long/20" },
    NEUTRAL:         { label: "Neutral",          className: "bg-elevated text-text-secondary border-border" },
    WEAK_CONFLICT:   { label: "Weak Conflict",   className: "bg-signal-short/8 text-signal-short/80 border-signal-short/20" },
    STRONG_CONFLICT: { label: "Strong Conflict", className: "bg-signal-short/15 text-signal-short border-signal-short/30" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-elevated text-text-secondary border-border" };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

/** Parse "BEARISH: X (1w 95%), Y | BULLISH: Z (1d 83%)" into structured lists */
function parseTaSummary(summary: string): { bearish: string[]; bullish: string[] } {
  const result = { bearish: [] as string[], bullish: [] as string[] };
  for (const part of summary.split("|").map((s) => s.trim())) {
    if (part.startsWith("BEARISH:")) {
      result.bearish = part.replace("BEARISH:", "").split(",").map((s) => s.trim()).filter(Boolean);
    } else if (part.startsWith("BULLISH:")) {
      result.bullish = part.replace("BULLISH:", "").split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return result;
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function SignalDetailCard({ signal }: SignalDetailCardProps) {
  const fc = parseFeatureContext(signal.features_used);
  const taParsed = fc?.ta_summary ? parseTaSummary(fc.ta_summary) : null;
  const isShort  = signal.signal_class === "SHORT" || signal.signal_class === "STRONG_SHORT";

  return (
    <div className="rounded-lg border border-border bg-card p-5">

      {/* ── Header ── */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-heading">{signal.ticker}</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {signal.asset_class} · {signal.timeframe}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SignalBadge signalClass={signal.signal_class} className="text-sm px-3 py-1" />
          <RayzarScore score={signal.rayzar_score} />
        </div>
      </div>

      {/* ── Earnings warning ── */}
      {fc?.earnings_proximity_flag && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <span>⚠️</span>
          <p className="text-sm text-amber-400">
            Earnings in {fc.days_to_earnings != null ? `${fc.days_to_earnings} days` : "< 14 days"} — elevated risk, consider sizing down
          </p>
        </div>
      )}

      {/* ── Swing candidate ── */}
      {fc?.swing_candidate && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-2">
          <span>↔️</span>
          <p className="text-sm text-purple-400">
            {isShort
              ? "Swing opportunity — ML short but deeply oversold, possible short-term bounce"
              : "Swing opportunity — ML long but overbought, possible short-term pullback"}
          </p>
        </div>
      )}

      {/* ── Core metrics ── */}
      <div className="mt-2 space-y-0">
        <MetricRow label="Signal date" value={formatDate(signal.signal_date)} />
        <MetricRow label="Confidence"  value={formatConfidence(signal.confidence)} />
        <MetricRow label="Conviction"  value={formatConfidence(signal.conviction_score)} />
        <MetricRow label="Consensus"   value={formatConfidence(signal.consensus_score)} />
        <MetricRow label="Regime"      value={<span className="capitalize">{signal.regime.replace(/_/g, " ")}</span>} />
        <MetricRow label="Model"       value={signal.model_id} />
        {fc?.final_long_prob  != null && <MetricRow label="Long prob"  value={`${(fc.final_long_prob  * 100).toFixed(1)}%`} />}
        {fc?.final_short_prob != null && <MetricRow label="Short prob" value={`${(fc.final_short_prob * 100).toFixed(1)}%`} />}
      </div>

      {/* ── TA Signals ── */}
      {taParsed && (taParsed.bearish.length > 0 || taParsed.bullish.length > 0) && (
        <>
          <SectionHeader title="TA Signals" />
          <div className="space-y-1.5">
            {taParsed.bearish.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-signal-short" />
                <span className="text-sm text-text-primary">{s}</span>
              </div>
            ))}
            {taParsed.bullish.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-signal-long" />
                <span className="text-sm text-text-primary">{s}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ML + TA Alignment ── */}
      {fc?.ta_alignment_status && (
        <>
          <SectionHeader title="ML + TA Alignment" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Status</span>
            <AlignmentBadge status={fc.ta_alignment_status} />
          </div>
          {fc.ta_conflict_reason && (
            <p className="text-xs text-text-muted mt-1.5">{fc.ta_conflict_reason}</p>
          )}
        </>
      )}

      {/* ── Stop loss + targets ── */}
      {(fc?.stop_loss != null || fc?.target_1 != null) && (
        <>
          <SectionHeader title="Levels" />
          <div className="space-y-0">
            {fc?.stop_loss != null && (
              <MetricRow label="Stop loss" value={<span className="font-mono text-signal-short">${fmt(fc.stop_loss)}</span>} />
            )}
            {fc?.target_1 != null && (
              <MetricRow label="Target 1"  value={<span className={`font-mono ${isShort ? "text-signal-short" : "text-signal-long"}`}>${fmt(fc.target_1)}</span>} />
            )}
            {fc?.target_2 != null && (
              <MetricRow label="Target 2"  value={<span className={`font-mono ${isShort ? "text-signal-short" : "text-signal-long"}`}>${fmt(fc.target_2)}</span>} />
            )}
          </div>
        </>
      )}

      {/* ── Position sizing ── */}
      {fc?.shares_1pct_risk != null && (
        <>
          <SectionHeader title="Position Sizing (1% risk · $100k account)" />
          <div className="space-y-0">
            <MetricRow label="Shares"          value={<span className="font-mono">{fc.shares_1pct_risk}</span>} />
            {fc.position_value_1pct != null && (
              <MetricRow label="Position value" value={<span className="font-mono">${fmt(fc.position_value_1pct, 0)}</span>} />
            )}
            {fc.risk_per_share != null && (
              <MetricRow label="Risk / share"   value={<span className="font-mono">${fmt(fc.risk_per_share)}</span>} />
            )}
            {fc.risk_pct != null && (
              <MetricRow label="Account risk"   value={<span className="font-mono">{fmt(fc.risk_pct, 1)}%</span>} />
            )}
          </div>
        </>
      )}

      {/* ── Reasoning ── */}
      {signal.reasoning && (
        <div className="mt-4 rounded-md bg-elevated p-3">
          <p className="text-xs font-medium text-text-secondary mb-1">Reasoning</p>
          <p className="text-sm text-text-primary leading-relaxed">{signal.reasoning}</p>
        </div>
      )}

    </div>
  );
}
