"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  // Task 2.6: { href: "/watchlist", label: "Watchlist" },
  // Task 2.7: { href: "/portfolio", label: "Portfolio" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            Ray<span className="text-green-400">Zar</span>
          </span>
          <span className="hidden rounded border border-green-900 px-1.5 py-0.5 text-xs text-green-500 sm:inline">
            AI Trading
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
