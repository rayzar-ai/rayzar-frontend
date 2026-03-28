import type { MarketRegime } from "@/lib/api-client";
import { RegimeBadge } from "@/components/ui/regime-badge";
import { formatDate } from "@/lib/utils";

interface DashboardHeaderProps {
  regime: MarketRegime | null;
  totalSignals: number;
}

export function DashboardHeader({ regime, totalSignals }: DashboardHeaderProps) {
  return (
    <div className="border-b border-gray-800 bg-card px-4 py-5">
      <div className="mx-auto max-w-screen-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title + signal count */}
          <div>
            <h1 className="text-xl font-bold text-white">Signal Dashboard</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {totalSignals > 0
                ? `${totalSignals} signals · sorted by RayZar Score`
                : "No signals yet — run the nightly pipeline"}
            </p>
          </div>

          {/* Regime + last updated */}
          <div className="flex items-center gap-3">
            {regime ? (
              <>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Market Regime</p>
                  <RegimeBadge regime={regime.regime} className="mt-0.5" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last updated</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-300">
                    {formatDate(regime.signal_date)}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-600">No regime data</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
