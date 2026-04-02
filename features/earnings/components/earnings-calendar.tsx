"use client";

import Link from "next/link";
import type { UpcomingEarning } from "@/lib/api-client";

const SIGNAL_COLORS: Record<string, string> = {
  STRONG_LONG:  "#10b981",
  LONG:         "#34d399",
  NEUTRAL:      "#6b7280",
  SHORT:        "#f87171",
  STRONG_SHORT: "#ef4444",
  NO_TRADE:     "#6b7280",
};

function DaysChip({ days }: { days: number }) {
  if (days === 0) return (
    <span className="rounded px-1 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
      Today
    </span>
  );
  if (days === 1) return (
    <span className="rounded px-1 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
      Tomorrow
    </span>
  );
  if (days <= 7) return (
    <span className="rounded px-1 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
      {days}d
    </span>
  );
  return (
    <span className="text-[10px] text-text-muted font-mono">{days}d</span>
  );
}

interface Props {
  earnings: UpcomingEarning[];
}

export function EarningsCalendar({ earnings }: Props) {
  if (earnings.length === 0) {
    return (
      <div className="px-4 py-3">
        <p className="text-xs text-text-muted">No upcoming earnings in next 30 days.</p>
      </div>
    );
  }

  // Group by date
  const byDate = earnings.reduce<Record<string, UpcomingEarning[]>>((acc, e) => {
    const key = e.report_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort();

  return (
    <div className="space-y-0">
      {sortedDates.map((dateStr) => {
        const items = byDate[dateStr];
        const daysUntil = items[0].days_until;
        const label = daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : dateStr;

        return (
          <div key={dateStr}>
            {/* Date header */}
            <div className="px-4 py-1.5 border-y border-border/60 bg-elevated/30">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {label}
                {daysUntil > 1 && (
                  <span className="ml-1 normal-case tracking-normal">({daysUntil}d)</span>
                )}
              </span>
            </div>

            {/* Tickers */}
            <div className="divide-y divide-border/40">
              {items.map((e) => {
                const color = SIGNAL_COLORS[e.signal_class] ?? "#6b7280";
                return (
                  <Link
                    key={e.ticker}
                    href={`/stock/${e.ticker}`}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-elevated/50 transition-colors"
                  >
                    <span className="font-mono text-xs font-semibold text-text-primary w-16 shrink-0">
                      {e.ticker}
                    </span>
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="font-mono text-[10px] text-text-muted ml-auto">
                      {e.rayzar_score}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
