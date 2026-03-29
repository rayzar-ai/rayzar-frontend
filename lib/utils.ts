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
    STRONG_LONG:  "text-signal-strong-long",
    LONG:         "text-signal-long",
    NEUTRAL:      "text-signal-neutral",
    SHORT:        "text-signal-short",
    STRONG_SHORT: "text-signal-strong-short",
    NO_TRADE:     "text-signal-no-trade",
  };
  return map[signalClass] ?? "text-signal-neutral";
}

/** Background variant for signal badges (used on dashboard table). */
export function signalBgColour(signalClass: Signal["signal_class"]): string {
  const map: Record<Signal["signal_class"], string> = {
    STRONG_LONG:  "signal-bg-strong-long",
    LONG:         "signal-bg-long",
    NEUTRAL:      "signal-bg-neutral",
    SHORT:        "signal-bg-short",
    STRONG_SHORT: "signal-bg-strong-short",
    NO_TRADE:     "signal-bg-no-trade",
  };
  return map[signalClass] ?? "signal-bg-neutral";
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
