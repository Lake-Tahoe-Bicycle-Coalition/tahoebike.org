import { NextResponse } from "next/server";
import { refreshConnection } from "@/lib/constant-contact-api";

/**
 * Weekly Vercel cron (vercel.json): refreshes the Constant Contact tokens so the refresh
 * token never sits unused for the 180 days after which it expires, even when nobody
 * subscribes for months. Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set; the Constant Contact refresh did not run.");
    return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await refreshConnection();
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[cron] Constant Contact token refresh failed; reconnect it in /admin/settings.", error);
    return NextResponse.json({ error: "Refresh failed." }, { status: 502 });
  }
}
