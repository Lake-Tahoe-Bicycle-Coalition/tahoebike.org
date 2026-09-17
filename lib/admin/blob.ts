import { del } from "@vercel/blob";
import { isOptimizableImageUrl, isSitePath } from "@/lib/urls";

/**
 * Admin-uploaded images live in Vercel Blob (public store). Uploads go straight from
 * the browser to Blob via app/api/admin/upload/route.ts; this module holds the
 * server-side bits.
 */

export const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Allowed upload types; SVG is excluded because it can carry scripts. */
export const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Every upload is filed under this prefix so the store is easy to audit. */
export const UPLOAD_PATH_PREFIX = "uploads/";

/** `true` for a URL in our Blob store (as opposed to a /public path or a pasted external URL). */
export function isBlobUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && !isSitePath(url) && isOptimizableImageUrl(url);
}

/**
 * Best-effort removal of a blob we no longer reference (row deleted, image replaced).
 * Failures are logged, never surfaced: an orphaned file costs cents, a failed admin
 * action costs a volunteer's evening.
 */
export async function deleteBlobIfOurs(url: string | null | undefined): Promise<void> {
  if (!blobConfigured || !isBlobUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error(`[blob] could not delete ${url}`, error);
  }
}
