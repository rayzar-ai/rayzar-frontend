"use client";

/**
 * features/fundamentals/components/fundamentals-panel.tsx
 * Displays fundamental data for a stock: valuation, analyst ratings,
 * earnings countdown, 52-week range, and sector/industry.
 */

import { Fundamentals } from "@/lib/api-client";

interface Props {
  data: Fundamentals;
  currentPrice?: number;
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtLarge(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function earningsCountdown(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0)  return `${Math.abs(diff)}d ago`;
  if (diff === 0) return "Today";
  return `in ${diff}d`;
}

function analystBar(buy: number | null, hold: number | null, sell: number | null) {
  const b = buy ?? 0;
  const h = hold ?? 0;
  const s = sell ?? 0;
  const total = b + h + s;
  if (total === 0) return null;
  const buyPct  = Math.round((b / total) * 100);
  const holdPct = Math.round((h / total) * 100);
  const sellPct = 100 - buyPct - holdPct;
  return { buyPct, holdPct, sellPct, b, h, s };
}

interface RowProps { label: string; value: string; highlight?: boolean }
function Row({ label, value, highlight }: RowProps) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-medium ${highlight ? "text-emerald-400" : "text-gray-200"}`}>
        {value}
      </span>
    </div>
  );
}

export function FundamentalsPanel({ data, currentPrice }: Props) {
  const bar = analystBar(data.analyst_buy, data.analyst_hold, data.analyst_sell);
  const upside = currentPrice && data.analyst_target
    ? ((data.analyst_target - currentPrice) / currentPrice) * 100
    : null;

  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0f0f0f] overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Fundamentals
          </h3>
          {data.sector && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{data.sector}</span>
              {data.industry && (
                <span className="text-xs text-gray-700">· {data.industry}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a]">

        {/* Valuation */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Valuation</p>
          <Row label="Market Cap"    value={fmtLarge(data.market_cap)} />
          <Row label="P/E (TTM)"     value={fmt(data.pe_ratio, 1)} />
          <Row label="P/B"           value={fmt(data.pb_ratio, 1)} />
          <Row label="P/S"           value={fmt(data.ps_ratio, 1)} />
          <Row label="EPS (TTM)"     value={data.eps_ttm != null ? `$${fmt(data.eps_ttm)}` : "—"} />
          <Row label="Revenue (TTM)" value={fmtLarge(data.revenue_ttm)} />
          <Row label="Profit Margin" value={fmtPct(data.profit_margin)} />
        </div>

        {/* Analyst & Earnings */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Analyst Consensus</p>
          {data.analyst_target && (
            <Row
              label="Price Target"
              value={`$${fmt(data.analyst_target)} ${upside != null ? `(${upside > 0 ? "+" : ""}${upside.toFixed(1)}%)` : ""}`}
              highlight={upside != null && upside > 0}
            />
          )}

          {bar && (
            <div className="mt-2 mb-3">
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                <div className="bg-emerald-500 transition-all" style={{ width: `${bar.buyPct}%` }} />
                <div className="bg-yellow-500 transition-all" style={{ width: `${bar.holdPct}%` }} />
                <div className="bg-red-500 transition-all"    style={{ width: `${bar.sellPct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span className="text-emerald-400">{bar.b} Buy</span>
                <span className="text-yellow-400">{bar.h} Hold</span>
                <span className="text-red-400">{bar.s} Sell</span>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 mt-3">Earnings</p>
          <Row label="Next Earnings" value={data.earnings_date
            ? `${data.earnings_date} (${earningsCountdown(data.earnings_date)})`
            : "—"
          } />
          <Row label="Dividend Yield" value={data.dividend_yield ? fmtPct(data.dividend_yield) : "—"} />
        </div>

        {/* Risk & Range */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Risk & Range</p>
          <Row label="Beta"          value={fmt(data.beta)} />
          <Row label="Short Float"   value={data.short_float != null ? fmtPct(data.short_float) : "—"} />
          <Row label="Short Ratio"   value={fmt(data.short_ratio, 1)} />
          <Row label="52W High"      value={data.week_52_high != null ? `$${fmt(data.week_52_high)}` : "—"} />
          <Row label="52W Low"       value={data.week_52_low  != null ? `$${fmt(data.week_52_low)}`  : "—"} />

          {/* 52W range bar */}
          {data.week_52_high && data.week_52_low && currentPrice && (
            <div className="mt-3">
              <div className="relative h-1.5 bg-[#1a1a1a] rounded-full">
                <div
                  className="absolute h-1.5 bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0,
                      ((currentPrice - data.week_52_low) /
                       (data.week_52_high - data.week_52_low)) * 100
                    ))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>${fmt(data.week_52_low)}</span>
                <span className="text-blue-400">${fmt(currentPrice)}</span>
                <span>${fmt(data.week_52_high)}</span>
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-700 mt-3">
            Data: {data.data_date} · yfinance
          </p>
        </div>
      </div>
    </div>
  );
}
