/* Server-only (node:crypto). */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * One-line admin notices after a redirect ("Saved “…”.", "That card could not be deleted…").
 *
 * The text travels in the URL (`?notice=…&tone=…&sig=…`), so it is signed with AUTH_SECRET:
 * <Notice /> shows only notices this server wrote. Without the signature anyone could send an
 * admin a link that prints any text inside the admin, styled as a trusted confirmation.
 */

export type NoticeTone = "success" | "error";

export type AdminNotice = { text: string; tone: NoticeTone };

type SearchParams = Record<string, string | string[] | undefined>;

function signingKey(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  // `next dev` without Google sign-in configured (ADMIN_DEV_EMAIL) may have no AUTH_SECRET.
  return process.env.NODE_ENV === "development" ? "development-only-notice-key" : null;
}

function signature(text: string, tone: NoticeTone): string | null {
  const key = signingKey();
  if (!key) return null;
  return createHmac("sha256", key).update(`${tone}\n${text}`).digest("base64url").slice(0, 22);
}

/** Adds `notice`, `tone` (errors only) and `sig` to a URL's query. */
export function appendNotice(params: URLSearchParams, text: string, tone: NoticeTone = "success"): void {
  const sig = signature(text, tone);
  if (!sig) return;
  params.set("notice", text);
  if (tone === "error") params.set("tone", "error");
  params.set("sig", sig);
}

/** The notice in a page's search params, or null when absent or not signed by this server. */
export function readNotice(params: SearchParams): AdminNotice | null {
  const { notice: text, tone: rawTone, sig } = params;
  if (typeof text !== "string" || text === "" || typeof sig !== "string") return null;
  const tone: NoticeTone = rawTone === "error" ? "error" : "success";
  const expected = signature(text, tone);
  if (!expected || expected.length !== sig.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? { text, tone } : null;
}
