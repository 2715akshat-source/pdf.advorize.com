/**
 * The tools themselves. Every function here runs entirely in the visitor's
 * browser: files are read with FileReader, worked on with pdf-lib or pdf.js,
 * and handed back as blobs. Nothing is uploaded, so there is no server-side
 * counterpart to any of this.
 */
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import anyToPdf from "./convert";
import { getPdfjs } from "./pdfjs";
import { base, parsePages, pdfBlob, zip, type OutFile } from "./util";

export type Options = Record<string, string>;
export type Progress = (fraction: number, label?: string) => void;
export type Engine = (
  files: File[],
  opts: Options,
  onProgress: Progress,
) => Promise<OutFile[]>;

const load = async (file: File, ignoreEncryption = false) =>
  PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption });

const save = async (doc: PDFDocument) => pdfBlob(await doc.save());

/* ---------------------------------------------------------------- merge */

const merge: Engine = async (files, opts, onProgress) => {
  const out = await PDFDocument.create();
  for (const [i, file] of files.entries()) {
    const src = await load(file, true);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    onProgress((i + 1) / files.length, file.name);
  }
  out.setTitle(opts.title || "Merged document");
  return [{ name: `${base(files[0].name)}-merged.pdf`, blob: await save(out) }];
};

/* ---------------------------------------------------------------- split */

const split: Engine = async (files, opts, onProgress) => {
  const src = await load(files[0], true);
  const total = src.getPageCount();
  const stem = base(files[0].name);

  if (opts.mode === "ranges") {
    const groups = (opts.ranges || "1-")
      .split(/[;\n]/)
      .map((g) => g.trim())
      .filter(Boolean);
    const outputs: OutFile[] = [];
    for (const [i, group] of groups.entries()) {
      const idx = parsePages(group, total);
      if (!idx.length) continue;
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, idx);
      pages.forEach((p) => doc.addPage(p));
      outputs.push({
        name: `${stem}-${group.replace(/[^\w-]/g, "")}.pdf`,
        blob: await save(doc),
      });
      onProgress((i + 1) / groups.length);
    }
    return outputs.length === 1
      ? outputs
      : [await zip(outputs, `${stem}-split.zip`)];
  }

  const size = Math.max(1, Number(opts.every || 1));
  const outputs: OutFile[] = [];
  for (let start = 0; start < total; start += size) {
    const idx = Array.from(
      { length: Math.min(size, total - start) },
      (_, k) => start + k,
    );
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, idx);
    pages.forEach((p) => doc.addPage(p));
    const label =
      size === 1 ? `${start + 1}` : `${start + 1}-${start + idx.length}`;
    outputs.push({ name: `${stem}-${label}.pdf`, blob: await save(doc) });
    onProgress((start + size) / total);
  }
  return outputs.length === 1
    ? outputs
    : [await zip(outputs, `${stem}-split.zip`)];
};

/* ------------------------------------------------- page rearrangement */

/** rotate / remove / extract / organise / reverse all share this shape. */
const pages =
  (mode: "rotate" | "remove" | "extract" | "organize" | "reverse"): Engine =>
  async (files, opts, onProgress) => {
    const src = await load(files[0], true);
    const total = src.getPageCount();
    const stem = base(files[0].name);
    onProgress(0.3);

    if (mode === "rotate") {
      const turn = Number(opts.angle || 90);
      const targets = opts.pages?.trim()
        ? parsePages(opts.pages, total)
        : src.getPageIndices();
      for (const i of targets) {
        const page = src.getPage(i);
        page.setRotation(degrees((page.getRotation().angle + turn + 360) % 360));
      }
      onProgress(1);
      return [{ name: `${stem}-rotated.pdf`, blob: await save(src) }];
    }

    let order: number[];
    if (mode === "remove") {
      const drop = new Set(parsePages(opts.pages || "", total));
      order = src.getPageIndices().filter((i) => !drop.has(i));
    } else if (mode === "reverse") {
      order = src.getPageIndices().reverse();
    } else {
      order = parsePages(opts.pages || "", total);
    }
    if (!order.length) throw new Error("That leaves no pages in the document.");

    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(src, order);
    copied.forEach((p) => doc.addPage(p));
    onProgress(1);
    return [{ name: `${stem}-${mode}.pdf`, blob: await save(doc) }];
  };

/* ------------------------------------------------------------ rasterise */

type RasterOpts = {
  scale: number;
  grayscale?: boolean;
  type: "image/jpeg" | "image/png";
  quality?: number;
};

/** Renders every page to a canvas — the shared step behind compress,
    flatten, greyscale and both PDF→image tools. */
async function rasterPages(
  file: File,
  { scale, grayscale, type, quality }: RasterOpts,
  onProgress: (f: number) => void,
  password?: string,
) {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    password,
  }).promise;

  const out: { blob: Blob; width: number; height: number }[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    if (grayscale) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        px[i] = px[i + 1] = px[i + 2] = v;
      }
      ctx.putImageData(data, 0, 0);
    }

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), type, quality),
    );
    out.push({ blob, width: canvas.width, height: canvas.height });
    canvas.width = canvas.height = 0;
    onProgress(n / doc.numPages);
  }
  await doc.destroy();
  return out;
}

/** Wraps rendered page images back into a PDF of the same page dimensions. */
async function imagesToPdf(
  images: { blob: Blob; width: number; height: number }[],
  type: "image/jpeg" | "image/png",
) {
  const doc = await PDFDocument.create();
  for (const img of images) {
    const bytes = new Uint8Array(await img.blob.arrayBuffer());
    const embedded =
      type === "image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }
  return doc;
}

const QUALITY: Record<string, { scale: number; quality: number }> = {
  low: { scale: 1.0, quality: 0.55 },
  medium: { scale: 1.35, quality: 0.7 },
  high: { scale: 1.8, quality: 0.85 },
};

const compress: Engine = async (files, opts, onProgress) => {
  const preset = QUALITY[opts.level || "medium"] ?? QUALITY.medium;
  const images = await rasterPages(
    files[0],
    { ...preset, type: "image/jpeg", grayscale: opts.grayscale === "on" },
    (f) => onProgress(f * 0.85),
  );
  const doc = await imagesToPdf(images, "image/jpeg");
  onProgress(1);
  return [
    { name: `${base(files[0].name)}-compressed.pdf`, blob: await save(doc) },
  ];
};

const rasterToPdf =
  (grayscale: boolean): Engine =>
  async (files, opts, onProgress) => {
    const images = await rasterPages(
      files[0],
      { scale: Number(opts.scale || 2), type: "image/jpeg", quality: 0.9, grayscale },
      (f) => onProgress(f * 0.85),
    );
    const doc = await imagesToPdf(images, "image/jpeg");
    onProgress(1);
    const suffix = grayscale ? "grayscale" : "flattened";
    return [
      { name: `${base(files[0].name)}-${suffix}.pdf`, blob: await save(doc) },
    ];
  };

const pdfToImages =
  (type: "image/jpeg" | "image/png"): Engine =>
  async (files, opts, onProgress) => {
    const ext = type === "image/png" ? "png" : "jpg";
    const stem = base(files[0].name);
    const images = await rasterPages(
      files[0],
      { scale: Number(opts.dpi || 150) / 72, type, quality: 0.92 },
      (f) => onProgress(f * 0.9),
    );
    const outputs = images.map((img, i) => ({
      name: `${stem}-${String(i + 1).padStart(3, "0")}.${ext}`,
      blob: img.blob,
    }));
    onProgress(1);
    return outputs.length === 1
      ? outputs
      : [await zip(outputs, `${stem}-${ext}.zip`)];
  };

/* ------------------------------------------------------- images → PDF */

const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

const imageToPdf: Engine = async (files, opts, onProgress) => {
  const doc = await PDFDocument.create();
  const margin = Number(opts.margin || 0);

  for (const [i, file] of files.entries()) {
    let bytes = new Uint8Array(await file.arrayBuffer());
    let isPng = /png$/i.test(file.type) || /\.png$/i.test(file.name);

    /* Anything that is not already a JPEG or PNG (HEIC, WebP, GIF…) goes
       through a canvas first so pdf-lib has something it can embed. */
    if (!isPng && !/jpe?g$/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      const blob: Blob = await new Promise((r) =>
        canvas.toBlob((b) => r(b!), "image/png"),
      );
      bytes = new Uint8Array(await blob.arrayBuffer());
      isPng = true;
    }

    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const fit = PAGE_SIZES[opts.size] ?? null;

    if (!fit) {
      const page = doc.addPage([
        img.width + margin * 2,
        img.height + margin * 2,
      ]);
      page.drawImage(img, {
        x: margin,
        y: margin,
        width: img.width,
        height: img.height,
      });
    } else {
      const [pw, ph] = opts.orientation === "landscape" ? [fit[1], fit[0]] : fit;
      const page = doc.addPage([pw, ph]);
      const box = { w: pw - margin * 2, h: ph - margin * 2 };
      const ratio = Math.min(box.w / img.width, box.h / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
    onProgress((i + 1) / files.length);
  }
  return [{ name: `${base(files[0].name)}.pdf`, blob: await save(doc) }];
};

/* ------------------------------------------------------- page numbers */

const pageNumbers: Engine = async (files, opts, onProgress) => {
  const doc = await load(files[0], true);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = Number(opts.size || 11);
  const start = Number(opts.start || 1);
  const total = doc.getPageCount();
  const skip = opts.skipFirst === "on" ? 1 : 0;

  doc.getPages().forEach((page, i) => {
    if (i < skip) return;
    const n = start + i - skip;
    const text = (opts.format || "n")
      .replace(/\bn\b/g, String(n))
      .replace(/\btotal\b/g, String(total - skip));
    const width = font.widthOfTextAtSize(text, size);
    const { width: pw, height: ph } = page.getSize();
    const x =
      opts.position?.endsWith("left")
        ? 40
        : opts.position?.endsWith("right")
          ? pw - 40 - width
          : (pw - width) / 2;
    const y = opts.position?.startsWith("top") ? ph - 40 : 28;
    page.drawText(text, { x, y, size, font, color: rgb(0.1, 0.1, 0.1) });
    onProgress((i + 1) / total);
  });
  return [{ name: `${base(files[0].name)}-numbered.pdf`, blob: await save(doc) }];
};

/* ---------------------------------------------------------- watermark */

const watermark: Engine = async (files, opts, onProgress) => {
  const doc = await load(files[0], true);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = opts.text || "CONFIDENTIAL";
  const size = Number(opts.size || 52);
  const opacity = Number(opts.opacity || 15) / 100;
  const angle = Number(opts.angle || 45);
  const total = doc.getPageCount();

  doc.getPages().forEach((page, i) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, size);
    const rad = (angle * Math.PI) / 180;
    page.drawText(text, {
      x: width / 2 - (Math.cos(rad) * textWidth) / 2,
      y: height / 2 - (Math.sin(rad) * textWidth) / 2,
      size,
      font,
      opacity,
      rotate: degrees(angle),
      color: rgb(0.5, 0.5, 0.5),
    });
    onProgress((i + 1) / total);
  });
  return [{ name: `${base(files[0].name)}-watermarked.pdf`, blob: await save(doc) }];
};

/* ----------------------------------------------------------- metadata */

const metadata: Engine = async (files, opts, onProgress) => {
  const doc = await load(files[0], true);
  if (opts.strip === "on") {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("");
    doc.setCreator("");
  } else {
    if (opts.title !== undefined) doc.setTitle(opts.title);
    if (opts.author !== undefined) doc.setAuthor(opts.author);
    if (opts.subject !== undefined) doc.setSubject(opts.subject);
    if (opts.keywords)
      doc.setKeywords(opts.keywords.split(",").map((k) => k.trim()));
  }
  doc.setModificationDate(new Date());
  onProgress(1);
  return [{ name: `${base(files[0].name)}-metadata.pdf`, blob: await save(doc) }];
};

/* --------------------------------------------------------- extract text */

const toText: Engine = async (files, opts, onProgress) => {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(await files[0].arrayBuffer()),
  }).promise;

  const parts: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let line = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trimEnd());
        line = "";
      }
      line += item.str + (item.hasEOL ? "\n" : "");
      lastY = y;
    }
    lines.push(line.trimEnd());
    if (opts.pageBreaks !== "off") parts.push(`--- Page ${n} ---`);
    parts.push(lines.join("\n").trim());
    onProgress(n / doc.numPages);
  }
  await doc.destroy();
  return [
    {
      name: `${base(files[0].name)}.txt`,
      blob: new Blob([parts.join("\n\n")], { type: "text/plain;charset=utf-8" }),
    },
  ];
};

/* ---------------------------------------------------------------- crop */

const crop: Engine = async (files, opts, onProgress) => {
  const doc = await load(files[0], true);
  const t = Number(opts.top || 0);
  const b = Number(opts.bottom || 0);
  const l = Number(opts.left || 0);
  const r = Number(opts.right || 0);
  const total = doc.getPageCount();

  doc.getPages().forEach((page, i) => {
    const box = page.getMediaBox();
    const width = box.width - l - r;
    const height = box.height - t - b;
    if (width <= 0 || height <= 0)
      throw new Error("Those margins crop the whole page away.");
    page.setCropBox(box.x + l, box.y + b, width, height);
    onProgress((i + 1) / total);
  });
  return [{ name: `${base(files[0].name)}-cropped.pdf`, blob: await save(doc) }];
};

/* -------------------------------------------------------------- unlock */

const unlock: Engine = async (files, opts, onProgress) => {
  const stem = base(files[0].name);
  /* An owner password only sets restrictions — the document itself is
     readable, so re-saving it drops them without touching the pages. */
  try {
    const doc = await load(files[0], true);
    doc.getPageCount();
    onProgress(1);
    return [{ name: `${stem}-unlocked.pdf`, blob: await save(doc) }];
  } catch {
    /* A user password actually encrypts the content, so the only way
       through is to open it with the password and rebuild the pages. */
    if (!opts.password)
      throw new Error(
        "This PDF needs its open password before it can be unlocked.",
      );
    const images = await rasterPages(
      files[0],
      { scale: 2, type: "image/jpeg", quality: 0.9 },
      (f) => onProgress(f * 0.9),
      opts.password,
    );
    const doc = await imagesToPdf(images, "image/jpeg");
    onProgress(1);
    return [{ name: `${stem}-unlocked.pdf`, blob: await save(doc) }];
  }
};

export const engines: Record<string, Engine> = {
  merge,
  split,
  rotate: pages("rotate"),
  remove: pages("remove"),
  extract: pages("extract"),
  organize: pages("organize"),
  reverse: pages("reverse"),
  compress,
  flatten: rasterToPdf(false),
  grayscale: rasterToPdf(true),
  toJpg: pdfToImages("image/jpeg"),
  toPng: pdfToImages("image/png"),
  imageToPdf,
  anyToPdf,
  pageNumbers,
  watermark,
  metadata,
  toText,
  crop,
  unlock,
};
