import { Fragment, type ReactNode } from "react";
import { SmartLink } from "@/components/smart-link";

/**
 * Tiny, safe Markdown-subset renderer. Output is React elements only; raw HTML in the
 * source is shown as text, never interpreted. Board bios and event descriptions use it.
 *
 * Supported syntax:
 *
 *   Paragraphs are separated by a blank line.
 *   A single newline inside a paragraph becomes a line break.
 *   **bold**   *italic*   [link text](https://example.com)
 *   - bullet item        (consecutive "- " lines form one list)
 *
 * Links must use http:, https:, or mailto:; anything else renders as plain text.
 * http(s) links open in a new tab.
 */

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
const SAFE_URL = /^(https?:|mailto:)/i;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const [, bold, italic, label, url] = match;
    if (bold !== undefined) {
      nodes.push(<strong key={index}>{renderInline(bold)}</strong>);
    } else if (italic !== undefined) {
      nodes.push(<em key={index}>{renderInline(italic)}</em>);
    } else if (label !== undefined && url !== undefined) {
      nodes.push(renderLink(label, url, index));
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderLink(label: string, url: string, key: number): ReactNode {
  if (!SAFE_URL.test(url)) return label;
  return (
    <SmartLink key={key} href={url}>
      {label}
    </SmartLink>
  );
}

function renderLines(lines: string[], key: number): ReactNode {
  return (
    <p key={key}>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

function renderBlock(block: string): ReactNode[] {
  const out: ReactNode[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];
  const flush = () => {
    if (paragraph.length) out.push(renderLines(paragraph, out.length));
    if (items.length) {
      out.push(
        <ul key={out.length} className="list-disc space-y-1 pl-6">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
    }
    paragraph = [];
    items = [];
  };
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = /^-\s+(.*)$/.exec(line);
    if (bullet?.[1] !== undefined) {
      if (paragraph.length) flush();
      items.push(bullet[1]);
    } else {
      if (items.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return out;
}

/** Renders a Markdown-subset string as React elements (see the syntax note above). */
export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n?/g, "\n").split(/\n[ \t]*\n/);
  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={i}>{renderBlock(block)}</Fragment>
      ))}
    </>
  );
}
