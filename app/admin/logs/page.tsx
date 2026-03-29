import { fetchAuditLog } from "@/lib/admin-client";
import type { AuditLogEntry } from "@/lib/admin-client";
import { DownloadLogButton } from "./download-log-button";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
}

function LogRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <tr className="border-b border-border/50 hover:bg-elevated/40 transition-colors">
      <td className="px-4 py-3 text-xs text-text-muted font-mono whitespace-nowrap">
        {formatDate(entry.created_at)}
      </td>
      <td className="px-4 py-3">
        <span className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-2xs text-text-secondary">
          {entry.action}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-text-secondary font-mono">{entry.actor}</td>
      <td className="px-4 py-3 text-xs text-text-muted">{entry.target ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-text-muted">{entry.ip_address ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-text-muted max-w-[200px] truncate">
        {entry.details != null ? JSON.stringify(entry.details) : "—"}
      </td>
    </tr>
  );
}

export default async function AdminLogsPage() {
  const data = await fetchAuditLog(50, 0);

  if (!data) {
    return (
      <div className="rounded-lg border border-signal-short/30 bg-signal-short/10 p-6 text-center">
        <div className="text-sm font-semibold text-signal-short mb-1">Failed to load audit log</div>
        <div className="text-xs text-text-muted">
          Ensure the backend is running and ADMIN_TOKEN is set.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Audit Log</h1>
          <p className="text-xs text-text-muted mt-1">
            Admin action history — append-only, ordered most-recent first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{data.total} total entries</span>
          <DownloadLogButton entries={data.entries} />
        </div>
      </div>

      {data.entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-20 text-center">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="text-sm font-semibold text-text-primary">No audit log entries yet</h3>
          <p className="mt-1 text-xs text-text-muted">
            Admin actions will appear here as they are performed.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted whitespace-nowrap">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Actor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    IP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <LogRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
