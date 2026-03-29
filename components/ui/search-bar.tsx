"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Signal } from "@/lib/api-client";
import { cn, signalBgColour } from "@/lib/utils";

const SIGNAL_LABELS: Record<Signal["signal_class"], string> = {
  STRONG_LONG:  "S.Long",
  LONG:         "Long",
  NEUTRAL:      "Neutral",
  SHORT:        "Short",
  STRONG_SHORT: "S.Short",
  NO_TRADE:     "No Trade",
};

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ className, placeholder = "Search ticker..." }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Signal[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allSignals, setAllSignals] = useState<Signal[]>([]);

  // Pre-load all signals once for fast client-side filtering
  useEffect(() => {
    apiClient.getSignals({ page: 1, page_size: 200 }).then((res) => {
      if (res.success && res.data) {
        setAllSignals(res.data.signals);
      }
    }).catch(() => {/* silently fail */});
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click-outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim().toUpperCase();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    // First try client-side filter from pre-loaded signals
    const clientFiltered = allSignals.filter(
      (s) => s.ticker.includes(trimmed)
    ).slice(0, 8);

    if (clientFiltered.length > 0) {
      setResults(clientFiltered);
      setIsOpen(true);
      setIsLoading(false);
      return;
    }

    // Fall back to direct ticker lookup
    try {
      const res = await apiClient.getSignalByTicker(trimmed);
      if (res.success && res.data) {
        setResults([res.data]);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(trimmed.length > 0);
      }
    } catch {
      setResults([]);
      setIsOpen(trimmed.length > 0);
    } finally {
      setIsLoading(false);
    }
  }, [allSignals]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(val);
    }, 200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        navigateTo(results[activeIndex].ticker);
      } else if (query.trim()) {
        navigateTo(query.trim().toUpperCase());
      }
    }
  }

  function navigateTo(ticker: string) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/stock/${ticker.toUpperCase()}`);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input wrapper */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-panel px-3 py-1.5 transition-all",
          isOpen
            ? "border-accent-teal shadow-teal-sm"
            : "border-border hover:border-border-focus/50"
        )}
      >
        {isLoading ? (
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent-teal" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-text-secondary" />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full min-w-[160px] bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {query ? (
          <button
            onClick={handleClear}
            className="shrink-0 rounded p-0.5 text-text-muted hover:text-text-primary"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 items-center gap-1 rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-2xs text-text-muted sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop blur hint for elevated context */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-panel shadow-panel animate-fade-in">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-muted">
                {query.trim() ? `No results for "${query.trim().toUpperCase()}"` : "Start typing to search..."}
              </div>
            ) : (
              <ul role="listbox" aria-label="Search results">
                {results.slice(0, 8).map((signal, idx) => (
                  <li
                    key={signal.id}
                    role="option"
                    aria-selected={idx === activeIndex}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      idx === activeIndex
                        ? "bg-elevated"
                        : "hover:bg-elevated/60"
                    )}
                    onClick={() => navigateTo(signal.ticker)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    {/* Ticker */}
                    <span className="w-20 shrink-0 font-mono font-semibold text-text-primary">
                      {signal.ticker}
                    </span>

                    {/* Signal badge */}
                    <span
                      className={cn(
                        "shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium",
                        signalBgColour(signal.signal_class)
                      )}
                    >
                      {SIGNAL_LABELS[signal.signal_class]}
                    </span>

                    {/* Score */}
                    <span className="ml-auto shrink-0 font-mono text-xs text-text-secondary">
                      {signal.rayzar_score}
                    </span>

                    {/* Date */}
                    <span className="shrink-0 text-xs text-text-muted">
                      {signal.signal_date}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {results.length > 0 && (
              <div className="border-t border-border px-4 py-2 text-xs text-text-muted">
                Press Enter to navigate · ↑↓ to select · Esc to close
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
