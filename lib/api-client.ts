/**
 * lib/api-client.ts — RayZar Frontend
 * Typed HTTP client for the RayZar FastAPI backend.
 *
 * DATA ARCHITECTURE NOTE:
 * The backend (EC2) is a READ-ONLY consumer of AWS RDS PostgreSQL.
 * All signal data originates from the nightly ML pipeline on the owner's Mac:
 *   Mac (IBKR TWS) → download_data.py → ML pipeline → db_writer.py → RDS
 *   EC2 (FastAPI)  → reads signals from RDS → this client reads from EC2
 *
 * Configuration:
 *   NEXT_PUBLIC_API_URL — set in .env.local (dev) or Vercel env vars (prod)
 *   NEXT_PUBLIC_API_KEY — X-API-Key header value (leave blank in dev)
 *
 * All methods return the full ApiResponse envelope from the backend.
 * Callers should check response.success before using response.data.
 */

// ---------------------------------------------------------------------------
// Types — mirror backend schemas exactly
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: PaginationMeta | null;
  error: ErrorDetail | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  timestamp: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details: unknown | null;
}

export interface HealthData {
  status: "healthy" | "degraded" | "unhealthy";
  environment: string;
  version: string;
  database: string;
  timestamp: string;
}

export interface Signal {
  id: string;
  ticker: string;
  asset_class: string;
  timeframe: string;
  signal_class: "STRONG_LONG" | "LONG" | "NEUTRAL" | "SHORT" | "STRONG_SHORT";
  confidence: number;       // 0.0 – 1.0
  rayzar_score: number;     // 0 – 100
  conviction_score: number;
  consensus_score: number;
  regime: string;
  reasoning: string | null;
  model_id: string;
  features_used: unknown | null;
  signal_date: string;      // ISO date "YYYY-MM-DD"
  created_at: string;       // ISO datetime
}

export interface SignalListData {
  signals: Signal[];
  total: number;
  page: number;
  page_size: number;
}

export interface MarketRegime {
  regime: string;
  signal_date: string;
  signal_count: number;
  timestamp: string;
}

export interface WatchlistItem {
  id: number;
  ticker: string;
  asset_class: string;
  created_at: string;
}

export interface OhlcvBar {
  date: string;       // "YYYY-MM-DD"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fundamentals {
  ticker: string;
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  ps_ratio: number | null;
  eps_ttm: number | null;
  revenue_ttm: number | null;
  profit_margin: number | null;
  earnings_date: string | null;   // "YYYY-MM-DD"
  analyst_target: number | null;
  analyst_buy: number | null;
  analyst_hold: number | null;
  analyst_sell: number | null;
  short_float: number | null;
  short_ratio: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  beta: number | null;
  dividend_yield: number | null;
  data_date: string;
}

// ---------------------------------------------------------------------------
// Query param types
// ---------------------------------------------------------------------------

export interface GetSignalsParams {
  page?: number;
  page_size?: number;
  signal_class?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

class RayZarApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    ).replace(/\/$/, "");
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY ?? "";
  }

  private headers(): HeadersInit {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (this.apiKey) h["X-API-Key"] = this.apiKey;
    return h;
  }

  private async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url.toString(), {
      headers: this.headers(),
      // Revalidate every 60 seconds — signals update nightly so this is generous
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      // Parse error envelope if backend returned one
      try {
        return await res.json() as ApiResponse<T>;
      } catch {
        throw new Error(`API error: ${res.status} ${res.statusText} — ${path}`);
      }
    }

    return res.json() as Promise<ApiResponse<T>>;
  }

  // ── Endpoints ─────────────────────────────────────────────────────────

  async health(): Promise<ApiResponse<HealthData>> {
    return this.get<HealthData>("/health");
  }

  async getSignals(params?: GetSignalsParams): Promise<ApiResponse<SignalListData>> {
    return this.get<SignalListData>("/api/v1/signals", {
      page: params?.page,
      page_size: params?.page_size,
      signal_class: params?.signal_class,
    });
  }

  async getTopSignals(limit = 10): Promise<ApiResponse<Signal[]>> {
    return this.get<Signal[]>("/api/v1/signals/top", { limit });
  }

  async getSignalByTicker(ticker: string): Promise<ApiResponse<Signal>> {
    return this.get<Signal>(`/api/v1/signals/${encodeURIComponent(ticker.toUpperCase())}`);
  }

  async getMarketRegime(): Promise<ApiResponse<MarketRegime | null>> {
    return this.get<MarketRegime | null>("/api/v1/market/regime");
  }

  async getOhlcv(ticker: string, limit = 252): Promise<ApiResponse<OhlcvBar[]>> {
    return this.get<OhlcvBar[]>(
      `/api/v1/ohlcv/${encodeURIComponent(ticker.toUpperCase())}`,
      { limit },
    );
  }

  async getWatchlist(): Promise<ApiResponse<WatchlistItem[]>> {
    return this.get<WatchlistItem[]>("/api/v1/watchlist");
  }

  async addToWatchlist(ticker: string, asset_class = "stocks"): Promise<ApiResponse<WatchlistItem>> {
    const url = new URL(`${this.baseUrl}/api/v1/watchlist`);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ ticker, asset_class }),
    });
    return res.json() as Promise<ApiResponse<WatchlistItem>>;
  }

  async getFundamentals(ticker: string): Promise<ApiResponse<Fundamentals | null>> {
    return this.get<Fundamentals | null>(
      `/api/v1/fundamentals/${encodeURIComponent(ticker.toUpperCase())}`,
    );
  }

  async removeFromWatchlist(ticker: string): Promise<ApiResponse<null>> {
    const url = new URL(`${this.baseUrl}/api/v1/watchlist/${encodeURIComponent(ticker.toUpperCase())}`);
    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: this.headers(),
    });
    return res.json() as Promise<ApiResponse<null>>;
  }
}

// Singleton — one client instance shared across the app
export const apiClient = new RayZarApiClient();
