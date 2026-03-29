"use client";

import { cn, signalBgColour } from "@/lib/utils";
import type { Signal } from "@/lib/api-client";

interface SignalBadgeProps {
  signalClass: Signal["signal_class"];
  noTradeReason?: string | null;
  className?: string;
}

const LABELS: Record<Signal["signal_class"], string> = {
  STRONG_LONG:  "Strong Long",
  LONG:         "Long",
  NEUTRAL:      "Neutral",
  SHORT:        "Short",
  STRONG_SHORT: "Strong Short",
  NO_TRADE:     "No Trade",
};

export function SignalBadge({ signalClass, noTradeReason, className }: SignalBadgeProps) {
  return (
    <span
      title={signalClass === "NO_TRADE" && noTradeReason ? noTradeReason : undefined}
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        signalBgColour(signalClass),
        className
      )}
    >
      {LABELS[signalClass] ?? signalClass}
      {signalClass === "NO_TRADE" && noTradeReason && (
        <span className="ml-1 opacity-75">— {noTradeReason}</span>
      )}
    </span>
  );
}
