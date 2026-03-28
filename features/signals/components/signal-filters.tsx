"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { label: "All",          value: "" },
  { label: "Strong Long",  value: "STRONG_LONG" },
  { label: "Long",         value: "LONG" },
  { label: "Neutral",      value: "NEUTRAL" },
  { label: "Short",        value: "SHORT" },
  { label: "Strong Short", value: "STRONG_SHORT" },
];

const FILTER_COLOURS: Record<string, string> = {
  "":            "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500",
  STRONG_LONG:   "border-green-700 text-green-400 hover:bg-green-900/30",
  LONG:          "border-green-900 text-green-500 hover:bg-green-900/20",
  NEUTRAL:       "border-gray-700 text-gray-400 hover:border-gray-500",
  SHORT:         "border-red-900 text-red-500 hover:bg-red-900/20",
  STRONG_SHORT:  "border-red-700 text-red-400 hover:bg-red-900/30",
};

const ACTIVE_COLOURS: Record<string, string> = {
  "":            "bg-gray-800 border-gray-600 text-white",
  STRONG_LONG:   "bg-green-900/40 border-green-600 text-green-400",
  LONG:          "bg-green-900/20 border-green-800 text-green-300",
  NEUTRAL:       "bg-gray-800 border-gray-600 text-gray-300",
  SHORT:         "bg-red-900/20 border-red-800 text-red-300",
  STRONG_SHORT:  "bg-red-900/40 border-red-600 text-red-400",
};

interface SignalFiltersProps {
  activeClass: string;
}

export function SignalFilters({ activeClass }: SignalFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function applyFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("signal_class", value);
    } else {
      params.delete("signal_class");
    }
    params.delete("page"); // Reset to page 1 on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeClass === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => applyFilter(opt.value)}
              disabled={isPending}
              className={cn(
                "rounded border px-3 py-1 text-xs font-medium transition-all",
                isActive ? ACTIVE_COLOURS[opt.value] : FILTER_COLOURS[opt.value]
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Refresh button */}
      <button
        onClick={refresh}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded border border-gray-700 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-gray-500 hover:text-white disabled:opacity-50"
      >
        <svg
          className={cn("h-3 w-3", isPending && "animate-spin")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isPending ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
