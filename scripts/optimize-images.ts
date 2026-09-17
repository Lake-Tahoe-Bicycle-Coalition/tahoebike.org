/**
 * `pnpm content:optimize [--dry-run] [--all]`
 *
 * Resizes and recompresses oversized raster images under public/images in place
 * (docs/OPEN_QUESTIONS.md Q30). Paths and formats never change, because they are
 * referenced from page code, content/image-map.json and database rows seeded from
 * the WordPress export (homepage cards, board headshots).
 *
 * A file is a candidate when it is over SIZE_THRESHOLD_BYTES or its long edge is
 * over MAX_EDGE_PX. Each candidate is resized so the long edge is at most MAX_EDGE_PX
 * (never enlarged, aspect ratio kept), stripped of metadata, and re-encoded:
 *   - JPEG: mozjpeg, quality JPEG_QUALITY, progressive
 *   - PNG:  palette (8-bit, up to 256 colours) with alpha preserved, quality PNG_QUALITY
 *   - WebP: quality WEBP_QUALITY, alpha preserved
 * Embedded colour profiles (Display P3, Adobe RGB) are applied before stripping, so
 * the untagged output looks the same in a browser that assumes sRGB. Files whose
 * EXIF/XMP/IPTC carries a copyright or creator notice keep that EXIF and XMP (never the
 * profile) so the notice is not removed from the repository copy; next/image strips
 * it from what visitors download either way.
 *
 * SVG and GIF are skipped (sharp would rasterise the former and drop animation from
 * the latter). A file is overwritten only when the new encoding is at least
 * MIN_SAVING_RATIO smaller, so running the script twice changes nothing: a file that
 * is still over the size threshold after one pass re-encodes to about the same size
 * and is left alone rather than degraded again. `--all` ignores the size threshold
 * and re-encodes every raster file; `--dry-run` prints the table without writing.
 */
import { closeSync, openSync, readSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import sharp, { type Metadata, type Sharp } from "sharp";

const IMAGES_DIR = join("public", "images");
/** Files at or below this size are left alone unless they exceed MAX_EDGE_PX. */
const SIZE_THRESHOLD_BYTES = 300_000;
/** Longest edge after resizing; next/image never asks for more than 3840 and pages use far less. */
const MAX_EDGE_PX = 2400;
/** Overwrite only when the re-encoded file is at least this much smaller (idempotency guard). */
const MIN_SAVING_RATIO = 0.05;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 85;
const WEBP_QUALITY = 80;
const SKIPPED_EXTENSIONS = new Set([".svg", ".gif"]);
const RASTER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
/** EXIF IFD0 tags that hold a rights notice. */
const EXIF_ARTIST = 0x013b;
const EXIF_COPYRIGHT = 0x8298;
/** IPTC IIM record 2 datasets that hold a rights notice: by-line, credit, copyright notice. */
const IPTC_RIGHTS_DATASETS = [80, 110, 116];
/** XMP (XML text) markers: a non-empty dc:rights/dc:creator/photoshop:Credit, or the rights-managed flag. */
const XMP_RIGHTS_PATTERNS = [
  /<dc:(?:rights|creator)>\s*<rdf:(?:Alt|Seq)[^>]*>\s*<rdf:li[^>]*>\s*[^<\s]/,
  /xmpRights:Marked="True"/,
  /photoshop:Credit="[^"]+"/,
  /(?:©|Â©)\s*[A-Za-z0-9]/,
];

interface Result {
  file: string;
  status: "optimised" | "kept" | "skipped";
  before: number;
  after: number;
  beforeSize: string;
  afterSize: string;
  note: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${bytes} B`;
}

/** Locale-independent ordering so the report is stable everywhere. */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function walkFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort(byCodeUnit);
}

/**
 * Whether a PNG already uses a colour palette (IHDR colour type 3). Quantising a
 * palette PNG again drops more colours each time, so such files are only touched
 * when they need resizing.
 */
function isPalettePng(file: string): boolean {
  const header = Buffer.alloc(26);
  const fd = openSync(file, "r");
  try {
    readSync(fd, header, 0, header.length, 0);
  } finally {
    closeSync(fd);
  }
  return header.toString("latin1", 12, 16) === "IHDR" && header[25] === 3;
}

/** The value of an ASCII tag in IFD0 of an EXIF block ("Exif\0\0" + TIFF), or null. */
function exifAsciiTag(exif: Buffer, tag: number): string | null {
  const tiff = exif.toString("latin1", 0, 6) === "Exif\0\0" ? exif.subarray(6) : exif;
  if (tiff.length < 8) return null;
  const order = tiff.toString("latin1", 0, 2);
  if (order !== "II" && order !== "MM") return null;
  const u16 = (offset: number): number => (order === "II" ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset));
  const u32 = (offset: number): number => (order === "II" ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset));
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return null;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) return null;
    if (u16(entry) !== tag) continue;
    const type = u16(entry + 2);
    const length = u32(entry + 4);
    if (type !== 2 || length === 0) return null; // 2 = ASCII
    const offset = length <= 4 ? entry + 8 : u32(entry + 8);
    if (offset + length > tiff.length) return null;
    const value = tiff.toString("latin1", offset, offset + length).replace(/\0+$/, "").trim();
    return value === "" ? null : value;
  }
  return null;
}

/** Non-empty values of the given IPTC IIM record-2 datasets (0x1c 0x02 <dataset> <length> <data>). */
function iptcValues(iptc: Buffer, datasets: number[]): string[] {
  const values: string[] = [];
  let i = 0;
  while (i + 5 <= iptc.length) {
    if (iptc[i] !== 0x1c || iptc[i + 1] !== 2) {
      i++;
      continue;
    }
    const dataset = iptc[i + 2] ?? 0;
    let length = iptc.readUInt16BE(i + 3);
    let header = 5;
    if (length & 0x8000) {
      // Extended length: the low bits give the byte count of the real length.
      const lengthBytes = length & 0x7fff;
      if (lengthBytes > 4 || i + 5 + lengthBytes > iptc.length) break;
      length = 0;
      for (let k = 0; k < lengthBytes; k++) length = length * 256 + (iptc[i + 5 + k] ?? 0);
      header = 5 + lengthBytes;
    }
    if (datasets.includes(dataset)) {
      const value = iptc.toString("latin1", i + header, i + header + length).trim();
      if (value !== "") values.push(value);
    }
    i += header + length;
  }
  return values;
}

/** Whether the EXIF, XMP or IPTC blocks carry a copyright or creator notice. */
function hasRightsNotice(metadata: Metadata): boolean {
  const { exif, xmp, iptc } = metadata;
  if (Buffer.isBuffer(exif) && (exifAsciiTag(exif, EXIF_COPYRIGHT) !== null || exifAsciiTag(exif, EXIF_ARTIST) !== null)) {
    return true;
  }
  if (Buffer.isBuffer(iptc) && iptcValues(iptc, IPTC_RIGHTS_DATASETS).length > 0) return true;
  if (Buffer.isBuffer(xmp)) {
    // Decoded as latin1 so a UTF-8 "©" appears as "Â©" (matched by the last pattern).
    const text = xmp.toString("latin1");
    return XMP_RIGHTS_PATTERNS.some((pattern) => pattern.test(text));
  }
  return false;
}

function encode(pipeline: Sharp, format: string): Sharp {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true });
    case "png":
      return pipeline.png({ palette: true, quality: PNG_QUALITY, compressionLevel: 9, effort: 10 });
    case "webp":
      return pipeline.webp({ quality: WEBP_QUALITY, effort: 6 });
    default:
      throw new Error(`unsupported format ${format}`);
  }
}

async function optimise(file: string, options: { dryRun: boolean; all: boolean }): Promise<Result> {
  const before = statSync(file).size;
  const ext = extname(file).toLowerCase();
  const base = { file, before, after: before, beforeSize: formatBytes(before), afterSize: formatBytes(before) };
  if (SKIPPED_EXTENSIONS.has(ext) || !RASTER_EXTENSIONS.has(ext)) {
    return { ...base, status: "skipped", note: `${ext || "no extension"} is not optimised` };
  }

  const metadata = await sharp(file).metadata();
  const { width, height, format } = metadata;
  if (format === undefined || width === undefined || height === undefined) {
    return { ...base, status: "skipped", note: "could not read metadata" };
  }
  const longEdge = Math.max(width, height);
  const oversized = longEdge > MAX_EDGE_PX;
  if (!oversized && before <= SIZE_THRESHOLD_BYTES && !options.all) {
    return { ...base, status: "kept", note: `${width}x${height}, within limits` };
  }

  // sharp reports "jpeg" for .jpg/.jpeg; keep the file's own container format.
  const container = ext === ".png" ? "png" : ext === ".webp" ? "webp" : "jpeg";
  if (container !== format) {
    return { ...base, status: "skipped", note: `extension ${ext} but content is ${format}` };
  }
  if (container === "png" && !oversized && isPalettePng(file)) {
    return { ...base, status: "kept", note: `${width}x${height}, already a palette PNG` };
  }

  let pipeline = sharp(file).rotate(); // apply EXIF orientation before the metadata is stripped
  const keepsRights = hasRightsNotice(metadata);
  if (keepsRights) pipeline = pipeline.keepExif().keepXmp();
  if (oversized) {
    pipeline = pipeline.resize({
      width: MAX_EDGE_PX,
      height: MAX_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const output = await encode(pipeline, container).toBuffer({ resolveWithObject: true });
  const dims = `${width}x${height} -> ${output.info.width}x${output.info.height}${keepsRights ? ", copyright metadata kept" : ""}`;

  if (output.data.length > before * (1 - MIN_SAVING_RATIO)) {
    return { ...base, status: "kept", note: `${dims}, re-encoding saves under ${MIN_SAVING_RATIO * 100}%` };
  }
  if (!options.dryRun) writeFileSync(file, output.data);
  return {
    ...base,
    status: "optimised",
    after: output.data.length,
    afterSize: formatBytes(output.data.length),
    note: `${dims}${options.dryRun ? " (dry run)" : ""}`,
  };
}

function printTable(results: Result[]): void {
  const rows = results.map((r) => ({
    file: relative(IMAGES_DIR, r.file),
    status: r.status,
    before: r.beforeSize,
    after: r.status === "optimised" ? r.afterSize : "",
    note: r.note,
  }));
  const widths = {
    file: Math.max(4, ...rows.map((r) => r.file.length)),
    status: 9,
    before: Math.max(6, ...rows.map((r) => r.before.length)),
    after: Math.max(5, ...rows.map((r) => r.after.length)),
  };
  const line = (file: string, status: string, before: string, after: string, note: string): string =>
    `${file.padEnd(widths.file)}  ${status.padEnd(widths.status)}  ${before.padStart(widths.before)}  ${after.padStart(widths.after)}  ${note}`;
  console.log(line("file", "status", "before", "after", "note"));
  for (const row of rows) console.log(line(row.file, row.status, row.before, row.after, row.note));
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const options = { dryRun: args.has("--dry-run"), all: args.has("--all") };
  const files = walkFiles(IMAGES_DIR);
  const results: Result[] = [];
  for (const file of files) results.push(await optimise(file, options));

  printTable(results);

  const optimised = results.filter((r) => r.status === "optimised");
  const before = results.reduce((sum, r) => sum + r.before, 0);
  const after = results.reduce((sum, r) => sum + r.after, 0);
  console.log("");
  console.log(
    `${optimised.length} of ${results.length} files ${options.dryRun ? "would be " : ""}optimised, ` +
      `${results.filter((r) => r.status === "skipped").length} skipped.`,
  );
  console.log(`${IMAGES_DIR}: ${formatBytes(before)} -> ${formatBytes(after)} (saved ${formatBytes(before - after)}).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
