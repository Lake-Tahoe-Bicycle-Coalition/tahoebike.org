/**
 * Code-level feature flags: switches a developer flips per deployment, as opposed to
 * the site settings that admins edit at /admin (`lib/settings.ts`).
 *
 * There is one flag family so far. The Bike Valet request and the Bike Rack
 * application each exist twice: as the embedded Google Form the old site used, and
 * as a native form that stores submissions in the database (docs/OPEN_QUESTIONS.md,
 * Q16 and Q17). The site launches with the Google Forms; the native forms stay in
 * the code so the two can be compared later.
 *
 * `NATIVE_FORMS` selects which native forms replace their Google Form: a
 * comma-separated list of `valet` and/or `racks`, or `all` / `none`. Unset (the
 * default) means none. Set it in the Vercel project (per environment) or in `.env`;
 * a change takes effect on the next deployment, since the pages are prerendered.
 *
 * Server-only: `process.env.NATIVE_FORMS` is not exposed to the browser.
 */

export const NATIVE_FORM_NAMES = ["valet", "racks"] as const;

export type NativeFormName = (typeof NATIVE_FORM_NAMES)[number];

/**
 * The Google Forms the old site embedded, keyed by the native form that would
 * replace them. Plain `viewform` URLs; `GoogleFormEmbed` adds `embedded=true` for
 * the iframe and links to this URL for the new-tab fallback.
 */
export const GOOGLE_FORM_URLS: Record<NativeFormName, string> = {
  valet: "https://docs.google.com/forms/d/1vMeWKttoO9zJynpM7h6SihKUeX6iqqpAIFToyhrEPrk/viewform",
  racks:
    "https://docs.google.com/forms/d/e/1FAIpQLScvMJk1HoApEevcLeAPsTJvd4rfuEWGCk0mJOeQZk1zum6OWA/viewform",
};

const ENV_VAR = "NATIVE_FORMS";

let warnedAboutUnknownNames = false;

function isNativeFormName(value: string): value is NativeFormName {
  return (NATIVE_FORM_NAMES as readonly string[]).includes(value);
}

/**
 * The set of native forms enabled by `NATIVE_FORMS`. Parsed on every call; it is a
 * handful of string operations. Unknown names are ignored, with a warning once per
 * process so a typo such as `rack` does not silently leave the Google Form in place.
 */
export function enabledNativeForms(): ReadonlySet<NativeFormName> {
  const raw = process.env[ENV_VAR]?.trim().toLowerCase() ?? "";
  if (raw === "" || raw === "none") return new Set();
  if (raw === "all") return new Set(NATIVE_FORM_NAMES);

  const enabled = new Set<NativeFormName>();
  const unknown: string[] = [];
  for (const token of raw.split(",")) {
    const name = token.trim();
    if (name === "") continue;
    if (isNativeFormName(name)) enabled.add(name);
    else unknown.push(name);
  }
  if (unknown.length > 0 && !warnedAboutUnknownNames) {
    warnedAboutUnknownNames = true;
    console.warn(
      `[feature-flags] ${ENV_VAR} contains unknown form name(s) ${unknown.join(", ")}; expected ${NATIVE_FORM_NAMES.join(", ")}, all or none.`,
    );
  }
  return enabled;
}

/** Whether the site's own form (not the Google Form) is shown and accepts submissions. */
export function nativeFormEnabled(name: NativeFormName): boolean {
  return enabledNativeForms().has(name);
}
