/**
 * Cloudflare Turnstile server-side verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export type TurnstileResult = { ok: true; skipped: boolean } | { ok: false; error: string };

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

let warnedAboutHalfConfiguration = false;

/**
 * The two Turnstile variables only work as a pair: without the site key the widget
 * never renders and every submission is rejected; without the secret every
 * submission is accepted unverified. Say so once per process instead of failing silently.
 */
function warnIfHalfConfigured(secret: string | undefined): void {
  if (warnedAboutHalfConfiguration) return;
  warnedAboutHalfConfiguration = true;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (secret && !siteKey) {
    console.warn(
      "[turnstile] TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not: the widget never renders, so every form submission will be rejected.",
    );
  } else if (!secret && siteKey) {
    console.warn(
      "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is not: the widget renders but tokens are never verified.",
    );
  }
}

/**
 * Verifies a widget token. When TURNSTILE_SECRET_KEY is absent (local development)
 * verification is skipped and reported as `{ ok: true, skipped: true }`.
 */
export async function verifyTurnstile(
  token: string | null,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  warnIfHalfConfigured(secret);
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, error: "Missing Turnstile token." };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, { method: "POST", body });
    if (!response.ok) {
      return { ok: false, error: `Turnstile responded ${response.status}.` };
    }
    const data = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success === true) return { ok: true, skipped: false };
    const codes = data["error-codes"]?.join(", ") || "unknown";
    return { ok: false, error: `Turnstile rejected the token (${codes}).` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Turnstile verification failed: ${reason}` };
  }
}
