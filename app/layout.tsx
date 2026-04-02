import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "RayZar — AI Trading Intelligence",
  description:
    "Institutional-grade trading signals powered by ensemble ML models with walk-forward validation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body
        className="min-h-screen antialiased"
        style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
      >
        <Navbar />
        {children}
        <footer
          className="border-t px-4 py-3"
          style={{ borderColor: "var(--color-border)", background: "rgba(8,12,20,0.8)" }}
        >
          <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-2">
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span style={{ color: "rgba(239,68,68,0.8)", fontWeight: 600 }}>NOT FINANCIAL ADVICE</span>
              {" — "}RayZar signals are for informational purposes only. Trading involves significant risk of loss.
              Past performance does not guarantee future results.
            </p>
            <Link
              href="/legal"
              className="shrink-0 text-xs transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              Full Disclaimer →
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
