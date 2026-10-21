/* Server-only (node:crypto). */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * One-line admin notices after a redirect ("Saved “…”.", "That card could not be deleted…").
 *
 * The text travels in the URL (`?notice=…&tone=…&sig=…`), so it is signed with AUTH_SECRET:
 * <Notice /> shows only notices this server wrote. Without the signature anyone could send an
 * admin a link that prints any text inside the admin, styled as a trusted confirmation.
 *
 * An optional `view` (a public site path such as `/bike-kitchen`) adds a "View on site" link to
 * the page that changed. It is covered by the same signature, so a link cannot swap it.
 */

export type NoticeTone = "success" | "error";

export type AdminNotice = { text: string; tone: NoticeTone; view?: string };

type SearchParams = Record<string, string | string[] | undefined>;

function signingKey(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  // `next dev` without Google sign-in configured (ADMIN_DEV_EMAIL) may have no AUTH_SECRET.
  return process.env.NODE_ENV === "development" ? "development-only-notice-key" : null;
}

/** A plain same-site path (`/`, `/bike-kitchen`): no scheme, host, query or `//`. */
function isViewPath(view: string): boolean {
  return /^\/(?!\/)[\w\-/]*$/.test(view);
}

function signature(text: string, tone: NoticeTone, view?: string): string | null {
  const key = signingKey();
  if (!key) return null;
  const payload = view ? `${tone}\n${text}\n${view}` : `${tone}\n${text}`;
  return createHmac("sha256", key).update(payload).digest("base64url").slice(0, 22);
}

/** Adds `notice`, `tone` (errors only), `view` (if given) and `sig` to a URL's query. */
export function appendNotice(
  params: URLSearchParams,
  text: string,
  tone: NoticeTone = "success",
  view?: string,
): void {
  const safeView = view && isViewPath(view) ? view : undefined;
  const sig = signature(text, tone, safeView);
  if (!sig) return;
  params.set("notice", text);
  if (tone === "error") params.set("tone", "error");
  if (safeView) params.set("view", safeView);
  params.set("sig", sig);
}

/** The notice in a page's search params, or null when absent or not signed by this server. */
export function readNotice(params: SearchParams): AdminNotice | null {
  const { notice: text, tone: rawTone, view: rawView, sig } = params;
  if (typeof text !== "string" || text === "" || typeof sig !== "string") return null;
  const tone: NoticeTone = rawTone === "error" ? "error" : "success";
  const view = typeof rawView === "string" && isViewPath(rawView) ? rawView : undefined;
  if (rawView !== undefined && !view) return null;
  const expected = signature(text, tone, view);
  if (!expected || expected.length !== sig.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? { text, tone, view } : null;
}
