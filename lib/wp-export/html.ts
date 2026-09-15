/**
 * Small HTML → plain-text helpers for WordPress/Divi page bodies.
 * No DOM, no dependencies: the export's HTML is simple enough for regexes.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  laquo: "«",
  raquo: "»",
  bull: "•",
  middot: "·",
  copy: "©",
  reg: "®",
  trade: "™",
  deg: "°",
  times: "×",
  divide: "÷",
  plusmn: "±",
  para: "¶",
  sect: "§",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  larr: "←",
  rarr: "→",
  uarr: "↑",
  darr: "↓",
  harr: "↔",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  aacute: "á",
  agrave: "à",
  acirc: "â",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  ntilde: "ñ",
  ccedil: "ç",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  szlig: "ß",
};

/**
 * Decode HTML character references: named (`&amp;`, `&nbsp;`, `&rsquo;` …),
 * decimal (`&#8217;`) and hexadecimal (`&#x2019;`). Unknown named entities are
 * left untouched.
 */
export function decodeHtmlEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi,
    (match, entity: string) => {
      if (entity[0] === "#") {
        const isHex = entity[1] === "x" || entity[1] === "X";
        const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return match;
        }
      }
      const named = NAMED_ENTITIES[entity] ?? NAMED_ENTITIES[entity.toLowerCase()];
      return named ?? match;
    },
  );
}

const BLOCK_TAGS =
  "p|div|h[1-6]|li|ul|ol|blockquote|tr|table|thead|tbody|section|article|aside|header|footer|pre|hr|figure|figcaption|dd|dt|dl|address";

/**
 * Convert an HTML fragment to plain text:
 * - block elements become paragraphs (separated by one blank line),
 * - `<br>` becomes a single line break inside a paragraph,
 * - all other tags are stripped,
 * - entities are decoded (`&amp;`, `&nbsp;`, `&#8217;` …),
 * - whitespace is collapsed and trimmed; empty paragraphs are dropped.
 */
export function htmlToText(html: string): string {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  // Source whitespace (including newlines) is insignificant in HTML; the only
  // line structure we keep is the one we introduce below.
  s = s.replace(/\s+/g, " ");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(new RegExp(`</?(?:${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeHtmlEntities(s);
  s = s.replace(/ /g, " ");

  const paragraphs = s
    .split(/\n[ \t]*\n/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .filter((line) => line.length > 0)
        .join("\n"),
    )
    .filter((paragraph) => paragraph.length > 0);

  return paragraphs.join("\n\n");
}
