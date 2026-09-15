/**
 * The image path convention shared by the download script, the seed, and the
 * page ports.
 *
 * A source URL `https?://(www.)?tahoebike.org/wp-content/uploads/YYYY/MM/<file>`
 * maps to the local file `public/images/YYYY/MM/<base>.<ext>`, served at
 * `/images/YYYY/MM/<base>.<ext>`, where `<base>` is the filename with these
 * suffixes stripped, repeatedly until none match:
 * - `-<digits>x<digits>` (resized variants)
 * - `-scaled`
 * - `-rotated`
 * - `-e<10 or more digits>` (WordPress edited-copy marker)
 * The extension is kept as-is (`jpeg` stays `jpeg`).
 */

const UPLOAD_URL_RE = /^https?:\/\/(?:www\.)?tahoebike\.org\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^/?#]+)(?:[?#].*)?$/i;

/** Matches any `wp-content/uploads` URL on any host, for scanning bodies. */
export const ANY_UPLOAD_URL_RE = /https?:\/\/[^\s"'<>()[\]]+?\/wp-content\/uploads\/[^\s"'<>()[\]]+/g;

export interface UploadUrlParts {
  year: string;
  month: string;
  /** The filename exactly as referenced, e.g. `Nick-Speal-150x150.jpg`. */
  file: string;
  /** Filename with variant suffixes stripped, e.g. `Nick-Speal.jpg`. */
  base: string;
}

export function isTahoebikeUploadUrl(url: string): boolean {
  return UPLOAD_URL_RE.test(url);
}

/** Strip WordPress variant suffixes from a filename until none match. */
export function stripVariantSuffixes(file: string): string {
  const dot = file.lastIndexOf(".");
  if (dot <= 0) return file;
  let stem = file.slice(0, dot);
  const ext = file.slice(dot);
  const suffix = /(?:-\d+x\d+|-scaled|-rotated|-e\d{10,})$/;
  while (suffix.test(stem)) stem = stem.replace(suffix, "");
  return stem + ext;
}

/** Whether a filename carries any of the variant suffixes. */
export function hasVariantSuffix(file: string): boolean {
  return stripVariantSuffixes(file) !== file;
}

/** Split a tahoebike.org upload URL into its parts, or null if it is not one. */
export function parseUploadUrl(url: string): UploadUrlParts | null {
  const match = UPLOAD_URL_RE.exec(url);
  if (!match) return null;
  const [, year, month, rawFile] = match;
  if (year === undefined || month === undefined || rawFile === undefined) return null;
  let file = rawFile;
  try {
    file = decodeURIComponent(rawFile);
  } catch {
    // keep as-is
  }
  return { year, month, file, base: stripVariantSuffixes(file) };
}

/** Public path (`/images/YYYY/MM/<base>.<ext>`) for a tahoebike.org upload URL, or null. */
export function localImagePath(url: string): string | null {
  const parts = parseUploadUrl(url);
  if (!parts) return null;
  return `/images/${parts.year}/${parts.month}/${parts.base}`;
}

/** Every `wp-content/uploads` URL (any host) referenced in a body, in order, de-duplicated. */
export function collectUploadUrls(body: string): string[] {
  const seen = new Set<string>();
  for (const match of body.matchAll(ANY_UPLOAD_URL_RE)) {
    seen.add(match[0]);
  }
  return [...seen];
}

/** Attachment ids from every `gallery_ids="1,2,3"` attribute in a body. */
export function collectGalleryIds(body: string): number[] {
  const ids = new Set<number>();
  for (const match of body.matchAll(/gallery_ids="([^"]*)"/g)) {
    for (const part of (match[1] ?? "").split(",")) {
      const id = Number.parseInt(part.trim(), 10);
      if (Number.isFinite(id)) ids.add(id);
    }
  }
  return [...ids];
}
