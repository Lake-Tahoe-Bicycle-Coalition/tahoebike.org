"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

/**
 * The subset of the Turnstile JavaScript API this component uses.
 * https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */
type TurnstileApi = {
  render: (container: HTMLElement, options: { sitekey: string; theme?: "light" | "dark" | "auto" }) => string | undefined;
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

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile challenge. Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is absent, so local development needs no Cloudflare account.
 *
 * `resetKey`: pass the form's action state. A token is single-use, so the widget is
 * reset whenever the server answers (e.g. with validation errors) and the visitor
 * needs to submit again.
 */
export function TurnstileWidget({ resetKey }: { resetKey?: unknown }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lastResetKeyRef = useRef(resetKey);

  /** Idempotent: renders once per mount, and only once the script and container exist. */
  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!siteKey || !container || !turnstile || widgetIdRef.current !== null) return;
    widgetIdRef.current = turnstile.render(container, { sitekey: siteKey, theme: "light" }) ?? null;
  }, []);

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
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script src={TURNSTILE_SCRIPT_URL} strategy="afterInteractive" onReady={renderWidget} />
      <div ref={containerRef} />
    </>
  );
}
