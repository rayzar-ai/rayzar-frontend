"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const SIGNAL_CLASS_OPTIONS = [
  { value: "", label: "All Classes" },
  { value: "STRONG_LONG", label: "Strong Long" },
  { value: "LONG", label: "Long" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "SHORT", label: "Short" },
  { value: "STRONG_SHORT", label: "Strong Short" },
];

const SECTOR_OPTIONS = [
  { value: "", label: "All Sectors" },
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Financials", label: "Financials" },
  { value: "Consumer Discretionary", label: "Consumer Discr." },
  { value: "Consumer Staples", label: "Consumer Staples" },
  { value: "Energy", label: "Energy" },
  { value: "Industrials", label: "Industrials" },
  { value: "Materials", label: "Materials" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Communication Services", label: "Communication" },
  { value: "Utilities", label: "Utilities" },
];

const MIN_SCORE_OPTIONS = [
  { value: "", label: "Any Score" },
  { value: "70", label: "Score ≥ 70" },
  { value: "75", label: "Score ≥ 75" },
  { value: "80", label: "Score ≥ 80" },
  { value: "85", label: "Score ≥ 85" },
  { value: "90", label: "Score ≥ 90" },
];

interface Props {
  initialClass: string;
  initialSector: string;
  initialMinScore: string;
}

export function ScreenerFilters({ initialClass, initialSector, initialMinScore }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  const hasFilters = initialClass || initialSector || initialMinScore;

  return (
    <div
      className="rounded-xl border border-border bg-panel px-5 py-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary">Filters</p>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Signal Class */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-muted uppercase tracking-wide">Signal</label>
          <select
            value={initialClass}
            onChange={(e) => updateParam("signal_class", e.target.value)}
            className="rounded border border-border bg-elevated px-3 py-1.5 text-xs text-text-primary outline-none focus:border-teal-500/50 cursor-pointer"
          >
            {SIGNAL_CLASS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-muted uppercase tracking-wide">Sector</label>
          <select
            value={initialSector}
            onChange={(e) => updateParam("sector", e.target.value)}
            className="rounded border border-border bg-elevated px-3 py-1.5 text-xs text-text-primary outline-none focus:border-teal-500/50 cursor-pointer"
          >
            {SECTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Min Score */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-muted uppercase tracking-wide">Min Score</label>
          <select
            value={initialMinScore}
            onChange={(e) => updateParam("min_score", e.target.value)}
            className="rounded border border-border bg-elevated px-3 py-1.5 text-xs text-text-primary outline-none focus:border-teal-500/50 cursor-pointer"
          >
            {MIN_SCORE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {initialClass && (
            <span
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs"
              style={{ background: "rgba(0,212,170,0.12)", color: "var(--color-teal)", border: "1px solid rgba(0,212,170,0.25)" }}
            >
              {initialClass.replace("_", " ")}
              <button onClick={() => updateParam("signal_class", "")} className="opacity-60 hover:opacity-100">×</button>
            </span>
          )}
          {initialSector && (
            <span
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs"
              style={{ background: "rgba(0,212,170,0.12)", color: "var(--color-teal)", border: "1px solid rgba(0,212,170,0.25)" }}
            >
              {initialSector}
              <button onClick={() => updateParam("sector", "")} className="opacity-60 hover:opacity-100">×</button>
            </span>
          )}
          {initialMinScore && (
            <span
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs"
              style={{ background: "rgba(0,212,170,0.12)", color: "var(--color-teal)", border: "1px solid rgba(0,212,170,0.25)" }}
            >
              Score ≥ {initialMinScore}
              <button onClick={() => updateParam("min_score", "")} className="opacity-60 hover:opacity-100">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
