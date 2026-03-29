"use client";

/**
 * features/signals/components/signal-detail-card.tsx — RayZar Frontend
 * Displays full signal metadata for a single ticker on the stock detail page.
 */

import type { Signal } from "@/lib/api-client";
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

export function SignalDetailCard({ signal }: SignalDetailCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
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

      <div className="mt-4 space-y-0">
        <MetricRow label="Signal date" value={formatDate(signal.signal_date)} />
        <MetricRow label="Confidence" value={formatConfidence(signal.confidence)} />
        <MetricRow label="Conviction" value={formatConfidence(signal.conviction_score)} />
        <MetricRow label="Consensus" value={formatConfidence(signal.consensus_score)} />
        <MetricRow label="Regime" value={
          <span className="capitalize">{signal.regime.replace(/_/g, " ")}</span>
        } />
        <MetricRow label="Model" value={signal.model_id} />
      </div>

      {signal.reasoning && (
        <div className="mt-4 rounded-md bg-elevated p-3">
          <p className="text-xs font-medium text-text-secondary mb-1">Reasoning</p>
          <p className="text-sm text-text-primary leading-relaxed">{signal.reasoning}</p>
        </div>
      )}
    </div>
  );
}
