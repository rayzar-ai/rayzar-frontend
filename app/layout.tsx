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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
