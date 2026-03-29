"use client";

import type { AuditLogEntry } from "@/lib/admin-client";
import { Download } from "lucide-react";

interface Props {
  entries: AuditLogEntry[];
}

export function DownloadLogButton({ entries }: Props) {
  function handleDownload() {
    const header = ["timestamp", "action", "actor", "target", "ip_address", "details"].join(",");
    const rows = entries.map((e) =>
      [
        e.created_at,
        e.action,
        e.actor,
        e.target ?? "",
        e.ip_address ?? "",
        e.details != null ? JSON.stringify(e.details).replace(/,/g, ";") : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rayzar-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 rounded border border-border bg-elevated px-2.5 py-1 text-xs text-text-secondary hover:text-accent-teal hover:border-accent-teal/40 transition-colors"
    >
      <Download className="h-3 w-3" />
      Download CSV
    </button>
  );
}
