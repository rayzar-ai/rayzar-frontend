// Temporary landing page — will be replaced by Task 2.4 signal dashboard
// Redirects to /dashboard once the dashboard page exists.
// For now renders a status page confirming the stack is wired up.

import { apiClient } from "@/lib/api-client";

async function getHealthStatus() {
  try {
    const data = await apiClient.health();
    return data;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getHealthStatus();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          RayZar
        </h1>
        <p className="mt-2 text-gray-400">AI Trading Intelligence Platform</p>
      </div>

      <div className="w-full max-w-sm rounded-lg border border-gray-800 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
          System Status
        </h2>

        {health ? (
          <div className="space-y-2 text-sm">
            <StatusRow label="API" value={health.data?.status ?? "unknown"} ok={health.data?.status === "healthy"} />
            <StatusRow label="Database" value={health.data?.database ?? "unknown"} ok={health.data?.database === "connected"} />
            <StatusRow label="Environment" value={health.data?.environment ?? "—"} />
            <StatusRow label="Version" value={health.data?.version ?? "—"} />
          </div>
        ) : (
          <p className="text-sm text-red-400">
            Backend unreachable. Check NEXT_PUBLIC_API_URL and that the backend is running.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Signal dashboard coming in Task 2.4
      </p>
    </main>
  );
}

function StatusRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span
        className={
          ok === undefined
            ? "text-gray-300"
            : ok
            ? "text-green-400"
            : "text-red-400"
        }
      >
        {value}
      </span>
    </div>
  );
}
