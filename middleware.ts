/**
 * middleware.ts — RayZar Frontend
 *
 * Injects X-API-Key into all /api/v1/* requests before they are forwarded
 * to the EC2 backend via Next.js rewrites.
 *
 * The key is read from BACKEND_API_KEY (server-side env var, never sent to
 * the browser), so it is never baked into the client bundle.
 *
 * Set BACKEND_API_KEY in Vercel environment variables (Production, Preview).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const apiKey = process.env.BACKEND_API_KEY ?? "";

  if (!apiKey) {
    // No key configured — forward as-is (dev mode with open backend)
    return NextResponse.next();
  }

  // Clone request headers and inject the API key
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-API-Key", apiKey);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Only run on backend API proxy paths
  matcher: "/api/v1/:path*",
};
