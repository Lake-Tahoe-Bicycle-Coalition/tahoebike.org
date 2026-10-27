import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { adminListUrl } from "@/lib/admin/form";
import { completeConnection, oauthCallbackUrl } from "@/lib/constant-contact-api";
import { OAUTH_STATE_COOKIE } from "../oauth-state";

const PAGE = "/admin/settings";

/**
 * Where Constant Contact sends the admin back after "Connect" (see ../connect). Checks the
 * `state` cookie, trades the code for tokens, and returns to /admin/settings with a notice.
 * This exact URL must be registered as a redirect URI on the Constant Contact app.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const back = (text: string, tone: "success" | "error" = "success") => {
    const response = NextResponse.redirect(new URL(adminListUrl(PAGE, text, tone), url.origin));
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/constant-contact" });
    return response;
  };

  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin/sign-in", url.origin));

  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const state = url.searchParams.get("state") ?? "";
  if (!expected || !sameString(state, expected)) {
    return back("The Constant Contact connection expired or did not start here. Please try Connect again.", "error");
  }

  const denied = url.searchParams.get("error");
  if (denied) {
    console.warn(`[constant-contact] authorization refused: ${denied}`);
    return back("Constant Contact access was not granted, so nothing changed.", "error");
  }

  const code = url.searchParams.get("code");
  if (!code) return back("Constant Contact did not return an authorization code. Please try again.", "error");

  try {
    await completeConnection(code, oauthCallbackUrl(url.origin), admin.email);
    return back("Connected Constant Contact. Signups now go straight to the email lists below.");
  } catch (error) {
    console.error("[constant-contact] could not complete the connection", error);
    return back("Constant Contact could not be connected. Please try again.", "error");
  }
}

function sameString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
