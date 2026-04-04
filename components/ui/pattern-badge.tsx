import {
  Activity,
  ChevronsUpDown,
  Flag,
  Triangle,
  ChevronRight,
  Coffee,
  BarChart2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatternBadgeProps {
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;    // 0.0 – 1.0
  timeframe: string;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

function getPatternIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  if (lower.includes("head") || lower.includes("h&s") || lower.includes("h & s")) return Activity;
  if (lower.includes("double top") || lower.includes("double bottom")) return ChevronsUpDown;
  if (lower.includes("flag")) return Flag;
  if (lower.includes("triangle") || lower.includes("pennant")) return Triangle;
  if (lower.includes("wedge")) return ChevronRight;
  if (lower.includes("cup")) return Coffee;
  if (lower.includes("ascending") || lower.includes("breakout")) return TrendingUp;
  if (lower.includes("descending") || lower.includes("breakdown")) return TrendingDown;
  return BarChart2;
}

function directionColors(direction: "bullish" | "bearish" | "neutral"): {
  text: string;
  bg: string;
  border: string;
  fill: string;
} {
  if (direction === "bullish") {
    return {
      text:   "var(--color-teal)",
      bg:     "var(--color-teal-dim)",
      border: "var(--color-teal-glow)",
      fill:   "var(--color-teal)",
    };
  }
  if (direction === "bearish") {
    return {
      text:   "var(--color-bear)",
      bg:     "var(--color-bear-dim)",
      border: "rgba(239, 68, 68, 0.30)",
      fill:   "var(--color-bear)",
    };
  }
  return {
    text:   "var(--color-amber)",
    bg:     "var(--color-amber-dim)",
    border: "rgba(245, 158, 11, 0.30)",
    fill:   "var(--color-amber)",
  };
}

export function PatternBadge({
  name,
  direction,
  confidence,
  timeframe,
  compact = false,
  className,
  onClick,
  isActive = false,
}: PatternBadgeProps) {
  const Icon = getPatternIcon(name);
  const colors = directionColors(direction);
  const pct = Math.round(confidence * 100);

  // ── Compact pill (for chart overlay labels) ──────────────────────────────
  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
          className
        )}
        style={{
          background: colors.bg,
          borderColor: colors.border,
          color: colors.text,
        }}
      >
        <Icon className="h-3 w-3" />
        <span className="max-w-[96px] truncate">{name}</span>
        <span style={{ opacity: 0.7 }}>{timeframe === "1d" ? "D" : timeframe === "1w" ? "W" : timeframe === "1m" ? "M" : timeframe} · {pct}%</span>
      </span>
    );
  }

  // ── Full card ────────────────────────────────────────────────────────────
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={cn(
        "flex min-w-[140px] flex-col gap-2 rounded-lg border p-3 transition-all hover:shadow-sm text-left",
        onClick && "cursor-pointer hover:ring-1",
        isActive && "ring-1",
        className
      )}
      style={{
        background: colors.bg,
        borderColor: isActive ? colors.fill : colors.border,
        // @ts-expect-error -- ringColor not in React.CSSProperties
        "--tw-ring-color": colors.fill,
      }}
      {...(onClick ? { onClick } : {})}
    >
      {/* Icon + name row */}
      <div className="flex items-start gap-2">
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded"
          style={{ background: `${colors.fill}20` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: colors.text }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold leading-tight"
            style={{ color: colors.text }}
          >
            {name}
          </p>
          <span
            className="mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-2xs font-bold"
            style={{
              background: `${colors.fill}20`,
              color: colors.fill,
              border: `1px solid ${colors.fill}40`,
            }}
          >
            {timeframe === "1d" ? "Daily" : timeframe === "1w" ? "Weekly" : timeframe === "1m" ? "Monthly" : timeframe === "4h" ? "4H" : timeframe}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-2xs text-text-muted">Confidence</span>
          <span className="font-mono text-2xs font-medium" style={{ color: colors.text }}>
            {pct}%
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: colors.fill,
              boxShadow: `0 0 6px ${colors.fill}50`,
            }}
          />
        </div>
      </div>

      {/* Direction label */}
      <span
        className="self-start rounded px-1.5 py-0.5 text-2xs font-medium capitalize"
        style={{
          background: `${colors.fill}15`,
          color: colors.text,
        }}
      >
        {direction}
      </span>
    </Tag>
  );
}
