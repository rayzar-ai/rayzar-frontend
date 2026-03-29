/**
 * lib/admin-client.ts — RayZar Frontend
 * Server-side fetch helpers for /admin endpoints.
 *
 * These functions run ONLY in Server Components (they use ADMIN_TOKEN,
 * a non-public env var, which is never sent to the browser).
 *
 * Set ADMIN_TOKEN in .env.local (same value as the backend's ADMIN_TOKEN).
 */

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

function adminHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Admin-Token": ADMIN_TOKEN,
  };
}

async function adminGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: adminHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminHealthData {
  api_status: string;
  db_status: string;
  environment: string;
  version: string;
  signal_stats: {
    total_signals: number;
    latest_signal_date: string | null;
    signals_by_class: Record<string, number>;
    signals_this_week: number;
  };
  cron: CronStatusData;
  timestamp: string;
}

export interface CronStatusData {
  last_run_date: string | null;
  last_run_signal_count: number;
  last_run_started_at: string | null;
  last_run_finished_at: string | null;
  status: "ok" | "stale" | "error" | "unknown";
  days_since_last_run?: number | null;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogData {
  entries: AuditLogEntry[];
  total: number;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

export async function fetchAdminHealth(): Promise<AdminHealthData | null> {
  return adminGet<AdminHealthData>("/admin/health");
}

export async function fetchCronStatus(): Promise<CronStatusData | null> {
  return adminGet<CronStatusData>("/admin/cron");
}

export async function fetchAuditLog(
  limit = 50,
  offset = 0,
): Promise<AuditLogData | null> {
  return adminGet<AuditLogData>(`/admin/audit-log?limit=${limit}&offset=${offset}`);
}
