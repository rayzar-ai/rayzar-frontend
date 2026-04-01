"use client";

/**
 * features/signals/components/model-selector.tsx — RayZar Frontend
 *
 * Model selector tab bar + consensus filter for the signal dashboard.
 * Fetches signals client-side when model selection changes.
 * Also provides consensus filtering (by specialist vote count via consensus_score).
 */

import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/api-client";
import type { Signal } from "@/lib/api-client";
import { DashboardClient } from "./dashboard-client";
import type { MarketRegime } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelMeta {
  id: string;
  name: string;
  specialists: number;
  status: string;
}

interface ModelSelectorProps {
  initialSignals: Signal[];
  regime: MarketRegime | null;
  watchedTickers: string[];
  activeClass: string;
}

// ---------------------------------------------------------------------------
// Consensus filter thresholds
// The consensus_score (0–1) maps to "N out of M specialists agree".
// e.g. 5/7 = 0.714, 4/7 = 0.571, etc.
// We filter by minimum consensus_score >= threshold.
// ---------------------------------------------------------------------------

function getConsensusLabel(minVotes: number, totalSpecialists: number): string {
  if (minVotes === 0) return "ALL";
  return `${minVotes}/${totalSpecialists}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModelSelector({
  initialSignals,
  regime,
  watchedTickers,
  activeClass,
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<string>("ta_only");
  const [models, setModels] = useState<ModelMeta[]>([
    { id: "ta_only", name: "TA Only", specialists: 7, status: "active" },
    { id: "ta_options", name: "TA + Options", specialists: 8, status: "active" },
  ]);
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [loading, setLoading] = useState(false);
  const [consensusMin, setConsensusMin] = useState<number>(0); // 0 = ALL

  // Fetch model list on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/signals/models`,
          {
            headers: process.env.NEXT_PUBLIC_API_KEY
              ? { "X-API-Key": process.env.NEXT_PUBLIC_API_KEY }
              : {},
            cache: "no-store",
          }
        );
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          setModels(body.data);
        }
      } catch {
        // keep defaults
      }
    }
    fetchModels();
  }, []);

  // Re-fetch signals when model changes
  useEffect(() => {
    async function fetchSignals() {
      setLoading(true);
      try {
        const res = await apiClient.getSignals({
          page: 1,
          page_size: 200,
          signal_class: activeClass || undefined,
          model: selectedModel,
        });
        if (res.success && res.data) {
          setSignals(res.data.signals);
        }
      } catch {
        // keep current signals
      } finally {
        setLoading(false);
      }
    }
    fetchSignals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel, activeClass]);

  const activeModel = models.find((m) => m.id === selectedModel) ?? models[0];
  const totalSpecialists = activeModel?.specialists ?? 7;

  // Consensus filter options: ALL, 3/N, 4/N, 5/N, 6/N, 7/N
  const consensusOptions = useMemo(() => {
    const opts: { label: string; minVotes: number; minScore: number }[] = [
      { label: "ALL", minVotes: 0, minScore: 0 },
    ];
    for (let v = 3; v <= totalSpecialists; v++) {
      opts.push({
        label: getConsensusLabel(v, totalSpecialists),
        minVotes: v,
        minScore: v / totalSpecialists,
      });
    }
    return opts;
  }, [totalSpecialists]);

  // Reset consensus filter when switching models
  function handleModelSelect(modelId: string) {
    setSelectedModel(modelId);
    setConsensusMin(0);
  }

  // Apply consensus filter client-side
  const filteredSignals = useMemo(() => {
    if (consensusMin === 0) return signals;
    const minScore = consensusMin / totalSpecialists;
    return signals.filter((s) => s.consensus_score >= minScore);
  }, [signals, consensusMin, totalSpecialists]);

  return (
    <div className="space-y-3">
      {/* Model selector tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted mr-1">
          Model:
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-panel p-0.5">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                selectedModel === model.id
                  ? "bg-accent-teal text-background shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-elevated"
              )}
            >
              {model.name}
              <span
                className={cn(
                  "ml-1.5 font-mono text-2xs",
                  selectedModel === model.id ? "opacity-80" : "opacity-50"
                )}
              >
                {model.specialists}S
              </span>
            </button>
          ))}
        </div>

        {loading && (
          <span className="text-xs text-text-muted animate-pulse">Loading...</span>
        )}
      </div>

      {/* Consensus filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted mr-1">
          Consensus:
        </span>
        <div className="flex items-center gap-1">
          {consensusOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setConsensusMin(opt.minVotes)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-mono font-semibold transition-all border",
                consensusMin === opt.minVotes
                  ? "bg-accent-teal/20 border-accent-teal/50 text-accent-teal"
                  : "border-border bg-panel text-text-muted hover:text-text-secondary hover:border-border"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {consensusMin > 0 && (
          <span className="text-xs text-text-muted">
            · {filteredSignals.length} of {signals.length} signals
          </span>
        )}
      </div>

      {/* Dashboard table with filtered signals */}
      <DashboardClient
        signals={filteredSignals}
        activeClass={activeClass}
        regime={regime}
        watchedTickers={watchedTickers}
        showConsensusVotes={true}
        totalSpecialists={totalSpecialists}
      />
    </div>
  );
}
