import { fetchAdminHealth } from "@/lib/admin-client";
import type { AdminHealthData } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import { QuickActions } from "./quick-actions";

export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: string }) {
  const ok = status === "healthy" || status === "connected" || status === "ok";
  const warn = status === "degraded" || status === "stale";
  const muted = status === "n/a" || status === "external" || status === "unknown";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ok    && "bg-signal-long/15 text-signal-long border border-signal-long/30",
        warn  && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        muted && "bg-border/30 text-text-muted border border-border",
        !ok && !warn && !muted && "bg-signal-short/15 text-signal-short border border-signal-short/30",
      )}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-text-primary font-mono">{value}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

export default async function AdminHealthPage() {
  const data: AdminHealthData | null = await fetchAdminHealth();

  if (!data) {
    return (
      <div className="rounded-lg border border-signal-short/30 bg-signal-short/10 p-6 text-center">
        <div className="text-sm font-semibold text-signal-short mb-1">Failed to load admin data</div>
        <div className="text-xs text-text-muted">
          Check that the backend is running and ADMIN_TOKEN is configured in .env.local
        </div>
      </div>
    );
  }

  const { signal_stats, cron } = data;
  const signalClasses = ["STRONG_LONG", "LONG", "NEUTRAL", "SHORT", "STRONG_SHORT"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-bold text-text-primary">Health Dashboard</h1>
        <p className="text-xs text-text-muted mt-1">
          Last refreshed: {new Date(data.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* System status */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          System
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs text-text-muted mb-2">API Status</div>
            <StatusPill status={data.api_status} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs text-text-muted mb-2">Database</div>
            <StatusPill status={data.db_status} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs text-text-muted mb-2">Environment</div>
            <span className="font-mono text-sm text-text-primary">{data.environment}</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs text-text-muted mb-2">Version</div>
            <span className="font-mono text-sm text-text-primary">v{data.version}</span>
          </div>
        </div>
      </section>

      {/* Component health pills */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Components
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "FastAPI",      status: data.api_status },
            { label: "PostgreSQL",   status: data.db_status },
            { label: "ML Pipeline",  status: cron.status },
            { label: "Redis",        status: "n/a" },
            { label: "EC2",          status: "ok" },
            { label: "Vercel",       status: "external" },
          ].map(({ label, status }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
            >
              <span className="text-xs text-text-muted">{label}</span>
              <StatusPill status={status} />
            </div>
          ))}
        </div>
      </section>

      {/* Signal stats */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Signals
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Signals"
            value={signal_stats.total_signals.toLocaleString()}
          />
          <StatCard
            label="This Week"
            value={signal_stats.signals_this_week.toLocaleString()}
            sub="Mon – today (UTC)"
          />
          <StatCard
            label="Latest Signal Date"
            value={signal_stats.latest_signal_date ?? "—"}
          />
          <StatCard
            label="Pipeline Status"
            value={<StatusPill status={cron.status} />}
            sub={cron.days_since_last_run != null
              ? `${cron.days_since_last_run} day(s) since last run`
              : undefined}
          />
        </div>

        {/* By class breakdown */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs text-text-muted mb-3">Signals by class (latest batch)</div>
          <div className="flex flex-wrap gap-3">
            {signalClasses.map((cls) => (
              <div key={cls} className="text-center min-w-[80px]">
                <div className="font-mono text-lg font-bold text-text-primary">
                  {(signal_stats.signals_by_class[cls] ?? 0).toLocaleString()}
                </div>
                <div className="text-2xs text-text-muted">{cls.replace("_", " ")}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cron detail */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Nightly Pipeline
        </h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
          {[
            { label: "Last run date",      value: cron.last_run_date ?? "—" },
            { label: "Signals in batch",   value: cron.last_run_signal_count.toString() },
            { label: "Batch started at",   value: cron.last_run_started_at ?? "—" },
            { label: "Batch finished at",  value: cron.last_run_finished_at ?? "—" },
            { label: "Days since run",     value: cron.days_since_last_run?.toString() ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-text-muted">{label}</span>
              <span className="font-mono text-sm text-text-primary">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
