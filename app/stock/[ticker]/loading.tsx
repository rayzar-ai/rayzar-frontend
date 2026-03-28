/**
 * app/stock/[ticker]/loading.tsx — RayZar Frontend
 * Skeleton shown while the stock detail page is loading.
 */
export default function StockLoading() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-pulse">

        {/* Back link skeleton */}
        <div className="h-4 w-32 bg-[#1a1a1a] rounded mb-6" />

        {/* Header */}
        <div className="mb-6">
          <div className="h-8 w-24 bg-[#1a1a1a] rounded mb-2" />
          <div className="h-3 w-40 bg-[#111] rounded" />
        </div>

        {/* Chart */}
        <div className="mb-6">
          <div className="h-4 w-32 bg-[#111] rounded mb-3" />
          <div className="h-[420px] w-full bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]" />
        </div>

        {/* Signal card */}
        <div className="mb-6">
          <div className="h-4 w-28 bg-[#111] rounded mb-3" />
          <div className="rounded-lg border border-[#1a1a1a] bg-[#0f0f0f] p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-7 w-20 bg-[#1a1a1a] rounded" />
              <div className="h-7 w-24 bg-[#1a1a1a] rounded" />
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between border-b border-[#1a1a1a] pb-2">
                <div className="h-4 w-24 bg-[#111] rounded" />
                <div className="h-4 w-16 bg-[#111] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
