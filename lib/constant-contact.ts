/**
 * Constant Contact integration.
 *
 * The public Constant Contact endpoints the WordPress site used; no API key is involved.
 * Signups through the authenticated V3 API live in lib/constant-contact-api.ts and fall
 * back to the hosted opt-in page below when that API is not connected.
 *
 * 1. Campaign archive (read-only JSON)
 *    GET https://campaignlp.constantcontact.com/v1/archive/<accountId>/activities?limit=<n>
 *
 *    Known (verified with curl on 2026-09-15):
 *    - Responds 200 `application/json` with `access-control-allow-origin: *`, so it can
 *      be fetched server-side (as this module does) or from the browser (as the old
 *      widget in reference/ltbc-newsletter-widget.html did).
 *    - The body is a bare JSON array of `{ subject, campaignUrl }`; `campaignUrl` is a
 *      `https://conta.cc/...` short link to the hosted campaign page. No date field
 *      is returned today.
 *    - Items come back oldest-archived first (checked 2026-09-17 against the dates
 *      inside the campaigns), so `fetchNewsletterArchive` reverses them. Whether `limit`
 *      truncates from the old or the new end is unknown (the account has fewer
 *      campaigns than any limit we pass), so keep `limit` generous.
 *    - The archive lists only campaigns that were sent with "archive" enabled; the
 *      account currently exposes four, so `limit` above that returns all of them.
 *    - Served with `cache-control: public, max-age=14400`.
 *
 *    Assumed:
 *    - The endpoint is undocumented, so parsing is lenient: it accepts a bare array or
 *      an object wrapping one, requires `subject` and an http(s) `campaignUrl`, and keeps
 *      a date if a plausibly named field ever appears. Anything else yields [].
 *    - The raw keys of the first item are logged once per process so we learn about
 *      shape changes from the server logs.
 *
 * 2. Hosted opt-in page (newsletter signup)
 *    https://visitor.r20.constantcontact.com/manage/optin?v=<opaque token>
 *
 *    Known: an ordinary server-rendered page whose own form POSTs the visitor's email
 *    address back to itself. Extra query parameters are tolerated (the page keeps them
 *    on its form action).
 *
 *    The newsletter form's server action (`subscribeNewsletter` in lib/forms/actions.ts)
 *    redirects here when the V3 API is not connected or a signup through it fails (see
 *    `signupPageUrl`). The `email` value travels along in the query string for a
 *    possible future prefill, but as of 2026-09-15 the hosted page ignores it and the
 *    visitor types their address again there.
 */

export type NewsletterItem = {
  subject: string;
  campaignUrl: string;
  /** Sent date as returned by the API, if it ever returns one. Not returned today. */
  sentDate?: string;
};

const ARCHIVE_BASE_URL = "https://campaignlp.constantcontact.com/v1/archive";

/** Field names we would accept as a sent date, should the API start returning one. */
const DATE_KEYS = ["sentDate", "sent_date", "sentAt", "sent_at", "date", "scheduledDate"];

/** How long a slow Constant Contact response may hold up a page render. */
const FETCH_TIMEOUT_MS = 8000;

/** Hourly is plenty for a newsletter that goes out roughly monthly. */
const REVALIDATE_SECONDS = 3600;

export function newsletterArchiveUrl(accountId: string, limit: number): string {
  const count = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 6;
  return `${ARCHIVE_BASE_URL}/${encodeURIComponent(accountId)}/activities?limit=${count}`;
}

/**
 * Fetch the most recent archived campaigns for an account, newest first.
 * Never throws: any network, HTTP, or parsing problem results in an empty list, and the
 * caller shows a subscribe link instead.
 */
export async function fetchNewsletterArchive(
  accountId: string,
  limit = 6,
): Promise<NewsletterItem[]> {
  if (!accountId.trim()) return [];

  try {
    const response = await fetch(newsletterArchiveUrl(accountId, limit), {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`[constant-contact] archive responded ${response.status} ${response.statusText}`);
      return [];
    }
    // The API lists oldest first; callers want the newest issue on top.
    const items = parseArchiveItems(await response.json()).reverse();
    return items.slice(0, limit);
  } catch (error) {
    console.warn("[constant-contact] archive fetch failed", error);
    return [];
  }
}

let loggedItemShape = false;

/** Validate an archive response of unknown shape into `NewsletterItem`s. */
export function parseArchiveItems(raw: unknown): NewsletterItem[] {
  const list = extractList(raw);
  if (!loggedItemShape && list.length > 0) {
    loggedItemShape = true;
    const first = list[0];
    console.info(
      "[constant-contact] archive item keys:",
      isRecord(first) ? Object.keys(first).join(", ") : typeof first,
    );
  }

  const items: NewsletterItem[] = [];
  for (const entry of list) {
    if (!isRecord(entry)) continue;
    const subject = typeof entry.subject === "string" ? entry.subject.trim() : "";
    const campaignUrl = typeof entry.campaignUrl === "string" ? entry.campaignUrl.trim() : "";
    if (!subject || !/^https?:\/\//i.test(campaignUrl)) continue;

    const item: NewsletterItem = { subject, campaignUrl };
    const dateKey = DATE_KEYS.find((key) => typeof entry[key] === "string" && entry[key]);
    if (dateKey) item.sentDate = entry[dateKey] as string;
    items.push(item);
  }
  return items;
}

/** The API returns a bare array today; tolerate a wrapper object just in case. */
function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw)) {
    for (const key of ["activities", "items", "results", "data"]) {
      const value = raw[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The hosted opt-in URL with the visitor's email added to its query. A URL that cannot
 * be parsed is returned as-is.
 */
export function signupPageUrl(signupUrl: string, email: string): string {
  try {
    const url = new URL(signupUrl);
    url.searchParams.set("email", email);
    return url.toString();
  } catch {
    return signupUrl;
  }
}
