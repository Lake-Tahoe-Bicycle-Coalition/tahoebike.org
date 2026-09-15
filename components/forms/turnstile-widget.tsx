"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    turnstile?: { reset: (container?: string | HTMLElement) => void };
  }
}

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
  useEffect(() => {
    if (resetKey === undefined) return;
    window.turnstile?.reset();
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </>
  );
}
