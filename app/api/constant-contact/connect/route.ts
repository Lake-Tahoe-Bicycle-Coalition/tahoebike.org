import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { adminListUrl } from "@/lib/admin/form";
import { authorizeUrl, constantContactConfigured, oauthCallbackUrl } from "@/lib/constant-contact-api";
import { OAUTH_STATE_COOKIE, OAUTH_STATE_MAX_AGE_SECONDS } from "../oauth-state";

/**
 * Starts the admin "Connect Constant Contact" flow (components/admin/constant-contact-panel.tsx):
 * sets a one-time `state` cookie and sends the admin to Constant Contact to approve
 * access. Constant Contact then returns to ../callback.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const origin = new URL(request.url).origin;
  if (!(await getAdmin())) return NextResponse.redirect(new URL("/admin/sign-in", origin));
  if (!constantContactConfigured()) {
    return NextResponse.redirect(
      new URL(adminListUrl("/admin/settings", "Constant Contact is not set up on this deployment.", "error"), origin),
    );
  }

  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(authorizeUrl(state, oauthCallbackUrl(origin)));
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: origin.startsWith("https:"),
    sameSite: "lax",
    path: "/api/constant-contact",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
