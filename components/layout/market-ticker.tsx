"use client";

import Link from "next/link";
import type { Signal } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface MarketTickerProps {
  signals: Signal[];
  className?: string;
}

function SignalArrow({ signalClass }: { signalClass: Signal["signal_class"] }) {
  if (signalClass === "STRONG_LONG" || signalClass === "LONG") {
    return <span className="text-signal-long">▲</span>;
  }
  if (signalClass === "STRONG_SHORT" || signalClass === "SHORT") {
    return <span className="text-signal-short">▼</span>;
  }
  return <span className="text-text-muted">—</span>;
}

function TickerItem({ signal }: { signal: Signal }) {
  const isLong  = signal.signal_class === "LONG" || signal.signal_class === "STRONG_LONG";
  const isShort = signal.signal_class === "SHORT" || signal.signal_class === "STRONG_SHORT";

  const labelMap: Record<Signal["signal_class"], string> = {
    STRONG_LONG:  "S.Long",
    LONG:         "Long",
    NEUTRAL:      "Neutral",
    SHORT:        "Short",
    STRONG_SHORT: "S.Short",
    NO_TRADE:     "No Trade",
  };

  return (
    <Link
      href={`/stock/${signal.ticker}`}
      className="inline-flex items-center gap-1.5 px-4 py-1 transition-colors hover:bg-elevated/60"
    >
      {/* Ticker */}
      <span className="font-mono text-xs font-semibold text-text-primary">
        {signal.ticker}
      </span>

      {/* Arrow */}
      <SignalArrow signalClass={signal.signal_class} />

      {/* Signal label */}
      <span
        className={cn(
          "rounded border px-1.5 py-0.5 font-mono text-2xs font-medium",
          isLong  && "bg-signal-long/10 text-signal-long border-signal-long/30",
          isShort && "bg-signal-short/10 text-signal-short border-signal-short/30",
          !isLong && !isShort && "bg-text-muted/10 text-text-muted border-text-muted/20"
        )}
      >
        {labelMap[signal.signal_class]}
      </span>

      {/* Score */}
      <span className="font-mono text-2xs text-text-muted">{signal.rayzar_score}</span>

      {/* Divider */}
      <span className="ml-2 text-border text-xs">·</span>
    </Link>
  );
}

export function MarketTicker({ signals, className }: MarketTickerProps) {
  if (!signals || signals.length === 0) return null;

  // Take up to 20 tickers, then duplicate for seamless loop
  const tickerSignals = signals.slice(0, 20);
  const doubled = [...tickerSignals, ...tickerSignals];

  return (
    <div
      className={cn(
        "overflow-hidden border-b border-border bg-panel",
        className
      )}
    >
      <div className="flex items-center">
        {/* Label */}
        <div className="shrink-0 border-r border-border bg-elevated px-3 py-1.5">
          <span className="text-2xs font-semibold uppercase tracking-wider text-accent-teal">
            Live Signals
          </span>
        </div>

        {/* Scrolling strip */}
        <div className="overflow-hidden flex-1">
          <div className="ticker-strip inline-flex items-center py-1">
            {doubled.map((signal, idx) => (
              <TickerItem key={`${signal.id}-${idx}`} signal={signal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
