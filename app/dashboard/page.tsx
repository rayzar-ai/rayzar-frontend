/**
 * app/dashboard/page.tsx — RayZar Frontend
 * Main signal dashboard — Server Component.
 *
 * Fetches signals and market regime from the FastAPI backend (EC2 → RDS).
 * Renders server-side for fast initial load, then hydrates for interactivity.
 *
 * URL params:
 *   ?page=1            — pagination (default 1)
 *   ?signal_class=LONG — filter by signal class (default all)
 */

import { Suspense } from "react";
import { apiClient } from "@/lib/api-client";
import { DashboardHeader } from "@/features/signals/components/dashboard-header";
import { SignalFilters } from "@/features/signals/components/signal-filters";
import { SignalsTable } from "@/features/signals/components/signals-table";
import { WatchlistPanel } from "@/features/watchlist/components/watchlist-panel";
import { FINANCIAL_DISCLAIMER } from "@/config/legal";

interface DashboardPageProps {
  searchParams: Promise<{
    page?: string;
    signal_class?: string;
  }>;
}

export const metadata = {
  title: "Dashboard — RayZar",
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const signalClass = params.signal_class ?? "";

  // Fetch signals and regime in parallel — gracefully handle backend being offline
  const [signalsResult, regimeResult] = await Promise.allSettled([
    apiClient.getSignals({
      page,
      page_size: 50,
      signal_class: signalClass || undefined,
    }),
    apiClient.getMarketRegime(),
  ]);

  const signalsData =
    signalsResult.status === "fulfilled" && signalsResult.value.success
      ? signalsResult.value.data
      : null;

  const regime =
    regimeResult.status === "fulfilled" &&
    regimeResult.value.success &&
    regimeResult.value.data
      ? regimeResult.value.data
      : null;

  const meta =
    signalsResult.status === "fulfilled" ? signalsResult.value.meta : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header: regime badge + signal count */}
      <DashboardHeader
        regime={regime}
        totalSignals={signalsData?.total ?? 0}
      />

      <main className="mx-auto max-w-screen-xl px-4 py-6">
        <div className="flex gap-6">
          {/* ── Main content ────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {/* Filters + refresh button */}
            <Suspense>
              <SignalFilters activeClass={signalClass} />
            </Suspense>

            {/* Signals table / empty state */}
            <Suspense>
              <SignalsTable
                signals={signalsData?.signals ?? []}
                meta={meta}
                currentPage={page}
              />
            </Suspense>
          </div>

          {/* ── Watchlist sidebar ────────────────────────────────────────── */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20">
              <WatchlistPanel />
            </div>
          </aside>
        </div>

        {/* Financial disclaimer — required on all signal pages */}
        <p className="mt-8 text-xs leading-relaxed text-gray-600">
          {FINANCIAL_DISCLAIMER}
        </p>
      </main>
    </div>
  );
}
