"use client";

/**
 * components/ui/live-price.tsx — RayZar Frontend
 *
 * Displays a live-streaming price with change delta and a pulse indicator.
 * Connects via WebSocket to /ws/prices/{ticker}.
 * Falls back gracefully to initialPrice if WebSocket is unavailable.
 *
 * Usage:
 *   <LivePrice
 *     ticker="AAPL"
 *     initialPrice={185.23}
 *     initialChange={1.23}
 *     initialChangePct={0.67}
 *   />
 */

import { usePriceStream } from "@/hooks/use-price-stream";
import { cn } from "@/lib/utils";

interface LivePriceProps {
  ticker: string;
  initialPrice?: number | null;
  initialChange?: number | null;
  initialChangePct?: number | null;
  className?: string;
}

export function LivePrice({
  ticker,
  initialPrice,
  initialChange,
  initialChangePct,
  className,
}: LivePriceProps) {
  const { price, change, changePct, isLive, marketOpen } = usePriceStream(
    ticker,
    initialPrice,
    initialChange,
    initialChangePct,
  );

  const displayPrice:     number | null = price      ?? initialPrice      ?? null;
  const displayChange:    number | null = change     ?? initialChange     ?? null;
  const displayChangePct: number | null = changePct  ?? initialChangePct  ?? null;

  const isPositive = displayChange !== null ? displayChange >= 0 : null;
  const priceColor =
    isPositive === null ? "text-text-primary"
    : isPositive        ? "text-signal-long"
    : "text-signal-short";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Live indicator dot */}
      {isLive && marketOpen && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-long opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-long" />
        </span>
      )}

      {/* Price */}
      {displayPrice != null ? (
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-lg font-semibold text-text-primary">
            ${displayPrice.toFixed(2)}
          </span>
          {displayChange !== null && displayChangePct !== null && (
            <span
              className="font-mono text-sm font-medium"
              style={{ color: isPositive ? "#10b981" : "#ef4444" }}
            >
              {isPositive ? "▲" : "▼"}
              {Math.abs(displayChange).toFixed(2)} ({isPositive ? "+" : ""}
              {displayChangePct.toFixed(2)}%)
            </span>
          )}
        </div>
      ) : (
        <span className="font-mono text-lg text-text-muted">—</span>
      )}
    </div>
  );
}
