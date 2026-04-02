"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export function AddPositionForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [ticker, setTicker]         = useState("");
  const [qty, setQty]               = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [entryDate, setEntryDate]   = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = ticker.trim().toUpperCase();
    if (!t || !qty || !entryPrice) return;

    setSubmitting(true);
    try {
      const res = await apiClient.addPosition({
        ticker: t,
        quantity: parseFloat(qty),
        entry_price: parseFloat(entryPrice),
        entry_date: entryDate,
        notes: notes.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error?.message ?? "Failed to add position.");
        return;
      }
      setTicker(""); setQty(""); setEntryPrice(""); setNotes("");
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-panel px-5 py-4 space-y-3"
    >
      <p className="text-xs font-semibold text-text-secondary">Add Position</p>

      <div className="flex flex-wrap gap-2">
        {/* Ticker */}
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker"
          className="w-24 rounded border border-border bg-elevated px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted outline-none focus:border-teal-500/50"
          maxLength={8}
          required
        />
        {/* Entry Price */}
        <input
          type="number"
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
          placeholder="Entry $"
          step="0.01"
          min="0.01"
          className="w-24 rounded border border-border bg-elevated px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted outline-none focus:border-teal-500/50"
          required
        />
        {/* Quantity */}
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Qty"
          step="0.01"
          min="0.01"
          className="w-20 rounded border border-border bg-elevated px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted outline-none focus:border-teal-500/50"
          required
        />
        {/* Entry date */}
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="rounded border border-border bg-elevated px-2.5 py-1.5 text-xs font-mono text-text-primary outline-none focus:border-teal-500/50"
          required
        />
        {/* Notes */}
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="flex-1 min-w-[140px] rounded border border-border bg-elevated px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-teal-500/50"
          maxLength={120}
        />
        <button
          type="submit"
          disabled={submitting || !ticker || !qty || !entryPrice}
          className="rounded px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: "rgba(0,212,170,0.15)", color: "var(--color-teal)", border: "1px solid rgba(0,212,170,0.3)" }}
        >
          {submitting ? "Adding…" : "+ Add"}
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
      )}
    </form>
  );
}
