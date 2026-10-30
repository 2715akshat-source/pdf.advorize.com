"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import Magnetic from "./Magnetic";
import { takeHandoff } from "@/lib/handoff";
import { sizeBucket, track } from "@/lib/analytics";
import anyToPdf from "@/lib/pdf/convert";
import { sniff } from "@/lib/pdf/detect";
import { getPdfjs } from "@/lib/pdf/pdfjs";
import { decodePsd, decodeTiff } from "@/lib/pdf/raster";
import { prepareModel, removePainted } from "@/lib/pdf/inpaint";
import { stripPdfWatermark } from "@/lib/pdf/unwatermark";
import { base, pdfBlob } from "@/lib/pdf/util";

const EASE = [0.16, 1, 0.3, 1] as const;

/** PDF pages are worked on at 144 dpi — sharp enough to print, small enough
    for the model to fill in a second or two. */
const PAGE_SCALE = 2;
/** Photos past this are scaled down to it; a 50-megapixel canvas is where
    phones start running out of memory. */
const MAX_SIDE = 6000;

type PdfDoc = Awaited<
  ReturnType<Awaited<ReturnType<typeof getPdfjs>>["getDocument"]>["promise"]
>;

type Undo = { page: number; image?: HTMLCanvasElement; mask?: ImageData };

const copyCanvas = (src: HTMLCanvasElement) => {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  c.getContext("2d")!.drawImage(src, 0, 0);
  return c;
};

const isPdf = (f: File) => /pdf/i.test(f.type) || /\.pdf$/i.test(f.name);

/** Any picture the browser — or our own PSD and TIFF decoders — can read,
    drawn onto a canvas no bigger than MAX_SIDE. */
async function pictureCanvas(file: File, kind: string): Promise<HTMLCanvasElement> {
  let source: CanvasImageSource;
  let w: number;
  let h: number;
  if (kind === "psd" || kind === "tiff") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const r = kind === "psd" ? decodePsd(bytes) : await decodeTiff(bytes);
    const c = document.createElement("canvas");
    c.width = r.width;
    c.height = r.height;
    c.getContext("2d")!.putImageData(
      new ImageData(new Uint8ClampedArray(r.pixels), r.width, r.height),
      0,
      0,
    );
    [source, w, h] = [c, r.width, r.height];
  } else if (kind === "svg") {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      [source, w, h] = [img, img.naturalWidth || 1600, img.naturalHeight || 1200];
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } else {
    const bmp = await createImageBitmap(file);
    [source, w, h] = [bmp, bmp.width, bmp.height];
  }
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext("2d")!.drawImage(source, 0, 0, c.width, c.height);
  return c;
}

/**
 * Remove watermark.
 *
 * Two ways in, chosen by what the watermark actually is. A PDF watermark
 * that is still its own object is deleted outright, which leaves the page
 * exactly as it was underneath. Anything else — a photo, a screenshot, a
 * scan, a watermark flattened into the page — is painted over and filled in
 * by the inpainting model, which replaces only the painted pixels.
 */
export default function WatermarkRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /* PDF state: the document being worked on (after any stripping), and what
     the strip found. */
  const [working, setWorking] = useState<Blob | null>(null);
  const [removed, setRemoved] = useState<number | null>(null);
  const [wmText, setWmText] = useState("");
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(0);
  const [allPages, setAllPages] = useState(true);

  const [brush, setBrush] = useState(24);
  const [painted, setPainted] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [editedCount, setEditedCount] = useState(0);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  /** How the last removal went: solved exactly, or filled in. */
  const [outcome, setOutcome] = useState<"recovered" | "filled" | null>(null);
  const [ready, setReady] = useState(false);
  /** Whether any page has been painted out — mirrors `edited` for render. */
  const [anyEdits, setAnyEdits] = useState(false);

  const view = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pdfDoc = useRef<PdfDoc | null>(null);
  /** Pages (or the one image) as they are now, and as they arrived. */
  const current = useRef(new Map<number, HTMLCanvasElement>());
  const originals = useRef(new Map<number, HTMLCanvasElement>());
  const edited = useRef(new Set<number>());
  const history = useRef<Undo[]>([]);
  const drawing = useRef<{ x: number; y: number } | null>(null);

  /* -------------------------------------------------------------- loading */

  const openPdf = useCallback(async (blob: Blob) => {
    const pdfjs = await getPdfjs();
    await pdfDoc.current?.destroy();
    pdfDoc.current = await pdfjs.getDocument({
      data: new Uint8Array(await blob.arrayBuffer()),
    }).promise;
    setPageCount(pdfDoc.current.numPages);
  }, []);

  const resetWork = () => {
    current.current.clear();
    originals.current.clear();
    edited.current.clear();
    history.current = [];
    setEditedCount(0);
    setPainted(false);
    setFallbackUsed(false);
    setOutcome(null);
    setAnyEdits(false);
    setPage(0);
  };

  const load = useCallback(
    async (incoming: File) => {
      setError(null);
      setRemoved(null);
      setWorking(null);
      setReady(false);
      resetWork();
      setFile(incoming);

      let label = "file";
      try {
        const found = await sniff(incoming);
        label = found.label;
        if (found.kind === "unsupported") {
          throw new Error(found.reason ?? `${found.label} files cannot be opened here.`);
        }
        let doc: File | null = found.kind === "pdf" ? incoming : null;

        /* Word, PowerPoint, Pages and the rest become a PDF first, through
           the same converter as Convert to PDF — then they are a PDF like
           any other. */
        if (!doc && !["image", "svg", "psd", "tiff"].includes(found.kind)) {
          setBusy(`Opening the ${found.label}`);
          const [pdf] = await anyToPdf([incoming], {}, setProgress);
          doc = new File([pdf.blob], `${base(incoming.name)}.pdf`, {
            type: "application/pdf",
          });
          setFile(doc);
        }

        if (doc) {
          /* Look for a separate watermark first — if there is one, deleting
             it beats any amount of painting. */
          setBusy("Looking for the watermark");
          track("tool_run", { tool: "remove-watermark", files: 1, size: sizeBucket(incoming.size) });
          const out = await stripPdfWatermark(doc, "", setProgress);
          setRemoved(out.removed);
          const blob = out.removed ? out.blob : doc;
          setWorking(blob);
          await openPdf(blob);
        } else {
          const c = await pictureCanvas(incoming, found.kind);
          current.current.set(0, c);
          originals.current.set(0, copyCanvas(c));
          setPageCount(1);
        }
        setReady(true);
      } catch (e) {
        const own = e instanceof Error && e.message && !/^(Failed|The source|Invalid|InvalidState)/.test(e.message);
        setError(
          own
            ? (e as Error).message
            : label === "HEIC photo"
              ? "This browser cannot open HEIC photos. Safari can — or set your iPhone to shoot JPEG under Settings, Camera, Formats."
              : isPdf(incoming)
                ? "That PDF could not be opened. If it asks for a password, remove it with the unlock tool first."
                : `That ${label} could not be opened. Try saving it as a PNG, JPG or PDF first.`,
        );
        setFile(null);
      } finally {
        setBusy(null);
        setProgress(0);
      }
    },
    [openPdf],
  );

  useEffect(() => {
    const handed = takeHandoff();
    /* Arriving by a client-side link skips this page's isolation headers,
       which leaves the fill on one thread. With no file in hand yet, one
       real reload costs nothing and makes it several times faster. */
    if (!handed?.length && !self.crossOriginIsolated) {
      let tried = true;
      try {
        tried = sessionStorage.getItem("wm-isolate") === "1";
        sessionStorage.setItem("wm-isolate", "1");
      } catch {}
      if (!tried) {
        window.location.reload();
        return;
      }
    }
    if (handed?.length) load(handed[0]);
    return () => {
      pdfDoc.current?.destroy();
    };
  }, [load]);

  /** The canvas for a page, rendering it the first time it is asked for. */
  const pageCanvas = useCallback(async (n: number) => {
    const have = current.current.get(n);
    if (have) return have;
    const p = await pdfDoc.current!.getPage(n + 1);
    const v = p.getViewport({ scale: PAGE_SCALE });
    const c = document.createElement("canvas");
    c.width = Math.floor(v.width);
    c.height = Math.floor(v.height);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    await p.render({ canvasContext: ctx, viewport: v }).promise;
    current.current.set(n, c);
    originals.current.set(n, copyCanvas(c));
    return c;
  }, []);

  /* --------------------------------------------------------------- render */

  const paint = useCallback(async () => {
    if (!ready) return;
    const src = await pageCanvas(page);
    const shown = comparing ? originals.current.get(page) ?? src : src;
    const v = view.current;
    const m = maskRef.current;
    if (!v || !m) return;
    if (v.width !== src.width || v.height !== src.height) {
      v.width = m.width = src.width;
      v.height = m.height = src.height;
    }
    v.getContext("2d")!.drawImage(shown, 0, 0);
  }, [page, comparing, ready, pageCanvas]);

  useEffect(() => {
    paint();
  }, [paint, editedCount]);

  /** Moves to another page, which starts with a clean mask. */
  const goTo = (n: number) => {
    const m = maskRef.current;
    m?.getContext("2d")!.clearRect(0, 0, m.width, m.height);
    setPainted(false);
    setPage(n);
  };

  /* ---------------------------------------------------------------- brush */

  const at = (e: { clientX: number; clientY: number }) => {
    const m = maskRef.current!;
    const r = m.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * m.width) / r.width,
      y: ((e.clientY - r.top) * m.height) / r.height,
      k: m.width / r.width,
    };
  };

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }, k: number) => {
    const ctx = maskRef.current!.getContext("2d")!;
    ctx.strokeStyle = ctx.fillStyle = "#ff4f18";
    ctx.lineWidth = brush * k;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x + 0.01, to.y);
    ctx.stroke();
  };

  const onDown = (e: React.PointerEvent) => {
    const m = maskRef.current;
    if (!m || busy) return;
    try {
      m.setPointerCapture(e.pointerId);
    } catch {}
    history.current.push({
      page,
      mask: m.getContext("2d")!.getImageData(0, 0, m.width, m.height),
    });
    const p = at(e);
    drawing.current = p;
    stroke(p, p, p.k);
    setPainted(true);
    /* Painting is the signal they mean to use the fill — start the model
       now, while they are still painting, not when they press the button. */
    prepareModel().catch(() => {});
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const p = at(e);
    stroke(drawing.current, p, p.k);
    drawing.current = p;
  };

  const onUp = () => {
    drawing.current = null;
  };

  const clearMask = () => {
    const m = maskRef.current;
    if (!m) return;
    history.current.push({
      page,
      mask: m.getContext("2d")!.getImageData(0, 0, m.width, m.height),
    });
    m.getContext("2d")!.clearRect(0, 0, m.width, m.height);
    setPainted(false);
  };

  const undo = () => {
    const last = history.current.pop();
    if (!last) return;
    if (last.page !== page) goTo(last.page);
    if (last.image) {
      current.current.set(last.page, last.image);
      setEditedCount((n) => n + 1);
    }
    if (last.mask && maskRef.current) {
      maskRef.current.getContext("2d")!.putImageData(last.mask, 0, 0);
      setPainted(true);
    }
  };

  /* --------------------------------------------------------------- remove */

  const removeByText = async () => {
    if (!file || !wmText.trim()) return;
    setError(null);
    setBusy("Removing the watermark text");
    try {
      const out = await stripPdfWatermark(file, wmText, setProgress);
      if (!out.removed) {
        setError(
          `No text block saying "${wmText.trim()}" on its own was found — the watermark may be an image or part of a scan. Paint over it instead.`,
        );
        return;
      }
      resetWork();
      setRemoved(out.removed);
      setWorking(out.blob);
      await openPdf(out.blob);
      setEditedCount((n) => n + 1);
    } catch {
      setError("That PDF could not be processed.");
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  const fill = async () => {
    const m = maskRef.current;
    if (!m || !painted) return;
    setError(null);
    const started = performance.now();
    const targets = file && isPdf(file) && allPages ? [...Array(pageCount).keys()] : [page];
    const shape = { tool: "remove-watermark", files: 1, size: sizeBucket(file?.size ?? 0) };
    track("tool_run", { ...shape, pages: targets.length });

    /* The mask is drawn on this page; other pages get it scaled to fit. */
    const mask = copyCanvas(m);
    try {
      let solvedAll = true;
      for (const [k, n] of targets.entries()) {
        const src = await pageCanvas(n);
        const scaled = document.createElement("canvas");
        scaled.width = src.width;
        scaled.height = src.height;
        scaled.getContext("2d")!.drawImage(mask, 0, 0, src.width, src.height);

        const { canvas, usedModel, recovered } = await removePainted(src, scaled, (f, label) => {
          setBusy(targets.length > 1 ? `${label} — page ${n + 1} of ${pageCount}` : label);
          setProgress(targets.length > 1 ? (k + f) / targets.length : f);
        });
        if (!usedModel) setFallbackUsed(true);
        if (!recovered) solvedAll = false;
        history.current.push({ page: n, image: src });
        current.current.set(n, canvas);
        edited.current.add(n);
      }
      m.getContext("2d")!.clearRect(0, 0, m.width, m.height);
      setPainted(false);
      setOutcome(solvedAll ? "recovered" : "filled");
      setAnyEdits(true);
      setEditedCount((x) => x + 1);
      track("tool_success", {
        ...shape,
        seconds: Math.round((performance.now() - started) / 100) / 10,
      });
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : "The fill did not finish.";
      setError(message);
      track("tool_error", { ...shape, reason: message.slice(0, 100) });
    } finally {
      setBusy(null);
      setProgress(0);
    }
  };

  /* ------------------------------------------------------------- download */

  const download = async () => {
    if (!file) return;
    setBusy("Preparing the download");
    try {
      let blob: Blob;
      let name: string;
      if (isPdf(file)) {
        const doc = await PDFDocument.load(await (working ?? file).arrayBuffer(), {
          ignoreEncryption: true,
        });
        /* Only the pages that were painted on become pictures; every other
           page is copied across untouched, text and all. */
        for (const n of [...edited.current].sort((a, b) => a - b)) {
          const c = current.current.get(n)!;
          const jpg: Blob = await new Promise((r) =>
            c.toBlob((b) => r(b!), "image/jpeg", 0.92),
          );
          const img = await doc.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
          const w = c.width / PAGE_SCALE;
          const h = c.height / PAGE_SCALE;
          const fresh = doc.insertPage(n, [w, h]);
          fresh.drawImage(img, { x: 0, y: 0, width: w, height: h });
          doc.removePage(n + 1);
        }
        blob = edited.current.size ? pdfBlob(await doc.save()) : (working ?? file);
        name = `${base(file.name)}-no-watermark.pdf`;
      } else {
        const type = /image\/(png|jpeg|webp)/.test(file.type) ? file.type : "image/png";
        const ext = type.split("/")[1].replace("jpeg", "jpg");
        const c = current.current.get(0)!;
        blob = await new Promise((r) => c.toBlob((b) => r(b!), type, 0.95));
        name = `${base(file.name)}-no-watermark.${ext}`;
      }
      track("download", {
        tool: "remove-watermark",
        format: name.split(".").pop() ?? "",
        size: sizeBucket(blob.size),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setError("The file could not be saved.");
    } finally {
      setBusy(null);
    }
  };

  /* ----------------------------------------------------------------- view */

  const dropzone = (
    <div
      className="dropzone flex flex-col items-center justify-center px-6 py-20 text-center md:py-24"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) load(f);
      }}
    >
      <Magnetic>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          data-cursor="hover"
          className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-accent text-center text-sm leading-tight font-medium text-white md:h-40 md:w-40"
        >
          Choose
          <br />a file
        </button>
      </Magnetic>
      <p className="mt-8 text-[15px] text-muted">
        a PDF, photo, screenshot or document — or drop it here. Nothing is uploaded.
      </p>
    </div>
  );

  const pdf = file ? isPdf(file) : false;
  const canDownload = anyEdits || (pdf && (removed ?? 0) > 0);

  return (
    <div>
      <input
        ref={fileInput}
        type="file"

        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) load(f);
        }}
      />

      {!ready ? (
        <>
          {dropzone}
          {busy && (
            <p className="mt-6 text-center text-[15px] text-muted">
              {busy}… {Math.round(progress * 100)}%
            </p>
          )}
        </>
      ) : (
        <>
          {/* -------------------------------------------- what the PDF had */}
          {pdf && removed !== null && (
            <div className="mb-6 rounded-[20px] bg-card p-6 text-[15px] leading-relaxed">
              {removed > 0 ? (
                <p>
                  <strong>Removed {removed} watermark {removed === 1 ? "object" : "objects"}.</strong>{" "}
                  The pages underneath are untouched — text is still text. If you can still see a
                  mark below, paint over it.
                </p>
              ) : (
                <p>
                  No separate watermark layer in this PDF. If the watermark is text, type it below
                  to remove it exactly; otherwise paint over it and it will be filled in.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <input
                  className="field min-w-0 flex-1"
                  placeholder="Watermark text, e.g. CONFIDENTIAL"
                  value={wmText}
                  onChange={(e) => setWmText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && removeByText()}
                />
                <button
                  type="button"
                  onClick={removeByText}
                  disabled={!wmText.trim() || !!busy}
                  data-cursor="hover"
                  className="rounded-full bg-fg px-6 py-3 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
                >
                  Remove this text
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- toolbar */}
          <div className="sticky top-20 z-30 mb-4 flex flex-wrap items-center gap-x-3 gap-y-3 rounded-full border border-line bg-bg/90 px-4 py-2 backdrop-blur-md">
            <label className="flex items-center gap-2 text-xs text-muted">
              Brush
              <input
                type="range"
                min={6}
                max={140}
                value={brush}
                onChange={(e) => setBrush(Number(e.target.value))}
                className="w-28 accent-[var(--accent)]"
              />
            </label>
            {pdf && pageCount > 1 && (
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={allPages}
                  onChange={(e) => setAllPages(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Same spot on every page
              </label>
            )}
            <button
              type="button"
              onPointerDown={() => setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              data-cursor="hover"
              className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
            >
              Hold to compare
            </button>
            <button
              type="button"
              onClick={clearMask}
              disabled={!painted}
              data-cursor="hover"
              className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={undo}
              data-cursor="hover"
              className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              data-cursor="hover"
              className="ml-auto rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
            >
              New file
            </button>
          </div>

          <p className="mb-4 text-sm text-muted">
            Paint over the watermark tightly — just the mark and a hair past its edges — then press
            Remove. Anything you paint is treated as watermark, so keep the brush off faces and text
            you want to keep. Repeat on anything left behind.
          </p>

          {/* ------------------------------------------------------ canvas */}
          <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-[18px] border border-line">
            <canvas ref={view} className="block h-auto max-h-[75vh] w-auto max-w-full" />
            <canvas
              ref={maskRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              className="absolute inset-0 h-full w-full"
              style={{
                opacity: comparing ? 0 : 0.5,
                cursor: "crosshair",
                touchAction: "none",
              }}
            />
          </div>

          {pdf && pageCount > 1 && (
            <div className="mt-5 flex items-center justify-center gap-6 text-sm">
              <button
                type="button"
                onClick={() => goTo(Math.max(0, page - 1))}
                disabled={page === 0 || !!busy}
                data-cursor="hover"
                className="text-muted transition-colors hover:text-fg disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="tabular-nums text-muted">
                Page {page + 1} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => goTo(Math.min(pageCount - 1, page + 1))}
                disabled={page === pageCount - 1 || !!busy}
                data-cursor="hover"
                className="text-muted transition-colors hover:text-fg disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}

          {/* ----------------------------------------------------- actions */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Magnetic strength={0.15}>
              <button
                type="button"
                onClick={fill}
                disabled={!painted || !!busy}
                data-cursor="hover"
                className="relative w-full overflow-hidden rounded-full bg-fg px-8 py-5 text-[15px] font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-accent"
                  animate={{ width: busy ? `${progress * 100}%` : "0%" }}
                  transition={{ duration: 0.3, ease: "linear" }}
                />
                <span className="relative">
                  {busy ? `${busy}… ${Math.round(progress * 100)}%` : "Remove watermark"}
                </span>
              </button>
            </Magnetic>
            <Magnetic strength={0.15}>
              <button
                type="button"
                onClick={download}
                disabled={!canDownload || !!busy}
                data-cursor="hover"
                className="w-full rounded-full bg-accent px-8 py-5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Download
              </button>
            </Magnetic>
          </div>

          {outcome && (
            <p className="mt-6 text-[15px] leading-relaxed text-muted">
              {outcome === "recovered"
                ? "The watermark was see-through, so the picture underneath was recovered rather than redrawn — what you see there is the original detail."
                : "Filled in from the surroundings. If something looks invented, press Undo and paint a tighter stroke."}
            </p>
          )}

          <AnimatePresence>
            {fallbackUsed && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mt-6 border-l-2 border-accent pl-4 text-[15px] leading-relaxed"
              >
                The AI model could not load on this device, so a quick fill was used instead. It
                is clean on plain backgrounds; for detailed ones, try again on a laptop.
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-accent pl-4 text-[15px] leading-relaxed">
          {error}
        </p>
      )}
    </div>
  );
}
