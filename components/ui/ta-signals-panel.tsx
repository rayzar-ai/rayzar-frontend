"use client";

import { useState } from "react";
import type React from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Activity, ScanLine } from "lucide-react";
import type { TASignalItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useSignalsStore } from "@/store/signals-store";

interface TASignalsPanelProps {
  signals: TASignalItem[];
  direction: string | null;
  summary: string | null;
  className?: string;
}

function DirectionIcon({
  direction,
  className,
  style,
}: {
  direction: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (direction === "bullish") return <TrendingUp className={cn("h-4 w-4", className)} style={style} />;
  if (direction === "bearish") return <TrendingDown className={cn("h-4 w-4", className)} style={style} />;
  return <Minus className={cn("h-4 w-4", className)} style={style} />;
}

function directionColor(direction: string): string {
  if (direction === "bullish") return "var(--color-teal)";
  if (direction === "bearish") return "var(--color-bear)";
  return "var(--color-amber)";
}

function directionBgClass(direction: string): string {
  if (direction === "bullish") return "bg-accent-teal/10 text-accent-teal border-accent-teal/30";
  if (direction === "bearish") return "bg-signal-short/10 text-signal-short border-signal-short/30";
  return "bg-accent-amber/10 text-accent-amber border-accent-amber/30";
}

function confidenceBarColor(direction: string): string {
  if (direction === "bullish") return "var(--color-teal)";
  if (direction === "bearish") return "var(--color-bear)";
  return "var(--color-amber)";
}

function SignalCard({ signal, index }: { signal: TASignalItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = directionColor(signal.direction);
  const pct = Math.round(signal.confidence * 100);
  const activeOverlay = useSignalsStore((s) => s.activePatternOverlay);
  const setActivePatternOverlay = useSignalsStore((s) => s.setActivePatternOverlay);
  const isActive = activeOverlay?.type === signal.name;
  const hasOverlay = !!signal.overlay;

  return (
    <div
      className="rounded-lg border border-border bg-card/50 p-3 transition-colors hover:border-border-focus/30 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Direction icon */}
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <DirectionIcon direction={signal.direction} className="h-3.5 w-3.5" style={{ color }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name row */}
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate text-sm font-semibold text-text-primary">
              {signal.name}
            </span>

            {/* Timeframe badge */}
            <span className="shrink-0 rounded border border-border-subtle bg-elevated px-1.5 py-0.5 font-mono text-2xs text-text-secondary">
              {signal.timeframe}
            </span>

            {/* Direction badge */}
            <span
              className={cn(
                "shrink-0 rounded border px-1.5 py-0.5 text-2xs font-medium capitalize",
                directionBgClass(signal.direction)
              )}
            >
              {signal.direction}
            </span>
          </div>

          {/* Confidence bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: confidenceBarColor(signal.direction),
                  boxShadow: `0 0 6px ${confidenceBarColor(signal.direction)}40`,
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs text-text-secondary">
              {pct}%
            </span>
          </div>

          {/* Description (if available) */}
          {signal.description && (
            <div className="mt-2">
              <p
                className={cn(
                  "text-xs leading-relaxed text-text-secondary transition-all",
                  !expanded && "line-clamp-2"
                )}
              >
                {signal.description}
              </p>
              {signal.description.length > 80 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 flex items-center gap-0.5 text-2xs text-text-muted hover:text-accent-teal"
                >
                  {expanded ? (
                    <><ChevronUp className="h-3 w-3" /> less</>
                  ) : (
                    <><ChevronDown className="h-3 w-3" /> more</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Key levels (if available) */}
          {signal.key_levels && Object.keys(signal.key_levels).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(signal.key_levels).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-2xs text-text-secondary"
                >
                  {k}: <span className="text-text-primary">{typeof v === "number" ? v.toFixed(2) : String(v)}</span>
                </span>
              ))}
            </div>
          )}

          {/* Status badge */}
          {signal.status && (
            <div className="mt-2">
              <span className="rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs capitalize text-text-muted">
                {signal.status}
              </span>
            </div>
          )}

          {/* Show on chart button */}
          {hasOverlay && (
            <div className="mt-2">
              <button
                onClick={() =>
                  setActivePatternOverlay(
                    isActive ? null : { ...signal.overlay!, type: signal.name }
                  )
                }
                className={cn(
                  "flex items-center gap-1 rounded border px-2 py-0.5 text-2xs transition-colors",
                  isActive
                    ? "border-accent-teal/60 bg-accent-teal/10 text-accent-teal"
                    : "border-border bg-elevated text-text-muted hover:border-accent-teal/40 hover:text-accent-teal"
                )}
              >
                <ScanLine className="h-3 w-3" />
                {isActive ? "Hide overlay" : "Show on chart"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TASignalsPanel({ signals, direction, summary, className }: TASignalsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedSignals = showAll ? signals : signals.slice(0, 5);

  const directionLabel = direction
    ? direction.charAt(0).toUpperCase() + direction.slice(1)
    : "Neutral";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">TA Signals</h3>
          {signals.length > 0 && (
            <span className="rounded-full bg-elevated px-2 py-0.5 text-2xs text-text-muted">
              {signals.length}
            </span>
          )}
        </div>

        {/* Direction badge */}
        {direction && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium capitalize",
              directionBgClass(direction)
            )}
          >
            <DirectionIcon direction={direction} className="h-3 w-3" />
            {directionLabel}
          </span>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <p className="rounded-lg border border-border/50 bg-elevated/50 px-3 py-2 text-xs leading-relaxed text-text-secondary">
          {summary}
        </p>
      )}

      {/* Signal cards */}
      {signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card/30 py-8 text-center">
          <Activity className="mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">No TA signals detected</p>
          <p className="mt-1 text-xs text-text-muted">
            Signals update nightly after market close
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayedSignals.map((signal, i) => (
              <SignalCard key={`${signal.name}-${i}`} signal={signal} index={i} />
            ))}
          </div>

          {signals.length > 5 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-text-secondary transition-colors hover:border-accent-teal/50 hover:text-accent-teal"
            >
              {showAll ? (
                <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> Show {signals.length - 5} more signals</>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
