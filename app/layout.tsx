import type { Metadata } from "next";
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
      </body>
    </html>
  );
}
