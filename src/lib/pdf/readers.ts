/**
 * Readers: every supported source format, turned into layout blocks.
 *
 * There is no conversion library here on purpose. A .docx is a zip of XML and
 * a .xlsx is a zip of XML, and we already ship JSZip for the split tool, so
 * reading them directly costs nothing at load time — where mammoth and
 * SheetJS would add roughly a megabyte to a page whose whole promise is that
 * it works on a phone on bad wifi. What we give up is fidelity to Word's
 * layout engine, which was never on the table in a browser anyway: the
 * bargain is a clean, readable document, not a pixel match.
 */
import type { Block, Inline } from "./layout";

const decode = async (file: File) => new TextDecoder().decode(await file.arrayBuffer());

/* ------------------------------------------------------------------- XML */

/** The browser's own parser, in XML mode — no library, no regex soup. */
function parseXml(source: string): Document {
  return new DOMParser().parseFromString(source, "application/xml");
}

const kids = (node: Element, name: string) =>
  Array.from(node.children).filter((c) => c.localName === name);

const descendants = (node: Element | Document, name: string) =>
  Array.from(node.getElementsByTagName("*")).filter((c) => c.localName === name);

/* ------------------------------------------------------------------ DOCX */

/**
 * Word stores a document as a flat run of paragraphs. Each carries a style
 * name, which is where headings, quotes and list membership all come from,
 * and a numbering reference that tells bullets from numbers.
 */
export async function docxBlocks(file: File): Promise<Block[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("This Word file has no document part — it may be damaged.");

  const body = parseXml(xml).getElementsByTagName("*");
  const root = Array.from(body).find((n) => n.localName === "body");
  if (!root) throw new Error("This Word file could not be read.");

  const blocks: Block[] = [];
  let list: Extract<Block, { type: "list" }> | null = null;

  const flush = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };

  for (const node of Array.from(root.children)) {
    if (node.localName === "tbl") {
      flush();
      const rows = kids(node, "tr").map((tr) =>
        kids(tr, "tc").map((tc) =>
          descendants(tc, "t")
            .map((t) => t.textContent ?? "")
            .join("")
            .trim(),
        ),
      );
      if (rows.length) blocks.push({ type: "table", rows, header: true });
      continue;
    }
    if (node.localName !== "p") continue;

    const runs = wordRuns(node);
    const style = descendants(node, "pStyle")[0]?.getAttribute("w:val") ?? "";
    const numbering = descendants(node, "numPr")[0];
    const plain = runs.map((r) => r.text).join("").trim();

    if (!plain) {
      /* An empty paragraph is Word's page break as often as it is a blank
         line, so honour a real break and drop the rest. */
      if (descendants(node, "br").some((b) => b.getAttribute("w:type") === "page"))
        blocks.push({ type: "break" });
      flush();
      continue;
    }

    if (numbering) {
      const depth = Number(
        descendants(numbering, "ilvl")[0]?.getAttribute("w:val") ?? 0,
      );
      /* Word does not record "bulleted" on the paragraph — the numbering
         definition does — so the style name is the practical signal. */
      const ordered = /num|decimal|order/i.test(style);
      if (!list || list.ordered !== ordered) {
        flush();
        list = { type: "list", ordered, items: [] };
      }
      list.items.push({ runs, depth: Math.min(3, depth) });
      continue;
    }
    flush();

    const heading = style.match(/^Heading(\d)/i)?.[1];
    if (heading || /^Title$/i.test(style)) {
      const level = (/^Title$/i.test(style) ? 1 : Math.min(3, Number(heading))) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, runs });
    } else if (/Quote/i.test(style)) {
      blocks.push({ type: "quote", runs });
    } else {
      blocks.push({ type: "para", runs });
    }
  }
  flush();

  if (!blocks.length) throw new Error("This Word document appears to be empty.");
  return blocks;
}

/** A Word paragraph's text runs, with bold and italic carried across. */
function wordRuns(paragraph: Element): Inline[] {
  const runs: Inline[] = [];
  for (const r of descendants(paragraph, "r")) {
    const props = kids(r, "rPr")[0];
    const on = (name: string) => {
      const el = props ? kids(props, name)[0] : undefined;
      return !!el && el.getAttribute("w:val") !== "0" && el.getAttribute("w:val") !== "false";
    };
    let text = "";
    for (const child of Array.from(r.children)) {
      if (child.localName === "t") text += child.textContent ?? "";
      else if (child.localName === "tab") text += "    ";
      else if (child.localName === "br") text += "\n";
    }
    if (!text) continue;
    runs.push({ text, bold: on("b"), italic: on("i") });
  }
  return runs.length ? runs : [{ text: "" }];
}

/* ------------------------------------------------------------------ XLSX */

/**
 * Each worksheet becomes a heading and a table. Excel stores most strings in
 * one shared table and refers to them by index, and stores numbers already
 * formatted only sometimes — a cell's cached value is what the user last saw,
 * which is the honest thing to print.
 */
export async function xlsxBlocks(file: File): Promise<Block[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const shared = sharedXml
    ? descendants(parseXml(sharedXml), "si").map((si) =>
        descendants(si, "t")
          .map((t) => t.textContent ?? "")
          .join(""),
      )
    : [];

  /* Sheet order and names live in the workbook part; the files themselves are
     named by id, so a workbook with reordered sheets still prints in order. */
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  const names = workbookXml
    ? descendants(parseXml(workbookXml), "sheet").map(
        (s) => s.getAttribute("name") ?? "Sheet",
      )
    : [];

  const sheetFiles = Object.keys(zip.files)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort(
      (a, b) =>
        Number(a.match(/(\d+)/)![1]) - Number(b.match(/(\d+)/)![1]),
    );

  const blocks: Block[] = [];
  for (const [i, name] of sheetFiles.entries()) {
    const xml = await zip.file(name)!.async("string");
    const rows = sheetRows(parseXml(xml), shared);
    if (!rows.length) continue;
    if (blocks.length) blocks.push({ type: "break" });
    if (sheetFiles.length > 1 || names[i])
      blocks.push({
        type: "heading",
        level: 2,
        runs: [{ text: names[i] ?? `Sheet ${i + 1}` }],
      });
    blocks.push({ type: "table", rows, header: true });
  }

  if (!blocks.length) throw new Error("This spreadsheet has no data in it.");
  return blocks;
}

function sheetRows(doc: Document, shared: string[]): string[][] {
  const rows: string[][] = [];
  let width = 0;

  for (const row of descendants(doc, "row")) {
    const cells: string[] = [];
    for (const c of kids(row, "c")) {
      /* The cell reference carries the column, so gaps stay gaps rather than
         sliding the rest of the row left. */
      const column = colIndex(c.getAttribute("r") ?? "");
      const type = c.getAttribute("t");
      let value: string;
      if (type === "inlineStr") {
        value = descendants(c, "t")
          .map((t) => t.textContent ?? "")
          .join("");
      } else {
        const raw = kids(c, "v")[0]?.textContent ?? "";
        value = type === "s" ? (shared[Number(raw)] ?? "") : raw;
      }
      if (column >= 0) {
        while (cells.length < column) cells.push("");
        cells[column] = value.trim();
      } else if (value) cells.push(value.trim());
    }
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length) width = Math.max(width, cells.length);
    /* Keep interior blank rows, drop the trailing ones Excel leaves behind. */
    rows.push(cells);
  }
  while (rows.length && !rows[rows.length - 1].length) rows.pop();
  return rows.map((r) => {
    const padded = [...r];
    while (padded.length < width) padded.push("");
    return padded;
  });
}

/** `BC12` → 54. Excel columns are base-26 with no zero. */
function colIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0];
  if (!letters) return -1;
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/* -------------------------------------------------------------- Markdown */

export async function markdownBlocks(file: File): Promise<Block[]> {
  const source = (await decode(file)).replace(/\r\n?/g, "\n");
  const lines = source.split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: Extract<Block, { type: "list" }> | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "para", runs: inline(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };
  const flush = () => {
    flushPara();
    flushList();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^```/.test(line.trim())) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) body.push(lines[i++]);
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }

    /* A pipe table needs its separator row to be a table rather than three
       paragraphs that happen to contain pipes. */
    if (/^\s*\|/.test(line) && /^\s*\|?[\s:-]*-[\s|:-]*$/.test(lines[i + 1] ?? "")) {
      flush();
      const rows: string[][] = [];
      const cells = (l: string) =>
        l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      rows.push(cells(line));
      i++;
      while (i + 1 < lines.length && /\|/.test(lines[i + 1])) rows.push(cells(lines[++i]));
      blocks.push({ type: "table", rows, header: true });
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({
        type: "heading",
        level: Math.min(3, heading[1].length) as 1 | 2 | 3,
        runs: inline(heading[2].replace(/\s*#+\s*$/, "")),
      });
      continue;
    }

    /* Setext headings — the underlined kind — are common in pasted READMEs. */
    if (/^(=+|-{3,})\s*$/.test(line) && para.length === 1) {
      const runs = inline(para[0]);
      para = [];
      flushList();
      blocks.push({ type: "heading", level: line.startsWith("=") ? 1 : 2, runs });
      continue;
    }

    if (/^\s*(?:-\s*){3,}$|^\s*(?:\*\s*){3,}$|^\s*(?:_\s*){3,}$/.test(line)) {
      flush();
      blocks.push({ type: "rule" });
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushPara();
      flushList();
      blocks.push({ type: "quote", runs: inline(quote[1]) });
      continue;
    }

    const item = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (item) {
      flushPara();
      const ordered = /\d/.test(item[2]);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { type: "list", ordered, items: [] };
      }
      list.items.push({
        runs: inline(item[3]),
        depth: Math.min(3, Math.floor(item[1].replace(/\t/g, "  ").length / 2)),
      });
      continue;
    }

    flushList();
    para.push(line.trim());
  }
  flush();
  return blocks;
}

/** Bold, italic and inline code — the three that carry meaning. */
export function inline(source: string): Inline[] {
  const runs: Inline[] = [];
  const pattern = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`|\[([^\]]+)\]\([^)]*\)/g;
  let at = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(source))) {
    if (m.index > at) runs.push({ text: source.slice(at, m.index) });
    if (m[2] !== undefined) runs.push({ text: m[2], bold: true });
    else if (m[4] !== undefined) runs.push({ text: m[4], italic: true });
    else if (m[5] !== undefined) runs.push({ text: m[5], mono: true });
    else if (m[6] !== undefined) runs.push({ text: m[6] });
    at = m.index + m[0].length;
  }
  if (at < source.length) runs.push({ text: source.slice(at) });
  return runs.length ? runs : [{ text: source }];
}

/* ------------------------------------------------------------------ HTML */

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "HEAD", "NAV", "FOOTER"]);
const HEADINGS: Record<string, 1 | 2 | 3> = {
  H1: 1,
  H2: 2,
  H3: 3,
  H4: 3,
  H5: 3,
  H6: 3,
};

/**
 * Walks the parsed document rather than rendering it — a browser tab cannot
 * screenshot itself, and a text walk survives the stylesheets and scripts a
 * saved page drags along with it.
 */
export async function htmlBlocks(file: File): Promise<Block[]> {
  return htmlStringBlocks(await decode(file), true);
}

/** The same walk over markup already in hand — EPUB chapters arrive this way. */
export function htmlStringBlocks(source: string, useTitle: boolean): Block[] {
  const doc = new DOMParser().parseFromString(source, "text/html");
  const blocks: Block[] = [];

  const title = useTitle ? doc.title?.trim() : "";
  if (title) blocks.push({ type: "heading", level: 1, runs: [{ text: title }] });

  const runsOf = (el: Element): Inline[] => {
    const runs: Inline[] = [];
    const walk = (node: Node, style: Inline) => {
      if (node.nodeType === 3) {
        const t = (node.textContent ?? "").replace(/\s+/g, " ");
        if (t.trim()) runs.push({ ...style, text: t });
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node as Element;
      if (SKIP.has(el.tagName)) return;
      const next = { ...style };
      if (/^(B|STRONG|TH)$/.test(el.tagName)) next.bold = true;
      if (/^(I|EM|CITE)$/.test(el.tagName)) next.italic = true;
      if (/^(CODE|KBD|SAMP|TT)$/.test(el.tagName)) next.mono = true;
      if (el.tagName === "BR") runs.push({ text: "\n" });
      for (const child of Array.from(el.childNodes)) walk(child, next);
    };
    walk(el, { text: "" });
    return runs.length ? runs : [{ text: "" }];
  };

  const hasText = (runs: Inline[]) => runs.some((r) => r.text.trim());

  const walk = (el: Element) => {
    if (SKIP.has(el.tagName)) return;

    if (el.tagName in HEADINGS) {
      const runs = runsOf(el);
      if (hasText(runs)) blocks.push({ type: "heading", level: HEADINGS[el.tagName], runs });
      return;
    }
    if (el.tagName === "P" || el.tagName === "DD") {
      const runs = runsOf(el);
      if (hasText(runs)) blocks.push({ type: "para", runs });
      return;
    }
    if (el.tagName === "BLOCKQUOTE") {
      const runs = runsOf(el);
      if (hasText(runs)) blocks.push({ type: "quote", runs });
      return;
    }
    if (el.tagName === "PRE") {
      const t = el.textContent ?? "";
      if (t.trim()) blocks.push({ type: "code", text: t });
      return;
    }
    if (el.tagName === "HR") {
      blocks.push({ type: "rule" });
      return;
    }
    if (el.tagName === "UL" || el.tagName === "OL") {
      const items = Array.from(el.children)
        .filter((c) => c.tagName === "LI")
        .map((li) => ({ runs: runsOf(li), depth: 0 }))
        .filter((i) => hasText(i.runs));
      if (items.length)
        blocks.push({ type: "list", ordered: el.tagName === "OL", items });
      return;
    }
    if (el.tagName === "TABLE") {
      const rows = Array.from(el.querySelectorAll("tr")).map((tr) =>
        Array.from(tr.children).map((cell) =>
          (cell.textContent ?? "").replace(/\s+/g, " ").trim(),
        ),
      );
      const header = !!el.querySelector("th");
      if (rows.length) blocks.push({ type: "table", rows, header });
      return;
    }
    for (const child of Array.from(el.children)) walk(child);
  };

  walk(doc.body ?? doc.documentElement);

  /* A page built entirely from unlabelled divs walks to nothing; fall back to
     its text rather than handing back a blank PDF. */
  if (blocks.length <= (title ? 1 : 0)) {
    const flat = (doc.body?.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
    if (flat)
      for (const para of flat.split(/\n\s*\n/))
        blocks.push({ type: "para", runs: [{ text: para.replace(/\s+/g, " ") }] });
  }
  return blocks;
}

/* ------------------------------------------------------------------- CSV */

/** A real CSV parser — quoted fields hold commas and newlines, and do. */
export function parseCsv(source: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export async function csvBlocks(file: File): Promise<Block[]> {
  const source = await decode(file);
  const delimiter = /\.tsv$/i.test(file.name)
    ? "\t"
    : (source.match(/;/g)?.length ?? 0) > (source.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const rows = parseCsv(source, delimiter).map((r) => r.map((c) => c.trim()));
  if (!rows.length) throw new Error("This file has no rows in it.");
  return [{ type: "table", rows, header: true }];
}

/* ------------------------------------------------------------------ text */

const CODE_LIKE =
  /\.(js|jsx|ts|tsx|json|py|rb|go|rs|java|c|h|cpp|cs|php|sh|zsh|yml|yaml|toml|ini|sql|css|scss|xml|log|env|conf)$/i;

export async function textBlocks(file: File): Promise<Block[]> {
  const source = (await decode(file)).replace(/\r\n?/g, "\n");

  /* Source code and logs depend on their own line breaks and alignment, so
     they are set monospaced and unwrapped rather than reflowed as prose. */
  if (CODE_LIKE.test(file.name)) return [{ type: "code", text: source }];

  return source
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => ({ type: "para", runs: [{ text: para }] }) as Block);
}

/* ----------------------------------------------------------------- email */

/**
 * An .eml is headers, a blank line, then the body — often several bodies, in
 * a MIME tree. We print the headers people actually want on a saved email,
 * then the best body part: the HTML one if it is there, since that is what
 * the sender wrote, and the plain-text one otherwise.
 */
export async function emlBlocks(file: File): Promise<Block[]> {
  const source = (await decode(file)).replace(/\r\n/g, "\n");
  const split = source.indexOf("\n\n");
  const rawHeaders = split < 0 ? source : source.slice(0, split);
  const body = split < 0 ? "" : source.slice(split + 2);

  /* A header folded across lines continues with leading whitespace. */
  const headers = new Map<string, string>();
  for (const line of rawHeaders.replace(/\n[ \t]+/g, " ").split("\n")) {
    const at = line.indexOf(":");
    if (at < 0) continue;
    const name = line.slice(0, at).toLowerCase();
    if (!headers.has(name)) headers.set(name, decodeWords(line.slice(at + 1).trim()));
  }

  const blocks: Block[] = [];
  const subject = headers.get("subject");
  if (subject) blocks.push({ type: "heading", level: 1, runs: [{ text: subject }] });

  const rows = ["from", "to", "cc", "date"]
    .filter((k) => headers.get(k))
    .map((k) => [k[0].toUpperCase() + k.slice(1), headers.get(k)!]);
  if (rows.length) blocks.push({ type: "table", rows, header: false });
  blocks.push({ type: "rule" });

  const part = bestPart(body, headers.get("content-type") ?? "");
  if (part.html) blocks.push(...htmlStringBlocks(part.text, false));
  else
    for (const para of part.text.split(/\n\s*\n/))
      if (para.trim())
        blocks.push({ type: "para", runs: [{ text: para.replace(/\n/g, " ").trim() }] });

  return blocks;
}

/** Walks a MIME body far enough to find the part worth printing. */
function bestPart(
  body: string,
  contentType: string,
  depth = 0,
): { text: string; html: boolean } {
  const boundary = contentType.match(/boundary="?([^";]+)"?/i)?.[1];
  if (boundary && depth < 4) {
    const parts = body.split(`--${boundary}`).slice(1, -1);
    const read = parts.map((raw) => {
      const at = raw.indexOf("\n\n");
      const head = at < 0 ? raw : raw.slice(0, at);
      const type = head.match(/content-type:\s*([^;\n]+)([^\n]*)/i);
      return {
        type: (type?.[1] ?? "text/plain").toLowerCase().trim(),
        params: (type?.[2] ?? "") + (head.match(/boundary="?[^";]+"?/i)?.[0] ?? ""),
        encoding: head.match(/content-transfer-encoding:\s*(\S+)/i)?.[1] ?? "",
        body: at < 0 ? "" : raw.slice(at + 2),
      };
    });
    /* Prefer the richest part, then recurse into nested multiparts. */
    const nested = read.find((p) => p.type.startsWith("multipart/"));
    const html = read.find((p) => p.type === "text/html");
    const plain = read.find((p) => p.type === "text/plain");
    const pick = html ?? plain;
    if (pick)
      return { text: transferDecode(pick.body, pick.encoding), html: !!html };
    if (nested) return bestPart(nested.body, nested.params, depth + 1);
    return { text: "", html: false };
  }
  return { text: body, html: /text\/html/i.test(contentType) };
}

/** Quoted-printable and base64 are the two encodings mail actually uses. */
function transferDecode(body: string, encoding: string): string {
  if (/base64/i.test(encoding)) {
    try {
      return new TextDecoder().decode(
        Uint8Array.from(atob(body.replace(/\s+/g, "")), (c) => c.charCodeAt(0)),
      );
    } catch {
      return body;
    }
  }
  if (/quoted-printable/i.test(encoding))
    return body
      .replace(/=\n/g, "")
      .replace(/=([0-9A-F]{2})/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
  return body;
}

/** RFC 2047 encodes non-ASCII header text; subjects are full of it. */
function decodeWords(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi,
    (whole, charset, kind, data) => {
      try {
        const bytes =
          kind.toUpperCase() === "B"
            ? Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
            : Uint8Array.from(
                data
                  .replace(/_/g, " ")
                  .replace(/=([0-9A-F]{2})/gi, (_m: string, h: string) =>
                    String.fromCharCode(parseInt(h, 16)),
                  ),
                (c: string) => c.charCodeAt(0),
              );
        return new TextDecoder(charset).decode(bytes);
      } catch {
        return whole;
      }
    },
  );
}
