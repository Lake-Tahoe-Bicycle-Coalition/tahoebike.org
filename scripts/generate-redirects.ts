/**
 * `pnpm content:redirects`
 *
 * Rebuilds lib/redirects.generated.ts, the data behind the WordPress-era
 * redirects in lib/redirects.ts:
 *
 *   - attachment pages (`/<slug>/`, sometimes nested under the page the file
 *     was uploaded to) → that page's current path, or `/`
 *   - `?page_id=N` / `?p=N` for every published page → its current path or
 *     its retired-page target (ids resolving to `/`, drafts, and unknown ids
 *     get no rule and render the home page as-is)
 *   - `?attachment_id=N` → the same target as the attachment page
 *   - every `wp-content/uploads` URL in content/image-map.json → its `/images` path
 *
 * The output is deterministic (sorted, no timestamps) so re-running it on an
 * unchanged export and image map is a no-op. It fails loudly when a published
 * page is neither ported nor listed in `retiredPages`, or when a generated
 * source would shadow a real page.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { publicPaths } from "../lib/navigation";
import { retiredPages } from "../lib/redirects";
import { WP_EXPORT_PATH, parseWpExport, type WpAttachment, type WpPage } from "../lib/wp-export";

const OUT_PATH = "lib/redirects.generated.ts";
const IMAGE_MAP_PATH = "content/image-map.json";

const currentPaths: ReadonlySet<string> = new Set(publicPaths);
const reservedSources: ReadonlySet<string> = new Set([...publicPaths, ...Object.keys(retiredPages)]);

const data = parseWpExport();
const pageById = new Map<number, WpPage>(data.pages.map((page) => [page.id, page]));
const attachmentById = new Map<number, WpAttachment>(data.attachments.map((att) => [att.id, att]));

/** Where a WordPress page lives now, or null for drafts. Throws for published pages nobody accounted for. */
function pageDestination(page: WpPage): string | null {
  if (page.status !== "publish") return null;
  const retired = retiredPages[page.path];
  if (retired !== undefined) return retired;
  if (currentPaths.has(page.path)) return page.path;
  throw new Error(
    `Published page ${page.path} (id ${page.id}) is neither in publicPaths nor in retiredPages; ` +
      "add it to one of them.",
  );
}

/** The page an attachment belongs to (following attachment-in-attachment nesting), or `/`. */
function attachmentDestination(att: WpAttachment, depth = 0): string {
  if (att.parentId === null || depth > 10) return "/";
  const page = pageById.get(att.parentId);
  if (page) return pageDestination(page) ?? "/";
  const parent = attachmentById.get(att.parentId);
  if (parent) return attachmentDestination(parent, depth + 1);
  return "/"; // parent is a post type the export does not contain
}

/** Site-relative path of a WordPress link, without the trailing slash Next strips itself. */
function sourcePath(link: string): string {
  const path = new URL(link).pathname;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** Escape the characters path-to-regexp treats as syntax in a redirect `source`. */
function escapeSource(path: string): string {
  return path.replace(/[(){}:*+?]/g, "\\$&");
}

function assertDestination(destination: string, context: string): void {
  if (destination.startsWith("https://")) return;
  if (destination === "/" || currentPaths.has(destination)) return;
  throw new Error(`${context}: destination ${destination} is not a public path.`);
}

function byKey<T extends string | number>(a: readonly [T, string], b: readonly [T, string]): number {
  return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
}

// (a) attachment pages
const attachmentPages = new Map<string, string>();
for (const att of data.attachments) {
  const source = sourcePath(att.link);
  if (source === "/" || reservedSources.has(source)) {
    throw new Error(`Attachment ${att.id} (${att.link}) would shadow the real page at ${source}.`);
  }
  const destination = attachmentDestination(att);
  assertDestination(destination, `Attachment ${att.id}`);
  const existing = attachmentPages.get(source);
  if (existing !== undefined && existing !== destination) {
    throw new Error(`Attachment page ${source} maps to both ${existing} and ${destination}.`);
  }
  attachmentPages.set(source, destination);
}

// (b) ids. Ids that resolve to "/" (the home page itself, drafts) get no rule:
// `/?page_id=N` already renders the home page, and a redirect from `/` to `/`
// would loop because Next keeps the query string (see lib/redirects.ts).
const pageIds: [number, string][] = [];
const homeIds: number[] = [];
for (const page of data.pages) {
  const destination = pageDestination(page) ?? "/";
  if (destination === "/") {
    homeIds.push(page.id);
  } else {
    pageIds.push([page.id, destination]);
  }
}
const attachmentIds: [number, string][] = data.attachments
  .map((att): [number, string] => [att.id, attachmentDestination(att)])
  .filter(([, destination]) => destination !== "/");

// (c) old upload URLs
const imageMap = JSON.parse(readFileSync(IMAGE_MAP_PATH, "utf8")) as Record<string, string>;
const uploads = new Map<string, string>();
for (const [url, destination] of Object.entries(imageMap)) {
  const source = new URL(url).pathname;
  if (!destination.startsWith("/images/")) {
    throw new Error(`${IMAGE_MAP_PATH}: ${url} maps to ${destination}, expected an /images path.`);
  }
  const existing = uploads.get(source);
  if (existing !== undefined && existing !== destination) {
    throw new Error(`${IMAGE_MAP_PATH}: ${source} maps to both ${existing} and ${destination}.`);
  }
  uploads.set(source, destination);
}

const attachmentPageEntries = [...attachmentPages]
  .map(([source, destination]): [string, string] => [escapeSource(source), destination])
  .sort(byKey);
const uploadEntries = [...uploads]
  .map(([source, destination]): [string, string] => [escapeSource(source), destination])
  .sort(byKey);
pageIds.sort(byKey);
attachmentIds.sort(byKey);
homeIds.sort((a, b) => a - b);

function tuples(entries: ReadonlyArray<readonly [string | number, string]>): string {
  return entries.map(([a, b]) => `  [${JSON.stringify(a)}, ${JSON.stringify(b)}],`).join("\n");
}

const output = `// GENERATED FILE - DO NOT EDIT.
// Built by scripts/generate-redirects.ts (\`pnpm content:redirects\`) from
// ${WP_EXPORT_PATH} and ${IMAGE_MAP_PATH}.
// lib/redirects.ts turns these entries into next.config redirects.

/** WordPress attachment pages → the current path of the page the file was uploaded to, or "/". */
export const attachmentPageRedirects: ReadonlyArray<readonly [source: string, destination: string]> = [
${tuples(attachmentPageEntries)}
];

/**
 * \`/?page_id=N\` and \`/?p=N\` → the page's current path or retired-page target.
 * Ids that resolve to "/" (${homeIds.join(", ")}: the home page and drafts) and
 * unknown ids have no rule; those URLs render the home page as-is.
 */
export const pageIdRedirects: ReadonlyArray<readonly [id: number, destination: string]> = [
${tuples(pageIds)}
];

/** \`/?attachment_id=N\` for attachments with a ported parent page; all others render the home page as-is. */
export const attachmentIdRedirects: ReadonlyArray<readonly [id: number, destination: string]> = [
${tuples(attachmentIds)}
];

/** Old \`wp-content/uploads\` paths (http and https collapsed) → their \`/images\` path. */
export const uploadRedirects: ReadonlyArray<readonly [source: string, destination: string]> = [
${tuples(uploadEntries)}
];
`;

writeFileSync(OUT_PATH, output);

const withParent = attachmentPageEntries.filter(([, destination]) => destination !== "/").length;
console.log(`Wrote ${OUT_PATH}`);
console.log(`  attachment pages: ${attachmentPageEntries.length} (${withParent} with a parent page)`);
console.log(`  page ids: ${pageIds.length} (no rule for ids resolving to "/": ${homeIds.join(", ")})`);
console.log(`  attachment ids with a parent page: ${attachmentIds.length}`);
console.log(`  upload URLs: ${uploadEntries.length} (from ${Object.keys(imageMap).length} image-map keys)`);
