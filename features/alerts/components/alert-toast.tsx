"use client";

/**
 * features/alerts/components/alert-toast.tsx — RayZar Frontend
 * Shows triggered price alerts as dismissible toasts.
 * Renders in a fixed corner, stacks up to 3.
 */

import { useEffect, useState } from "react";
import { useAlertsStore } from "@/store/alerts-store";
import type { TriggeredAlert } from "@/store/alerts-store";

function sessionLabel(session: TriggeredAlert["session"]): string {
  if (session === "pre")  return "Pre-Market";
  if (session === "post") return "After-Hours";
  return "Market";
}

function Toast({ alert, onDismiss }: { alert: TriggeredAlert; onDismiss: () => void }) {
  const isUp = alert.change_pct >= 0;
  const color = isUp ? "#10b981" : "#ef4444";

  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="flex items-start gap-3 rounded-lg border p-3 shadow-xl text-sm max-w-xs animate-in slide-in-from-right-5"
      style={{
        background: "rgba(13,17,23,0.97)",
        borderColor: `${color}40`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono font-bold text-text-primary">{alert.ticker}</span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {sessionLabel(alert.session)}
          </span>
        </div>
        <div className="mt-0.5 font-mono font-semibold" style={{ color }}>
          {alert.change_pct >= 0 ? "+" : ""}{alert.change_pct.toFixed(2)}%
          <span className="ml-2 text-xs font-normal text-text-secondary">
            ${alert.price.toFixed(2)}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-text-muted">
          Price alert triggered
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-secondary transition-colors text-xs shrink-0 mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}

export function AlertToastContainer() {
  const triggered = useAlertsStore((s) => s.triggered);
  const markAllRead = useAlertsStore((s) => s.markAllRead);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Show only unread + not dismissed, max 3
  const visible = triggered
    .filter((t) => !t.read && !dismissed.has(t.id))
    .slice(0, 3);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
    markAllRead();
  }

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2">
      {visible.map((alert) => (
        <Toast key={alert.id} alert={alert} onDismiss={() => dismiss(alert.id)} />
      ))}
    </div>
  );
}
