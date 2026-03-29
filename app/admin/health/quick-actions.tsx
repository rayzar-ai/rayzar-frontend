"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, RefreshCw, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type PingStatus = "idle" | "loading" | "success" | "error";

export function QuickActions() {
  const [status, setStatus] = useState<PingStatus>("idle");
  const [message, setMessage] = useState<string>("");

  async function handlePipelinePing() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/pipeline-ping", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setMessage(json?.data?.message ?? "Pipeline ping sent successfully");
      } else {
        setStatus("error");
        setMessage(json?.error ?? json?.detail ?? "Ping failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error — check that the backend is reachable");
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handlePipelinePing}
          disabled={status === "loading"}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            status === "success"
              ? "border-signal-long/40 bg-signal-long/10 text-signal-long"
              : status === "error"
              ? "border-signal-short/40 bg-signal-short/10 text-signal-short"
              : "border-border bg-elevated text-text-secondary hover:border-accent-teal/40 hover:text-accent-teal",
          )}
        >
          {status === "loading"
            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            : <Play className="h-3.5 w-3.5" />
          }
          {status === "loading"
            ? "Sending…"
            : status === "success"
            ? "Pinged!"
            : status === "error"
            ? "Failed — retry"
            : "Ping Pipeline"}
        </button>

        <Link
          href="/admin/logs"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2 text-xs font-semibold text-text-secondary hover:border-accent-teal/40 hover:text-accent-teal transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          View Audit Log
        </Link>
      </div>

      {message && (
        <p className={cn(
          "text-xs",
          status === "success" ? "text-signal-long" : "text-signal-short",
        )}>
          {message}
        </p>
      )}
    </section>
  );
}
