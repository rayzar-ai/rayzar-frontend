"use client";

import { useSignalsStore } from "@/store/signals-store";
import { PatternBadge } from "@/components/ui/pattern-badge";
import type { PatternOverlay } from "@/lib/api-client";

interface PatternBadgeData {
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  timeframe: string;
  overlay?: PatternOverlay | null;
}

interface PatternBadgesClientProps {
  patterns: PatternBadgeData[];
}

export function PatternBadgesClient({ patterns }: PatternBadgesClientProps) {
  const activeOverlay = useSignalsStore((s) => s.activePatternOverlay);
  const setActivePatternOverlay = useSignalsStore((s) => s.setActivePatternOverlay);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Detected Patterns</h2>
        <span className="text-2xs text-text-muted italic">Click to show on chart</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {patterns.map((p, i) => {
          const isActive = activeOverlay?.type === p.name;
          return (
            <PatternBadge
              key={`${p.name}-${i}`}
              name={p.name}
              direction={p.direction}
              confidence={p.confidence}
              timeframe={p.timeframe}
              isActive={isActive}
              onClick={
                p.overlay
                  ? () => setActivePatternOverlay(isActive ? null : { ...p.overlay!, type: p.name })
                  : undefined
              }
            />
          );
        })}
      </div>
      <p className="mt-2 text-2xs text-text-muted leading-relaxed">
        Pattern confidence reflects detection quality, not predictive accuracy. Use alongside ML signal and TA alignment — not in isolation.
      </p>
    </div>
  );
}
