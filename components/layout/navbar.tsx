"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Bell, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/ui/search-bar";

const NAV_LINKS = [
  { href: "/dashboard", label: "Signals" },
  // Upcoming:
  // { href: "/screener", label: "Screener" },
  // { href: "/watchlist", label: "Watchlist" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        borderColor: "#1e2433",
        background: "rgba(8,12,20,0.96)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-2.5">

        {/* ── Logo ────────────────────────────────────────────────────── */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 mr-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded"
            style={{
              background: "linear-gradient(135deg, #00d4aa22, #00d4aa44)",
              border: "1px solid #00d4aa44",
            }}
          >
            <Zap className="h-4 w-4" style={{ color: "#00d4aa" }} />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Ray<span style={{ color: "#00d4aa" }}>Zar</span>
          </span>
          <span
            className="hidden rounded px-1.5 py-0.5 text-[10px] font-semibold sm:inline"
            style={{
              background: "#00d4aa15",
              color: "#00d4aa",
              border: "1px solid #00d4aa30",
            }}
          >
            AI
          </span>
        </Link>

        {/* ── Search bar (grows to fill space) ────────────────────────── */}
        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* ── Nav links ───────────────────────────────────────────────── */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              )}
              style={
                pathname.startsWith(link.href)
                  ? { background: "#ffffff10", color: "#e6edf3" }
                  : {}
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Right controls ──────────────────────────────────────────── */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/5"
            title="Alerts (coming soon)"
            disabled
          >
            <Bell className="h-4 w-4 text-gray-500" />
          </button>

          <button
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/5"
            title="Settings (coming soon)"
            disabled
          >
            <Settings className="h-4 w-4 text-gray-500" />
          </button>

          <div
            className="hidden rounded px-2.5 py-1 text-xs font-semibold sm:flex items-center gap-1"
            style={{
              background: "#f59e0b15",
              color: "#f59e0b",
              border: "1px solid #f59e0b30",
            }}
          >
            <BarChart2 className="h-3 w-3" />
            Pro
          </div>
        </div>
      </div>
    </header>
  );
}
