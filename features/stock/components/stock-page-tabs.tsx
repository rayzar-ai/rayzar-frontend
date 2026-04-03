"use client";

/**
 * features/stock/components/stock-page-tabs.tsx — RayZar Frontend
 *
 * [Chart] [AI Chat] [Advanced] tab bar for the stock detail page.
 *
 * - Chart tab: renders children (the 4-pane WorkspaceLayout from page.tsx)
 * - AI Chat tab: active AI chat powered by Claude (MVP3)
 * - Advanced tab: placeholder shell with MVP3+ feature previews
 *
 * Accepts Server Component ReactNode as `chartContent` so the data
 * is fetched server-side and the tab switch is purely client-side.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  FlaskConical,
  MessageSquare,
  Layers,
  Zap,
  Lock,
} from "lucide-react";
import { AiChatPanel } from "./ai-chat-panel";
import { DebatePanel } from "./debate-panel";
import { ScenarioPanel } from "./scenario-panel";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "chart" | "ai_chat" | "debate" | "scenarios" | "advanced";

interface StockPageTabsProps {
  ticker: string;
  chartContent: React.ReactNode;
  advancedContent?: React.ReactNode;
  currentPrice?: number | null;
  signalClass?: string | null;
  hv20d?: number | null;
  atr14Pct?: number | null;
}

// ── Advanced tab placeholder ─────────────────────────────────────────────────

const ADVANCED_FEATURES = [
  {
    icon: BarChart2,
    title: "Backtester",
    description:
      "Run walk-forward backtests on any RayZar signal strategy. Customize entry/exit rules, position sizing, and risk parameters.",
    tag: "MVP3",
  },
  {
    icon: FlaskConical,
    title: "Scenario Builder",
    description:
      "Stress-test your thesis with Monte Carlo simulations and macro scenario overlays (rate shock, recession, earnings miss).",
    tag: "MVP3",
  },
  {
    icon: MessageSquare,
    title: "AI Copilot Chat",
    description:
      "Ask natural language questions about this stock. The AI has access to all signal data, TA analysis, fundamentals, and earnings history.",
    tag: "MVP3",
  },
  {
    icon: Layers,
    title: "Options Strategy Builder",
    description:
      "Build multi-leg options strategies with real-time P&L curves. Pre-loaded with RayZar's gamma walls and max pain levels.",
    tag: "MVP4",
  },
  {
    icon: Zap,
    title: "Real-time Alerts",
    description:
      "Set price, signal-change, and TA-trigger alerts. Push notifications via email, Slack, or Telegram.",
    tag: "MVP4",
  },
];

function AdvancedTabPlaceholder({ ticker }: { ticker: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-4 py-1.5">
            <Lock className="h-3.5 w-3.5 text-accent-teal" />
            <span className="text-xs font-semibold text-accent-teal tracking-wide">
              Coming in MVP3
            </span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">
            Advanced Analysis for{" "}
            <span className="font-mono text-accent-teal">{ticker}</span>
          </h2>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            The Advanced tab is your institutional-grade research workbench.
            Full backtesting, AI-powered analysis, and options strategy
            tooling — all in one place.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {ADVANCED_FEATURES.map(({ icon: Icon, title, description, tag }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent-teal/30"
            >
              {/* Tag pill */}
              <div className="absolute top-3 right-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-2xs font-semibold border",
                    tag === "MVP3"
                      ? "bg-accent-teal/10 text-accent-teal border-accent-teal/30"
                      : "bg-elevated text-text-muted border-border"
                  )}
                >
                  {tag}
                </span>
              </div>

              {/* Icon */}
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-elevated">
                <Icon className="h-4.5 w-4.5 text-text-secondary group-hover:text-accent-teal transition-colors" />
              </div>

              <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-text-muted">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline CTA */}
        <div className="rounded-xl border border-dashed border-border bg-panel p-6 text-center space-y-3">
          <p className="text-xs text-text-muted">
            MVP3 is planned after MVP2 launch. The Chart tab above has all
            the analysis you need right now — EMA cloud, VWAP, S/R levels,
            gamma walls, Fibonacci, and 7 sub-chart indicators.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-signal-long" />
              MVP2 — Live now
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-teal" />
              MVP3 — Backtester + AI Chat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-border" />
              MVP4 — Options + Alerts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab bar + switcher ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; badge?: string }[] = [
  { id: "chart",     label: "Chart" },
  { id: "ai_chat",   label: "AI Chat" },
  { id: "debate",    label: "Debate",    badge: "NEW" },
  { id: "scenarios", label: "Scenarios", badge: "NEW" },
  { id: "advanced",  label: "Advanced" },
];

export function StockPageTabs({
  ticker,
  chartContent,
  advancedContent,
  currentPrice,
  signalClass,
  hv20d,
  atr14Pct,
}: StockPageTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chart");

  return (
    <>
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-border bg-panel/80">
        <div className="flex items-center gap-0 px-4">
          {TABS.map(({ id, label, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "relative px-4 py-2.5 text-xs font-semibold transition-colors",
                activeTab === id
                  ? "text-accent-teal"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {label}
              {/* Active underline */}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-teal rounded-t-full" />
              )}
              {/* Badge */}
              {badge && (
                <span className={cn(
                  "ml-1.5 rounded px-1 py-0.5 text-2xs font-semibold",
                  badge === "NEW"
                    ? "bg-signal-long/20 text-signal-long"
                    : "bg-accent-teal/15 text-accent-teal"
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        <div className={cn("h-full", activeTab !== "chart" && "hidden")}>
          {chartContent}
        </div>
        {activeTab === "ai_chat" && (
          <div className="h-full overflow-y-auto p-4">
            <div className="mx-auto max-w-2xl h-full flex flex-col">
              <AiChatPanel ticker={ticker} />
            </div>
          </div>
        )}
        {activeTab === "debate" && (
          <div className="h-full overflow-y-auto">
            <DebatePanel ticker={ticker} />
          </div>
        )}
        {activeTab === "scenarios" && (
          <ScenarioPanel
            ticker={ticker}
            currentPrice={currentPrice}
            signalClass={signalClass}
            hv20d={hv20d}
            atr14Pct={atr14Pct}
          />
        )}
        {activeTab === "advanced" && (
          advancedContent ?? <AdvancedTabPlaceholder ticker={ticker} />
        )}
      </div>
    </>
  );
}
