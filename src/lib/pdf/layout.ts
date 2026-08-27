/**
 * A small typesetter.
 *
 * Everything that is not already a PDF or an image — Word, Excel, Markdown,
 * HTML, CSV, plain text — is read into the same block model here and then
 * painted onto pages by one layout routine. That is what keeps the converter
 * honest: one place decides how a heading looks, how a line wraps and when a
 * page breaks, so a Word file and a Markdown file come out looking like the
 * same product rather than two different tools bolted together.
 *
 * It uses pdf-lib's standard fonts, which carry no glyphs beyond WinAnsi.
 * `text()` folds the punctuation people actually paste — curly quotes, en
 * dashes, non-breaking spaces — down to characters those fonts have, and
 * substitutes anything left, because a missing glyph throws rather than
 * degrades.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export type Inline = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
};

export type Block =
  | { type: "heading"; level: 1 | 2 | 3; runs: Inline[] }
  | { type: "para"; runs: Inline[] }
  | { type: "quote"; runs: Inline[] }
  | { type: "list"; ordered: boolean; items: { runs: Inline[]; depth: number }[] }
  | { type: "code"; text: string }
  | { type: "table"; rows: string[][]; header: boolean }
  | { type: "rule" }
  | { type: "break" };

export type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  mono: PDFFont;
  monoBold: PDFFont;
};

export type Frame = {
  width: number;
  height: number;
  margin: number;
};

export const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
};

export function frameFrom(opts: Record<string, string>): Frame {
  const size = PAGE_SIZES[opts.size] ?? PAGE_SIZES.a4;
  const [w, h] = opts.orientation === "landscape" ? [size[1], size[0]] : size;
  const margin = Number.isFinite(Number(opts.margin))
    ? Math.min(160, Math.max(0, Number(opts.margin)))
    : 56;
  return { width: w, height: h, margin };
}

export async function embedFonts(doc: PDFDocument): Promise<Fonts> {
  const [regular, bold, italic, boldItalic, mono, monoBold] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.HelveticaOblique),
    doc.embedFont(StandardFonts.HelveticaBoldOblique),
    doc.embedFont(StandardFonts.Courier),
    doc.embedFont(StandardFonts.CourierBold),
  ]);
  return { regular, bold, italic, boldItalic, mono, monoBold };
}

/* ------------------------------------------------------------------ text */

const FOLD: [RegExp, string][] = [
  [/\r\n?/g, "\n"],
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[‐‑‒–—―−]/g, "-"],
  [/…/g, "..."],
  [/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " "],
  [/[\u200b-\u200d\u2060\ufeff]/g, ""],
  [/•/g, "-"],
  [/₹/g, "Rs."],
  [/™/g, "(TM)"],
  [/\t/g, "    "],
];

/** Folds a string down to what the standard fonts can actually draw. */
export function text(input: string): string {
  let out = input;
  for (const [pattern, to] of FOLD) out = out.replace(pattern, to);
  /* WinAnsi covers Latin-1 plus a handful of high slots; anything outside it
     would throw at draw time, so it becomes a visible placeholder instead. */
  return out.replace(/[^\n\x20-\x7E\xA1-\xFF]/g, "?");
}

/* ---------------------------------------------------------------- writer */

/** The page being filled, and where the next line goes on it. */
class Sheet {
  page: PDFPage;
  y: number;

  constructor(
    readonly doc: PDFDocument,
    readonly frame: Frame,
    readonly fonts: Fonts,
  ) {
    this.page = doc.addPage([frame.width, frame.height]);
    this.y = frame.height - frame.margin;
  }

  get left() {
    return this.frame.margin;
  }

  get width() {
    return this.frame.width - this.frame.margin * 2;
  }

  get bottom() {
    return this.frame.margin;
  }

  /** Starts a new page when `need` points would run off the bottom. */
  room(need: number) {
    if (this.y - need >= this.bottom) return;
    this.page = this.doc.addPage([this.frame.width, this.frame.height]);
    this.y = this.frame.height - this.frame.margin;
  }

  down(by: number) {
    this.y -= by;
  }
}

const fontFor = (fonts: Fonts, run: Inline) =>
  run.mono
    ? run.bold
      ? fonts.monoBold
      : fonts.mono
    : run.bold && run.italic
      ? fonts.boldItalic
      : run.bold
        ? fonts.bold
        : run.italic
          ? fonts.italic
          : fonts.regular;

type Piece = { run: Inline; text: string; width: number };

/**
 * Greedy wrap across styled runs. Words carry their own run with them, so a
 * bold phrase that straddles a line break stays bold on both halves.
 */
function wrap(
  runs: Inline[],
  fonts: Fonts,
  size: number,
  maxWidth: number,
): Piece[][] {
  const lines: Piece[][] = [];
  let line: Piece[] = [];
  let used = 0;

  const push = () => {
    lines.push(line);
    line = [];
    used = 0;
  };

  for (const run of runs) {
    const font = fontFor(fonts, run);
    /* Split on spaces but keep explicit newlines as forced breaks. */
    for (const [i, chunk] of text(run.text).split("\n").entries()) {
      if (i > 0) push();
      for (const word of chunk.split(/(\s+)/)) {
        if (!word) continue;
        const isSpace = /^\s+$/.test(word);
        if (isSpace && !line.length) continue;
        let piece = word;
        let width = font.widthOfTextAtSize(piece, size);

        /* A single unbreakable token wider than the column — a URL, a hash —
           is chopped rather than allowed to run into the margin. */
        while (width > maxWidth && piece.length > 1) {
          let cut = piece.length;
          while (cut > 1 && font.widthOfTextAtSize(piece.slice(0, cut), size) > maxWidth)
            cut--;
          const head = piece.slice(0, cut);
          if (line.length) push();
          lines.push([{ run, text: head, width: font.widthOfTextAtSize(head, size) }]);
          piece = piece.slice(cut);
          width = font.widthOfTextAtSize(piece, size);
        }

        if (used + width > maxWidth && line.length) {
          push();
          if (isSpace) continue;
        }
        line.push({ run, text: piece, width });
        used += width;
      }
    }
  }
  if (line.length) lines.push(line);
  return lines.length ? lines : [[]];
}

function draw(
  sheet: Sheet,
  lines: Piece[][],
  size: number,
  leading: number,
  indent: number,
  colour: ReturnType<typeof rgb>,
  firstMarker?: { text: string; font: PDFFont },
) {
  lines.forEach((line, i) => {
    sheet.room(leading);
    let x = sheet.left + indent;
    if (i === 0 && firstMarker) {
      sheet.page.drawText(firstMarker.text, {
        x: sheet.left + indent - firstMarker.font.widthOfTextAtSize(firstMarker.text, size) - 6,
        y: sheet.y - size,
        size,
        font: firstMarker.font,
        color: colour,
      });
    }
    for (const piece of line) {
      if (piece.text.trim())
        sheet.page.drawText(piece.text, {
          x,
          y: sheet.y - size,
          size,
          font: fontFor(sheet.fonts, piece.run),
          color: colour,
        });
      x += piece.width;
    }
    sheet.down(leading);
  });
}

const INK = rgb(0.08, 0.08, 0.1);
const SOFT = rgb(0.42, 0.42, 0.46);
const RULE = rgb(0.82, 0.82, 0.85);

const HEADING = { 1: 22, 2: 16, 3: 13 } as const;

/* --------------------------------------------------------------- tables */

function drawTable(
  sheet: Sheet,
  rows: string[][],
  header: boolean,
  size: number,
) {
  if (!rows.length) return;
  const cols = Math.max(...rows.map((r) => r.length));
  const pad = 6;
  const leading = size * 1.35;

  /* Columns are sized by what they hold, then scaled to the page — a table
     of dates and a table of sentences should not get identical columns. */
  const demand = Array.from({ length: cols }, (_, c) =>
    Math.max(
      24,
      ...rows.map((r) =>
        Math.min(220, sheet.fonts.regular.widthOfTextAtSize(text(r[c] ?? ""), size)),
      ),
    ),
  );
  const total = demand.reduce((a, b) => a + b, 0) + cols * pad * 2;
  const scale = sheet.width / total;
  const widths = demand.map((d) => (d + pad * 2) * scale);

  for (const [r, row] of rows.entries()) {
    const isHead = header && r === 0;
    const cells = Array.from({ length: cols }, (_, c) =>
      wrap(
        [{ text: row[c] ?? "", bold: isHead }],
        sheet.fonts,
        size,
        widths[c] - pad * 2,
      ),
    );
    const height = Math.max(...cells.map((l) => l.length)) * leading + pad;
    sheet.room(height + 2);

    const top = sheet.y;
    let x = sheet.left;
    for (const [c, lines] of cells.entries()) {
      let y = top - pad / 2;
      for (const line of lines) {
        let cx = x + pad;
        for (const piece of line) {
          if (piece.text.trim())
            sheet.page.drawText(piece.text, {
              x: cx,
              y: y - size,
              size,
              font: fontFor(sheet.fonts, piece.run),
              color: INK,
            });
          cx += piece.width;
        }
        y -= leading;
      }
      x += widths[c];
    }

    sheet.down(height);
    sheet.page.drawLine({
      start: { x: sheet.left, y: sheet.y },
      end: { x: sheet.left + sheet.width, y: sheet.y },
      thickness: isHead ? 1 : 0.5,
      color: isHead ? SOFT : RULE,
    });
    sheet.down(4);
  }
}

/* ---------------------------------------------------------------- entry */

/**
 * Paints blocks into `doc` as new pages. Returns how many pages it added, so
 * the caller can tell the difference between a document and an empty file.
 */
export function render(
  doc: PDFDocument,
  blocks: Block[],
  fonts: Fonts,
  frame: Frame,
  body = 11,
): number {
  const before = doc.getPageCount();
  const sheet = new Sheet(doc, frame, fonts);
  const leading = body * 1.45;

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const size = HEADING[block.level];
        sheet.room(size * 2.4);
        sheet.down(block.level === 1 ? size * 0.7 : size * 0.9);
        draw(
          sheet,
          wrap(
            block.runs.map((r) => ({ ...r, bold: true })),
            fonts,
            size,
            sheet.width,
          ),
          size,
          size * 1.25,
          0,
          INK,
        );
        sheet.down(size * 0.35);
        break;
      }
      case "para":
        draw(sheet, wrap(block.runs, fonts, body, sheet.width), body, leading, 0, INK);
        sheet.down(leading * 0.45);
        break;
      case "quote": {
        const top = sheet.y;
        draw(
          sheet,
          wrap(
            block.runs.map((r) => ({ ...r, italic: true })),
            fonts,
            body,
            sheet.width - 18,
          ),
          body,
          leading,
          18,
          SOFT,
        );
        /* Only rule the quote when it did not straddle a page break. */
        if (sheet.y < top)
          sheet.page.drawLine({
            start: { x: sheet.left + 4, y: top - 2 },
            end: { x: sheet.left + 4, y: sheet.y + 4 },
            thickness: 2,
            color: RULE,
          });
        sheet.down(leading * 0.45);
        break;
      }
      case "list": {
        block.items.forEach((item, i) => {
          const indent = 18 + item.depth * 16;
          draw(
            sheet,
            wrap(item.runs, fonts, body, sheet.width - indent),
            body,
            leading,
            indent,
            INK,
            {
              text: block.ordered ? `${i + 1}.` : "–",
              font: fonts.regular,
            },
          );
        });
        sheet.down(leading * 0.45);
        break;
      }
      case "code": {
        const size = body - 1;
        const lines = text(block.text).replace(/\n+$/, "").split("\n");
        for (const line of lines)
          draw(
            sheet,
            wrap([{ text: line, mono: true }], fonts, size, sheet.width - 12),
            size,
            size * 1.4,
            12,
            SOFT,
          );
        sheet.down(leading * 0.5);
        break;
      }
      case "table":
        drawTable(sheet, block.rows, block.header, body - 1);
        sheet.down(leading * 0.5);
        break;
      case "rule":
        sheet.room(leading);
        sheet.down(leading * 0.4);
        sheet.page.drawLine({
          start: { x: sheet.left, y: sheet.y },
          end: { x: sheet.left + sheet.width, y: sheet.y },
          thickness: 0.75,
          color: RULE,
        });
        sheet.down(leading * 0.6);
        break;
      case "break":
        /* Asking for a whole page's worth of room forces a fresh one —
           unless this page is already fresh, which would leave a blank. */
        if (sheet.y < frame.height - frame.margin) sheet.room(frame.height);
        break;
    }
  }
  return doc.getPageCount() - before;
}
