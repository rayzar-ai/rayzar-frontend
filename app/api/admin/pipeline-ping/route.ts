/**
 * app/api/admin/pipeline-ping/route.ts — RayZar Frontend
 * Server-side proxy for POST /admin/pipeline-ping.
 * Keeps ADMIN_TOKEN out of the browser — the client POSTs here,
 * this route forwards to the backend with the real token.
 */

import { NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

export async function POST() {
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN not configured on the server" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/admin/pipeline-ping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": ADMIN_TOKEN,
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 503 },
    );
  }
}
