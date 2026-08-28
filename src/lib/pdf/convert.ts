/**
 * The universal converter.
 *
 * One drop zone that takes anything: it looks at what each file actually is,
 * sends it to the handler for that type, and appends the result to a single
 * document. A PDF is copied page for page, an image is fitted to a page, and
 * everything else is read into layout blocks and typeset.
 *
 * The rule it follows when something goes wrong is that one bad file should
 * not lose the other nine — a file that cannot be converted is skipped with a
 * reason, and only a run where nothing at all converted is an error.
 */
import { PDFDocument } from "pdf-lib";
import { sniff, type Kind } from "./detect";
import {
  embedFonts,
  frameFrom,
  render,
  type Block,
  type Fonts,
  type Frame,
} from "./layout";
import {
  csvBlocks,
  docxBlocks,
  emlBlocks,
  htmlBlocks,
  markdownBlocks,
  textBlocks,
  xlsxBlocks,
} from "./readers";
import {
  epubBlocks,
  iworkPreview,
  odpBlocks,
  odsBlocks,
  odtBlocks,
  pptxBlocks,
  rtfBlocks,
} from "./office";
import { decodePsd, decodeTiff, rasterToPng } from "./raster";
import { base, pdfBlob, zip, type OutFile } from "./util";
import type { Engine } from "./engines";

const READERS: Partial<Record<Kind, (file: File) => Promise<Block[]>>> = {
  docx: docxBlocks,
  xlsx: xlsxBlocks,
  pptx: pptxBlocks,
  odt: odtBlocks,
  ods: odsBlocks,
  odp: odpBlocks,
  epub: epubBlocks,
  rtf: rtfBlocks,
  eml: emlBlocks,
  markdown: markdownBlocks,
  html: htmlBlocks,
  csv: csvBlocks,
  text: textBlocks,
};

/* ----------------------------------------------------------------- images */

/** Decodes anything the browser can open into PNG bytes pdf-lib can embed. */
async function rasterise(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
  canvas.width = canvas.height = 0;
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * SVG is vector but pdf-lib embeds bitmaps, so it is drawn at 2× the size it
 * declares — big enough that the edges stay clean in print.
 */
async function rasteriseSvg(file: File): Promise<Uint8Array> {
  const url = URL.createObjectURL(new Blob([file], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("This SVG could not be drawn."));
      img.src = url;
    });
    /* An SVG with only a viewBox reports no intrinsic size in some engines. */
    const w = img.naturalWidth || img.width || 1000;
    const h = img.naturalHeight || img.height || 1000;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * 2);
    canvas.height = Math.round(h * 2);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
    canvas.width = canvas.height = 0;
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Adds one image as a page, fitted inside the margins or sized to itself. */
async function addImagePage(
  doc: PDFDocument,
  bytes: Uint8Array,
  frame: Frame,
  fit: boolean,
) {
  /* A JPEG is embedded as it is rather than re-encoded, which keeps a photo
     at its original size and quality. */
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
  const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  if (!fit) {
    const page = doc.addPage([
      img.width + frame.margin * 2,
      img.height + frame.margin * 2,
    ]);
    page.drawImage(img, {
      x: frame.margin,
      y: frame.margin,
      width: img.width,
      height: img.height,
    });
    return;
  }
  /* A photo that is wider than it is tall goes on a landscape page rather
     than being shrunk into a portrait one. */
  const landscape = img.width > img.height;
  const [pw, ph] =
    landscape && frame.width < frame.height
      ? [frame.height, frame.width]
      : [frame.width, frame.height];

  const page = doc.addPage([pw, ph]);
  const box = { w: pw - frame.margin * 2, h: ph - frame.margin * 2 };
  const ratio = Math.min(box.w / img.width, box.h / img.height, 1);
  const w = img.width * ratio;
  const h = img.height * ratio;
  page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
}

/* ---------------------------------------------------------------- engine */

type Note = { name: string; reason: string; fatal: boolean };

/**
 * Converts one file into pages on `doc`. Returns a warning when the file
 * converted but not completely — throwing is reserved for not converting.
 */
async function convertInto(
  doc: PDFDocument,
  file: File,
  frame: Frame,
  opts: Record<string, string>,
  fonts: () => Promise<Fonts>,
): Promise<string | undefined> {
  const { kind, label, reason } = await sniff(file);

  if (kind === "unsupported")
    throw new Error(reason ?? `${label} files cannot be converted here.`);

  if (kind === "pdf") {
    const src = await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
    });
    const pages = await doc.copyPages(src, src.getPageIndices());
    pages.forEach((p) => doc.addPage(p));
    return;
  }

  /* Pages, Numbers and Keynote are converted through the preview they carry;
     when that preview is a PDF it is the whole document. */
  if (kind === "iwork") {
    const preview = await iworkPreview(file);
    if (preview.pdf) {
      const src = await PDFDocument.load(preview.pdf, { ignoreEncryption: true });
      const pages = await doc.copyPages(src, src.getPageIndices());
      pages.forEach((p) => doc.addPage(p));
      return;
    }
    await addImagePage(doc, preview.image!, frame, opts.size !== "fit");
    return "only its cover page could be converted, because this file carries a picture preview rather than a PDF one";
  }

  /* Two formats no browser will decode, so we decode them ourselves. */
  if (kind === "psd" || kind === "tiff") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const raster = kind === "psd" ? decodePsd(bytes) : await decodeTiff(bytes);
    await addImagePage(doc, await rasterToPng(raster), frame, opts.size !== "fit");
    return;
  }

  if (kind === "image" || kind === "svg") {
    let bytes: Uint8Array;
    try {
      bytes = kind === "svg" ? await rasteriseSvg(file) : await rasterise(file);
    } catch {
      throw new Error(
        label === "HEIC photo"
          ? "This browser cannot open HEIC photos. Safari can, or set your iPhone to shoot in JPEG under Settings, Camera, Formats."
          : `This ${label} could not be decoded.`,
      );
    }
    await addImagePage(doc, bytes, frame, opts.size !== "fit");
    return;
  }

  const reader = READERS[kind]!;
  const blocks = await reader(file);
  const added = render(doc, blocks, await fonts(), frame);
  if (!added) throw new Error("This file turned out to be empty.");
}

/** Reports what a mixed run produced, so a skipped file is never silent. */
function summarise(notes: Note[], converted: number): string {
  const detail = notes.map((n) => `${n.name}: ${n.reason}`).join("\n");
  if (!converted) throw new Error(detail || "Nothing here could be converted.");
  return detail;
}

const anyToPdf: Engine = async (files, opts, onProgress) => {
  const frame = frameFrom(opts);
  /* The runner writes "on" or "" for a toggle, and an engine called without
     options at all should still combine — hence the default rather than a
     comparison against "off". */
  const combine = (opts.combine ?? "on") === "on" && files.length > 1;
  const stem = base(files[0].name);

  /* Fonts are embedded once per output document and only when a file that
     needs typesetting actually turns up — a run of photos embeds none. */
  const fontsFor = (doc: PDFDocument) => {
    let pending: Promise<Fonts> | null = null;
    return () => (pending ??= embedFonts(doc));
  };

  const notes: Note[] = [];
  const outputs: OutFile[] = [];
  let combined: PDFDocument | null = null;
  let converted = 0;

  if (combine) combined = await PDFDocument.create();
  const fonts = combined ? fontsFor(combined) : null;

  for (const [i, file] of files.entries()) {
    onProgress(i / files.length, file.name);
    try {
      let warning: string | undefined;
      if (combined) {
        warning = await convertInto(combined, file, frame, opts, fonts!);
      } else {
        const doc = await PDFDocument.create();
        warning = await convertInto(doc, file, frame, opts, fontsFor(doc));
        doc.setTitle(base(file.name));
        outputs.push({
          name: `${base(file.name)}.pdf`,
          blob: pdfBlob(await doc.save()),
        });
      }
      converted++;
      if (warning) notes.push({ name: file.name, reason: warning, fatal: false });
    } catch (e) {
      notes.push({
        name: file.name,
        reason: e instanceof Error ? e.message : "This file could not be converted.",
        fatal: true,
      });
    }
    onProgress((i + 1) / files.length, file.name);
  }

  const note = summarise(notes, converted);

  if (combined) {
    combined.setTitle(stem);
    outputs.push({ name: `${stem}-converted.pdf`, blob: pdfBlob(await combined.save()) });
  }

  onProgress(1);
  const result =
    outputs.length > 1 ? [await zip(outputs, `${stem}-pdf.zip`)] : outputs;

  /* Files that were skipped ride back on the result so the runner can say so
     without failing a run that mostly worked. */
  return note ? result.map((f, i) => (i ? f : { ...f, note })) : result;
};

export default anyToPdf;

/* Re-exported so the tool page can list what the drop zone accepts without
   importing the detector's internals. */
export const SUPPORTED = [
  "PDF",
  "Illustrator (.ai)",
  "Word (.docx)",
  "Excel (.xlsx)",
  "PowerPoint (.pptx)",
  "OpenDocument (.odt, .ods, .odp)",
  "Pages, Numbers, Keynote",
  "RTF",
  "EPUB",
  "Email (.eml)",
  "JPG",
  "PNG",
  "WebP",
  "HEIC",
  "AVIF",
  "GIF",
  "BMP",
  "TIFF",
  "PSD",
  "SVG",
  "HTML",
  "Markdown",
  "CSV",
  "TXT",
] as const;
