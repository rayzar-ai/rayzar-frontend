"use client";

/**
 * components/ui/watch-button.tsx — RayZar Frontend
 * Button to add/remove a ticker from the owner's watchlist.
 * Calls the backend API and updates Zustand state optimistically.
 */

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignalsStore } from "@/store/signals-store";

interface WatchButtonProps {
  ticker: string;
  className?: string;
  size?: "sm" | "md";
}

export function WatchButton({ ticker, className, size = "sm" }: WatchButtonProps) {
  const { isWatched, addToWatchlist, removeFromWatchlist, fetchWatchlist, watchlistLoaded } =
    useSignalsStore();
  const [loading, setLoading] = useState(false);

  // Load watchlist from backend on first render if not already loaded
  useEffect(() => {
    if (!watchlistLoaded) {
      fetchWatchlist();
    }
  }, [watchlistLoaded, fetchWatchlist]);

  const watched = isWatched(ticker);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (watched) {
        await removeFromWatchlist(ticker);
      } else {
        await addToWatchlist(ticker);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={watched ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
      className={cn(
        "inline-flex items-center gap-1 rounded transition-colors disabled:opacity-50",
        size === "sm" ? "p-1" : "px-2 py-1 text-sm",
        watched
          ? "text-yellow-400 hover:text-yellow-300"
          : "text-gray-600 hover:text-gray-400",
        className,
      )}
    >
      <Star
        className={cn(
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          watched && "fill-yellow-400",
        )}
      />
      {size === "md" && (
        <span>{watched ? "Watching" : "Watch"}</span>
      )}
    </button>
  );
}
