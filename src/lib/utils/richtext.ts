/**
 * Simple formatted text, as typed in the admin:
 *
 *   Paragraphs are separated by a blank line.
 *   ## A heading
 *   > A quote (e.g. scripture)
 *   - A bullet point
 *   **bold**, *italic*, [link text](https://example.com)
 *
 * Parsed into plain data (never HTML), so nothing typed in the admin can
 * inject markup or scripts into the page.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; children: Inline[] }
  | { type: "italic"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "paragraph"; lines: Inline[][] }
  | { type: "heading"; children: Inline[] }
  | { type: "quote"; lines: Inline[][] }
  | { type: "list"; items: Inline[][] };

/** Only web, email and phone links, or links within the site. */
export function safeHref(raw: string): string | undefined {
  const href = raw.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

const INLINE = /\*\*(.+?)\*\*|\*(?!\s)(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(text: string): Inline[] {
  const nodes: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push({ type: "text", text: text.slice(last, index) });
    const [whole, bold, italic, label, href] = match;
    if (bold !== undefined) nodes.push({ type: "bold", children: parseInline(bold) });
    else if (italic !== undefined) nodes.push({ type: "italic", children: parseInline(italic) });
    else {
      const safe = safeHref(href);
      nodes.push(safe ? { type: "link", href: safe, children: parseInline(label) } : { type: "text", text: whole });
    }
    last = index + whole.length;
  }
  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes;
}

export function parseRichText(source: string | undefined | null): Block[] {
  if (!source?.trim()) return [];
  const blocks: Block[] = [];
  const chunks = source.replace(/\r\n?/g, "\n").split(/\n\s*\n/);

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((line) => line.trimEnd()).filter((line) => line.trim());
    if (!lines.length) continue;

    // A chunk can mix kinds line by line (e.g. a heading directly followed by text).
    let paragraph: string[] = [];
    let quote: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", lines: paragraph.map(parseInline) });
      if (quote.length) blocks.push({ type: "quote", lines: quote.map(parseInline) });
      if (list.length) blocks.push({ type: "list", items: list.map(parseInline) });
      paragraph = [];
      quote = [];
      list = [];
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (/^#{1,3}\s+/.test(line)) {
        flush();
        blocks.push({ type: "heading", children: parseInline(line.replace(/^#{1,3}\s+/, "")) });
      } else if (/^>\s?/.test(line)) {
        if (paragraph.length || list.length) flush();
        quote.push(line.replace(/^>\s?/, ""));
      } else if (/^[-•*]\s+/.test(line)) {
        if (paragraph.length || quote.length) flush();
        list.push(line.replace(/^[-•*]\s+/, ""));
      } else {
        if (quote.length || list.length) flush();
        paragraph.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/** Plain text (formatting removed) — for summaries and meta descriptions. */
export function richTextToPlain(source: string | undefined | null): string {
  return (source ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^(#{1,3}|>|[-•*])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
