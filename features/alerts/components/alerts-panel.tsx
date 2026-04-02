"use client";

/**
 * features/alerts/components/alerts-panel.tsx — RayZar Frontend
 * Slide-out panel for managing price alert rules and viewing history.
 */

import { useState } from "react";
import { useAlertsStore } from "@/store/alerts-store";
import type { AlertRule } from "@/store/alerts-store";

function sessionLabel(session: string): string {
  if (session === "pre")  return "Pre-Market";
  if (session === "post") return "After-Hours";
  return "Regular";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

interface AddRuleFormProps {
  onAdd: (ticker: string, threshold: number, sessions: AlertRule["sessions"]) => void;
}

function AddRuleForm({ onAdd }: AddRuleFormProps) {
  const [ticker, setTicker]       = useState("");
  const [threshold, setThreshold] = useState(3);
  const [sessions, setSessions]   = useState<AlertRule["sessions"]>(["pre", "post"]);

  function toggleSession(s: "pre" | "post" | "regular") {
    setSessions((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function handleAdd() {
    const t = ticker.trim().toUpperCase();
    if (!t || threshold <= 0 || sessions.length === 0) return;
    onAdd(t, threshold, sessions);
    setTicker("");
    setThreshold(3);
    setSessions(["pre", "post"]);
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-3 space-y-3">
      <p className="text-xs font-semibold text-text-secondary">New Alert Rule</p>

      {/* Ticker */}
      <div className="flex gap-2">
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker (e.g. AAPL)"
          className="flex-1 rounded border border-border bg-panel px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted outline-none focus:border-accent-teal/50"
          maxLength={8}
        />
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          min={0.5}
          max={30}
          step={0.5}
          title="Alert threshold (%)"
          className="w-16 rounded border border-border bg-panel px-2 py-1.5 text-xs font-mono text-text-primary outline-none focus:border-accent-teal/50 text-center"
        />
        <span className="flex items-center text-xs text-text-muted">%</span>
      </div>

      {/* Session toggles */}
      <div className="flex gap-1.5">
        {(["pre", "regular", "post"] as const).map((s) => (
          <button
            key={s}
            onClick={() => toggleSession(s)}
            className="rounded px-2 py-1 text-xs font-medium transition-all border"
            style={
              sessions.includes(s)
                ? { background: "rgba(0,212,170,0.12)", color: "var(--color-teal)", borderColor: "rgba(0,212,170,0.3)" }
                : { background: "transparent", color: "var(--color-text-muted)", borderColor: "var(--color-border)" }
            }
          >
            {sessionLabel(s)}
          </button>
        ))}
      </div>

      <button
        onClick={handleAdd}
        disabled={!ticker.trim() || sessions.length === 0}
        className="w-full rounded py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
        style={{ background: "rgba(0,212,170,0.15)", color: "var(--color-teal)", border: "1px solid rgba(0,212,170,0.3)" }}
      >
        + Add Alert
      </button>
    </div>
  );
}

interface AlertsPanelProps {
  onClose: () => void;
}

export function AlertsPanel({ onClose }: AlertsPanelProps) {
  const rules         = useAlertsStore((s) => s.rules);
  const triggered     = useAlertsStore((s) => s.triggered);
  const addRule       = useAlertsStore((s) => s.addRule);
  const removeRule    = useAlertsStore((s) => s.removeRule);
  const markAllRead   = useAlertsStore((s) => s.markAllRead);
  const clearTriggered = useAlertsStore((s) => s.clearTriggered);

  const [tab, setTab] = useState<"rules" | "history">("rules");

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-border shadow-2xl"
      style={{ background: "rgba(8,12,20,0.98)", backdropFilter: "blur(16px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">Price Alerts</span>
          {triggered.filter((t) => !t.read).length > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs font-bold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
            >
              {triggered.filter((t) => !t.read).length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors text-sm">
          ✕
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {(["rules", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "history") markAllRead(); }}
            className="flex-1 py-2 text-xs font-medium transition-colors"
            style={
              tab === t
                ? { color: "var(--color-teal)", borderBottom: "2px solid var(--color-teal)" }
                : { color: "var(--color-text-muted)" }
            }
          >
            {t === "rules" ? `Rules (${rules.length})` : `History (${triggered.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === "rules" && (
          <>
            <AddRuleForm onAdd={addRule} />

            {rules.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-6">
                No alert rules yet. Add one above.
              </p>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-sm font-bold text-text-primary">{rule.ticker}</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--color-teal)" }}>
                        ≥ {rule.threshold_pct}%
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {rule.sessions.map((s) => (
                        <span key={s} className="rounded border border-border bg-panel px-1 py-0.5 text-2xs text-text-muted">
                          {sessionLabel(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="text-text-muted hover:text-red-400 transition-colors text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {triggered.length > 0 && (
              <button
                onClick={clearTriggered}
                className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors text-right mb-1"
              >
                Clear all →
              </button>
            )}

            {triggered.length === 0 ? (
              <p className="text-center text-xs text-text-muted py-6">
                No alerts triggered yet. Polling runs every 2 minutes.
              </p>
            ) : (
              triggered.map((alert) => {
                const isUp = alert.change_pct >= 0;
                const color = isUp ? "#10b981" : "#ef4444";
                return (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-border bg-elevated px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-sm font-bold text-text-primary">{alert.ticker}</span>
                        <span className="text-xs text-text-muted">{sessionLabel(alert.session)}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold" style={{ color }}>
                        {isUp ? "+" : ""}{alert.change_pct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="font-mono text-xs text-text-secondary">
                        ${alert.price.toFixed(2)}
                      </span>
                      <span className="text-2xs text-text-muted">{formatTime(alert.triggeredAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Footer note */}
      <div className="border-t border-border px-3 py-2.5">
        <p className="text-2xs text-text-muted leading-relaxed">
          Polls every 2 min · Pre-market 4am–9:30am ET · After-hours 4pm–8pm ET
        </p>
      </div>
    </div>
  );
}
