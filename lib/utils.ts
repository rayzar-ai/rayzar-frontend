import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Signal } from "./api-client";

/** Merge Tailwind classes without conflicts. Used by all UI components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Return the Tailwind colour class for a given signal class.
 * Used on the dashboard and detail page signal badges.
 */
export function signalColour(signalClass: Signal["signal_class"]): string {
  const map: Record<Signal["signal_class"], string> = {
    STRONG_LONG:  "text-green-500",
    LONG:         "text-green-400",
    NEUTRAL:      "text-gray-400",
    SHORT:        "text-red-400",
    STRONG_SHORT: "text-red-500",
  };
  return map[signalClass] ?? "text-gray-400";
}

/** Background variant for signal badges (used on dashboard table). */
export function signalBgColour(signalClass: Signal["signal_class"]): string {
  const map: Record<Signal["signal_class"], string> = {
    STRONG_LONG:  "bg-green-900/40 text-green-400 border-green-800",
    LONG:         "bg-green-900/20 text-green-300 border-green-900",
    NEUTRAL:      "bg-gray-800/40 text-gray-400 border-gray-700",
    SHORT:        "bg-red-900/20 text-red-300 border-red-900",
    STRONG_SHORT: "bg-red-900/40 text-red-400 border-red-800",
  };
  return map[signalClass] ?? "bg-gray-800 text-gray-400";
}

/** Format a confidence float (0–1) as a percentage string e.g. "82%" */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/** Format an ISO date string "YYYY-MM-DD" to a human-readable form. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
