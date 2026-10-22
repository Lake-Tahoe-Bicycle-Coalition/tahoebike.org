"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The subset of the Turnstile JavaScript API this component uses.
 * https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string | undefined;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * `render=explicit`: the script must not scan the DOM for `.cf-turnstile` elements,
 * because next/script loads each `src` once per page lifetime and never re-runs it after
 * a client-side navigation. The widget is rendered from `renderWidget` instead.
 */
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Inlined at build time: changing it needs a redeploy. */
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** True when the spam check is configured; forms use it to wait for a token before submitting. */
export const turnstileEnabled = Boolean(siteKey);

/**
 * Cloudflare Turnstile challenge. Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is absent, so local development needs no Cloudflare account.
 *
 * `resetKey`: pass the form's action state. A token is single-use, so the widget is
 * reset whenever the server answers (e.g. with validation errors) and the visitor
 * needs to submit again.
 *
 * `onReadyChange`: called with true once a token exists and false whenever it is
 * missing again (reset, expiry, error), so the submit button can wait for the check.
 * `contactEmail`: shown if the check expires, fails to load, or JavaScript is off.
 */
export function TurnstileWidget({
  resetKey,
  contactEmail,
  onReadyChange,
}: {
  resetKey?: unknown;
  contactEmail?: string;
  onReadyChange?: (ready: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);
  const onReadyChangeRef = useRef(onReadyChange);
  useEffect(() => {
    onReadyChangeRef.current = onReadyChange;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lastResetKeyRef = useRef(resetKey);

  const resetWidget = useCallback(() => {
    const widgetId = widgetIdRef.current;
    if (widgetId === null) return;
    try {
      window.turnstile?.reset(widgetId);
    } catch {
      // The widget is already gone.
    }
  }, []);

  /** Idempotent: renders once per mount, and only once the script and container exist. */
  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!siteKey || !container || !turnstile || widgetIdRef.current !== null) return;
    widgetIdRef.current =
      turnstile.render(container, {
        sitekey: siteKey,
        theme: "light",
        callback: () => {
          setFailed(false);
          onReadyChangeRef.current?.(true);
        },
        "expired-callback": () => {
          onReadyChangeRef.current?.(false);
          setFailed(true);
          resetWidget();
        },
        "error-callback": () => {
          onReadyChangeRef.current?.(false);
          setFailed(true);
          resetWidget();
        },
      }) ?? null;
  }, [resetWidget]);

  // Covers the script being loaded before this effect runs (e.g. a client-side
  // navigation back to a form page). <Script onReady> covers the first load and also
  // fires on every re-mount, which the guard in renderWidget makes harmless.
  useEffect(() => {
    renderWidget();
    return () => {
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId === null) return;
      try {
        window.turnstile?.remove(widgetId);
      } catch {
        // The widget is already gone (e.g. its iframe was removed with the page).
      }
    };
  }, [renderWidget]);

  useEffect(() => {
    if (Object.is(lastResetKeyRef.current, resetKey)) return;
    lastResetKeyRef.current = resetKey;
    const widgetId = widgetIdRef.current;
    if (widgetId !== null) window.turnstile?.reset(widgetId);
    onReadyChangeRef.current?.(false);
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script src={TURNSTILE_SCRIPT_URL} strategy="afterInteractive" onReady={renderWidget} />
      <div ref={containerRef} />
      {failed ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
          The spam check expired or could not load. Try again, or email us
          {contactEmail ? (
            <>
              {" "}at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </>
          ) : null}
          .
        </p>
      ) : null}
      <noscript>
        <p className="text-sm">
          This form needs JavaScript for its spam check. Please email us
          {contactEmail ? (
            <>
              {" "}at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </>
          ) : null}
          .
        </p>
      </noscript>
    </>
  );
}
