/**
 * store/alerts-store.ts — RayZar Frontend
 * Price alert management with localStorage persistence.
 *
 * Alert rules: user-defined (ticker + threshold %).
 * Triggered alerts: when a pre/post-market move exceeds the threshold.
 *
 * Polling is handled by the AlertsProvider component.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AlertRule {
  id: string;
  ticker: string;
  threshold_pct: number;   // e.g. 3 = alert when |change| >= 3%
  sessions: ("pre" | "post" | "regular")[];  // which sessions to watch
  createdAt: number;
}

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  ticker: string;
  session: "pre" | "post" | "regular";
  change_pct: number;
  price: number;
  triggeredAt: number;
  read: boolean;
}

interface AlertsState {
  rules: AlertRule[];
  triggered: TriggeredAlert[];
  addRule: (ticker: string, threshold_pct: number, sessions: AlertRule["sessions"]) => void;
  removeRule: (id: string) => void;
  addTriggered: (alert: Omit<TriggeredAlert, "id" | "read">) => void;
  markAllRead: () => void;
  clearTriggered: () => void;
  unreadCount: () => number;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      rules: [],
      triggered: [],

      addRule: (ticker, threshold_pct, sessions) => {
        const rule: AlertRule = {
          id: `${ticker}-${Date.now()}`,
          ticker: ticker.toUpperCase(),
          threshold_pct,
          sessions,
          createdAt: Date.now(),
        };
        set((s) => ({ rules: [...s.rules, rule] }));
      },

      removeRule: (id) => {
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
      },

      addTriggered: (alert) => {
        const triggered: TriggeredAlert = {
          ...alert,
          id: `triggered-${Date.now()}-${Math.random()}`,
          read: false,
        };
        // Keep only last 50 triggered alerts
        set((s) => ({
          triggered: [triggered, ...s.triggered].slice(0, 50),
        }));
      },

      markAllRead: () => {
        set((s) => ({
          triggered: s.triggered.map((t) => ({ ...t, read: true })),
        }));
      },

      clearTriggered: () => set({ triggered: [] }),

      unreadCount: () => get().triggered.filter((t) => !t.read).length,
    }),
    {
      name: "rayzar-alerts",
      partialize: (s) => ({ rules: s.rules, triggered: s.triggered }),
    },
  ),
);
