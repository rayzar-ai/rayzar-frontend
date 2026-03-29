import type { Fundamentals } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AnalystPanelProps {
  fundamentals: Fundamentals | null;
  currentPrice?: number;
  className?: string;
}

function getConsensus(buy: number, hold: number, sell: number): {
  label: string;
  color: string;
} {
  const total = buy + hold + sell;
  if (total === 0) return { label: "N/A", color: "var(--color-neutral)" };
  const buyRatio = buy / total;
  const sellRatio = sell / total;
  if (buyRatio >= 0.7) return { label: "Strong Buy",    color: "var(--color-bull)" };
  if (buyRatio >= 0.5) return { label: "Buy",           color: "var(--color-teal)" };
  if (sellRatio >= 0.5) return { label: "Sell",         color: "var(--color-bear)" };
  if (sellRatio >= 0.3) return { label: "Underperform", color: "var(--color-status-orange)" };
  return { label: "Hold", color: "var(--color-amber)" };
}

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

function DonutChart({ segments, size = 80 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
        />
      </svg>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;

  let accumulated = 0;
  const paths: { offset: number; length: number; color: string }[] = [];

  for (const seg of segments) {
    const fraction = seg.value / total;
    const length = fraction * circumference;
    paths.push({ offset: accumulated, length, color: seg.color });
    accumulated += length;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="10"
      />
      {/* Segments */}
      {paths.map((p, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={p.color}
          strokeWidth="10"
          strokeDasharray={`${p.length} ${circumference - p.length}`}
          strokeDashoffset={-p.offset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

export function AnalystPanel({ fundamentals, currentPrice, className }: AnalystPanelProps) {
  if (!fundamentals) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-lg border border-border bg-card/30 py-6 text-center", className)}>
        <p className="text-sm text-text-secondary">No analyst data</p>
        <p className="mt-1 text-xs text-text-muted">
          Coverage data not available for this ticker
        </p>
      </div>
    );
  }

  const buy  = fundamentals.analyst_buy  ?? 0;
  const hold = fundamentals.analyst_hold ?? 0;
  const sell = fundamentals.analyst_sell ?? 0;
  const total = buy + hold + sell;
  const target = fundamentals.analyst_target;

  const consensus = getConsensus(buy, hold, sell);

  const upside =
    target && currentPrice && currentPrice > 0
      ? ((target - currentPrice) / currentPrice) * 100
      : null;

  const segments: DonutSegment[] = [
    { value: buy,  color: "var(--color-bull)",  label: "Buy" },
    { value: hold, color: "var(--color-amber)", label: "Hold" },
    { value: sell, color: "var(--color-bear)",  label: "Sell" },
  ];

  if (total === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-lg border border-border bg-card/30 py-6 text-center", className)}>
        <p className="text-sm text-text-secondary">No analyst ratings</p>
        <p className="mt-1 text-xs text-text-muted">No coverage found</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Consensus label */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text-primary">Analyst Ratings</h4>
        <span
          className="rounded border px-2 py-0.5 text-xs font-semibold"
          style={{
            color: consensus.color,
            background: `${consensus.color}18`,
            borderColor: `${consensus.color}40`,
          }}
        >
          {consensus.label}
        </span>
      </div>

      {/* Donut + counts */}
      <div className="flex items-center gap-4">
        {/* Donut chart */}
        <div className="relative shrink-0">
          <DonutChart segments={segments} size={80} />
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-sm font-bold text-text-primary">{total}</span>
            <span className="text-2xs text-text-muted">analysts</span>
          </div>
        </div>

        {/* Counts */}
        <div className="flex flex-col gap-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: seg.color }}
              />
              <span className="min-w-[28px] text-xs text-text-secondary">{seg.label}</span>
              <span className="font-mono text-xs font-semibold text-text-primary">
                {seg.value}
              </span>
              {total > 0 && (
                <span className="text-2xs text-text-muted">
                  ({Math.round((seg.value / total) * 100)}%)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full flex">
        {segments.map((seg, i) => (
          total > 0 && seg.value > 0 ? (
            <div
              key={i}
              style={{
                width: `${(seg.value / total) * 100}%`,
                background: seg.color,
              }}
            />
          ) : null
        ))}
      </div>

      {/* Price target */}
      {target && (
        <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Price Target</span>
            {upside !== null && (
              <span
                className="font-mono font-semibold"
                style={{ color: upside >= 0 ? "var(--color-bull)" : "var(--color-bear)" }}
              >
                {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% upside
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentPrice && (
              <div className="text-center">
                <p className="font-mono text-xs text-text-muted">Current</p>
                <p className="font-mono text-sm font-semibold text-text-primary">
                  ${currentPrice.toFixed(2)}
                </p>
              </div>
            )}
            {currentPrice && (
              <div className="flex-1 flex items-center gap-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-2xs text-text-muted">→</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}
            <div className="text-center">
              <p className="font-mono text-xs text-text-muted">Target</p>
              <p
                className="font-mono text-sm font-bold"
                style={{
                  color:
                    upside === null ? "var(--color-text-primary)"
                    : upside >= 0 ? "var(--color-bull)"
                    : "var(--color-bear)",
                }}
              >
                ${target.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
