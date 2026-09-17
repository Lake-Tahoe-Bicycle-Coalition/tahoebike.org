/**
 * `pnpm content:image-index`
 *
 * Writes docs/IMAGE_INDEX.md: every image the public site shows, with a thumbnail,
 * where it is used and the alt text it gets, grouped by page, so the alt text can be
 * reviewed in one place (docs/OPEN_QUESTIONS.md Q29). Sources:
 *
 *   1. `<Image>` / `<img>` elements in app/ and components/ whose `src` is a literal
 *      `/images/...` path (or a data URL built from one, as in app/opengraph-image.tsx).
 *   2. Object literals with `src: "/images/..."` and `alt:` (the photo arrays pages
 *      pass to galleries). The element that renders them is found through the
 *      array's `.map((item) => <Image ...>)` in the same file, or through a component
 *      the array is passed to (`<PhotoGallery photos={galleryPhotos} />`), and any alt
 *      template such as `${map.alt} (PDF, opens in a new tab)` is applied.
 *   3. `pageMetadata({ image: { url, alt } })` Open Graph images.
 *   4. Database-seeded images: homepage cards and board headshots are parsed from the
 *      WordPress export exactly as prisma/seed.ts does, and the alt each one gets is
 *      read from the `<Image>` in components/hero-cards.tsx and components/board-roster.tsx.
 *      Rows edited in /admin after seeding are not visible to this script.
 *   5. The favicon (app/icon.png), the Apple touch icon (app/apple-icon.png) and the
 *      default share image (app/opengraph-image.tsx).
 *
 * Admin pages (app/admin, components/admin) are skipped: they preview whatever URL
 * an editor types and show no site content. The final section lists the files in
 * public/images nothing above references. Output is deterministic (sorted, no dates),
 * so re-running without changes leaves the document untouched.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import {
  WP_EXPORT_PATH,
  extractSlides,
  extractTeamMembers,
  parseWpExport,
  requirePage,
} from "../lib/wp-export";

const OUTPUT_PATH = join("docs", "IMAGE_INDEX.md");
const IMAGES_DIR = join("public", "images");
const IMAGE_MAP_PATH = join("content", "image-map.json");
const SOURCE_DIRS = ["app", "components"];
const SKIPPED_DIRS = [join("app", "admin"), join("components", "admin")];
const THUMBNAIL_WIDTH = 120;

interface Entry {
  /** Site path, e.g. /images/2022/05/x.jpg, or an app/ file for icons. */
  path: string;
  /** Where it is used: file:line plus a short description. */
  usage: string;
  /** Orders entries within a section: source order for code, then seeded rows, then icons. */
  sortKey: string;
  /** Alt text as rendered; null when the element has no alt attribute at all. */
  alt: string | null;
  /** Extra context for the reviewer (rendering component, template, seed origin). */
  note: string;
}

interface Section {
  title: string;
  entries: Entry[];
}

/** A parsed JSX `<Image>` / `<img>` element. */
interface ImageElement {
  file: string;
  line: number;
  /** Offset of `<` in the file. */
  start: number;
  attrs: Map<string, Attr>;
}

/** A JSX attribute value: a string literal, or the source text of a `{...}` expression. */
type Attr = { kind: "string"; value: string } | { kind: "expr"; source: string };

/** An object literal such as `{ src: "/images/x.jpg", alt: "..." }`. */
interface ObjectLiteral {
  file: string;
  line: number;
  start: number;
  fields: Record<string, string>;
}

/** Locale-independent ordering so the generated file is byte-identical everywhere. */
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
  return files.sort(byCodeUnit);
}

function sourceFiles(): string[] {
  return SOURCE_DIRS.flatMap(walkFiles).filter(
    (file) => file.endsWith(".tsx") && !SKIPPED_DIRS.some((dir) => file.startsWith(dir + "/")),
  );
}

function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${bytes} B`;
}

/** Sort key for a source location: file, then line as a fixed-width number. */
function locationKey(file: string, line: number): string {
  return `0 ${file}:${String(line).padStart(6, "0")}`;
}

/** Returns the offset just past the bracket that closes the one at `open`. */
function matchBracket(text: string, open: number): number {
  const pairs: Record<string, string> = { "{": "}", "[": "]", "(": ")" };
  const close = pairs[text[open] ?? ""];
  if (close === undefined) throw new Error(`no bracket at ${open}`);
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < text.length; i++) {
    const ch = text[i] ?? "";
    if (quote !== null) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{" || ch === "[" || ch === "(") depth++;
    else if (ch === "}" || ch === "]" || ch === ")") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error(`unbalanced bracket at ${open}`);
}

// --- Source parsing --------------------------------------------------------------

/** Parses the attributes of one JSX element, starting after the tag name. */
function parseAttributes(text: string, from: number): { attrs: Map<string, Attr>; end: number } {
  const attrs = new Map<string, Attr>();
  let i = from;
  while (i < text.length) {
    const ch = text[i] ?? "";
    if (/\s/.test(ch)) {
      i++;
    } else if (ch === "/" || ch === ">") {
      return { attrs, end: text.indexOf(">", i) + 1 };
    } else if (text.startsWith("{/*", i)) {
      i = text.indexOf("*/}", i) + 3;
    } else if (ch === "{") {
      i = matchBracket(text, i); // spread attribute
    } else {
      const name = /^[A-Za-z_][\w:.-]*/.exec(text.slice(i))?.[0];
      if (!name) throw new Error(`cannot parse JSX attribute at ${lineOf(text, i)}`);
      i += name.length;
      while (/\s/.test(text[i] ?? "")) i++;
      if (text[i] !== "=") {
        attrs.set(name, { kind: "expr", source: "true" });
        continue;
      }
      i++;
      while (/\s/.test(text[i] ?? "")) i++;
      if (text[i] === '"' || text[i] === "'") {
        const quote = text[i] ?? '"';
        const end = text.indexOf(quote, i + 1);
        attrs.set(name, { kind: "string", value: text.slice(i + 1, end) });
        i = end + 1;
      } else if (text[i] === "{") {
        const end = matchBracket(text, i);
        attrs.set(name, { kind: "expr", source: text.slice(i + 1, end - 1).trim() });
        i = end;
      } else {
        throw new Error(`cannot parse JSX attribute value at ${lineOf(text, i)}`);
      }
    }
  }
  return { attrs, end: i };
}

function findImageElements(file: string, text: string): ImageElement[] {
  const elements: ImageElement[] = [];
  const re = /<(Image|img)(?=[\s/>])/g;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    const { attrs } = parseAttributes(text, m.index + m[0].length);
    elements.push({ file, line: lineOf(text, m.index), start: m.index, attrs });
  }
  return elements;
}

/** Object literals without nested braces whose fields are string or template literals. */
function findObjectLiterals(file: string, text: string): ObjectLiteral[] {
  const objects: ObjectLiteral[] = [];
  const re = /\{[^{}]*\}/g;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    const fields: Record<string, string> = {};
    const fieldRe = /(\w+):\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`([^`]*)`)/g;
    for (let f = fieldRe.exec(m[0]); f !== null; f = fieldRe.exec(m[0])) {
      const name = f[1];
      const value = f[2] ?? f[3] ?? f[4];
      if (name !== undefined && value !== undefined) fields[name] = value;
    }
    if (Object.keys(fields).length > 0) objects.push({ file, line: lineOf(text, m.index), start: m.index, fields });
  }
  return objects;
}

/** Name of the `const x = [...]` array literal that contains `offset`, if any. */
function enclosingArrayConst(text: string, offset: number): string | null {
  const re = /const\s+(\w+)(?:\s*:\s*[^=]+?)?\s*=\s*\[/g;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    const open = m.index + m[0].length - 1;
    if (open < offset && matchBracket(text, open) > offset) return m[1] ?? null;
  }
  return null;
}

/** Whether `offset` sits inside an `image: { ... }` object (a pageMetadata share image). */
function insideMetadataImage(text: string, offset: number): boolean {
  const re = /\bimage:\s*\{/g;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    const open = m.index + m[0].length - 1;
    if (open <= offset && matchBracket(text, open) > offset) return true;
  }
  return false;
}

function describeAttr(attr: Attr | undefined): string {
  if (attr === undefined) return "(no alt attribute)";
  return attr.kind === "string" ? `"${attr.value}"` : `{${attr.source}}`;
}

/**
 * Resolves an alt attribute for one item: literals as-is; `{item.alt}` and
 * `` {`${item.alt} suffix`} `` with the item's field values substituted.
 */
function resolveAlt(attr: Attr | undefined, item: Record<string, string>): string | null {
  if (attr === undefined) return null;
  if (attr.kind === "string") return attr.value;
  const source = attr.source.trim();
  const direct = /^(\w+)\.(\w+)$/.exec(source);
  if (direct) {
    const value = item[direct[2] ?? ""];
    return value ?? `{${source}}`;
  }
  const template = /^`([^`]*)`$/.exec(source);
  if (template) {
    return (template[1] ?? "").replace(/\$\{(\w+)\.(\w+)\}/g, (whole, _obj: string, field: string) => item[field] ?? whole);
  }
  return `{${source}}`;
}

/**
 * The `<Image>` that renders items of `arrayName` (via `arrayName.map((item) =>`),
 * in this file or in a component the array is passed to as a prop.
 */
function findRenderer(
  file: string,
  text: string,
  arrayName: string,
  elementsByFile: Map<string, ImageElement[]>,
  textsByFile: Map<string, string>,
): { element: ImageElement; param: string } | null {
  const mapRe = new RegExp(`\\b${arrayName}\\.map\\(\\(\\s*(\\w+)`);
  const m = mapRe.exec(text);
  if (m) {
    const element = (elementsByFile.get(file) ?? []).find((el) => el.start > m.index);
    if (element) return { element, param: m[1] ?? "item" };
  }
  // Passed as a prop: <Component prop={arrayName} /> with `import { Component } from "@/components/x"`.
  const propRe = new RegExp(`<(\\w+)[^>]*?\\b(\\w+)=\\{${arrayName}\\}`, "s");
  const p = propRe.exec(text);
  if (!p) return null;
  const [, component, prop] = p;
  const importRe = new RegExp(`import\\s*\\{[^}]*\\b${component}\\b[^}]*\\}\\s*from\\s*"@/([^"]+)"`);
  const imp = importRe.exec(text);
  if (!imp) return null;
  const componentFile = `${imp[1]}.tsx`;
  const componentText = textsByFile.get(componentFile);
  if (componentText === undefined) return null;
  const innerRe = new RegExp(`\\b${prop}\\.map\\(\\(\\s*(\\w+)`);
  const inner = innerRe.exec(componentText);
  if (!inner) return null;
  const element = (elementsByFile.get(componentFile) ?? []).find((el) => el.start > inner.index);
  return element ? { element, param: inner[1] ?? "item" } : null;
}

// --- Page grouping ---------------------------------------------------------------

/** "/about" for app/about/page.tsx, "/" for app/page.tsx, null otherwise. */
function routeOf(file: string): string | null {
  const m = /^app\/(.*?)\/?page\.tsx$/.exec(file);
  if (!m) return null;
  return m[1] === "" ? "/" : `/${m[1]}`;
}

/** Pages (or the layout) that import a component, as section titles. */
function importers(componentFile: string, textsByFile: Map<string, string>): string[] {
  const specifier = `@/${componentFile.replace(/\.tsx$/, "")}`;
  const titles: string[] = [];
  for (const [file, text] of textsByFile) {
    if (!text.includes(`"${specifier}"`)) continue;
    if (file === "app/layout.tsx") titles.push("Every page (app/layout.tsx)");
    const route = routeOf(file);
    if (route !== null) titles.push(route);
  }
  return titles;
}

/** Orders sections: every-page first, then routes alphabetically, then the rest. */
function sectionOrder(title: string): string {
  if (title.startsWith("Every page")) return "0";
  if (title.startsWith("/")) return `1${title}`;
  return `2${title}`;
}

// --- Seeded content --------------------------------------------------------------

interface SeededSource {
  component: string;
  /** Section title of the page that renders the component. */
  items: { label: string; path: string; fields: Record<string, string>; origin: string }[];
}

function seededSources(): SeededSource[] {
  const data = parseWpExport(WP_EXPORT_PATH);
  const imageMap = JSON.parse(readFileSync(IMAGE_MAP_PATH, "utf8")) as Record<string, string>;
  const local = (url: string, context: string): string => {
    const path = imageMap[url];
    if (path === undefined) throw new Error(`${context}: ${url} is not in ${IMAGE_MAP_PATH}`);
    return path;
  };
  const cards = extractSlides(requirePage(data, "/").body)
    .filter((slide) => slide.backgroundImage !== null)
    .map((slide) => ({
      label: `homepage card "${slide.heading}"`,
      path: local(slide.backgroundImage ?? "", `card "${slide.heading}"`),
      fields: { title: slide.heading, blurb: slide.text, imageUrl: "" },
      origin: "prisma/seed.ts seedHomepageCards (HomepageCard.imageUrl)",
    }));
  const members = extractTeamMembers(requirePage(data, "/about").body)
    .filter((member) => member.imageUrl !== null)
    .map((member) => ({
      label: `board member ${member.name}`,
      path: local(member.imageUrl ?? "", `board member ${member.name}`),
      fields: { name: member.name, role: member.position ?? "", photoUrl: "" },
      origin: "prisma/seed.ts seedBoard (BoardMember.photoUrl)",
    }));
  return [
    { component: "components/hero-cards.tsx", items: cards },
    { component: "components/board-roster.tsx", items: members },
  ];
}

/** "identical to X" or "a WxH rendering of X" when an icon matches a brand file, else null. */
async function brandOrigin(icon: string, brandFiles: string[]): Promise<string | null> {
  const iconBytes = readFileSync(icon);
  const twin = brandFiles.find((file) => readFileSync(file).equals(iconBytes));
  if (twin) return `identical to /${relative("public", twin)}`;
  const target = await sharp(icon).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const file of brandFiles) {
    const candidate = await sharp(file)
      .resize(target.info.width, target.info.height)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (candidate.data.length !== target.data.length) continue;
    let diff = 0;
    for (let i = 0; i < target.data.length; i++) diff += Math.abs((target.data[i] ?? 0) - (candidate.data[i] ?? 0));
    if (diff / target.data.length < 10) {
      return `a ${target.info.width}x${target.info.height} rendering of /${relative("public", file)}`;
    }
  }
  return null;
}

// --- Main ------------------------------------------------------------------------

async function main(): Promise<void> {
  const files = sourceFiles();
  const textsByFile = new Map(files.map((file) => [file, readFileSync(file, "utf8")] as const));
  const elementsByFile = new Map(files.map((file) => [file, findImageElements(file, textsByFile.get(file) ?? "")] as const));

  const sections = new Map<string, Entry[]>();
  const add = (title: string, entry: Entry): void => {
    const list = sections.get(title) ?? [];
    list.push(entry);
    sections.set(title, list);
  };
  const sectionsFor = (file: string): string[] => {
    const route = routeOf(file);
    if (route !== null) return [route];
    const titles = importers(file, textsByFile);
    return titles.length > 0 ? titles : [file];
  };

  // 1. Elements with a literal /images src.
  for (const [file, elements] of elementsByFile) {
    for (const el of elements) {
      const src = el.attrs.get("src");
      if (src?.kind !== "string" || !src.value.startsWith("/images/")) continue;
      const alt = el.attrs.get("alt");
      for (const title of sectionsFor(file)) {
        add(title, {
          path: src.value,
          usage: `${file}:${el.line}`,
          sortKey: locationKey(file, el.line),
          alt: alt?.kind === "string" ? alt.value : null,
          note: alt?.kind === "expr" ? `alt is ${describeAttr(alt)}` : "",
        });
      }
    }
  }

  // 2. Photo objects and 3. metadata images.
  for (const [file, text] of textsByFile) {
    for (const obj of findObjectLiterals(file, text)) {
      const src = obj.fields.src;
      const url = obj.fields.url;
      if (src !== undefined && src.startsWith("/images/")) {
        const arrayName = enclosingArrayConst(text, obj.start);
        const renderer = arrayName === null ? null : findRenderer(file, text, arrayName, elementsByFile, textsByFile);
        const alt = renderer ? resolveAlt(renderer.element.attrs.get("alt"), obj.fields) : (obj.fields.alt ?? null);
        const rendered = renderer ? `rendered by ${renderer.element.file}:${renderer.element.line}` : "renderer not found";
        const template =
          renderer && renderer.element.attrs.get("alt")?.kind === "expr" && alt !== obj.fields.alt
            ? `; alt template ${describeAttr(renderer.element.attrs.get("alt"))}`
            : "";
        for (const title of sectionsFor(file)) {
          add(title, {
            path: src,
            usage: `${file}:${obj.line}${arrayName ? ` (\`${arrayName}\`)` : ""}`,
            sortKey: locationKey(file, obj.line),
            alt,
            note: `${rendered}${template}`,
          });
        }
      } else if (url !== undefined && url.startsWith("/images/") && insideMetadataImage(text, obj.start)) {
        for (const title of sectionsFor(file)) {
          add(title, {
            path: url,
            usage: `${file}:${obj.line}`,
            sortKey: locationKey(file, obj.line),
            alt: obj.fields.alt ?? null,
            note: "Open Graph share image (`pageMetadata({ image })`); the alt is the og:image:alt tag",
          });
        }
      }
    }
  }

  // 4. Seeded rows rendered by components.
  for (const source of seededSources()) {
    const element = (elementsByFile.get(source.component) ?? [])[0];
    if (!element) throw new Error(`${source.component}: no <Image> found`);
    const altAttr = element.attrs.get("alt");
    source.items.forEach((item, index) => {
      for (const title of sectionsFor(source.component)) {
        add(title, {
          path: item.path,
          usage: `${item.label} via seed`,
          sortKey: `1 ${source.component} ${String(index).padStart(4, "0")}`,
          alt: resolveAlt(altAttr, item.fields),
          note: `${item.origin}; rendered by ${source.component}:${element.line} with alt ${describeAttr(altAttr)}`,
        });
      }
    });
  }

  // 5. Icons and the default share image.
  const referenced = new Set<string>();
  const iconEntries: Entry[] = [];
  const brandFiles = walkFiles(join(IMAGES_DIR, "brand"));
  const icons = [
    { file: "app/icon.png", usage: "favicon (Next.js file convention, served at /icon.png)" },
    { file: "app/apple-icon.png", usage: "Apple touch icon (Next.js file convention, served at /apple-icon.png)" },
  ];
  for (const icon of icons) {
    if (!existsSync(icon.file)) continue;
    const origin = await brandOrigin(icon.file, brandFiles);
    iconEntries.push({
      path: icon.file,
      usage: icon.usage,
      sortKey: `2 ${icon.file}`,
      alt: null,
      note: `icons have no alt text${origin ? `; ${origin}` : ""}`,
    });
  }
  const ogFile = "app/opengraph-image.tsx";
  const ogText = textsByFile.get(ogFile) ?? "";
  const ogAlt = /export const alt = "((?:[^"\\]|\\.)*)"/.exec(ogText)?.[1] ?? null;
  const ogAssets = [...ogText.matchAll(/"public\/(images\/[^"]+)"/g)].map((m) => `/${m[1]}`);
  const ogImgs = elementsByFile.get(ogFile) ?? [];
  for (const asset of ogAssets) {
    referenced.add(asset);
    const line = lineOf(ogText, ogText.indexOf(asset.slice(1)));
    iconEntries.push({
      path: asset,
      usage: `${ogFile}:${line}`,
      sortKey: locationKey(ogFile, line),
      alt: ogImgs[0] ? resolveAlt(ogImgs[0].attrs.get("alt"), {}) : null,
      note:
        `drawn into the default Open Graph image (1200x630, yellow background, emblem plus the site name and tagline)` +
        `; the emblem's own alt inside the generated image is ${describeAttr(ogImgs[0]?.attrs.get("alt"))}` +
        (ogAlt !== null ? `; the share image's alt is "${ogAlt}"` : ""),
    });
  }
  sections.set("Icons and default share image", iconEntries);

  // Metadata for every file under public/images and the app icons.
  const info = new Map<string, { size: number; dims: string }>();
  const describe = async (file: string, key: string): Promise<void> => {
    const size = statSync(file).size;
    let dims = "?";
    try {
      const meta = await sharp(file).metadata();
      dims = `${meta.width}x${meta.height}`;
    } catch {
      // not a raster sharp can read (e.g. SVG without librsvg); size alone is fine
    }
    info.set(key, { size, dims });
  };
  for (const file of walkFiles(IMAGES_DIR)) await describe(file, `/${relative("public", file)}`);
  for (const icon of icons) if (existsSync(icon.file)) await describe(icon.file, icon.file);
  for (const entries of sections.values()) for (const entry of entries) referenced.add(entry.path);
  const unused = [...info.keys()].filter((path) => path.startsWith("/images/") && !referenced.has(path));

  // Render.
  const cell = (text: string): string => text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const thumb = (path: string): string => {
    const rel = path.startsWith("/images/") ? `../public${path}` : `../${path}`;
    return `<img src="${rel}" width="${THUMBNAIL_WIDTH}" alt="">`;
  };
  const describeFile = (path: string): string => {
    const meta = info.get(path);
    return meta ? `\`${path}\`<br>${meta.dims}, ${formatBytes(meta.size)}` : `\`${path}\` (missing!)`;
  };
  const altCell = (alt: string | null): string => {
    if (alt === null) return "_none_";
    if (alt === "") return '_decorative_ (`alt=""`)';
    return cell(alt);
  };

  const orderedSections: Section[] = [...sections.entries()]
    .map(([title, entries]) => ({ title, entries: [...entries].sort((a, b) => byCodeUnit(a.sortKey, b.sortKey) || byCodeUnit(a.path, b.path)) }))
    .sort((a, b) => byCodeUnit(sectionOrder(a.title), sectionOrder(b.title)));
  const total = orderedSections.reduce((sum, s) => sum + s.entries.length, 0);
  const distinct = new Set(orderedSections.flatMap((s) => s.entries.map((e) => e.path))).size;

  const out: string[] = [];
  out.push("# Image and alt-text index");
  out.push("");
  out.push(
    "Every image the public site shows, with the alt text it gets, grouped by page, for reviewing the alt text " +
      "(docs/OPEN_QUESTIONS.md Q29). **Generated** by `pnpm content:image-index` (scripts/image-index.ts); " +
      "do not edit by hand, re-run it after changing images or alt text.",
  );
  out.push("");
  out.push("How to change alt text:");
  out.push("");
  out.push("- Images in page code: edit the `alt` in the file named in the *Used in* column (app/ and components/).");
  out.push(
    "- Homepage cards and board headshots come from the database (seeded from the WordPress export by prisma/seed.ts). " +
      "Their alt text is derived in the rendering component: cards are decorative (`alt=\"\"`, the card title sits next to " +
      "the image), headshots use the member's name. Change the derivation in the component; change the image or the " +
      "name in `/admin` (or in the export before re-seeding).",
  );
  out.push("- Open Graph share images (`pageMetadata({ image })`) are what Facebook, Slack, etc. show for a link; their alt is the `og:image:alt` tag.");
  out.push("");
  out.push("Alt text on the old site existed only for sponsor logos and board headshots (the member's name); the rest was written during the migration from the image content and file names, so it needs a human check. Photo credits: none were shown on the old site and none were added (Q29).");
  out.push("");
  out.push(`**${total} image uses** (${distinct} distinct files) across ${orderedSections.length} sections; **${unused.length} unreferenced files** in public/images (last section).`);
  out.push("");
  out.push("Thumbnails are relative links into public/images, so they render in GitHub and VS Code previews. Sizes are the committed files; next/image serves resized copies.");

  for (const section of orderedSections) {
    out.push("");
    out.push(`## ${section.title}`);
    out.push("");
    out.push("| Thumbnail | File | Used in | Alt text | Notes |");
    out.push("|---|---|---|---|---|");
    for (const entry of section.entries) {
      out.push(`| ${thumb(entry.path)} | ${describeFile(entry.path)} | ${cell(entry.usage)} | ${altCell(entry.alt)} | ${cell(entry.note)} |`);
    }
  }

  out.push("");
  out.push("## Unreferenced files in public/images");
  out.push("");
  out.push(
    "Nothing in app/, components/, the seeded rows or the icons references these. The dated folders were downloaded " +
      "because the WordPress export referenced them somewhere (old sliders, footers, sponsor logos, unused " +
      "attachments); each is still listed in content/image-map.json and its old `wp-content/uploads` URL redirects " +
      "here (lib/redirects.generated.ts), so deleting one breaks inbound links to that file. Sponsor logos may be " +
      "wanted back once sponsors are decided. Files under `brand/` are the source artwork for the icons and the " +
      "share image and are kept on purpose.",
  );
  out.push("");
  out.push("| Thumbnail | File | Size |");
  out.push("|---|---|---|");
  let unusedBytes = 0;
  for (const path of unused) {
    const meta = info.get(path);
    if (!meta) continue;
    unusedBytes += meta.size;
    out.push(`| ${thumb(path)} | \`${path}\`<br>${meta.dims} | ${formatBytes(meta.size)} |`);
  }
  out.push("");
  out.push(`${unused.length} files, ${formatBytes(unusedBytes)} in total.`);
  out.push("");

  const content = out.join("\n");
  const previous = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf8") : null;
  if (!existsSync(dirname(OUTPUT_PATH))) throw new Error(`${dirname(OUTPUT_PATH)} does not exist`);
  writeFileSync(OUTPUT_PATH, content);
  console.log(
    `${previous === content ? "Unchanged" : "Wrote"} ${OUTPUT_PATH}: ${total} image uses (${distinct} files) in ${orderedSections.length} sections, ${unused.length} unreferenced files (${formatBytes(unusedBytes)}).`,
  );
  const missing = orderedSections.flatMap((s) => s.entries).filter((e) => e.path.startsWith("/images/") && !info.has(e.path));
  for (const entry of missing) console.warn(`  missing file: ${entry.path} (${entry.usage})`);
  if (missing.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
