import Link from "next/link";

const NAV = [
  { href: "/admin/health", label: "Health" },
  { href: "/admin/cron",   label: "Cron" },
  { href: "/admin/logs",   label: "Audit Log" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin sub-header */}
      <div className="border-b border-border bg-panel flex-shrink-0">
        <div className="mx-auto max-w-6xl px-4 flex items-center gap-6 h-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-teal">
            Admin
          </span>
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              ← Back to app
            </Link>
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
