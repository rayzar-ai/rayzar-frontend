import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },

  /**
   * Server-side proxy rewrites.
   * BACKEND_URL is a server-only env var (no NEXT_PUBLIC_ prefix) — safe to use here.
   * Set BACKEND_URL=http://<ec2-ip>:8000 in Vercel environment variables.
   *
   * This solves the HTTPS → HTTP mixed-content problem:
   *   Browser (HTTPS Vercel) → fetch("/api/v1/...") → Vercel server rewrites → EC2 HTTP
   *
   * Client code uses relative paths (baseUrl = "") — rewrites intercept on the server.
   */
  async rewrites() {
    // BACKEND_URL overrides the default EC2 address (set in Vercel env vars to change).
    // Falls back to the known EC2 address so rewrites work without any env var configured.
    const backendUrl = (process.env.BACKEND_URL ?? "http://54.159.27.188:8000").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
