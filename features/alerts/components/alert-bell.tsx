"use client";

/**
 * features/alerts/components/alert-bell.tsx — RayZar Frontend
 * Bell icon button for the navbar that opens the alerts panel.
 * Shows an unread badge count when alerts are triggered.
 */

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAlertsStore } from "@/store/alerts-store";
import { AlertsPanel } from "./alerts-panel";
import { AlertsProvider } from "./alerts-provider";
import { AlertToastContainer } from "./alert-toast";

export function AlertBell() {
  const [open, setOpen] = useState(false);
  const unread = useAlertsStore((s) => s.unreadCount());

  return (
    <>
      {/* Background polling */}
      <AlertsProvider />

      {/* Toast notifications */}
      <AlertToastContainer />

      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/5"
        title="Price Alerts"
      >
        <Bell className="h-4 w-4 text-text-muted" />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-0.5 text-[10px] font-bold"
            style={{ background: "#ef4444", color: "#fff" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <AlertsPanel onClose={() => setOpen(false)} />
        </>
      )}
    </>
  );
}
