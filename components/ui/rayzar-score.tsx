"use client";

import { cn } from "@/lib/utils";

interface RayzarScoreProps {
  score: number;       // 0–100
  size?: "sm" | "md" | "lg" | "xl";
  showGauge?: boolean; // false = plain text (compact table rows)
  className?: string;
}

function scoreHex(score: number): string {
  if (score >= 75) return "#10b981";
  if (score >= 55) return "#f59e0b";
  if (score >= 45) return "#6b7280";
  if (score >= 25) return "#fb923c";
  return "#ef4444";
}

// ── SVG circular gauge ────────────────────────────────────────────────────────

interface GaugeProps {
  score: number;
  outer: number;
  stroke: number;
  className?: string;
}

function CircularGauge({ score, outer, stroke, className }: GaugeProps) {
  const colour = scoreHex(score);
  const r      = (outer - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const isStrong = score >= 75;

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: outer, height: outer }}
    >
      {/* Pulse ring — only for strong signals */}
      {isStrong && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
          style={{ border: `2px solid ${colour}` }}
          aria-hidden="true"
        />
      )}

      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track ring */}
        <circle
          cx={outer / 2} cy={outer / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        {/* Filled arc */}
        <circle
          cx={outer / 2} cy={outer / 2} r={r}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>

      {/* Score number */}
      <span
        className="absolute inset-0 flex items-center justify-center font-mono font-bold leading-none select-none"
        style={{ fontSize: outer * 0.27, color: colour }}
      >
        {score}
      </span>
    </span>
  );
}

// ── Sizes ─────────────────────────────────────────────────────────────────────

const SIZES = {
  sm:  { outer: 36, stroke: 3 },
  md:  { outer: 48, stroke: 4 },
  lg:  { outer: 64, stroke: 5 },
  xl:  { outer: 88, stroke: 6 },
};

const TEXT_SIZES = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-2xl font-bold",
  xl: "text-3xl font-bold",
};

// ── Public component ──────────────────────────────────────────────────────────

export function RayzarScore({
  score,
  size = "md",
  showGauge = true,
  className,
}: RayzarScoreProps) {
  if (!showGauge) {
    return (
      <span
        className={cn(TEXT_SIZES[size], className)}
        style={{ color: scoreHex(score), fontVariantNumeric: "tabular-nums" }}
      >
        {score}
      </span>
    );
  }
  const { outer, stroke } = SIZES[size];
  return <CircularGauge score={score} outer={outer} stroke={stroke} className={className} />;
}
