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
  signal_class: "STRONG_LONG" | "LONG" | "NEUTRAL" | "SHORT" | "STRONG_SHORT" | "NO_TRADE";
  no_trade_reason: string | null;  // populated when signal_class === "NO_TRADE"
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
  sector: string | null;
  model_variant: string | null;   // "ta_only" | "ta_options" — set by service layer
}

export interface ModelVariant {
  id: string;
  name: string;
  specialists: number;
  status: string;
}

export interface TradingIdea {
  id: string;
  ticker: string | null;
  source: string;
  raw_text: string;
  url: string | null;
  assessment: string | null;
  assessment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeaRequest {
  ticker?: string;
  text: string;
  source: "chat" | "twitter" | "discord" | "manual";
  url?: string;
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
// TA Analysis types — new for TrendSpider-like terminal
// ---------------------------------------------------------------------------

/**
 * A single TA signal item returned by the /ta-analysis endpoint.
 */
/** A single pivot point used in a pattern overlay (date + price). */
export interface OverlayPoint {
  date: string;    // "YYYY-MM-DD"
  price: number;
}

/** A trendline connecting two points, optionally extended and labelled. */
export interface OverlayTrendline {
  p1: OverlayPoint;
  p2: OverlayPoint;
  extend?: boolean;
  style?: "solid" | "dashed" | "dotted";
  label?: string;
}

/** A shaded price/time zone on the chart. */
export interface OverlayZone {
  from_date: string;
  to_date: string;
  from_price: number;
  to_price: number;
  color: string;
}

/** Chart overlay data for a detected pattern — pivot points, trendlines, zones. */
export interface PatternOverlay {
  type: string;               // "pattern"
  points: OverlayPoint[];     // key pivot candles (shoulders, peaks, troughs)
  trendlines?: OverlayTrendline[];
  zones?: OverlayZone[];
}

export interface TASignalItem {
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;          // 0.0 – 1.0
  timeframe: string;           // e.g. "1d", "1w", "1m"
  status?: string;             // e.g. "active", "forming", "completed"
  key_levels?: Record<string, number>;  // e.g. { neckline: 150.5, target: 135.0 }
  description?: string;        // human-readable explanation
  overlay?: PatternOverlay | null;     // pivot points + trendlines + zones for chart
}

/**
 * Lightweight health-only response from GET /ta-analysis/{ticker}/health
 */
export interface TAHealthResponse {
  ticker: string;
  health_score: number | null;   // -100 to +100
  health_grade: string | null;   // "A+", "A", "B", "C", "D", "F", "F-"
  signal_date: string;
}

/**
 * Full TA analysis response from GET /ta-analysis/{ticker}
 */
export interface TAAnalysisResponse {
  ticker: string;
  signal_date: string;
  ta_direction: "bullish" | "bearish" | "neutral" | null;
  ta_summary: string | null;
  health_score: number | null;
  health_grade: string | null;
  personality_type: string | null;     // e.g. "MOMENTUM", "VALUE", "MEAN_REVERSION"
  macro_regime_label: string | null;   // e.g. "risk-on", "risk-off", "transition"
  sector_regime_label: string | null;  // e.g. "BULL", "BEAR", "NEUTRAL"
  signals: TASignalItem[];
}

/**
 * FeatureContext — structured view of Signal.features_used for TA data fallback.
 * Parsed from the opaque features_used JSON blob on the Signal object.
 */
export interface FeatureContext {
  // Existing fields
  health_score?: number | null;
  health_grade?: string | null;
  personality_type?: string | null;
  macro_regime?: string | null;
  sector_regime?: string | null;
  ta_direction?: string | null;
  ta_summary?: string | null;
  pattern_1?: string | null;
  pattern_2?: string | null;
  pattern_3?: string | null;
  hurst_exponent?: number | null;
  beta?: number | null;
  long_prob?: number | null;
  short_prob?: number | null;
  // MVP1 — TA + ML alignment
  ta_alignment_status?: string | null;  // STRONG_AGREE | WEAK_AGREE | NEUTRAL | WEAK_CONFLICT | STRONG_CONFLICT
  ta_conflict_reason?: string | null;
  swing_candidate?: boolean | null;
  regime_warning?: boolean | null;
  // MVP1 — stops + position sizing
  stop_loss?: number | null;
  target_1?: number | null;
  target_2?: number | null;
  risk_per_share?: number | null;
  risk_pct?: number | null;
  shares_1pct_risk?: number | null;
  position_value_1pct?: number | null;
  // MVP1 — earnings proximity
  earnings_proximity_flag?: boolean | null;
  days_to_earnings?: number | null;
  // MVP1 — final meta probs
  final_long_prob?: number | null;
  final_short_prob?: number | null;
  // Advanced Tab — volatility + momentum indicators
  atr7?: number | null;
  atr7_pct?: number | null;
  atr14?: number | null;
  atr14_pct?: number | null;
  atr21?: number | null;
  atr21_pct?: number | null;
  hv_5d?: number | null;
  hv_10d?: number | null;
  hv_20d?: number | null;
  hv_60d?: number | null;
  rsi7?: number | null;
  rsi14?: number | null;
  rsi21?: number | null;
  macd_hist?: number | null;
  macd_bull?: number | null;
  macd_bear?: number | null;
  adx?: number | null;
  trending?: number | null;
  bb_width_pct?: number | null;
  bb_kc_squeeze?: number | null;
  rvol5?: number | null;
  rvol10?: number | null;
  unusual_vol?: number | null;
}

/**
 * Parse the opaque features_used blob from a Signal into a typed FeatureContext.
 * Returns null if features_used is null/unparseable.
 */
export function parseFeatureContext(featuresUsed: unknown): FeatureContext | null {
  if (!featuresUsed || typeof featuresUsed !== "object") return null;
  const f = featuresUsed as Record<string, unknown>;
  return {
    health_score:            typeof f.health_score === "number" ? f.health_score : null,
    health_grade:            typeof f.health_grade === "string" ? f.health_grade : null,
    personality_type:        typeof f.personality_type === "string" ? f.personality_type : null,
    macro_regime:            typeof f.macro_regime === "string" ? f.macro_regime : null,
    sector_regime:           typeof f.sector_regime === "string" ? f.sector_regime : null,
    ta_direction:            typeof f.ta_direction === "string" ? f.ta_direction : null,
    ta_summary:              typeof f.ta_summary === "string" ? f.ta_summary : null,
    pattern_1:               typeof f.pattern_1 === "string" ? f.pattern_1 : null,
    pattern_2:               typeof f.pattern_2 === "string" ? f.pattern_2 : null,
    pattern_3:               typeof f.pattern_3 === "string" ? f.pattern_3 : null,
    hurst_exponent:          typeof f.hurst_exponent === "number" ? f.hurst_exponent : null,
    beta:                    typeof f.beta === "number" ? f.beta : null,
    long_prob:               typeof f.long_prob === "number" ? f.long_prob : null,
    short_prob:              typeof f.short_prob === "number" ? f.short_prob : null,
    ta_alignment_status:     typeof f.ta_alignment_status === "string" ? f.ta_alignment_status : null,
    ta_conflict_reason:      typeof f.ta_conflict_reason === "string" ? f.ta_conflict_reason : null,
    swing_candidate:         typeof f.swing_candidate === "boolean" ? f.swing_candidate : null,
    regime_warning:          typeof f.regime_warning === "boolean" ? f.regime_warning : null,
    stop_loss:               typeof f.stop_loss === "number" ? f.stop_loss : null,
    target_1:                typeof f.target_1 === "number" ? f.target_1 : null,
    target_2:                typeof f.target_2 === "number" ? f.target_2 : null,
    risk_per_share:          typeof f.risk_per_share === "number" ? f.risk_per_share : null,
    risk_pct:                typeof f.risk_pct === "number" ? f.risk_pct : null,
    shares_1pct_risk:        typeof f.shares_1pct_risk === "number" ? f.shares_1pct_risk : null,
    position_value_1pct:     typeof f.position_value_1pct === "number" ? f.position_value_1pct : null,
    earnings_proximity_flag: typeof f.earnings_proximity_flag === "boolean" ? f.earnings_proximity_flag : null,
    days_to_earnings:        typeof f.days_to_earnings === "number" ? f.days_to_earnings : null,
    final_long_prob:         typeof f.final_long_prob === "number" ? f.final_long_prob : null,
    final_short_prob:        typeof f.final_short_prob === "number" ? f.final_short_prob : null,
    // Advanced Tab
    atr7:                    typeof f.atr7 === "number" ? f.atr7 : null,
    atr7_pct:                typeof f.atr7_pct === "number" ? f.atr7_pct : null,
    atr14:                   typeof f.atr14 === "number" ? f.atr14 : null,
    atr14_pct:               typeof f.atr14_pct === "number" ? f.atr14_pct : null,
    atr21:                   typeof f.atr21 === "number" ? f.atr21 : null,
    atr21_pct:               typeof f.atr21_pct === "number" ? f.atr21_pct : null,
    hv_5d:                   typeof f.hv_5d === "number" ? f.hv_5d : null,
    hv_10d:                  typeof f.hv_10d === "number" ? f.hv_10d : null,
    hv_20d:                  typeof f.hv_20d === "number" ? f.hv_20d : null,
    hv_60d:                  typeof f.hv_60d === "number" ? f.hv_60d : null,
    rsi7:                    typeof f.rsi7 === "number" ? f.rsi7 : null,
    rsi14:                   typeof f.rsi14 === "number" ? f.rsi14 : null,
    rsi21:                   typeof f.rsi21 === "number" ? f.rsi21 : null,
    macd_hist:               typeof f.macd_hist === "number" ? f.macd_hist : null,
    macd_bull:               typeof f.macd_bull === "number" ? f.macd_bull : null,
    macd_bear:               typeof f.macd_bear === "number" ? f.macd_bear : null,
    adx:                     typeof f.adx === "number" ? f.adx : null,
    trending:                typeof f.trending === "number" ? f.trending : null,
    bb_width_pct:            typeof f.bb_width_pct === "number" ? f.bb_width_pct : null,
    bb_kc_squeeze:           typeof f.bb_kc_squeeze === "number" ? f.bb_kc_squeeze : null,
    rvol5:                   typeof f.rvol5 === "number" ? f.rvol5 : null,
    rvol10:                  typeof f.rvol10 === "number" ? f.rvol10 : null,
    unusual_vol:             typeof f.unusual_vol === "number" ? f.unusual_vol : null,
  };
}

export interface InsiderTransaction {
  date: string;
  insider: string;
  shares: number | null;
  value: number | null;
  is_buy: boolean;
  is_sell: boolean;
}

export interface InsiderActivity {
  ticker: string;
  insider_buy_count: number;
  insider_sell_count: number;
  insider_buy_value: number;
  insider_sell_value: number;
  insider_net_value: number;
  insider_sentiment: string;   // "bullish" | "bearish" | "neutral"
  transactions: InsiderTransaction[];
}

export interface PortfolioPosition {
  id: string;
  ticker: string;
  asset_class: string;
  quantity: number | null;
  entry_price: number | null;
  entry_date: string | null;
  notes: string | null;
  created_at: string;
  // enriched
  current_price: number | null;
  pnl_pct: number | null;
  pnl_value: number | null;
  signal_class: string | null;
  rayzar_score: number | null;
  stop_loss: number | null;
  target_1: number | null;
  target_2: number | null;
}

export interface AddPositionRequest {
  ticker: string;
  quantity: number;
  entry_price: number;
  entry_date: string;  // YYYY-MM-DD
  notes?: string;
  asset_class?: string;
}

export interface ServerAlert {
  id: string;
  ticker: string;
  alert_type: string;
  condition: string;
  signal_class: string | null;
  price_at_trigger: number | null;
  reference_price: number | null;
  change_pct: number | null;
  session: string;
  read: boolean;
  triggered_at: string;
}

export interface ScannerStatus {
  running: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  active_tickers_count: number;
  alerts_today: number;
}

export interface QuoteData {
  ticker: string;
  price: number | null;
  prev_close: number | null;
  change_pct: number | null;
  pre_market_price: number | null;
  pre_market_change_pct: number | null;
  post_market_price: number | null;
  post_market_change_pct: number | null;
  session: "pre" | "regular" | "post" | "closed";
  market_state: string;
}

export interface EarningsQuarter {
  ticker: string;
  report_date: string;          // "YYYY-MM-DD"
  eps_actual: number | null;
  eps_estimate: number | null;
  eps_surprise_pct: number | null;  // matches db_writer column name
  revenue: number | null;           // matches db_writer column name
  beat: number | null;              // 1=beat, 0=miss, null=unknown
}

export interface OptionsSnapshot {
  ticker: string;
  snapshot_date: string;        // "YYYY-MM-DD" — matches db_writer column name
  pc_ratio: number | null;      // matches db_writer column name (NOT put_call_ratio)
  max_pain: number | null;
  call_wall: number | null;     // used as gamma wall call in chart Pro Mode
  put_wall: number | null;      // used as gamma wall put in chart Pro Mode
  current_iv: number | null;
  iv_rank: number | null;
  iv_percentile: number | null;
  total_call_oi: number | null;
  total_put_oi: number | null;
  pc_sentiment: string | null;
}

// ---------------------------------------------------------------------------
// Query param types
// ---------------------------------------------------------------------------

export interface SearchResult {
  ticker: string;
  signal_class: string;
  rayzar_score: number;
  signal_date: string;
  regime: string;
}

export interface UpcomingEarning {
  ticker: string;
  report_date: string;   // "YYYY-MM-DD"
  days_until: number;
  signal_class: string;
  rayzar_score: number;
}

export interface GetSignalsParams {
  page?: number;
  page_size?: number;
  signal_class?: string;
  model?: string;   // "ta_only" | "ta_options"
  sector?: string;
  min_score?: number;
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

  private async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return res.json() as Promise<ApiResponse<T>>;
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
      cache: "no-store",
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

  // ── Core Signal Endpoints ─────────────────────────────────────────────

  async health(): Promise<ApiResponse<HealthData>> {
    return this.get<HealthData>("/health");
  }

  async getSignals(params?: GetSignalsParams): Promise<ApiResponse<SignalListData>> {
    return this.get<SignalListData>("/api/v1/signals", {
      page: params?.page,
      page_size: params?.page_size,
      signal_class: params?.signal_class,
      model: params?.model,
      sector: params?.sector,
      min_score: params?.min_score,
    });
  }

  async getModelVariants(): Promise<ApiResponse<ModelVariant[]>> {
    return this.get<ModelVariant[]>("/api/v1/signals/models");
  }

  async getTopSignals(limit = 10): Promise<ApiResponse<Signal[]>> {
    return this.get<Signal[]>("/api/v1/signals/top", { limit });
  }

  async getSignalByTicker(ticker: string): Promise<ApiResponse<Signal>> {
    return this.get<Signal>(`/api/v1/signals/${encodeURIComponent(ticker.toUpperCase())}`);
  }

  async search(q: string, limit = 10): Promise<ApiResponse<SearchResult[]>> {
    return this.get<SearchResult[]>("/api/v1/search", { q, limit });
  }

  async getUpcomingEarnings(days = 30): Promise<ApiResponse<UpcomingEarning[]>> {
    return this.get<UpcomingEarning[]>("/api/v1/earnings/upcoming", { days });
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

  // ── TA Analysis Endpoints ─────────────────────────────────────────────

  /**
   * Fetch the full TA analysis for a ticker.
   * Returns null gracefully if the endpoint returns 404 or fails.
   */
  async getTAAnalysis(ticker: string): Promise<TAAnalysisResponse | null> {
    try {
      const res = await this.get<TAAnalysisResponse>(
        `/api/v1/ta/${encodeURIComponent(ticker.toUpperCase())}`,
      );
      if (res.success && res.data) return res.data;
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch just the TA signal items for a ticker.
   * Returns empty array gracefully on failure.
   */
  async getTASignals(ticker: string): Promise<TASignalItem[]> {
    try {
      const res = await this.get<TASignalItem[]>(
        `/api/v1/ta/${encodeURIComponent(ticker.toUpperCase())}/signals`,
      );
      if (res.success && res.data) return res.data;
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch just the health score and grade for a ticker.
   * Returns null gracefully on failure.
   */
  async getTAHealth(ticker: string): Promise<TAHealthResponse | null> {
    try {
      const res = await this.get<TAHealthResponse>(
        `/api/v1/ta/${encodeURIComponent(ticker.toUpperCase())}/health`,
      );
      if (res.success && res.data) return res.data;
      return null;
    } catch {
      return null;
    }
  }

  // ── Earnings & Options Endpoints ──────────────────────────────────────

  async getEarnings(ticker: string): Promise<ApiResponse<EarningsQuarter[]>> {
    return this.get<EarningsQuarter[]>(
      `/api/v1/earnings/${encodeURIComponent(ticker.toUpperCase())}`,
    );
  }

  async getOptions(ticker: string): Promise<ApiResponse<OptionsSnapshot | null>> {
    return this.get<OptionsSnapshot | null>(
      `/api/v1/options/${encodeURIComponent(ticker.toUpperCase())}`,
    );
  }

  async getInsiderActivity(ticker: string): Promise<ApiResponse<InsiderActivity | null>> {
    return this.get<InsiderActivity | null>(
      `/api/v1/insider/${encodeURIComponent(ticker.toUpperCase())}`,
    );
  }

  async getQuote(ticker: string): Promise<ApiResponse<QuoteData | null>> {
    return this.get<QuoteData | null>(
      `/api/v1/quote/${encodeURIComponent(ticker.toUpperCase())}`,
    );
  }

  // ── Chat Endpoints ────────────────────────────────────────────────────────

  async chatWithTicker(
    ticker: string,
    message: string,
    history: Array<{ role: string; content: string }>,
  ): Promise<ApiResponse<{ reply: string; sources: string[] }>> {
    return this.post(`/api/v1/chat/${encodeURIComponent(ticker.toUpperCase())}`, {
      message,
      history,
    });
  }

  // ── Ideas Endpoints ───────────────────────────────────────────────────────

  async createIdea(body: CreateIdeaRequest): Promise<ApiResponse<TradingIdea>> {
    const url = new URL(`${this.baseUrl}/api/v1/ideas`);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return res.json() as Promise<ApiResponse<TradingIdea>>;
  }

  async getPortfolio(): Promise<ApiResponse<PortfolioPosition[]>> {
    return this.get<PortfolioPosition[]>("/api/v1/portfolio");
  }

  async addPosition(body: AddPositionRequest): Promise<ApiResponse<PortfolioPosition>> {
    return this.post<PortfolioPosition>("/api/v1/portfolio", body);
  }

  async removePosition(ticker: string): Promise<ApiResponse<null>> {
    const url = `${this.baseUrl}/api/v1/portfolio/${ticker.toUpperCase()}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "X-API-Key": this.apiKey },
    });
    return res.json();
  }

  async getAlerts(limit = 50): Promise<ApiResponse<ServerAlert[]>> {
    return this.get<ServerAlert[]>("/api/v1/alerts", { limit });
  }

  async markAlertRead(alertId: string): Promise<ApiResponse<null>> {
    return this.post<null>(`/api/v1/alerts/${alertId}/read`, {});
  }

  async markAllAlertsRead(): Promise<ApiResponse<{ marked_read: number }>> {
    return this.post<{ marked_read: number }>("/api/v1/alerts/read-all", {});
  }

  async getScannerStatus(): Promise<ApiResponse<ScannerStatus>> {
    return this.get<ScannerStatus>("/api/v1/scanner/status");
  }

  async getIdeas(params?: {
    page?: number;
    page_size?: number;
    ticker?: string;
    source?: string;
  }): Promise<ApiResponse<{ ideas: TradingIdea[]; total: number; page: number; page_size: number }>> {
    return this.get("/api/v1/ideas", {
      page: params?.page,
      page_size: params?.page_size,
      ticker: params?.ticker,
      source: params?.source,
    });
  }
}

// Singleton — one client instance shared across the app
export const apiClient = new RayZarApiClient();
