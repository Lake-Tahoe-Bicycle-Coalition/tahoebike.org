/**
 * `pnpm content:images [path/to/export.xml]`
 *
 * Downloads every tahoebike.org `wp-content/uploads` image referenced by the
 * published pages and Divi layouts (header, footer, library layouts) in the
 * WordPress export, including gallery images referenced by attachment id,
 * into public/images/YYYY/MM/<base>.<ext> (see lib/wp-export/images.ts for
 * the naming convention), and writes content/image-map.json mapping each
 * referenced source URL to its local public path.
 *
 * For each image the largest available original is fetched, trying in order:
 *   1. the export attachment with the same stripped name and no variant suffix,
 *   2. the `-scaled` attachment,
 *   3. the `-rotated` attachment,
 *   4. the referenced URL itself.
 * Existing files are skipped, so re-running is cheap and idempotent. Failures
 * are logged and reported at the end without aborting the run.
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  WP_EXPORT_PATH,
  collectGalleryIds,
  collectUploadUrls,
  hasVariantSuffix,
  isTahoebikeUploadUrl,
  localImagePath,
  parseUploadUrl,
  parseWpExport,
  type WpAttachment,
} from "../lib/wp-export";

const PUBLIC_DIR = "public";
const IMAGES_DIR = join(PUBLIC_DIR, "images");
const MAP_PATH = join("content", "image-map.json");
const CONCURRENCY = 4;
/** Files above this (decimal MB) are flagged in the report; nothing is resized. */
const LARGE_FILE_BYTES = 5_000_000;
const USER_AGENT = "tahoebike.org-migration/1.0 (+https://tahoebike.org)";

interface Reference {
  url: string;
  /** Where the URL was found, for diagnostics. */
  source: string;
}

interface Task {
  localPath: string;
  filePath: string;
  /** Download URLs to try, best first. */
  candidates: string[];
  references: Reference[];
}

interface Outcome {
  task: Task;
  status: "downloaded" | "exists" | "failed";
  from?: string;
  bytes?: number;
  errors: string[];
}

function toHttps(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

function variantRank(url: string): number {
  const parts = parseUploadUrl(url);
  if (!parts) return 99;
  const file = parts.file;
  if (!hasVariantSuffix(file)) return 0;
  if (/-scaled\.[^.]+$/.test(file)) return 1;
  if (/-rotated\.[^.]+$/.test(file)) return 2;
  if (/-e\d{10,}\.[^.]+$/.test(file)) return 3;
  const size = /-(\d+)x(\d+)\.[^.]+$/.exec(file);
  if (size) return 10 + 1 / (Number(size[1]) * Number(size[2])); // larger renditions first
  return 20;
}

/** Ordered download candidates for a local path (see file header). */
function candidatesFor(localPath: string, references: Reference[], attachments: WpAttachment[]): string[] {
  const matching = attachments.filter((att) => localImagePath(att.url) === localPath);
  const fileOf = (url: string): string => parseUploadUrl(url)?.file ?? "";
  const ordered: string[] = [];
  const push = (url: string | undefined): void => {
    if (url !== undefined && !ordered.includes(toHttps(url))) ordered.push(toHttps(url));
  };
  push(matching.find((att) => !hasVariantSuffix(fileOf(att.url)))?.url);
  push(matching.find((att) => /-scaled\.[^.]+$/.test(fileOf(att.url)))?.url);
  push(matching.find((att) => /-rotated\.[^.]+$/.test(fileOf(att.url)))?.url);
  for (const ref of [...references].sort((a, b) => variantRank(a.url) - variantRank(b.url))) {
    push(ref.url);
  }
  return ordered;
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (/^text\/html/i.test(contentType)) {
    throw new Error(`unexpected content-type ${contentType}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error("empty response body");
  return bytes;
}

async function runTask(task: Task): Promise<Outcome> {
  if (existsSync(task.filePath)) {
    return { task, status: "exists", bytes: statSync(task.filePath).size, errors: [] };
  }
  const errors: string[] = [];
  for (const candidate of task.candidates) {
    try {
      const bytes = await download(candidate);
      mkdirSync(dirname(task.filePath), { recursive: true });
      writeFileSync(task.filePath, bytes);
      console.log(`  downloaded ${task.localPath} (${formatBytes(bytes.length)}) from ${candidate}`);
      return { task, status: "downloaded", from: candidate, bytes: bytes.length, errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${candidate}: ${message}`);
      console.warn(`  failed ${candidate}: ${message}`);
    }
  }
  return { task, status: "failed", errors };
}

async function runAll(tasks: Task[], concurrency: number): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      if (task) outcomes.push(await runTask(task));
    }
  });
  await Promise.all(workers);
  return outcomes;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${bytes} B`;
}

/** Locale-independent ordering so generated files are byte-identical everywhere. */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

async function main(): Promise<void> {
  const xmlPath = process.argv[2] ?? WP_EXPORT_PATH;
  const data = parseWpExport(xmlPath);
  const attachmentsById = new Map(data.attachments.map((att) => [att.id, att]));

  // 1. Collect references from published pages and every Divi layout.
  const bodies: { source: string; body: string }[] = [
    ...data.pages.filter((p) => p.status === "publish").map((p) => ({ source: `page ${p.path}`, body: p.body })),
    ...data.layouts.map((l) => ({ source: `${l.type} ${l.slug}`, body: l.body })),
  ];
  const references = new Map<string, Reference>();
  const ignored = new Map<string, string>();
  const missingGalleryIds: string[] = [];
  for (const { source, body } of bodies) {
    for (const url of collectUploadUrls(body)) {
      if (isTahoebikeUploadUrl(url)) {
        if (!references.has(url)) references.set(url, { url, source });
      } else if (!ignored.has(url)) {
        ignored.set(url, source);
      }
    }
    for (const id of collectGalleryIds(body)) {
      const att = attachmentsById.get(id);
      if (!att) {
        missingGalleryIds.push(`${id} (${source})`);
      } else if (isTahoebikeUploadUrl(att.url)) {
        if (!references.has(att.url)) references.set(att.url, { url: att.url, source: `${source} gallery_ids` });
      } else {
        ignored.set(att.url, `${source} gallery_ids`);
      }
    }
  }

  // 2. One task per local file.
  const imageMap: Record<string, string> = {};
  const tasksByPath = new Map<string, Task>();
  for (const ref of references.values()) {
    const localPath = localImagePath(ref.url);
    if (!localPath) continue; // cannot happen: isTahoebikeUploadUrl passed
    imageMap[ref.url] = localPath;
    let task = tasksByPath.get(localPath);
    if (!task) {
      task = { localPath, filePath: join(PUBLIC_DIR, localPath), candidates: [], references: [] };
      tasksByPath.set(localPath, task);
    }
    task.references.push(ref);
  }
  const tasks = [...tasksByPath.values()].sort((a, b) => byCodeUnit(a.localPath, b.localPath));
  for (const task of tasks) task.candidates = candidatesFor(task.localPath, task.references, data.attachments);

  console.log(`Found ${references.size} referenced upload URLs -> ${tasks.length} local files`);
  if (ignored.size > 0) {
    console.log(`Ignoring ${ignored.size} upload URLs on other hosts:`);
    for (const [url, source] of ignored) console.log(`  ${url} (${source})`);
  }
  for (const missing of missingGalleryIds) console.warn(`  gallery id not in export: ${missing}`);

  // 3. Download.
  const outcomes = await runAll(tasks, CONCURRENCY);

  // 4. Write the map (sorted, deterministic).
  const sortedMap = Object.fromEntries(Object.entries(imageMap).sort(([a], [b]) => byCodeUnit(a, b)));
  mkdirSync(dirname(MAP_PATH), { recursive: true });
  writeFileSync(MAP_PATH, JSON.stringify(sortedMap, null, 2) + "\n");

  // 5. Report.
  const downloaded = outcomes.filter((o) => o.status === "downloaded");
  const existing = outcomes.filter((o) => o.status === "exists");
  const failed = outcomes.filter((o) => o.status === "failed");
  console.log("");
  console.log(`Downloaded ${downloaded.length}, already present ${existing.length}, failed ${failed.length}.`);
  console.log(`Wrote ${MAP_PATH} with ${Object.keys(sortedMap).length} entries.`);

  const files = walkFiles(IMAGES_DIR);
  const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
  console.log(`${IMAGES_DIR}: ${files.length} files, ${formatBytes(totalBytes)} total.`);
  const large = files
    .map((file) => ({ file, bytes: statSync(file).size }))
    .filter(({ bytes }) => bytes > LARGE_FILE_BYTES);
  if (large.length > 0) {
    console.log(`Files over ${formatBytes(LARGE_FILE_BYTES)}:`);
    for (const { file, bytes } of large) console.log(`  ${file} (${formatBytes(bytes)})`);
  }

  if (failed.length > 0) {
    console.error("");
    console.error("Failed downloads:");
    for (const outcome of failed) {
      console.error(`  ${outcome.task.localPath} (referenced from ${outcome.task.references.map((r) => r.source).join(", ")})`);
      for (const error of outcome.errors) console.error(`    ${error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
