"use client";

/**
 * hooks/use-price-stream.ts — RayZar Frontend
 *
 * WebSocket hook for real-time price streaming.
 * Connects to GET /ws/prices/{ticker} on the backend.
 *
 * Features:
 *   - Auto-reconnect with exponential backoff (1s → 2s → 4s → … → 30s max)
 *   - Falls back to initialPrice if WebSocket is unavailable
 *   - Cleans up on unmount / ticker change
 *   - Sends heartbeat pong response to server pings
 *
 * Usage:
 *   const { price, change, changePct, isLive } = usePriceStream("AAPL", 185.23);
 */

import { useEffect, useRef, useState, useCallback } from "react";

export interface PriceData {
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  marketOpen: boolean;
  timestamp: string | null;
  isLive: boolean;       // true = connected and receiving data
  isConnecting: boolean; // true = attempting connection
}

const INITIAL_STATE: PriceData = {
  price: null,
  prevClose: null,
  change: null,
  changePct: null,
  volume: null,
  marketOpen: false,
  timestamp: null,
  isLive: false,
  isConnecting: false,
};

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

function getWsUrl(ticker: string): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  // WebSocket requires an explicit host — relative URLs don't work with WS protocol.
  // If no API URL is configured, degrade gracefully (no live streaming).
  if (!apiUrl || (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://"))) {
    return null;
  }
  const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? "";
  const wsBase = apiUrl
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://")
    .replace(/\/$/, "");
  const keyParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";
  return `${wsBase}/ws/prices/${ticker}${keyParam}`;
}

export function usePriceStream(
  ticker: string | null | undefined,
  initialPrice?: number | null,
  initialChange?: number | null,
  initialChangePct?: number | null,
): PriceData {
  const [data, setData] = useState<PriceData>({
    ...INITIAL_STATE,
    price: initialPrice ?? null,
    change: initialChange ?? null,
    changePct: initialChangePct ?? null,
  });

  const wsRef        = useRef<WebSocket | null>(null);
  const retryRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef   = useRef<number>(BASE_BACKOFF_MS);
  const mountedRef   = useRef<boolean>(true);
  const tickerRef    = useRef<string | null | undefined>(ticker);

  const clearRetry = useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }, []);

  const closeWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect on intentional close
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback((t: string) => {
    if (!mountedRef.current) return;

    const url = getWsUrl(t);
    if (!url) {
      // No explicit backend URL configured — WebSocket disabled, show static price only
      setData((prev) => ({ ...prev, isConnecting: false, isLive: false }));
      return;
    }

    closeWs();
    setData((prev) => ({ ...prev, isConnecting: true, isLive: false }));

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      backoffRef.current = BASE_BACKOFF_MS; // reset backoff on successful connect
      setData((prev) => ({ ...prev, isConnecting: false }));
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data as string);

        // Heartbeat ping from server — just ignore (connection is alive)
        if (msg.type === "ping") return;

        // Real price update
        setData({
          price:       msg.price      ?? null,
          prevClose:   msg.prev_close ?? null,
          change:      msg.change     ?? null,
          changePct:   msg.change_pct ?? null,
          volume:      msg.volume     ?? null,
          marketOpen:  msg.market_open ?? false,
          timestamp:   msg.timestamp  ?? null,
          isLive:      msg.price != null,
          isConnecting: false,
        });
      } catch {
        // malformed message — ignore
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror — reconnect happens there
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setData((prev) => ({ ...prev, isLive: false, isConnecting: false }));

      // Exponential backoff reconnect
      const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);

      retryRef.current = setTimeout(() => {
        if (mountedRef.current && tickerRef.current === t) {
          connect(t);
        }
      }, delay);
    };
  }, [closeWs]);

  useEffect(() => {
    mountedRef.current = true;
    tickerRef.current = ticker;

    if (!ticker) {
      setData({ ...INITIAL_STATE, price: initialPrice ?? null });
      return;
    }

    backoffRef.current = BASE_BACKOFF_MS;
    connect(ticker);

    return () => {
      mountedRef.current = false;
      clearRetry();
      closeWs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  return data;
}
