"use client";

/**
 * features/stock/components/debate-panel.tsx — RayZar Frontend
 *
 * Institutional-grade multi-agent debate UI.
 * Streams 10-agent, 3-round debate via SSE and renders live.
 *
 * Layout:
 *   - Status bar (crisis mode, round progress)
 *   - Round 1: 2×3 grid of specialist agent cards
 *   - Round 2: 3 cross-examination cards (DA, Risk Manager, Pre-Mortem)
 *   - Round 3: Judge verdict panel (full-width)
 */

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart2, TrendingUp, DollarSign, Layers,
  Globe, MessageSquare, AlertTriangle, Shield,
  Clock, Gavel, Play, Loader2, Zap
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentName =
  | "quant" | "technical" | "fundamental" | "options" | "macro" | "sentiment"
  | "devils_advocate" | "risk_manager" | "pre_mortem";

type RoundNum = 1 | 2 | 3;

interface AgentOutput {
  content: string;
  round: RoundNum;
}

interface Verdict {
  verdict: "PROCEED" | "PROCEED_WITH_CAUTION" | "INVESTIGATE" | "AVOID";
  summary: string;
  bull_probability: number;
  base_probability: number;
  bear_probability: number;
  expected_value: number;
  kelly_size: number;
  confidence: number;
  agents_in_favour: number;
  agents_against: number;
  veto_triggered: boolean;
  veto_agent: string | null;
  invalidation_conditions: Record<string, string>;
  action_items: string[];
}

interface DebateState {
  status: "idle" | "running" | "complete" | "error";
  currentRound: RoundNum | null;
  crisisMode: boolean;
  agents: Partial<Record<AgentName, AgentOutput>>;
  veto: { triggered: boolean; agent: string | null };
  verdict: Verdict | null;
  debateId: string | null;
  errorMsg: string | null;
  statusMsg: string;
}

// ── Agent metadata ─────────────────────────────────────────────────────────────

const AGENT_META: Record<AgentName, { label: string; icon: React.ElementType; round: RoundNum }> = {
  quant:           { label: "Quant",            icon: BarChart2,      round: 1 },
  technical:       { label: "Technical",         icon: TrendingUp,     round: 1 },
  fundamental:     { label: "Fundamental",       icon: DollarSign,     round: 1 },
  options:         { label: "Options",           icon: Layers,         round: 1 },
  macro:           { label: "Macro / Regime",    icon: Globe,          round: 1 },
  sentiment:       { label: "Sentiment",         icon: MessageSquare,  round: 1 },
  devils_advocate: { label: "Devil's Advocate",  icon: AlertTriangle,  round: 2 },
  risk_manager:    { label: "Risk Manager",      icon: Shield,         round: 2 },
  pre_mortem:      { label: "Pre-Mortem",        icon: Clock,          round: 2 },
};

const ROUND1_AGENTS: AgentName[] = ["quant", "technical", "fundamental", "options", "macro", "sentiment"];
const ROUND2_AGENTS: AgentName[] = ["devils_advocate", "risk_manager", "pre_mortem"];

// ── Verdict styling ───────────────────────────────────────────────────────────

const VERDICT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  PROCEED:               { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "PROCEED" },
  PROCEED_WITH_CAUTION:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "PROCEED WITH CAUTION" },
  INVESTIGATE:           { color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "INVESTIGATE" },
  AVOID:                 { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "AVOID" },
};

// ── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  output,
  isLoading,
  vetoAgent,
}: {
  agent: AgentName;
  output: AgentOutput | undefined;
  isLoading: boolean;
  vetoAgent: string | null;
}) {
  const meta = AGENT_META[agent];
  const Icon = meta.icon;
  const isVetoAgent = ["risk_manager", "pre_mortem"].includes(agent);
  const isVetoed = vetoAgent === agent;

  const borderColor = isVetoed
    ? "#ef4444"
    : output
    ? agent === "devils_advocate" ? "#f59e0b" : "rgba(20,184,166,0.3)"
    : "rgba(255,255,255,0.06)";

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-300"
      style={{
        background: "rgba(13,17,23,0.8)",
        borderColor,
        boxShadow: isVetoed ? "0 0 12px rgba(239,68,68,0.15)" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: isVetoed
                ? "rgba(239,68,68,0.15)"
                : output
                ? "rgba(20,184,166,0.12)"
                : "rgba(255,255,255,0.05)",
            }}
          >
            <Icon
              className="h-3.5 w-3.5"
              style={{ color: isVetoed ? "#ef4444" : output ? "var(--color-teal)" : "#6b7280" }}
            />
          </div>
          <span className="text-xs font-semibold text-text-secondary">{meta.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isVetoAgent && (
            <span className="rounded px-1.5 py-0.5 text-2xs font-bold"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              VETO
            </span>
          )}
          {isLoading && !output && (
            <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
          )}
          {isVetoed && (
            <span className="rounded px-1.5 py-0.5 text-2xs font-bold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
              ⚠ VETOED
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-xs leading-relaxed text-text-secondary min-h-[60px]">
        {output ? (
          <p className="whitespace-pre-line">{output.content}</p>
        ) : isLoading ? (
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-2 w-5/6 rounded bg-white/5 animate-pulse" />
            <div className="h-2 w-4/6 rounded bg-white/5 animate-pulse" />
          </div>
        ) : (
          <span className="text-text-muted italic">Waiting...</span>
        )}
      </div>
    </div>
  );
}

// ── Judge Verdict Panel ───────────────────────────────────────────────────────

function JudgePanel({ verdict, loading }: { verdict: Verdict | null; loading: boolean }) {
  if (loading && !verdict) {
    return (
      <div className="rounded-xl border border-border p-6 animate-pulse"
        style={{ background: "rgba(13,17,23,0.8)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Gavel className="h-5 w-5 text-text-muted" />
          <span className="font-semibold text-text-secondary">Judge Deliberating...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-3 rounded bg-white/5" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!verdict) return null;

  const style = VERDICT_STYLE[verdict.verdict] ?? VERDICT_STYLE.INVESTIGATE;
  const totalPct = verdict.bull_probability + verdict.base_probability + verdict.bear_probability;
  const bullPct = Math.round((verdict.bull_probability / (totalPct || 1)) * 100);
  const basePct = Math.round((verdict.base_probability / (totalPct || 1)) * 100);
  const bearPct = 100 - bullPct - basePct;

  return (
    <div
      className="rounded-xl border p-6 space-y-5"
      style={{
        background: "rgba(13,17,23,0.95)",
        borderColor: style.color + "50",
        boxShadow: `0 0 24px ${style.color}10`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: style.bg }}>
            <Gavel className="h-4.5 w-4.5" style={{ color: style.color }} />
          </div>
          <div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Judge&apos;s Verdict</div>
            <div className="text-lg font-bold font-mono" style={{ color: style.color }}>
              {style.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {verdict.veto_triggered && (
            <span className="rounded-lg px-2.5 py-1 text-xs font-bold border"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }}>
              ⚠ VETO by {verdict.veto_agent?.replace("_", " ").toUpperCase()}
            </span>
          )}
          <div className="text-right">
            <div className="text-2xs text-text-muted">Confidence</div>
            <div className="font-mono text-sm font-bold text-text-primary">
              {Math.round((verdict.confidence ?? 0) * 100)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xs text-text-muted">Consensus</div>
            <div className="font-mono text-sm font-bold text-text-primary">
              {verdict.agents_in_favour}/{(verdict.agents_in_favour ?? 0) + (verdict.agents_against ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-text-secondary leading-relaxed">{verdict.summary}</p>

      {/* Scenario probabilities */}
      <div className="space-y-2">
        <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Scenario Probabilities</div>
        <div className="flex rounded-lg overflow-hidden h-6">
          <div className="flex items-center justify-center text-2xs font-bold text-white"
            style={{ width: `${bullPct}%`, background: "#10b981" }}>
            {bullPct}%
          </div>
          <div className="flex items-center justify-center text-2xs font-bold text-white"
            style={{ width: `${basePct}%`, background: "#6366f1" }}>
            {basePct}%
          </div>
          <div className="flex items-center justify-center text-2xs font-bold text-white"
            style={{ width: `${bearPct}%`, background: "#ef4444" }}>
            {bearPct}%
          </div>
        </div>
        <div className="flex justify-between text-2xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#10b981] inline-block" /> Bull
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#6366f1] inline-block" /> Base
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#ef4444] inline-block" /> Bear
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Expected Value", value: `${verdict.expected_value >= 0 ? "+" : ""}${verdict.expected_value?.toFixed(1)}%` },
          { label: "Kelly Size", value: `${((verdict.kelly_size ?? 0) * 100).toFixed(1)}%` },
          { label: "Bull Case", value: `${bullPct}%` },
          { label: "Bear Case", value: `${bearPct}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-elevated px-3 py-2">
            <div className="text-2xs text-text-muted">{label}</div>
            <div className="font-mono text-sm font-semibold text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* Action items */}
      {verdict.action_items?.length > 0 && (
        <div className="space-y-2">
          <div className="text-2xs font-semibold uppercase tracking-wider text-text-muted">Action Items</div>
          <ul className="space-y-1">
            {verdict.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="mt-0.5 h-4 w-4 rounded-full text-2xs font-bold flex items-center justify-center shrink-0"
                  style={{ background: style.bg, color: style.color }}>
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invalidation conditions */}
      {verdict.invalidation_conditions && Object.keys(verdict.invalidation_conditions).length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-2xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors">
            Invalidation Conditions ▸
          </summary>
          <div className="mt-2 space-y-1">
            {Object.entries(verdict.invalidation_conditions).map(([agent, cond]) => (
              <div key={agent} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 font-mono text-text-muted capitalize w-20">{agent.replace("_", " ")}:</span>
                <span className="text-text-secondary">{cond}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ── Main Debate Panel ─────────────────────────────────────────────────────────

interface DebatePanelProps {
  ticker: string;
}

export function DebatePanel({ ticker }: DebatePanelProps) {
  const [state, setState] = useState<DebateState>({
    status: "idle",
    currentRound: null,
    crisisMode: false,
    agents: {},
    veto: { triggered: false, agent: null },
    verdict: null,
    debateId: null,
    errorMsg: null,
    statusMsg: "",
  });

  const abortRef = useRef<AbortController | null>(null);

  const startDebate = useCallback(async () => {
    if (state.status === "running") return;

    // Reset state
    setState({
      status: "running",
      currentRound: null,
      crisisMode: false,
      agents: {},
      veto: { triggered: false, agent: null },
      verdict: null,
      debateId: null,
      errorMsg: null,
      statusMsg: "Initialising debate...",
    });

    abortRef.current = new AbortController();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? "";

      const res = await fetch(`${apiUrl}/api/v1/debate/${ticker}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
        },
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setState(s => ({ ...s, status: "error", errorMsg: `HTTP ${res.status}` }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);
            handleEvent(event);
          } catch {
            // malformed event — skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState(s => ({ ...s, status: "error", errorMsg: String(err) }));
    }
  }, [ticker, state.status]);

  function handleEvent(event: Record<string, unknown>) {
    setState(s => {
      switch (event.type) {
        case "status":
          return { ...s, statusMsg: event.message as string };

        case "crisis_mode":
          return { ...s, crisisMode: true, statusMsg: event.message as string };

        case "round_start":
          return { ...s, currentRound: event.round as RoundNum, statusMsg: event.message as string };

        case "agent_complete":
          return {
            ...s,
            agents: {
              ...s.agents,
              [event.agent as AgentName]: {
                content: event.content as string,
                round: event.round as RoundNum,
              },
            },
          };

        case "veto":
          return {
            ...s,
            veto: { triggered: true, agent: event.agent as string },
          };

        case "verdict":
          return { ...s, verdict: event.content as Verdict };

        case "complete":
          return { ...s, status: "complete", debateId: event.debate_id as string | null };

        case "error":
          return { ...s, status: "error", errorMsg: event.message as string };

        case "stream_end":
          return { ...s, status: s.status === "running" ? "complete" : s.status };

        default:
          return s;
      }
    });
  }

  const isRunning = state.status === "running";
  const r1Done = ROUND1_AGENTS.every(a => !!state.agents[a]);
  const r2Done = ROUND2_AGENTS.every(a => !!state.agents[a]);

  return (
    <div className="space-y-6 p-4">
      {/* Header + Run button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Gavel className="h-4 w-4" style={{ color: "var(--color-teal)" }} />
            Multi-Agent Debate
            <span className="font-mono text-accent-teal">{ticker}</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            10 agents · 3 rounds · institutional-grade analysis
          </p>
        </div>

        <button
          onClick={startDebate}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            isRunning
              ? "opacity-60 cursor-not-allowed bg-elevated text-text-muted"
              : "bg-accent-teal text-background hover:opacity-90 active:scale-95"
          )}
        >
          {isRunning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Debating...</>
          ) : (
            <><Play className="h-4 w-4" /> Run Debate</>
          )}
        </button>
      </div>

      {/* Crisis mode banner */}
      {state.crisisMode && (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
          <Zap className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
          <div>
            <div className="text-sm font-bold" style={{ color: "#ef4444" }}>
              Extreme Market Protocol Active
            </div>
            <div className="text-xs text-text-muted">
              VIX elevated or large gap detected — all agents in crisis mode, veto threshold lowered
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {isRunning && state.statusMsg && (
        <div className="text-xs text-text-muted flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          {state.statusMsg}
        </div>
      )}

      {/* Idle state */}
      {state.status === "idle" && (
        <div className="rounded-xl border border-border bg-panel py-16 text-center">
          <Gavel className="h-8 w-8 mx-auto mb-3 text-text-muted" />
          <p className="text-sm text-text-muted">Press Run Debate to start the 10-agent analysis</p>
          <p className="text-xs text-text-muted mt-1 opacity-60">Takes 30–60 seconds · requires Anthropic API</p>
        </div>
      )}

      {/* Error state */}
      {state.status === "error" && (
        <div className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
          Debate failed: {state.errorMsg}
        </div>
      )}

      {/* Round 1 */}
      {(isRunning || state.status === "complete") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: r1Done ? "rgba(16,185,129,0.2)" : "rgba(20,184,166,0.15)", color: r1Done ? "#10b981" : "var(--color-teal)" }}>
              1
            </div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Specialist Analyses
            </span>
            {state.currentRound === 1 && !r1Done && (
              <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROUND1_AGENTS.map(agent => (
              <AgentCard
                key={agent}
                agent={agent}
                output={state.agents[agent]}
                isLoading={isRunning && !state.agents[agent]}
                vetoAgent={null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Round 2 */}
      {(r1Done || state.status === "complete") && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: r2Done ? "rgba(16,185,129,0.2)" : "rgba(20,184,166,0.15)", color: r2Done ? "#10b981" : "var(--color-teal)" }}>
              2
            </div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Cross-Examination
            </span>
            {state.currentRound === 2 && !r2Done && (
              <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROUND2_AGENTS.map(agent => (
              <AgentCard
                key={agent}
                agent={agent}
                output={state.agents[agent]}
                isLoading={isRunning && !state.agents[agent]}
                vetoAgent={state.veto.triggered ? state.veto.agent : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Round 3 — Judge */}
      {(r2Done || state.verdict) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: state.verdict ? "rgba(16,185,129,0.2)" : "rgba(20,184,166,0.15)", color: state.verdict ? "#10b981" : "var(--color-teal)" }}>
              3
            </div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Judge&apos;s Verdict
            </span>
          </div>
          <JudgePanel verdict={state.verdict} loading={isRunning && !state.verdict} />
        </div>
      )}

      {/* Debate ID */}
      {state.debateId && (
        <p className="text-2xs text-text-muted text-right font-mono">
          Debate ID: {state.debateId}
        </p>
      )}
    </div>
  );
}
