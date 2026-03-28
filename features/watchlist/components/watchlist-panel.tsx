"use client";

/**
 * features/watchlist/components/watchlist-panel.tsx — RayZar Frontend
 * Collapsible watchlist panel shown on the dashboard.
 *
 * Displays the owner's watched tickers with links to their detail pages
 * and remove buttons. Synced with backend (RDS via FastAPI).
 *
 * SINGLE OWNER (MVP2): No user scoping. Per-user watchlists deferred to
 * the last MVP when Clerk auth is introduced.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Star, X } from "lucide-react";
import { useSignalsStore } from "@/store/signals-store";

export function WatchlistPanel() {
  const { watchlist, fetchWatchlist, removeFromWatchlist, watchlistLoaded } =
    useSignalsStore();
  const [open, setOpen] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!watchlistLoaded) {
      fetchWatchlist();
    }
  }, [watchlistLoaded, fetchWatchlist]);

  async function handleRemove(ticker: string) {
    setRemoving(ticker);
    try {
      await removeFromWatchlist(ticker);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0f0f0f]">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">Watchlist</span>
          {watchlist.length > 0 && (
            <span className="rounded-full bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-gray-400">
              {watchlist.length}
            </span>
          )}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-[#1a1a1a]">
          {watchlist.length === 0 ? (
            <p className="px-4 py-4 text-xs text-gray-600">
              No tickers watched. Click ☆ next to any ticker to add it.
            </p>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]">
              {watchlist.map((ticker) => (
                <li key={ticker} className="flex items-center justify-between px-4 py-2">
                  <Link
                    href={`/stock/${ticker}`}
                    className="font-mono text-sm font-semibold text-white hover:text-green-400 transition-colors"
                  >
                    {ticker}
                  </Link>
                  <button
                    onClick={() => handleRemove(ticker)}
                    disabled={removing === ticker}
                    title={`Remove ${ticker} from watchlist`}
                    className="p-1 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
