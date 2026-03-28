"use client";

import { cn, signalBgColour } from "@/lib/utils";
import type { Signal } from "@/lib/api-client";

interface SignalBadgeProps {
  signalClass: Signal["signal_class"];
  className?: string;
}

const LABELS: Record<Signal["signal_class"], string> = {
  STRONG_LONG:  "Strong Long",
  LONG:         "Long",
  NEUTRAL:      "Neutral",
  SHORT:        "Short",
  STRONG_SHORT: "Strong Short",
};

export function SignalBadge({ signalClass, className }: SignalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        signalBgColour(signalClass),
        className
      )}
    >
      {LABELS[signalClass] ?? signalClass}
    </span>
  );
}
