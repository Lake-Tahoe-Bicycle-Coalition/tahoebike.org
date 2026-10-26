/* Server-only (database, client secret). */
import { prisma } from "@/lib/db";
import type { ApiConnection } from "@/lib/generated/prisma/client";

/**
 * Constant Contact V3 API: newsletter signups straight from the site's own form.
 * (lib/constant-contact.ts holds the public, key-free endpoints: the archive and the
 * hosted opt-in page that signups fall back to.)
 *
 * Verified against Constant Contact's developer docs and OpenAPI spec on 2026-10-26
 * (https://developer.constantcontact.com/api_reference/bundledWithSamples.yaml):
 *
 * - OAuth2 authorization code flow. The token request authenticates with HTTP Basic
 *   `client_id:client_secret`. Scopes `contact_data offline_access` (the latter is what
 *   returns a refresh token). Authorization codes are single-use and expire in 5 minutes.
 * - Access tokens last at most 24 hours. A refresh token expires after 180 days if it
 *   is never used, and with "rotating" refresh tokens (an app setting) every refresh
 *   returns a new one and invalidates the old. So the tokens live in the database
 *   (`ApiConnection`), every refresh stores whatever comes back, and a weekly cron
 *   (app/api/cron/constant-contact) keeps the refresh token in use.
 * - `POST /v3/contacts/sign_up_form` creates (201) or updates (200) a contact by email
 *   address and adds it to the given lists. It needs `contact_data`. It also re-opts-in
 *   a contact who had unsubscribed, which is right here because the visitor asked to
 *   subscribe. With Confirmed Opt-in enabled on the account, a new contact gets a
 *   confirmation email and stays `pending_confirmation` until they click it.
 * - The WordPress site knew the newsletter list only by its V2 id (docs/OPEN_QUESTIONS.md
 *   Q25). `GET /v3/contact_lists/list_id_xrefs` maps it to the V3 UUID once, at connect
 *   time; Constant Contact says that endpoint will be removed eventually, so the admin
 *   can also pick the list from `GET /v3/contact_lists`.
 * - Rate limits: 10,000 requests a day, 4 a second. Refreshing before every request
 *   gets a 429 from the token endpoint, hence the cached access token.
 *
 * The app is registered at https://app.constantcontact.com/pages/dma/portal under the
 * LTBC Constant Contact login; its client id and secret are the
 * CONSTANT_CONTACT_CLIENT_ID / CONSTANT_CONTACT_CLIENT_SECRET environment variables.
 */

const PROVIDER = "constant_contact";

const AUTHORIZE_URL = "https://authz.constantcontact.com/oauth2/default/v1/authorize";
const TOKEN_URL = "https://authz.constantcontact.com/oauth2/default/v1/token";
const API_BASE_URL = "https://api.cc.email/v3";
const SCOPES = "contact_data offline_access";

/** The newsletter list's V2 id from the WordPress plugin settings (Q25). */
const NEWSLETTER_V2_LIST_ID = "1199281500";

/** Refresh a little before the access token expires rather than mid-request. */
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

/** Used when a token response leaves out `expires_in`; short enough to be safe. */
const FALLBACK_EXPIRES_IN_SECONDS = 3600;

/** A visitor is waiting on the signup, so a slow API must not hang the form. */
const FETCH_TIMEOUT_MS = 8000;

export class ConstantContactError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ConstantContactError";
  }
}

function clientCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.CONSTANT_CONTACT_CLIENT_ID?.trim();
  const clientSecret = process.env.CONSTANT_CONTACT_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** Whether the app credentials are set, i.e. whether "Connect" can work at all. */
export function constantContactConfigured(): boolean {
  return clientCredentials() !== null;
}

/** Must match a redirect URI registered on the Constant Contact app exactly. */
export function oauthCallbackUrl(origin: string): string {
  return `${origin}/api/constant-contact/callback`;
}

export function authorizeUrl(state: string, redirectUri: string): string {
  const credentials = clientCredentials();
  if (!credentials) throw new ConstantContactError("Constant Contact app credentials are not set.");
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

// --- Tokens ----------------------------------------------------------------------

type TokenSet = { accessToken: string; refreshToken: string | null; expiresAt: Date };

async function requestTokens(params: Record<string, string>): Promise<TokenSet> {
  const credentials = clientCredentials();
  if (!credentials) throw new ConstantContactError("Constant Contact app credentials are not set.");
  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new ConstantContactError(
      `token endpoint responded ${response.status} ${await errorSummary(response)}`,
      response.status,
    );
  }

  const body: unknown = await response.json();
  const accessToken = isRecord(body) && typeof body.access_token === "string" ? body.access_token : "";
  if (!accessToken) throw new ConstantContactError("token endpoint returned no access_token");
  const refreshToken = isRecord(body) && typeof body.refresh_token === "string" ? body.refresh_token : null;
  const expiresIn =
    isRecord(body) && typeof body.expires_in === "number" && body.expires_in > 0
      ? body.expires_in
      : FALLBACK_EXPIRES_IN_SECONDS;
  return { accessToken, refreshToken, expiresAt: new Date(Date.now() + expiresIn * 1000) };
}

/**
 * Finishes the admin "Connect" flow: trades the authorization code for tokens, finds
 * the newsletter list, and stores the connection (replacing any earlier one).
 * Returns the list id, or null when the list could not be found automatically.
 */
export async function completeConnection(
  code: string,
  redirectUri: string,
  adminEmail: string,
): Promise<{ listId: string | null }> {
  const tokens = await requestTokens({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (!tokens.refreshToken) {
    throw new ConstantContactError("no refresh token returned; was the offline_access scope granted?");
  }

  let listId: string | null = null;
  try {
    listId = await lookUpV2ListId(tokens.accessToken, NEWSLETTER_V2_LIST_ID);
  } catch (error) {
    console.warn("[constant-contact] could not map the V2 newsletter list id", error);
  }
  // A reconnect keeps the list chosen earlier when the lookup finds nothing.
  const existing = await prisma.apiConnection.findUnique({ where: { provider: PROVIDER } });
  listId ??= existing?.listId ?? null;

  const data = {
    refreshToken: tokens.refreshToken,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: tokens.expiresAt,
    listId,
    connectedBy: adminEmail,
    connectedAt: new Date(),
  };
  await prisma.apiConnection.upsert({
    where: { provider: PROVIDER },
    create: { provider: PROVIDER, ...data },
    update: data,
  });
  return { listId };
}

export function getConnection(): Promise<ApiConnection | null> {
  return prisma.apiConnection.findUnique({ where: { provider: PROVIDER } });
}

/** Forgets the tokens. Signups fall back to the hosted opt-in page from then on. */
export async function deleteConnection(): Promise<void> {
  await prisma.apiConnection.deleteMany({ where: { provider: PROVIDER } });
}

export async function setNewsletterList(listId: string): Promise<void> {
  await prisma.apiConnection.update({ where: { provider: PROVIDER }, data: { listId } });
}

/**
 * A usable access token, refreshing (and storing the result) when the cached one is
 * missing, about to expire, or `force` is set. Throws when not connected or when the
 * refresh fails.
 */
async function accessToken(force = false): Promise<string> {
  const row = await getConnection();
  if (!row) throw new ConstantContactError("not connected");
  if (!force && row.accessToken && isFresh(row.accessTokenExpiresAt)) return row.accessToken;

  let tokens: TokenSet;
  try {
    tokens = await requestTokens({ grant_type: "refresh_token", refresh_token: row.refreshToken });
  } catch (error) {
    // With rotating refresh tokens, a concurrent request may have just used (and so
    // invalidated) the token we read. If it stored a fresh access token, use that.
    const latest = await getConnection();
    if (latest && latest.refreshToken !== row.refreshToken && latest.accessToken && isFresh(latest.accessTokenExpiresAt)) {
      return latest.accessToken;
    }
    throw error;
  }

  await prisma.apiConnection.update({
    where: { provider: PROVIDER },
    data: {
      refreshToken: tokens.refreshToken ?? row.refreshToken,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.expiresAt,
    },
  });
  return tokens.accessToken;
}

function isFresh(expiresAt: Date | null): boolean {
  return expiresAt !== null && expiresAt.getTime() - EXPIRY_MARGIN_MS > Date.now();
}

/** For the weekly cron: uses the refresh token so it never reaches its 180-day idle expiry. */
export async function refreshConnection(): Promise<"refreshed" | "not_connected"> {
  if (!(await getConnection())) return "not_connected";
  await accessToken(true);
  return "refreshed";
}

// --- API calls ---------------------------------------------------------------------

/** An authenticated V3 API request. Retries once with a refreshed token on a 401. */
async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { accept: "application/json", ...init.headers, authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

  const response = await send(await accessToken());
  if (response.status !== 401) return response;
  return send(await accessToken(true));
}

async function lookUpV2ListId(token: string, v2ListId: string): Promise<string | null> {
  const response = await fetch(
    `${API_BASE_URL}/contact_lists/list_id_xrefs?sequence_ids=${encodeURIComponent(v2ListId)}`,
    {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new ConstantContactError(`list_id_xrefs responded ${response.status} ${await errorSummary(response)}`, response.status);
  }
  // The spec says `{ xrefs: [...] }`; the migration guide shows a bare array. Accept both.
  const body: unknown = await response.json();
  const xrefs = Array.isArray(body) ? body : isRecord(body) && Array.isArray(body.xrefs) ? body.xrefs : [];
  for (const xref of xrefs) {
    if (isRecord(xref) && String(xref.sequence_id).replace(/^0+/, "") === v2ListId && typeof xref.list_id === "string") {
      return xref.list_id;
    }
  }
  return null;
}

export type ContactList = { listId: string; name: string };

/** The account's email lists, for the list picker in /admin/settings. */
export async function fetchContactLists(): Promise<ContactList[]> {
  const response = await apiFetch("/contact_lists?limit=1000&status=active");
  if (!response.ok) {
    throw new ConstantContactError(`contact_lists responded ${response.status} ${await errorSummary(response)}`, response.status);
  }
  const body: unknown = await response.json();
  const lists = isRecord(body) && Array.isArray(body.lists) ? body.lists : [];
  const out: ContactList[] = [];
  for (const list of lists) {
    if (isRecord(list) && typeof list.list_id === "string" && typeof list.name === "string") {
      out.push({ listId: list.list_id, name: list.name });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export type NewsletterSignupResult = "subscribed" | "not_connected" | "failed";

/**
 * Adds an address to the newsletter list. Never throws: "not_connected" (no app
 * credentials, no connection, or no list chosen) and "failed" both mean the caller
 * should fall back to the hosted opt-in page. The address itself is never logged.
 */
export async function subscribeToNewsletter(emailAddress: string): Promise<NewsletterSignupResult> {
  if (!constantContactConfigured()) return "not_connected";
  try {
    const row = await getConnection();
    if (!row?.listId) return "not_connected";

    const response = await apiFetch("/contacts/sign_up_form", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email_address: emailAddress, list_memberships: [row.listId] }),
    });
    if (response.ok) return "subscribed";
    console.error(`[constant-contact] sign_up_form responded ${response.status} ${await errorSummary(response)}`);
    return "failed";
  } catch (error) {
    console.error("[constant-contact] newsletter signup failed", error);
    return "failed";
  }
}

// --- Helpers -----------------------------------------------------------------------

/** A short, log-safe description of an error response (Constant Contact's error_key, if any). */
async function errorSummary(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const first = Array.isArray(body) ? body[0] : body;
    if (isRecord(first)) {
      const key = first.error_key ?? first.error;
      const message = first.error_message ?? first.error_description;
      return [key, message]
        .filter((part) => typeof part === "string")
        .join(": ")
        .replace(/\S+@\S+/g, "<email>");
    }
  } catch {
    // Not JSON.
  }
  return response.statusText;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
