/**
 * store/signals-store.ts — RayZar Frontend
 * Zustand store for client-side signal state.
 *
 * Most signal data is fetched server-side via Next.js App Router (RSC).
 * This store holds client-side state: active filters, selected ticker,
 * and the market regime displayed in the header.
 *
 * Unidirectional data flow (from ARCHITECTURE.md):
 *   Server fetch → RSC props → Client Component → Zustand (UI state only)
 */

import { create } from "zustand";
import type { MarketRegime, Signal } from "@/lib/api-client";

interface SignalFilters {
  signalClass: string;   // "" = all classes
  page: number;
  pageSize: number;
}

interface SignalsState {
  // Active dashboard filters
  filters: SignalFilters;
  setFilters: (filters: Partial<SignalFilters>) => void;
  resetFilters: () => void;

  // Currently selected ticker (for detail page context)
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;

  // Market regime (cached after first load, refreshed on demand)
  regime: MarketRegime | null;
  setRegime: (regime: MarketRegime | null) => void;

  // Watchlist (ticker symbols — persisted in DB in Task 2.6, local for now)
  watchlist: string[];
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  isWatched: (ticker: string) => boolean;
}

const DEFAULT_FILTERS: SignalFilters = {
  signalClass: "",
  page: 1,
  pageSize: 50,
};

export const useSignalsStore = create<SignalsState>((set, get) => ({
  filters: DEFAULT_FILTERS,

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial, page: partial.page ?? 1 },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  selectedTicker: null,
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),

  regime: null,
  setRegime: (regime) => set({ regime }),

  watchlist: [],

  addToWatchlist: (ticker) =>
    set((state) => ({
      watchlist: state.watchlist.includes(ticker)
        ? state.watchlist
        : [...state.watchlist, ticker],
    })),

  removeFromWatchlist: (ticker) =>
    set((state) => ({
      watchlist: state.watchlist.filter((t) => t !== ticker),
    })),

  isWatched: (ticker) => get().watchlist.includes(ticker),
}));
