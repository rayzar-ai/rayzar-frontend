"use client";

/**
 * features/alerts/components/alerts-provider.tsx — RayZar Frontend
 * Polls the /api/v1/quote endpoint for each alert rule every 2 minutes.
 * Triggers alerts when pre/post-market moves exceed threshold.
 * Renders toast notifications for new alerts.
 */

import { useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAlertsStore } from "@/store/alerts-store";
import type { AlertRule } from "@/store/alerts-store";

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

// Track which rule+session combos already fired this session to avoid repeats
const _firedKeys = new Set<string>();

type AddTriggeredFn = (alert: Omit<import("@/store/alerts-store").TriggeredAlert, "id" | "read">) => void;

async function checkRule(rule: AlertRule, addTriggered: AddTriggeredFn) {
  try {
    const res = await apiClient.getQuote(rule.ticker);
    if (!res.success || !res.data) return;
    const q = res.data;

    const checks: { session: "pre" | "post" | "regular"; change_pct: number | null; price: number | null }[] = [
      { session: "pre",     change_pct: q.pre_market_change_pct,  price: q.pre_market_price },
      { session: "post",    change_pct: q.post_market_change_pct, price: q.post_market_price },
      { session: "regular", change_pct: q.change_pct,             price: q.price },
    ];

    for (const check of checks) {
      if (!rule.sessions.includes(check.session)) continue;
      if (check.change_pct === null || check.price === null) continue;
      if (Math.abs(check.change_pct) < rule.threshold_pct) continue;

      // Only fire once per rule+session per browser session
      const key = `${rule.id}:${check.session}:${new Date().toDateString()}`;
      if (_firedKeys.has(key)) continue;
      _firedKeys.add(key);

      addTriggered({
        ruleId: rule.id,
        ticker: rule.ticker,
        session: check.session,
        change_pct: check.change_pct,
        price: check.price,
        triggeredAt: Date.now(),
      });
    }
  } catch {
    // Silently ignore network errors during polling
  }
}

export function AlertsProvider() {
  const rules = useAlertsStore((s) => s.rules);
  const addTriggered = useAlertsStore((s) => s.addTriggered);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    if (rules.length === 0) return;
    await Promise.allSettled(rules.map((rule) => checkRule(rule, addTriggered)));
  }, [rules, addTriggered]);

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  return null; // no UI — just polling
}
