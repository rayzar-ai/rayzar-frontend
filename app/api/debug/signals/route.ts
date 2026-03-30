import { NextResponse } from "next/server";

// Diagnostic endpoint — remove after debugging
export async function GET() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "NOT_SET";
  const key = process.env.NEXT_PUBLIC_API_KEY ?? "NOT_SET";

  const target = `${url}/api/v1/signals?page=1&page_size=5`;

  try {
    const res = await fetch(target, {
      headers: {
        "Content-Type": "application/json",
        ...(key && key !== "NOT_SET" ? { "X-API-Key": key } : {}),
      },
      cache: "no-store",
    });

    const body = await res.json();
    return NextResponse.json({
      env_url: url,
      env_key_set: key !== "NOT_SET" && key.length > 0,
      env_key_prefix: key.length > 4 ? key.slice(0, 4) + "..." : "EMPTY",
      backend_status: res.status,
      backend_ok: res.ok,
      response_success: body?.success,
      signal_count: body?.data?.signals?.length ?? 0,
      meta: body?.meta,
    });
  } catch (err) {
    return NextResponse.json({
      env_url: url,
      env_key_set: key !== "NOT_SET",
      error: String(err),
    }, { status: 500 });
  }
}
