/**
 * app/portfolio/page.tsx — RayZar Frontend
 * Portfolio tracker — open positions with live P&L vs signal entry price.
 * Server component: fetches positions on every load (fresh prices via yfinance).
 */

import { apiClient } from "@/lib/api-client";
import { AddPositionForm } from "@/features/portfolio/components/add-position-form";
import { PortfolioTable } from "@/features/portfolio/components/portfolio-table";

export const metadata = {
  title: "Portfolio — RayZar AI",
};

export const dynamic = "force-dynamic"; // always fresh — live prices

export default async function PortfolioPage() {
  const res = await apiClient.getPortfolio();
  const positions = res.success && res.data ? res.data : [];

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">Portfolio</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Track open positions against RayZar signals. Prices refresh on each page load.
        </p>
      </div>

      {/* Add position form */}
      <AddPositionForm />

      {/* Positions table */}
      <PortfolioTable initialPositions={positions} />

      {/* Disclaimer */}
      <p className="text-xs text-text-muted">
        P&amp;L is unrealized and based on live price vs your entry. RayZar does not execute trades —
        this tracker is for informational purposes only. NOT FINANCIAL ADVICE.
      </p>
    </main>
  );
}
