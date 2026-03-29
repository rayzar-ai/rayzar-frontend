"use client";

/**
 * features/workspace/workspace-layout.tsx — RayZar Frontend
 *
 * Task 2.9: 4-pane resizable trading terminal workspace.
 *
 * Layout (desktop):
 *   ┌─────────────────────┬──────────────┐
 *   │   topLeft (chart)   │   topRight   │  ← top row
 *   ├─────────────────────┼──────────────┤
 *   │    bottomLeft       │ bottomRight  │  ← bottom row
 *   └─────────────────────┴──────────────┘
 *         ← col split →
 *
 * - Vertical divider: drag left/right to resize column split
 * - Horizontal divider: drag up/down to resize row split (shared across both columns)
 * - Sizes persisted to localStorage under key "rayzar_ws_v1"
 * - Press R (when no input is focused) to reset to defaults
 * - Mobile: all 4 panes stack vertically
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY      = "rayzar_ws_v1";
const DEFAULT_COL = 62;   // left column %
const DEFAULT_ROW = 65;   // top row %
const MIN_PCT     = 20;
const MAX_PCT     = 80;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceLayoutProps {
  topLeft:     React.ReactNode;
  bottomLeft:  React.ReactNode;
  topRight:    React.ReactNode;
  bottomRight: React.ReactNode;
}

// ── Divider components ────────────────────────────────────────────────────────

function VerticalDivider({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize columns"
      onMouseDown={onMouseDown}
      className="relative z-10 flex w-1.5 flex-shrink-0 cursor-col-resize select-none items-center justify-center bg-transparent transition-colors hover:bg-accent-teal/20 active:bg-accent-teal/30"
    >
      {/* Visual handle — 3 dots */}
      <div className="flex flex-col items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 w-1 rounded-full bg-border" />
        ))}
      </div>
      {/* Wide invisible hit area */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
    </div>
  );
}

function HorizontalDivider({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize rows"
      onMouseDown={onMouseDown}
      className="relative z-10 flex h-1.5 flex-shrink-0 cursor-row-resize select-none items-center justify-center bg-transparent transition-colors hover:bg-accent-teal/20 active:bg-accent-teal/30"
    >
      {/* Visual handle — 3 dots */}
      <div className="flex flex-row items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 w-1 rounded-full bg-border" />
        ))}
      </div>
      {/* Wide invisible hit area */}
      <div className="absolute -top-1.5 -bottom-1.5 inset-x-0" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkspaceLayout({
  topLeft,
  bottomLeft,
  topRight,
  bottomRight,
}: WorkspaceLayoutProps) {
  const [col, setCol] = useState(DEFAULT_COL);
  const [row, setRow] = useState(DEFAULT_ROW);

  const containerRef  = useRef<HTMLDivElement>(null);
  const draggingRef   = useRef<"col" | "row" | null>(null);
  const rafRef        = useRef<number | null>(null);

  // ── Load persisted sizes ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { col?: number; row?: number };
        if (typeof parsed.col === "number") setCol(clamp(parsed.col, MIN_PCT, MAX_PCT));
        if (typeof parsed.row === "number") setRow(clamp(parsed.row, MIN_PCT, MAX_PCT));
      }
    } catch {
      // corrupted storage — ignore
    }
  }, []);

  // ── Persist sizes on change ────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ col, row }));
    } catch {
      // storage unavailable — ignore
    }
  }, [col, row]);

  // ── R key to reset ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "r" || e.key === "R") {
        setCol(DEFAULT_COL);
        setRow(DEFAULT_ROW);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Mouse drag handlers ────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (draggingRef.current === "col") {
        setCol(clamp(((e.clientX - rect.left) / rect.width) * 100, MIN_PCT, MAX_PCT));
      } else if (draggingRef.current === "row") {
        setRow(clamp(((e.clientY - rect.top) / rect.height) * 100, MIN_PCT, MAX_PCT));
      }
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  function startColDrag(e: React.MouseEvent) {
    e.preventDefault();
    draggingRef.current   = "col";
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  }

  function startRowDrag(e: React.MouseEvent) {
    e.preventDefault();
    draggingRef.current   = "row";
    document.body.style.cursor     = "row-resize";
    document.body.style.userSelect = "none";
  }

  const isAtDefault = Math.abs(col - DEFAULT_COL) < 1 && Math.abs(row - DEFAULT_ROW) < 1;

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden">
      {/* Reset hint */}
      {!isAtDefault && (
        <div className="absolute top-1 right-2 z-20">
          <button
            onClick={() => { setCol(DEFAULT_COL); setRow(DEFAULT_ROW); }}
            title="Reset layout (R)"
            className="rounded border border-border bg-elevated px-2 py-0.5 text-2xs text-text-muted transition-colors hover:text-accent-teal hover:border-accent-teal/50"
          >
            ↺ Reset layout
          </button>
        </div>
      )}

      {/* ── Desktop 4-pane layout ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="hidden lg:flex flex-row h-full w-full overflow-hidden"
      >
        {/* Left column */}
        <div
          className="flex flex-col min-w-0 overflow-hidden"
          style={{ width: `${col}%` }}
        >
          {/* Top-left pane */}
          <div
            className="overflow-hidden"
            style={{ height: `${row}%` }}
          >
            <div className="h-full overflow-y-auto p-3">
              {topLeft}
            </div>
          </div>

          <HorizontalDivider onMouseDown={startRowDrag} />

          {/* Bottom-left pane */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
            {bottomLeft}
          </div>
        </div>

        <VerticalDivider onMouseDown={startColDrag} />

        {/* Right column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Top-right pane */}
          <div
            className="overflow-y-auto p-3 space-y-4"
            style={{ height: `${row}%` }}
          >
            {topRight}
          </div>

          <HorizontalDivider onMouseDown={startRowDrag} />

          {/* Bottom-right pane */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
            {bottomRight}
          </div>
        </div>
      </div>

      {/* ── Mobile: vertical stack ────────────────────────────────────────── */}
      <div className="flex lg:hidden flex-col gap-4 overflow-y-auto p-4">
        <div>{topLeft}</div>
        <div>{topRight}</div>
        <div>{bottomLeft}</div>
        <div>{bottomRight}</div>
      </div>
    </div>
  );
}
