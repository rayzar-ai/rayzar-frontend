// Next.js automatic loading UI — shown while dashboard/page.tsx fetches data

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-gray-800 bg-card px-4 py-5">
        <div className="mx-auto max-w-screen-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-800" />
              <div className="h-3 w-56 animate-pulse rounded bg-gray-800/60" />
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-24 animate-pulse rounded bg-gray-800" />
              <div className="h-8 w-20 animate-pulse rounded bg-gray-800" />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-screen-xl px-4 py-6">
        {/* Filter skeleton */}
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded border border-gray-800 bg-gray-800/40" />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <div className="border-b border-gray-800 bg-gray-900/60 px-4 py-3">
            <div className="flex gap-12">
              {["Ticker", "Signal", "Confidence", "RayZar Score", "Regime", "Date"].map((h) => (
                <div key={h} className="h-3 w-16 animate-pulse rounded bg-gray-700/60" />
              ))}
            </div>
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-12 border-b border-gray-800/60 px-4 py-3"
            >
              <div className="h-4 w-12 animate-pulse rounded bg-gray-800" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-800/60" />
              <div className="h-4 w-10 animate-pulse rounded bg-gray-800/60" />
              <div className="h-4 w-8 animate-pulse rounded bg-gray-800/60" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-800/60" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-800/60" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
