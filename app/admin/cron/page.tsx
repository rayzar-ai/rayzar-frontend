import { fetchCronStatus } from "@/lib/admin-client";
import type { CronStatusData } from "@/lib/admin-client";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  CronStatusData["status"],
  { label: string; cls: string; description: string }
> = {
  ok: {
    label: "OK",
    cls: "bg-signal-long/15 text-signal-long border-signal-long/30",
    description: "Signals were generated within the last 24 hours.",
  },
  stale: {
    label: "STALE",
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    description: "Last signals are 1–3 days old. Check if the nightly cron ran.",
  },
  error: {
    label: "ERROR",
    cls: "bg-signal-short/15 text-signal-short border-signal-short/30",
    description: "No signals generated in 3+ days. Nightly pipeline likely failed.",
  },
  unknown: {
    label: "UNKNOWN",
    cls: "bg-border/30 text-text-muted border-border",
    description: "No signal data found in the database.",
  },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span className="font-mono text-sm text-text-primary text-right break-all">{value}</span>
    </div>
  );
}

export default async function AdminCronPage() {
  const data: CronStatusData | null = await fetchCronStatus();

  if (!data) {
    return (
      <div className="rounded-lg border border-signal-short/30 bg-signal-short/10 p-6 text-center">
        <div className="text-sm font-semibold text-signal-short mb-1">Failed to load cron data</div>
        <div className="text-xs text-text-muted">
          Ensure the backend is running and ADMIN_TOKEN is set.
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[data.status];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-bold text-text-primary">Cron Monitor</h1>
        <p className="text-xs text-text-muted mt-1">
          Nightly ML pipeline status inferred from the signals table.
        </p>
      </div>

      {/* Status banner */}
      <div
        className={cn(
          "flex items-start gap-4 rounded-lg border p-5",
          cfg.cls,
        )}
      >
        <div className="shrink-0">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-xs font-bold border",
              cfg.cls,
            )}
          >
            {cfg.label}
          </span>
        </div>
        <div>
          <div className="text-sm font-semibold mb-0.5">{cfg.description}</div>
          {data.days_since_last_run != null && (
            <div className="text-xs opacity-80">
              {data.days_since_last_run === 0
                ? "Ran today."
                : `Last run: ${data.days_since_last_run} day(s) ago.`}
            </div>
          )}
        </div>
      </div>

      {/* Details table */}
      <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
        <Row label="Last run date"       value={data.last_run_date ?? "—"} />
        <Row label="Signals in batch"    value={data.last_run_signal_count.toString()} />
        <Row label="Batch started at"    value={data.last_run_started_at ?? "—"} />
        <Row label="Batch finished at"   value={data.last_run_finished_at ?? "—"} />
        <Row label="Days since last run" value={data.days_since_last_run?.toString() ?? "—"} />
      </div>

      {/* Help text */}
      <div className="rounded-lg border border-border bg-panel p-4 text-xs text-text-muted space-y-1">
        <div className="font-semibold text-text-secondary">How this works</div>
        <p>
          The nightly pipeline runs on the owner&apos;s Mac: IBKR TWS → download_data.py →
          ML pipeline → db_writer.py → RDS. This monitor infers run status from signal
          <code className="mx-1 font-mono bg-elevated px-1 rounded">created_at</code>
          timestamps — it does not connect to the Mac directly.
        </p>
        <p>
          Status thresholds: <strong>ok</strong> ≤1 day ·{" "}
          <strong>stale</strong> 1–3 days · <strong>error</strong> &gt;3 days.
        </p>
      </div>
    </div>
  );
}
