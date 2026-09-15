/**
 * Parse a WordPress WXR export (Tools → Export) into typed data.
 *
 * The export is RSS with `wp:` and `content:` namespaced elements; most values
 * are CDATA. Page bodies are Divi shortcodes with HTML inside; they are
 * returned raw so callers can use the helpers in ./shortcodes and ./extract.
 */
import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";

/** The export checked into the repo; the source of truth for all copy and image URLs. */
export const WP_EXPORT_PATH = "reference/laketahoebicyclecoalition.WordPress.2026-09-15.xml";

export interface WpPage {
  id: number;
  /** `wp:post_name`; empty for some drafts. */
  slug: string;
  /**
   * Site-relative path built from the `wp:post_parent` hierarchy, with a leading
   * and no trailing slash (`/programs/bike-kitchen`). The home page is `/`.
   * Pages with no slug (unpublished drafts) get `/?page_id=<id>`, matching their link.
   */
  path: string;
  title: string;
  /** `publish`, `draft`, … */
  status: string;
  parentId: number | null;
  /** Raw `content:encoded` (Divi shortcodes + HTML). */
  body: string;
  /** ISO 8601 UTC timestamp from `wp:post_modified_gmt`. */
  modified: string;
  /** The page's URL on the WordPress site. */
  link: string;
  menuOrder: number;
}

export interface WpAttachment {
  id: number;
  /** The post the file was uploaded to, if any. */
  parentId: number | null;
  title: string;
  /** `wp:attachment_url`: the full-size (or `-scaled`/`-rotated`) file URL. */
  url: string;
  /** The attachment page URL (`https://tahoebike.org/<slug>/`). */
  link: string;
}

export interface WpNavMenuItem {
  id: number;
  /** Menu slug from the `nav_menu` category, e.g. `primary`. */
  menu: string;
  /** `wp:menu_order` within the menu. */
  order: number;
  /** Parent menu item id (for nested menus), or null at the top level. */
  parentItemId: number | null;
  /** `post_type`, `custom`, `taxonomy`, … */
  type: string;
  /** For `post_type` items the linked post type (`page`); for custom links `custom`. */
  objectType: string;
  /** For `post_type` items the linked post id. */
  objectId: number | null;
  /** The raw title; empty when WordPress falls back to the linked page's title. */
  title: string;
  /** Title with the page-title fallback applied. */
  label: string;
  /** The custom URL, or the linked page's `path`. */
  url: string;
  /** `_blank` or empty. */
  target: string;
}

export type WpLayoutType = "et_header_layout" | "et_footer_layout" | "et_pb_layout";

export interface WpLayout {
  id: number;
  type: WpLayoutType;
  slug: string;
  title: string;
  status: string;
  body: string;
  modified: string;
}

export interface WpExport {
  siteUrl: string;
  pages: WpPage[];
  attachments: WpAttachment[];
  navMenuItems: WpNavMenuItem[];
  layouts: WpLayout[];
}

type XmlValue = string | number | boolean | XmlNode | XmlValue[] | null | undefined;
type XmlNode = { [key: string]: XmlValue };

const ARRAY_TAGS = new Set(["item", "wp:postmeta", "category", "wp:author", "wp:term", "wp:category"]);

function isNode(value: XmlValue): value is XmlNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Text of a child element, whether it is a bare string or `{ "#text": ..., "@_attr": ... }`. */
function text(node: XmlNode, key: string): string {
  const value = node[key];
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const first = value[0];
    return first === undefined ? "" : text({ v: first }, "v");
  }
  const inner = value["#text"];
  return typeof inner === "string" ? inner : inner === undefined || inner === null ? "" : String(inner);
}

function int(node: XmlNode, key: string): number {
  const value = Number.parseInt(text(node, key), 10);
  return Number.isFinite(value) ? value : 0;
}

function idOrNull(node: XmlNode, key: string): number | null {
  const value = int(node, key);
  return value > 0 ? value : null;
}

function list(node: XmlNode, key: string): XmlNode[] {
  const value = node[key];
  if (Array.isArray(value)) return value.filter(isNode);
  return isNode(value) ? [value] : [];
}

/** `wp:post_modified_gmt` (`2026-04-20 20:29:59`) → `2026-04-20T20:29:59Z`. */
function gmtToIso(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(value.trim());
  return match ? `${match[1]}T${match[2]}Z` : value;
}

function postmeta(item: XmlNode): Map<string, string> {
  const meta = new Map<string, string>();
  for (const entry of list(item, "wp:postmeta")) {
    meta.set(text(entry, "wp:meta_key"), text(entry, "wp:meta_value"));
  }
  return meta;
}

function menuSlug(item: XmlNode): string {
  for (const category of list(item, "category")) {
    if (text({ v: category["@_domain"] }, "v") === "nav_menu") {
      return text({ v: category["@_nicename"] }, "v");
    }
  }
  return "";
}

function isLayoutType(type: string): type is WpLayoutType {
  return type === "et_header_layout" || type === "et_footer_layout" || type === "et_pb_layout";
}

export function parseWpExportXml(xml: string): WpExport {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseTagValue: false,
    parseAttributeValue: false,
    cdataPropName: false, // merge CDATA into the element's text, unchanged
    processEntities: true,
    isArray: (tagName) => ARRAY_TAGS.has(tagName),
  });
  const doc = parser.parse(xml) as XmlNode;
  const rss = doc["rss"];
  const channel = isNode(rss) ? rss["channel"] : undefined;
  if (!isNode(channel)) {
    throw new Error("Not a WordPress export: no <rss><channel> element found.");
  }
  const siteUrl = text(channel, "wp:base_site_url").replace(/\/+$/, "");
  const items = list(channel, "item");
  if (items.length === 0) {
    throw new Error("WordPress export contains no <item> elements.");
  }

  const rawPages: { item: XmlNode; page: Omit<WpPage, "path"> }[] = [];
  const attachments: WpAttachment[] = [];
  const rawMenuItems: { item: XmlNode; meta: Map<string, string> }[] = [];
  const layouts: WpLayout[] = [];

  for (const item of items) {
    const type = text(item, "wp:post_type");
    if (type === "page") {
      rawPages.push({
        item,
        page: {
          id: int(item, "wp:post_id"),
          slug: text(item, "wp:post_name"),
          title: text(item, "title"),
          status: text(item, "wp:status"),
          parentId: idOrNull(item, "wp:post_parent"),
          body: text(item, "content:encoded"),
          modified: gmtToIso(text(item, "wp:post_modified_gmt")),
          link: text(item, "link"),
          menuOrder: int(item, "wp:menu_order"),
        },
      });
    } else if (type === "attachment") {
      attachments.push({
        id: int(item, "wp:post_id"),
        parentId: idOrNull(item, "wp:post_parent"),
        title: text(item, "title"),
        url: text(item, "wp:attachment_url"),
        link: text(item, "link"),
      });
    } else if (type === "nav_menu_item") {
      rawMenuItems.push({ item, meta: postmeta(item) });
    } else if (isLayoutType(type)) {
      layouts.push({
        id: int(item, "wp:post_id"),
        type,
        slug: text(item, "wp:post_name"),
        title: text(item, "title"),
        status: text(item, "wp:status"),
        body: text(item, "content:encoded"),
        modified: gmtToIso(text(item, "wp:post_modified_gmt")),
      });
    }
  }

  // Build paths from the parent hierarchy.
  const byId = new Map(rawPages.map(({ page }) => [page.id, page]));
  const siteRoot = `${siteUrl}/`;
  const pathOf = (page: Omit<WpPage, "path">, depth = 0): string => {
    if (page.link === siteRoot || page.link === siteUrl) return "/";
    if (page.slug === "") return `/?page_id=${page.id}`;
    if (depth > 20) throw new Error(`Page hierarchy loop detected at page ${page.id}`);
    const parent = page.parentId === null ? undefined : byId.get(page.parentId);
    const parentPath = parent ? pathOf(parent, depth + 1) : "";
    return `${parentPath === "/" ? "" : parentPath}/${page.slug}`;
  };
  const pages: WpPage[] = rawPages.map(({ page }) => ({ ...page, path: pathOf(page) }));
  const pageById = new Map(pages.map((page) => [page.id, page]));

  const navMenuItems: WpNavMenuItem[] = rawMenuItems
    .map(({ item, meta }) => {
      const type = meta.get("_menu_item_type") ?? "";
      const objectType = meta.get("_menu_item_object") ?? "";
      const objectIdRaw = Number.parseInt(meta.get("_menu_item_object_id") ?? "", 10);
      const objectId = Number.isFinite(objectIdRaw) && objectIdRaw > 0 ? objectIdRaw : null;
      const parentRaw = Number.parseInt(meta.get("_menu_item_menu_item_parent") ?? "", 10);
      const title = text(item, "title");
      const linkedPage = type === "post_type" && objectId !== null ? pageById.get(objectId) : undefined;
      return {
        id: int(item, "wp:post_id"),
        menu: menuSlug(item),
        order: int(item, "wp:menu_order"),
        parentItemId: Number.isFinite(parentRaw) && parentRaw > 0 ? parentRaw : null,
        type,
        objectType,
        objectId,
        title,
        label: title !== "" ? title : (linkedPage?.title ?? ""),
        url: type === "custom" ? (meta.get("_menu_item_url") ?? "") : (linkedPage?.path ?? ""),
        target: meta.get("_menu_item_target") ?? "",
      };
    })
    .sort((a, b) => a.menu.localeCompare(b.menu) || a.order - b.order);

  return { siteUrl, pages, attachments, navMenuItems, layouts };
}

/** Parse the export at `xmlPath` (relative to the current working directory). */
export function parseWpExport(xmlPath: string = WP_EXPORT_PATH): WpExport {
  let xml: string;
  try {
    xml = readFileSync(xmlPath, "utf8");
  } catch (error) {
    throw new Error(`Could not read WordPress export at ${xmlPath}: ${String(error)}`);
  }
  return parseWpExportXml(xml);
}

/** Find a page by its site path (`/about`), published pages first. Throws if absent. */
export function requirePage(data: WpExport, path: string): WpPage {
  const page =
    data.pages.find((p) => p.path === path && p.status === "publish") ??
    data.pages.find((p) => p.path === path);
  if (!page) {
    throw new Error(`Page ${path} not found in the WordPress export.`);
  }
  return page;
}
