/**
 * Minimal Divi/WordPress shortcode helpers.
 *
 * Divi page bodies look like `[et_pb_section ...][et_pb_row ...]...[/et_pb_row][/et_pb_section]`
 * with HTML between the tags. These helpers are regex based and cover the
 * subset of syntax the export uses: double-quoted attributes, no nesting of a
 * tag inside itself, and Divi's `%22`/`%91`/`%92`/`%93` attribute escapes.
 */
import { decodeHtmlEntities } from "./html";

export interface Shortcode {
  /** Tag name, e.g. `et_pb_team_member`. */
  tag: string;
  /** Decoded attributes. */
  attrs: Record<string, string>;
  /** Content between the opening and closing tag (raw HTML/shortcodes); empty for self-closing tags. */
  inner: string;
  /** The full matched text. */
  raw: string;
}

/**
 * Undo Divi's attribute escaping (`%22` → `"`, `%91` → `[`, `%92` → `\`, `%93` → `]`)
 * and decode HTML entities. Divi does not URL-encode anything else, so a full
 * `decodeURIComponent` would be wrong (and would throw on a literal `%`).
 */
export function decodeDiviAttribute(value: string): string {
  const unescaped = value
    .replace(/%22/g, '"')
    .replace(/%91/g, "[")
    .replace(/%92/g, "\\")
    .replace(/%93/g, "]");
  return decodeHtmlEntities(unescaped).trim();
}

/** Parse `key="value" key2="value2"` into an object, decoding Divi escapes. */
export function parseShortcodeAttributes(attrText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_][\w-]*)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrText)) !== null) {
    const key = match[1];
    const value = match[2];
    if (key !== undefined && value !== undefined) attrs[key] = decodeDiviAttribute(value);
  }
  return attrs;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find every occurrence of `[tag ...]...[/tag]` (or self-closing `[tag ...]`
 * with no closing tag) in document order. Does not support a tag nested
 * inside itself.
 */
export function findShortcodes(body: string, tag: string): Shortcode[] {
  const t = escapeRegExp(tag);
  // Opening tag: `[tag` followed by whitespace+attributes or directly by `]`.
  // The lookahead stops `et_pb_slide` from matching `et_pb_slider`.
  const re = new RegExp(`\\[${t}(?=[\\s\\]])([^\\]]*)\\](?:([\\s\\S]*?)\\[\\/${t}\\])?`, "g");
  const results: Shortcode[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    results.push({
      tag,
      attrs: parseShortcodeAttributes(match[1] ?? ""),
      inner: match[2] ?? "",
      raw: match[0],
    });
  }
  return results;
}

/**
 * Like `findShortcodes` but throws with a clear message when nothing matches,
 * so a change in the export surfaces immediately instead of seeding nothing.
 */
export function requireShortcodes(body: string, tag: string, context: string): Shortcode[] {
  const found = findShortcodes(body, tag);
  if (found.length === 0) {
    throw new Error(`Expected at least one [${tag}] shortcode in ${context}, found none.`);
  }
  return found;
}

/**
 * Remove every shortcode tag (opening, closing, self-closing), leaving the HTML
 * between them. Useful for turning a Divi body into something `htmlToText`
 * can flatten. Attribute-only modules (images, buttons, sliders) lose their
 * content, so use the dedicated extractors for structured data.
 */
export function stripShortcodes(body: string): string {
  return body.replace(/\[\/?[a-zA-Z][\w-]*(?:\s[^\]]*)?\]/g, "");
}
