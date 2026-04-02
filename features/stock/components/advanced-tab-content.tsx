/**
 * features/stock/components/advanced-tab-content.tsx — RayZar Frontend
 *
 * Advanced tab: deep-dive analysis panel with 4 sections:
 * 1. Expected Move Range — ATR-based + options IV implied move
 * 2. Multi-Timeframe TA Alignment — signals grouped by timeframe
 * 3. Volatility Panel — HV5/10/20/60 vs IV rank
 * 4. Technical Snapshot — RSI, MACD, ADX, BB squeeze
 *
 * Server component — all data passed as props (no fetches).
 */

import type { FeatureContext, TASignalItem, OptionsSnapshot, Signal } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "—";
  return v.toFixed(decimals);
}

function fmtPct(v: number | null | undefined, decimals = 1): string {
  if (v == null) return "—";
  return `${v.toFixed(decimals)}%`;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h2>
      {children}
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────

function HBar({
  label,
  value,
  max,
  color,
  suffix = "%",
  hint,
}: {
  label: string;
  value: number | null | undefined;
  max: number;
  color: string;
  suffix?: string;
  hint?: string;
}) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="font-mono text-xs font-semibold text-text-primary">
          {value != null ? `${value.toFixed(1)}${suffix}` : "—"}
          {hint && <span className="ml-1.5 font-normal text-text-muted">{hint}</span>}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── 1. Expected Move Range ────────────────────────────────────────────────────

function ExpectedMoveSection({
  currentPrice,
  features,
  options,
}: {
  currentPrice: number | null;
  features: FeatureContext | null;
  options: OptionsSnapshot | null;
}) {
  const price = currentPrice;

  // ATR-based ranges
  const atr7  = features?.atr7  ?? null;
  const atr14 = features?.atr14 ?? null;
  const atr21 = features?.atr21 ?? null;
  const atr14Pct = features?.atr14_pct ?? null;

  // IV-based expected move (1 week = 5 trading days)
  // Formula: price × IV × √(5/252) ≈ price × IV × 0.1408
  const iv = options?.current_iv ?? null;
  const ivWeekMove = iv != null && price != null ? price * iv * Math.sqrt(5 / 252) : null;
  const ivWeekPct  = iv != null ? iv * Math.sqrt(5 / 252) * 100 : null;

  const hasAny = atr14 != null || iv != null;
  if (!hasAny) return null;

  return (
    <Section title="Expected Move Range">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* ATR block */}
        <div className="space-y-3">
          <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">ATR-Based (Daily)</p>
          {[
            { label: "ATR-7",  val: atr7,  pct: features?.atr7_pct },
            { label: "ATR-14", val: atr14, pct: features?.atr14_pct },
            { label: "ATR-21", val: atr21, pct: features?.atr21_pct },
          ].map(({ label, val, pct }) =>
            val != null ? (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{label}</span>
                <div className="text-right">
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    ${val.toFixed(2)}
                  </span>
                  {pct != null && (
                    <span className="ml-1.5 font-mono text-xs text-text-muted">
                      ({fmtPct(pct * 100)})
                    </span>
                  )}
                </div>
              </div>
            ) : null
          )}

          {/* Price range bar */}
          {price != null && atr14 != null && (
            <div className="mt-2 rounded-lg border border-border bg-elevated p-3 space-y-1.5">
              <p className="text-2xs text-text-muted">1-Day ATR-14 Range</p>
              <div className="flex items-center justify-between font-mono text-xs">
                <span style={{ color: "#ef4444" }}>${(price - atr14).toFixed(2)}</span>
                <span className="text-text-muted text-2xs">±{fmtPct(atr14Pct != null ? atr14Pct * 100 : null)}</span>
                <span style={{ color: "#10b981" }}>${(price + atr14).toFixed(2)}</span>
              </div>
              <div className="relative h-2 rounded-full bg-elevated overflow-hidden border border-border">
                <div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    left: "20%",
                    right: "20%",
                    background: "linear-gradient(90deg, #ef4444 0%, #6b7280 40%, #6b7280 60%, #10b981 100%)",
                    opacity: 0.6,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white"
                  style={{ left: "50%" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Options IV block */}
        <div className="space-y-3">
          <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">Options IV-Based (1W)</p>
          {iv != null ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Current IV</span>
                <span className="font-mono text-xs font-semibold text-text-primary">{fmtPct(iv * 100)}</span>
              </div>
              {options?.iv_rank != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">IV Rank</span>
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: options.iv_rank >= 50 ? "#f59e0b" : "#6b7280" }}
                  >
                    {fmt(options.iv_rank)}%
                  </span>
                </div>
              )}
              {ivWeekMove != null && price != null && (
                <div className="mt-2 rounded-lg border border-border bg-elevated p-3 space-y-1.5">
                  <p className="text-2xs text-text-muted">1-Week Implied Move (1σ)</p>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span style={{ color: "#ef4444" }}>${(price - ivWeekMove).toFixed(2)}</span>
                    <span className="text-text-muted text-2xs">±{fmtPct(ivWeekPct)}</span>
                    <span style={{ color: "#10b981" }}>${(price + ivWeekMove).toFixed(2)}</span>
                  </div>
                  <p className="text-2xs text-text-muted">~68% probability price stays in this range</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-text-muted">No options data available</p>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── 2. Multi-Timeframe TA Alignment ──────────────────────────────────────────

function MultiTimeframeSection({ taSignals }: { taSignals: TASignalItem[] }) {
  if (!taSignals.length) return null;

  // Group by timeframe
  const tfOrder = ["1d", "4h", "1w", "1mo"];
  const groups: Record<string, TASignalItem[]> = {};
  for (const sig of taSignals) {
    const tf = sig.timeframe ?? "1d";
    if (!groups[tf]) groups[tf] = [];
    groups[tf].push(sig);
  }

  const tfLabels: Record<string, string> = {
    "1d": "Daily",
    "4h": "4-Hour",
    "1w": "Weekly",
    "1mo": "Monthly",
  };

  const tfs = tfOrder.filter((tf) => groups[tf]?.length);

  return (
    <Section title="Multi-Timeframe TA Alignment">
      <div className={cn("grid gap-4", tfs.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {tfs.map((tf) => {
          const sigs = groups[tf];
          const bullish = sigs.filter((s) => s.direction === "bullish").length;
          const bearish = sigs.filter((s) => s.direction === "bearish").length;
          const neutral = sigs.filter((s) => s.direction === "neutral").length;
          const total = sigs.length;
          const net = bullish - bearish;
          const alignment =
            net >= 2 ? "BULLISH" : net <= -2 ? "BEARISH" : net > 0 ? "LEAN BULL" : net < 0 ? "LEAN BEAR" : "MIXED";
          const alignColor =
            net >= 2 ? "#10b981" : net <= -2 ? "#ef4444" : net > 0 ? "#6ee7b7" : net < 0 ? "#f87171" : "#6b7280";

          return (
            <div key={tf} className="rounded-lg border border-border bg-elevated p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">{tfLabels[tf] ?? tf}</span>
                <span className="text-2xs font-semibold" style={{ color: alignColor }}>{alignment}</span>
              </div>

              {/* Bull / Bear / Neutral counts */}
              <div className="flex items-center gap-3 text-2xs">
                <span style={{ color: "#10b981" }}>▲ {bullish} Bull</span>
                <span style={{ color: "#ef4444" }}>▼ {bearish} Bear</span>
                {neutral > 0 && <span style={{ color: "#6b7280" }}>— {neutral}</span>}
              </div>

              {/* Stacked bar */}
              <div className="h-1.5 w-full flex rounded-full overflow-hidden">
                {bullish > 0 && (
                  <div style={{ width: `${(bullish / total) * 100}%`, background: "#10b981" }} />
                )}
                {neutral > 0 && (
                  <div style={{ width: `${(neutral / total) * 100}%`, background: "#6b7280" }} />
                )}
                {bearish > 0 && (
                  <div style={{ width: `${(bearish / total) * 100}%`, background: "#ef4444" }} />
                )}
              </div>

              {/* Top signals */}
              <div className="space-y-1">
                {sigs.slice(0, 3).map((sig, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-2xs text-text-muted truncate max-w-[110px]">{sig.name}</span>
                    <span
                      className="text-2xs font-mono font-semibold"
                      style={{
                        color:
                          sig.direction === "bullish"
                            ? "#10b981"
                            : sig.direction === "bearish"
                            ? "#ef4444"
                            : "#6b7280",
                      }}
                    >
                      {Math.round(sig.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ── 3. Volatility Panel ───────────────────────────────────────────────────────

function VolatilitySection({
  features,
  options,
}: {
  features: FeatureContext | null;
  options: OptionsSnapshot | null;
}) {
  const hv5  = features?.hv_5d  ?? null;
  const hv10 = features?.hv_10d ?? null;
  const hv20 = features?.hv_20d ?? null;
  const hv60 = features?.hv_60d ?? null;
  const iv   = options?.current_iv != null ? options.current_iv * 100 : null;
  const ivRank = options?.iv_rank ?? null;

  const hasHv = hv5 != null || hv10 != null || hv20 != null || hv60 != null;
  if (!hasHv && iv == null) return null;

  // Max for bar scaling: at least 80 (annualised vol %)
  const maxVol = Math.max(80, ...[hv5, hv10, hv20, hv60, iv].filter((v): v is number => v != null));

  // IV vs HV20 premium/discount
  const ivHvPremium =
    iv != null && hv20 != null
      ? ((iv - hv20) / hv20) * 100
      : null;

  return (
    <Section title="Volatility Panel">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Historical vol bars */}
        {hasHv && (
          <div className="space-y-3">
            <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">Historical Volatility (Ann.)</p>
            {[
              { label: "HV-5",  value: hv5  },
              { label: "HV-10", value: hv10 },
              { label: "HV-20", value: hv20 },
              { label: "HV-60", value: hv60 },
            ].map(({ label, value }) => (
              <HBar
                key={label}
                label={label}
                value={value != null ? value * 100 : null}
                max={maxVol}
                color="#6b7280"
                suffix="%"
              />
            ))}
          </div>
        )}

        {/* IV panel */}
        <div className="space-y-3">
          <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">Implied Volatility</p>
          {iv != null && (
            <HBar
              label="Current IV"
              value={iv}
              max={maxVol}
              color="#f59e0b"
              suffix="%"
            />
          )}
          {ivRank != null && (
            <HBar
              label="IV Rank"
              value={ivRank}
              max={100}
              color={ivRank >= 50 ? "#f59e0b" : "#6b7280"}
              suffix="%"
              hint={ivRank >= 70 ? "elevated" : ivRank >= 40 ? "moderate" : "low"}
            />
          )}
          {ivHvPremium != null && (
            <div className="mt-2 rounded-lg border border-border bg-elevated p-3">
              <p className="text-2xs text-text-muted mb-1">IV vs HV-20 Premium</p>
              <p
                className="font-mono text-sm font-bold"
                style={{ color: ivHvPremium > 10 ? "#f59e0b" : ivHvPremium < -10 ? "#10b981" : "#6b7280" }}
              >
                {ivHvPremium > 0 ? "+" : ""}
                {ivHvPremium.toFixed(1)}%
              </p>
              <p className="text-2xs text-text-muted mt-0.5">
                {ivHvPremium > 15
                  ? "Options are expensive vs realised vol — consider selling premium"
                  : ivHvPremium < -10
                  ? "Options are cheap vs realised vol — elevated risk"
                  : "IV roughly in line with historical volatility"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── 4. Technical Snapshot ─────────────────────────────────────────────────────

function rsiLabel(rsi: number | null | undefined): { text: string; color: string } {
  if (rsi == null) return { text: "—", color: "#6b7280" };
  if (rsi >= 70) return { text: "Overbought", color: "#ef4444" };
  if (rsi >= 60) return { text: "Strong",     color: "#f59e0b" };
  if (rsi >= 50) return { text: "Neutral+",   color: "#6ee7b7" };
  if (rsi >= 40) return { text: "Neutral−",   color: "#6b7280" };
  if (rsi >= 30) return { text: "Weak",       color: "#f59e0b" };
  return { text: "Oversold", color: "#10b981" }; // oversold = potential reversal = bullish signal
}

function adxLabel(adx: number | null | undefined): { text: string; color: string } {
  if (adx == null) return { text: "—", color: "#6b7280" };
  if (adx >= 40) return { text: "Very Strong Trend", color: "#10b981" };
  if (adx >= 25) return { text: "Trending",          color: "#6ee7b7" };
  if (adx >= 20) return { text: "Developing",        color: "#f59e0b" };
  return { text: "Ranging / Weak", color: "#6b7280" };
}

function TechnicalSnapshotSection({ features }: { features: FeatureContext | null }) {
  if (!features) return null;

  const { rsi14, rsi7, rsi21, macd_hist, adx, bb_width_pct, bb_kc_squeeze, rvol5, unusual_vol } = features;

  const hasAny = rsi14 != null || macd_hist != null || adx != null;
  if (!hasAny) return null;

  const rsiInfo = rsiLabel(rsi14);
  const adxInfo = adxLabel(adx);
  const macdDir = macd_hist != null ? (macd_hist > 0 ? "bullish" : "bearish") : null;
  const bbSqueeze = bb_kc_squeeze === 1;

  return (
    <Section title="Technical Snapshot">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* RSI */}
        {rsi14 != null && (
          <div className="rounded-lg border border-border bg-elevated p-4 space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">RSI</p>
            <p className="font-mono text-2xl font-bold text-text-primary">{rsi14.toFixed(0)}</p>
            <p className="text-xs font-semibold" style={{ color: rsiInfo.color }}>{rsiInfo.text}</p>
            <div className="space-y-1 pt-1 border-t border-border">
              {rsi7  != null && <div className="flex justify-between text-2xs"><span className="text-text-muted">RSI-7</span><span className="font-mono">{rsi7.toFixed(0)}</span></div>}
              {rsi21 != null && <div className="flex justify-between text-2xs"><span className="text-text-muted">RSI-21</span><span className="font-mono">{rsi21.toFixed(0)}</span></div>}
            </div>
          </div>
        )}

        {/* MACD */}
        {macd_hist != null && (
          <div className="rounded-lg border border-border bg-elevated p-4 space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">MACD</p>
            <p
              className="font-mono text-2xl font-bold"
              style={{ color: macd_hist > 0 ? "#10b981" : "#ef4444" }}
            >
              {macd_hist > 0 ? "▲" : "▼"}
            </p>
            <p
              className="text-xs font-semibold"
              style={{ color: macd_hist > 0 ? "#10b981" : "#ef4444" }}
            >
              {macdDir === "bullish" ? "Bullish" : "Bearish"} Histogram
            </p>
            <div className="space-y-1 pt-1 border-t border-border">
              <div className="flex justify-between text-2xs">
                <span className="text-text-muted">Histogram</span>
                <span className="font-mono">{macd_hist.toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ADX */}
        {adx != null && (
          <div className="rounded-lg border border-border bg-elevated p-4 space-y-2">
            <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">ADX</p>
            <p className="font-mono text-2xl font-bold text-text-primary">{adx.toFixed(0)}</p>
            <p className="text-xs font-semibold" style={{ color: adxInfo.color }}>{adxInfo.text}</p>
            <div className="pt-1 border-t border-border">
              <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (adx / 60) * 100)}%`,
                    background: adx >= 25 ? "#10b981" : "#6b7280",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* BB Squeeze + Volume */}
        <div className="rounded-lg border border-border bg-elevated p-4 space-y-2">
          <p className="text-2xs font-semibold uppercase tracking-wide text-text-muted">Conditions</p>

          {bb_kc_squeeze != null && (
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: bbSqueeze ? "#f59e0b" : "#10b981" }}
              />
              <span className="text-xs font-semibold" style={{ color: bbSqueeze ? "#f59e0b" : "#10b981" }}>
                BB {bbSqueeze ? "Squeezed" : "Open"}
              </span>
            </div>
          )}

          {bb_width_pct != null && (
            <div className="flex justify-between text-2xs">
              <span className="text-text-muted">BB Width %ile</span>
              <span className="font-mono">{bb_width_pct.toFixed(0)}</span>
            </div>
          )}

          {rvol5 != null && (
            <div className="flex justify-between text-2xs">
              <span className="text-text-muted">Rel. Vol (5d)</span>
              <span
                className="font-mono font-semibold"
                style={{ color: rvol5 >= 1.5 ? "#f59e0b" : "#6b7280" }}
              >
                {rvol5.toFixed(2)}x
              </span>
            </div>
          )}

          {unusual_vol === 1 && (
            <div className="mt-1">
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-2xs font-semibold text-amber-400">
                Unusual Volume
              </span>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface AdvancedTabContentProps {
  ticker: string;
  signal: Signal | null;
  features: FeatureContext | null;
  currentPrice: number | null;
  taSignals: TASignalItem[];
  options: OptionsSnapshot | null;
}

export function AdvancedTabContent({
  ticker,
  features,
  currentPrice,
  taSignals,
  options,
}: AdvancedTabContentProps) {
  const hasContent =
    features != null || taSignals.length > 0 || options != null;

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No advanced data available for {ticker}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <ExpectedMoveSection
          currentPrice={currentPrice}
          features={features}
          options={options}
        />
        <MultiTimeframeSection taSignals={taSignals} />
        <VolatilitySection features={features} options={options} />
        <TechnicalSnapshotSection features={features} />
      </div>
    </div>
  );
}
