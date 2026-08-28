/**
 * The rest of the document formats: OpenDocument, PowerPoint, EPUB, RTF and
 * the Apple iWork trio.
 *
 * Four of these five are zips of XML, which is the whole reason they can be
 * read here at all — the same JSZip and the same DOMParser that handle .docx
 * handle them too, so the coverage costs bytes of code rather than megabytes
 * of library. RTF is the odd one out and gets a small hand-written parser.
 *
 * iWork is a different trick again: Pages, Numbers and Keynote all bundle the
 * preview the Finder shows, and in most files that preview is a real PDF. We
 * hand it back rather than pretending to read Apple's own format.
 */
import type { Block, Inline } from "./layout";
import { htmlStringBlocks } from "./readers";

type Zip = Awaited<ReturnType<typeof loadZip>>;

async function loadZip(file: File) {
  const JSZip = (await import("jszip")).default;
  return JSZip.loadAsync(file);
}

const parseXml = (source: string) =>
  new DOMParser().parseFromString(source, "application/xml");

const descendants = (node: Element | Document, name: string) =>
  Array.from(node.getElementsByTagName("*")).filter((c) => c.localName === name);

/** All the text under a node, which is what most of these formats need. */
const textOf = (node: Element) =>
  descendants(node, "t")
    .map((t) => t.textContent ?? "")
    .join("")
    .trim();

/* ---------------------------------------------------------- OpenDocument */

/**
 * ODF marks up meaning rather than appearance: a heading is `text:h` with an
 * outline level on it, a list is `text:list`, and a table is a table. That
 * maps onto our blocks almost one for one.
 */
export async function odtBlocks(file: File): Promise<Block[]> {
  const zip = await loadZip(file);
  const xml = await zip.file("content.xml")?.async("string");
  if (!xml) throw new Error("This OpenDocument file has no content in it.");

  const doc = parseXml(xml);
  const body = descendants(doc, "text")[0] ?? doc.documentElement;
  const blocks: Block[] = [];
  walkOdf(body, blocks, 0);

  if (!blocks.length) throw new Error("This document appears to be empty.");
  return blocks;
}

/** ODF nests lists inside lists, so depth is carried down the walk. */
function walkOdf(node: Element, blocks: Block[], depth: number) {
  for (const el of Array.from(node.children)) {
    switch (el.localName) {
      case "h": {
        const runs = odfRuns(el);
        const level = Math.min(
          3,
          Number(el.getAttribute("text:outline-level") ?? 1),
        ) as 1 | 2 | 3;
        if (runs.some((r) => r.text.trim()))
          blocks.push({ type: "heading", level, runs });
        break;
      }
      case "p": {
        const runs = odfRuns(el);
        if (runs.some((r) => r.text.trim())) blocks.push({ type: "para", runs });
        break;
      }
      case "list": {
        const items = odfList(el, depth);
        if (items.length) blocks.push({ type: "list", ordered: false, items });
        break;
      }
      case "table": {
        const rows = odfRows(el);
        if (rows.length) blocks.push({ type: "table", rows, header: true });
        break;
      }
      case "soft-page-break":
        blocks.push({ type: "break" });
        break;
      default:
        if (el.children.length) walkOdf(el, blocks, depth);
    }
  }
}

/** A list item holds paragraphs, and may hold a list of its own below them. */
function odfList(list: Element, depth: number) {
  const items: { runs: Inline[]; depth: number }[] = [];
  for (const item of Array.from(list.children)) {
    if (item.localName !== "list-item") continue;
    for (const child of Array.from(item.children)) {
      if (child.localName === "list") items.push(...odfList(child, depth + 1));
      else {
        const runs = odfRuns(child);
        if (runs.some((r) => r.text.trim())) items.push({ runs, depth });
      }
    }
  }
  return items;
}

/** Spans carry the styling; without a style lookup, nesting is the signal. */
function odfRuns(node: Element): Inline[] {
  const runs: Inline[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === 3) {
      const t = n.textContent ?? "";
      if (t) runs.push({ text: t });
      return;
    }
    if (n.nodeType !== 1) return;
    const el = n as Element;
    if (el.localName === "s") runs.push({ text: " " });
    if (el.localName === "tab") runs.push({ text: "    " });
    if (el.localName === "line-break") runs.push({ text: "\n" });
    for (const child of Array.from(el.childNodes)) walk(child);
  };
  walk(node);
  return runs.length ? runs : [{ text: "" }];
}

function odfRows(table: Element): string[][] {
  const rows: string[][] = [];
  for (const row of descendants(table, "table-row")) {
    const cells: string[] = [];
    for (const cell of Array.from(row.children)) {
      if (!/^(table-cell|covered-table-cell)$/.test(cell.localName ?? "")) continue;
      const value = Array.from(cell.children)
        .map((p) => p.textContent ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      /* A repeated cell is ODF's run-length encoding for empty columns. */
      const repeat = Math.min(
        64,
        Number(cell.getAttribute("table:number-columns-repeated") ?? 1),
      );
      for (let i = 0; i < repeat; i++) cells.push(value);
    }
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    if (cells.length) rows.push(cells);
  }
  const width = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
}

/** A spreadsheet is the same walk, one table per sheet, with its name. */
export async function odsBlocks(file: File): Promise<Block[]> {
  const zip = await loadZip(file);
  const xml = await zip.file("content.xml")?.async("string");
  if (!xml) throw new Error("This spreadsheet has no content in it.");

  const doc = parseXml(xml);
  const blocks: Block[] = [];
  const sheets = descendants(doc, "table").filter(
    (t) => t.getAttribute("table:name") !== null,
  );

  for (const sheet of sheets) {
    const rows = odfRows(sheet);
    if (!rows.length) continue;
    if (blocks.length) blocks.push({ type: "break" });
    blocks.push({
      type: "heading",
      level: 2,
      runs: [{ text: sheet.getAttribute("table:name") ?? "Sheet" }],
    });
    blocks.push({ type: "table", rows, header: true });
  }
  if (!blocks.length) throw new Error("This spreadsheet has no data in it.");
  return blocks;
}

/** Slides become a page each, titled by their first line. */
export async function odpBlocks(file: File): Promise<Block[]> {
  const zip = await loadZip(file);
  const xml = await zip.file("content.xml")?.async("string");
  if (!xml) throw new Error("This presentation has no content in it.");

  const doc = parseXml(xml);
  const blocks: Block[] = [];
  for (const [i, page] of descendants(doc, "page").entries()) {
    const lines = descendants(page, "p")
      .map((p) => (p.textContent ?? "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (!lines.length) continue;
    if (blocks.length) blocks.push({ type: "break" });
    blocks.push(...slide(i + 1, lines));
  }
  if (!blocks.length) throw new Error("This presentation has no text on its slides.");
  return blocks;
}

/* ------------------------------------------------------------ PowerPoint */

/**
 * Slides are read for their text, not redrawn. PowerPoint positions every
 * shape absolutely against a theme, a master and a layout, and following all
 * of that faithfully is a rendering engine's job — so each slide becomes a
 * page carrying its title and its bullets, in the order they appear.
 */
export async function pptxBlocks(file: File): Promise<Block[]> {
  const zip = await loadZip(file);
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  if (!slides.length) throw new Error("This deck has no slides in it.");

  const blocks: Block[] = [];
  for (const [i, name] of slides.entries()) {
    const doc = parseXml(await zip.file(name)!.async("string"));
    /* `a:p` is a paragraph of runs; shapes hold them in reading order. */
    const lines = descendants(doc, "p")
      .map((p) => textOf(p).replace(/\s+/g, " "))
      .filter(Boolean);
    const notes = await slideNotes(zip, slideNumber(name));

    if (blocks.length) blocks.push({ type: "break" });
    blocks.push(...slide(i + 1, lines));
    if (notes) {
      blocks.push({ type: "rule" });
      blocks.push({ type: "quote", runs: [{ text: notes }] });
    }
  }
  return blocks;
}

const slideNumber = (name: string) => Number(name.match(/(\d+)\.xml$/)![1]);

async function slideNotes(zip: Zip, n: number): Promise<string> {
  const file = zip.file(`ppt/notesSlides/notesSlide${n}.xml`);
  if (!file) return "";
  const doc = parseXml(await file.async("string"));
  const text = descendants(doc, "p")
    .map((p) => textOf(p))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  /* The slide number is a field in the notes master and comes through as a
     bare digit, which is noise on the page. */
  return /^\d+$/.test(text) ? "" : text;
}

/** One slide's worth of blocks: a number, a title, then its bullets. */
function slide(n: number, lines: string[]): Block[] {
  const [title, ...rest] = lines;
  const blocks: Block[] = [
    { type: "para", runs: [{ text: `Slide ${n}`, italic: true }] },
    { type: "heading", level: 2, runs: [{ text: title }] },
  ];
  if (rest.length)
    blocks.push({
      type: "list",
      ordered: false,
      items: rest.map((text) => ({ runs: [{ text }], depth: 0 })),
    });
  return blocks;
}

/* ------------------------------------------------------------------ EPUB */

/**
 * The spine in the package file is the reading order — following it is the
 * difference between a book and its chapters in alphabetical order. Each
 * chapter is XHTML, so the HTML reader does the actual work.
 */
export async function epubBlocks(file: File): Promise<Block[]> {
  const zip = await loadZip(file);

  const container = await zip.file("META-INF/container.xml")?.async("string");
  const opfPath =
    (container &&
      parseXml(container)
        .getElementsByTagName("rootfile")[0]
        ?.getAttribute("full-path")) ||
    Object.keys(zip.files).find((n) => n.endsWith(".opf"));
  if (!opfPath) throw new Error("This EPUB has no package file, so its order is unknown.");

  const opf = parseXml(await zip.file(opfPath)!.async("string"));
  const root = opfPath.includes("/") ? opfPath.replace(/[^/]+$/, "") : "";

  const hrefs = new Map<string, string>();
  for (const item of descendants(opf, "item")) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) hrefs.set(id, root + href);
  }
  const spine = descendants(opf, "itemref")
    .map((ref) => hrefs.get(ref.getAttribute("idref") ?? ""))
    .filter((h): h is string => !!h);

  const blocks: Block[] = [];
  for (const href of spine.length ? spine : [...hrefs.values()]) {
    const entry = zip.file(decodeURIComponent(href));
    if (!entry || !/\.x?html?$/i.test(href)) continue;
    const chapter = htmlStringBlocks(await entry.async("string"), false);
    if (!chapter.length) continue;
    if (blocks.length) blocks.push({ type: "break" });
    blocks.push(...chapter);
  }
  if (!blocks.length) throw new Error("This EPUB has no readable chapters in it.");
  return blocks;
}

/* ------------------------------------------------------------------- RTF */

/**
 * A small RTF reader. RTF is a stream of groups, control words and text: the
 * words that matter here are the paragraph break, bold and italic, and the
 * escapes for characters outside ASCII. Everything else — fonts, colours,
 * tables, embedded objects — is skipped, and whole destinations we cannot use
 * (`\\*\\...`, pictures, stylesheets) are dropped with their contents.
 */
export async function rtfBlocks(file: File): Promise<Block[]> {
  const source = new TextDecoder("windows-1252").decode(await file.arrayBuffer());
  const blocks: Block[] = [];
  let runs: Inline[] = [];
  let text = "";
  const style = { bold: false, italic: false };
  const stack: { bold: boolean; italic: boolean }[] = [];
  /* Depth of a destination we are throwing away, 0 when we are keeping text. */
  let skipping = 0;
  let depth = 0;

  const flushRun = () => {
    if (text) runs.push({ text, ...style });
    text = "";
  };
  const flushPara = () => {
    flushRun();
    if (runs.some((r) => r.text.trim())) blocks.push({ type: "para", runs });
    runs = [];
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (ch === "{") {
      depth++;
      stack.push({ ...style });
      continue;
    }
    if (ch === "}") {
      depth--;
      const previous = stack.pop();
      if (previous) Object.assign(style, previous);
      if (skipping && depth < skipping) skipping = 0;
      continue;
    }
    if (ch === "\\") {
      const word = source.slice(i + 1).match(/^([a-z]+)(-?\d+)? ?/i);
      if (!word) {
        /* An escaped literal: \\{ \\} \\\\ and the hex form \\'xx. */
        const next = source[i + 1];
        if (next === "*") {
          /* `\*` marks a destination a reader is allowed not to understand —
             a generator stamp, a bookmark, a field's own instructions. */
          skipping = depth;
          i += 1;
          continue;
        }
        if (next === "'") {
          const code = parseInt(source.substr(i + 2, 2), 16);
          if (!skipping && !Number.isNaN(code)) text += decodeAnsi(code);
          i += 3;
        } else {
          if (!skipping) text += next;
          i += 1;
        }
        continue;
      }
      const [match, name, argument] = word;
      i += match.length;

      if (DROP.has(name)) {
        skipping = depth;
        continue;
      }
      if (skipping) continue;

      switch (name) {
        case "par":
        case "sect":
          flushPara();
          break;
        case "line":
          flushRun();
          runs.push({ text: "\n" });
          break;
        case "tab":
          text += "    ";
          break;
        case "b":
          flushRun();
          style.bold = argument !== "0";
          break;
        case "i":
          flushRun();
          style.italic = argument !== "0";
          break;
        case "plain":
          flushRun();
          style.bold = style.italic = false;
          break;
        case "u": {
          /* \\uN is a Unicode code point, followed by a fallback character
             that has to be stepped over so it does not double up. */
          const code = Number(argument);
          if (Number.isFinite(code))
            text += String.fromCharCode(code < 0 ? code + 65536 : code);
          if (source[i + 1] === "?") i += 1;
          break;
        }
        case "emdash":
          text += "-";
          break;
        case "endash":
          text += "-";
          break;
        case "lquote":
        case "rquote":
          text += "'";
          break;
        case "ldblquote":
        case "rdblquote":
          text += '"';
          break;
      }
      /* `i` now sits on the last character of the control word; the loop's
         own increment moves past it. The delimiting space, if there was one,
         the regex already took. */
      continue;
    }
    if (ch === "\n" || ch === "\r") continue;
    if (!skipping) text += ch;
  }
  flushPara();

  if (!blocks.length) throw new Error("This RTF file has no text in it.");
  return blocks;
}

/** Destinations whose contents are markup, not document text. */
const DROP = new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "info",
  "pict",
  "object",
  "themedata",
  "colorschememapping",
  "latentstyles",
  "datastore",
  "listtable",
  "listoverridetable",
  "generator",
  "xmlnstbl",
  "filetbl",
  "revtbl",
]);

const decodeAnsi = (code: number) =>
  new TextDecoder("windows-1252").decode(new Uint8Array([code]));

/* ----------------------------------------------------------------- iWork */

/**
 * Pages, Numbers and Keynote are read through the preview they carry rather
 * than through Apple's own format, which is an undocumented binary protocol
 * that changes between releases. The PDF preview is the whole document; the
 * JPEG fallback is the first page only, and says so.
 */
export async function iworkPreview(
  file: File,
): Promise<{ pdf?: Uint8Array; image?: Uint8Array; partial: boolean }> {
  const zip = await loadZip(file);

  const pdf = zip.file("QuickLook/Preview.pdf");
  if (pdf) return { pdf: await pdf.async("uint8array"), partial: false };

  const jpg = zip.file("preview.jpg") ?? zip.file("QuickLook/Thumbnail.jpg");
  if (jpg) return { image: await jpg.async("uint8array"), partial: true };

  throw new Error(
    "This file carries no preview to convert. Open it and export to PDF instead.",
  );
}
