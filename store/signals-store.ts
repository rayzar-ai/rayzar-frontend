/**
 * store/signals-store.ts — RayZar Frontend
 * Zustand store for client-side signal state.
 *
 * Most signal data is fetched server-side via Next.js App Router (RSC).
 * This store holds client-side state: active filters, selected ticker,
 * the market regime displayed in the header, and the watchlist.
 *
 * Watchlist is persisted in RDS via the backend API (Task 2.6).
 * Per-user watchlists are deferred to the last MVP with Clerk auth.
 */

import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import type { MarketRegime } from "@/lib/api-client";

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

  // Watchlist — synced with backend (RDS via FastAPI)
  watchlist: string[];
  watchlistLoaded: boolean;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (ticker: string) => Promise<void>;
  removeFromWatchlist: (ticker: string) => Promise<void>;
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
  watchlistLoaded: false,

  fetchWatchlist: async () => {
    const res = await apiClient.getWatchlist();
    if (res.success && res.data) {
      set({
        watchlist: res.data.map((item) => item.ticker),
        watchlistLoaded: true,
      });
    }
  },

  addToWatchlist: async (ticker: string) => {
    const res = await apiClient.addToWatchlist(ticker);
    if (res.success) {
      set((state) => ({
        watchlist: [...state.watchlist, ticker.toUpperCase()],
      }));
    }
  },

  removeFromWatchlist: async (ticker: string) => {
    const res = await apiClient.removeFromWatchlist(ticker);
    if (res.success) {
      set((state) => ({
        watchlist: state.watchlist.filter((t) => t !== ticker.toUpperCase()),
      }));
    }
  },

  isWatched: (ticker: string) =>
    get().watchlist.includes(ticker.toUpperCase()),
}));
