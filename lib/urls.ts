/**
 * URL classification helpers shared by components, pages, and next.config.ts.
 * Pure string logic: safe to import from server and client code alike.
 */

/** Hostname pattern for admin-uploaded images in Vercel Blob (next.config images.remotePatterns). */
export const VERCEL_BLOB_IMAGE_HOSTNAME = "*.public.blob.vercel-storage.com";

const VERCEL_BLOB_HOST_SUFFIX = VERCEL_BLOB_IMAGE_HOSTNAME.slice(1); // ".public.blob.vercel-storage.com"

/** `true` for http(s) URLs, which the site opens in a new tab. */
export function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** `true` for a site-relative path such as `/join` or `/images/x.jpg` (not `//host`). */
export function isSitePath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * Whether next/image may optimize this `src`: a path under /public, or an https URL
 * on the Vercel Blob host allowed in next.config.ts. Anything else (an image an
 * admin pasted from elsewhere) must be rendered `unoptimized`, or next/image throws.
 */
export function isOptimizableImageUrl(url: string): boolean {
  if (isSitePath(url)) return true;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname.endsWith(VERCEL_BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}
