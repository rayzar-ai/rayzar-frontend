/**
 * app/screener/page.tsx — RayZar Frontend
 * Signal screener — filter all signals by class, sector, min score, regime.
 * Server component: fetches signals based on search params, passes to client.
 */

import { Suspense } from "react";
import { apiClient } from "@/lib/api-client";
import { ScreenerFilters } from "@/features/screener/components/screener-filters";
import { ScreenerTable } from "@/features/screener/components/screener-table";
import type { Signal } from "@/lib/api-client";

export const metadata = {
  title: "Screener — RayZar AI",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    signal_class?: string;
    sector?: string;
    min_score?: string;
    page?: string;
  }>;
}

export default async function ScreenerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const signal_class = params.signal_class || undefined;
  const sector = params.sector || undefined;
  const min_score = params.min_score ? parseInt(params.min_score, 10) : undefined;

  const res = await apiClient.getSignals({
    page,
    page_size: 100,
    signal_class,
    sector,
    min_score,
  });

  const signals: Signal[] = res.success && res.data ? res.data.signals : [];
  const total = res.success && res.data ? res.data.total : 0;

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Signal Screener</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Filter all {total} signals by class, sector, and score. Updated nightly.
        </p>
      </div>

      {/* Filters — client component, updates URL params on change */}
      <Suspense>
        <ScreenerFilters
          initialClass={signal_class ?? ""}
          initialSector={sector ?? ""}
          initialMinScore={params.min_score ?? ""}
        />
      </Suspense>

      {/* Results table */}
      <Suspense>
        <ScreenerTable signals={signals} total={total} page={page} />
      </Suspense>

      {/* Disclaimer */}
      <p className="text-xs text-text-muted">
        Signals are generated nightly by the RayZar ML pipeline. NOT FINANCIAL ADVICE.
      </p>
    </main>
  );
}
