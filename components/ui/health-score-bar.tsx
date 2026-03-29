"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HealthScoreBarProps {
  score: number | null;
  grade: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getGradeFromScore(score: number): string {
  if (score >= 70)  return "A+";
  if (score >= 55)  return "A";
  if (score >= 40)  return "B";
  if (score >= 10)  return "C";
  if (score >= -20) return "D";
  if (score >= -50) return "F";
  return "F-";
}

function getScoreColor(score: number): string {
  if (score >= 60)  return "var(--color-score-excellent)";
  if (score >= 30)  return "var(--color-score-good)";
  if (score >= 0)   return "var(--color-score-moderate)";
  if (score >= -30) return "var(--color-score-weak)";
  return "var(--color-score-poor)";
}

function getScoreLabel(score: number): string {
  if (score >= 70)  return "Excellent";
  if (score >= 40)  return "Strong";
  if (score >= 10)  return "Moderate";
  if (score >= -20) return "Weak";
  if (score >= -50) return "Poor";
  return "Very Poor";
}

// Convert score (-100..+100) to percentage (0..100) for bar position
function scoreToPercent(score: number): number {
  return Math.max(0, Math.min(100, (score + 100) / 2));
}

export function HealthScoreBar({ score, grade, size = "md", className }: HealthScoreBarProps) {
  const [animated, setAnimated] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const displayScore = score ?? 0;
  const displayGrade = grade ?? (score !== null ? getGradeFromScore(displayScore) : "—");
  const percent = scoreToPercent(displayScore);
  const color = score !== null ? getScoreColor(displayScore) : "var(--color-score-muted)";

  useEffect(() => {
    // Trigger animation after mount
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (score === null) {
    if (size === "sm") {
      return (
        <span className={cn("inline-flex items-center gap-1 font-mono text-xs text-text-muted", className)}>
          <span className="h-1.5 w-16 rounded-full bg-elevated" />
          <span>—</span>
        </span>
      );
    }
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Health Score</span>
          <span>—</span>
        </div>
        <div className="h-2 w-full rounded-full bg-elevated" />
      </div>
    );
  }

  // ── Small (inline pill) ──────────────────────────────────────────────────
  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-xs font-medium",
          className
        )}
        style={{ borderColor: `${color}40`, color }}
      >
        <span
          className="h-1 w-12 overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }} /* track bg */
        >
          <span
            className="block h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: animated ? `${percent}%` : "50%",
              background: color,
            }}
          />
        </span>
        <span>{displayScore > 0 ? "+" : ""}{displayScore}</span>
        <span style={{ opacity: 0.7 }}>{displayGrade}</span>
      </span>
    );
  }

  // ── Medium (standard card row) ───────────────────────────────────────────
  if (size === "md") {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Label row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-secondary">Health Score</span>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-xs font-bold"
              style={{ background: `${color}20`, color }}
            >
              {displayGrade}
            </span>
          </div>
          <span className="font-mono text-sm font-semibold" style={{ color }}>
            {displayScore > 0 ? "+" : ""}{displayScore}
          </span>
        </div>

        {/* Bar */}
        <div className="relative">
          {/* Track with gradient */}
          <div
            className="h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
            ref={barRef}
          >
            <div
              className="absolute inset-y-0 left-0 h-full rounded-full"
              style={{
                background: "linear-gradient(to right, var(--color-score-very-poor) 0%, var(--color-score-poor) 25%, var(--color-score-moderate) 45%, #eab308 55%, var(--color-score-excellent) 75%, var(--color-strong-bull) 100%)",
                opacity: 0.2,
                right: 0,
              }}
            />
            {/* Fill overlay */}
            <div
              className="relative h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: animated ? `${percent}%` : "50%",
                background: color,
                boxShadow: `0 0 8px ${color}60`,
              }}
            />
          </div>

          {/* Needle marker */}
          <div
            className="absolute -top-0.5 bottom-0 w-0.5 rounded-full bg-white shadow-md transition-all duration-700 ease-out"
            style={{ left: animated ? `calc(${percent}% - 1px)` : "calc(50% - 1px)" }}
          />

          {/* Zero mark */}
          <div
            className="absolute -top-0.5 bottom-0 w-px bg-border"
            style={{ left: "50%" }}
          />
        </div>

        {/* Axis labels */}
        <div className="flex justify-between text-2xs text-text-muted">
          <span>-100</span>
          <span className="text-text-muted">0</span>
          <span>+100</span>
        </div>
      </div>
    );
  }

  // ── Large (full width with labels) ──────────────────────────────────────
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">Health Score</p>
          <p className="text-xs text-text-secondary">{getScoreLabel(displayScore)}</p>
        </div>
        <div className="text-right">
          <p
            className="font-mono text-2xl font-bold"
            style={{ color }}
          >
            {displayScore > 0 ? "+" : ""}{displayScore}
          </p>
          <p
            className="font-mono text-sm font-semibold"
            style={{ color }}
          >
            Grade: {displayGrade}
          </p>
        </div>
      </div>

      {/* Full gradient bar */}
      <div className="relative">
        {/* Background gradient */}
        <div
          className="h-4 w-full overflow-hidden rounded-full"
          style={{
            background: "linear-gradient(to right, var(--color-score-very-poor) 0%, var(--color-score-poor) 20%, var(--color-score-weak) 35%, var(--color-score-moderate) 50%, var(--color-score-excellent) 70%, var(--color-strong-bull) 100%)",
            opacity: 0.25,
          }}
        />

        {/* Actual bar layer on top */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {/* Gray track */}
          <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: animated ? `${percent}%` : "50%",
              background: `linear-gradient(to right, ${displayScore < 0 ? "var(--color-score-very-poor)" : "var(--color-score-moderate)"}, ${color})`,
              boxShadow: `0 0 12px ${color}50`,
            }}
          />
        </div>

        {/* Needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 rounded-full bg-white shadow-lg transition-all duration-700 ease-out"
          style={{ left: animated ? `calc(${percent}% - 1px)` : "calc(50% - 1px)" }}
        />

        {/* Center tick */}
        <div className="absolute top-0 bottom-0 w-px bg-border" style={{ left: "50%" }} />
      </div>

      {/* Axis labels */}
      <div className="flex justify-between text-xs text-text-muted">
        <span className="text-red-500">-100 (F-)</span>
        <span>0</span>
        <span className="text-signal-long">+100 (A+)</span>
      </div>

      {/* Grade thresholds legend */}
      <div className="grid grid-cols-6 gap-1 text-center">
        {[
          { range: "≤-50",   grade: "F-",  color: "var(--color-score-very-poor)" },
          { range: "-50→-20",grade: "F",   color: "var(--color-score-poor)" },
          { range: "-20→10", grade: "D",   color: "var(--color-score-weak)" },
          { range: "10→40",  grade: "C",   color: "var(--color-score-moderate)" },
          { range: "40→70",  grade: "B",   color: "var(--color-score-good)" },
          { range: "70+",    grade: "A/A+",color: "var(--color-score-excellent)" },
        ].map((t) => (
          <div
            key={t.grade}
            className={cn(
              "rounded py-1 text-2xs font-medium",
              displayGrade === t.grade ? "ring-1" : ""
            )}
            style={{
              background: `${t.color}15`,
              color: t.color,
              borderColor: displayGrade === t.grade ? t.color : "transparent",
              border: `1px solid ${displayGrade === t.grade ? t.color : "transparent"}`,
            }}
          >
            <div className="font-mono font-bold">{t.grade}</div>
            <div style={{ opacity: 0.6, fontSize: "0.55rem" }}>{t.range}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
