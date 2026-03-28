"use client";

import { cn } from "@/lib/utils";

interface RegimeBadgeProps {
  regime: string;
  className?: string;
}

function regimeColour(regime: string): string {
  const r = regime.toLowerCase();
  if (r.includes("bull")) return "bg-green-900/40 text-green-400 border-green-800";
  if (r.includes("bear")) return "bg-red-900/40 text-red-400 border-red-800";
  if (r.includes("volatile")) return "bg-purple-900/40 text-purple-400 border-purple-800";
  return "bg-yellow-900/40 text-yellow-400 border-yellow-800";
}

export function RegimeBadge({ regime, className }: RegimeBadgeProps) {
  const label = regime
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        regimeColour(regime),
        className
      )}
    >
      {label}
    </span>
  );
}
