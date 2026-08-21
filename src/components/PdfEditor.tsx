"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Magnetic from "./Magnetic";
import { getPdfjs } from "@/lib/pdf/pdfjs";
import { applyEdits, type Item } from "@/lib/pdf/edit";
import { takeHandoff } from "@/lib/handoff";

const EASE = [0.16, 1, 0.3, 1] as const;

type Tool = "select" | "text" | "draw" | "highlight" | "image";

const COLORS = ["#0a0a0a", "#ff4f18", "#1d63ff", "#12a150", "#ffd400"];

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "select", label: "Move", hint: "Drag anything you have added" },
  { id: "text", label: "Text", hint: "Click the page, then type" },
  { id: "draw", label: "Draw", hint: "Draw freehand — signatures, ticks, arrows" },
  { id: "highlight", label: "Highlight", hint: "Drag across a line to mark it" },
  { id: "image", label: "Image", hint: "Drop in a logo, a stamp or a signature" },
];

const uid = () => Math.random().toString(36).slice(2);

/**
 * The editor.
 *
 * Every page is rendered by pdf.js at `rotation: 0` — the page's own
 * coordinate system rather than its display orientation — so a point on
 * screen maps to a point in the file with nothing but a scale factor and a
 * y-flip. That is what lets the export write into the original document
 * instead of flattening it to images: your additions are new content on top
 * of pages that are otherwise untouched.
 */
export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ w: number; h: number }[]>([]);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const [tool, setTool] = useState<Tool>("text");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(16);

  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [stroke, setStroke] = useState<[number, number][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ name: string; blob: Blob } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useRef<Item[][]>([]);
  const docRef = useRef<Awaited<
    ReturnType<Awaited<ReturnType<typeof getPdfjs>>["getDocument"]>["promise"]
  > | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  /** Display scale: the page is fitted to whatever width it has to live in. */
  const [scale, setScale] = useState(1);

  const push = (next: Item[]) => {
    history.current = [...history.current, items].slice(-40);
    setItems(next);
    setSaved(null);
  };

  const undo = () => {
    const prev = history.current.pop();
    if (prev) {
      setItems(prev);
      setSaved(null);
    }
  };

  /* ------------------------------------------------------------ loading */

  const load = useCallback(async (incoming: File) => {
    setError(null);
    setSaved(null);
    setItems([]);
    history.current = [];
    setPage(0);
    setFile(incoming);

    try {
      const pdfjs = await getPdfjs();
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(await incoming.arrayBuffer()),
      }).promise;
      docRef.current = doc;

      const sizes: { w: number; h: number }[] = [];
      for (let n = 1; n <= doc.numPages; n++) {
        const p = await doc.getPage(n);
        const v = p.getViewport({ scale: 1, rotation: 0 });
        sizes.push({ w: v.width, h: v.height });
      }
      setPages(sizes);

      /* Thumbnails come after the sizes so the page appears immediately and
         the strip fills in behind it. */
      const strip: string[] = [];
      for (let n = 1; n <= Math.min(doc.numPages, 60); n++) {
        const p = await doc.getPage(n);
        const v = p.getViewport({ scale: 0.16, rotation: 0 });
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.floor(v.width));
        c.height = Math.max(1, Math.floor(v.height));
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        await p.render({ canvasContext: ctx, viewport: v }).promise;
        const blob: Blob = await new Promise((r) =>
          c.toBlob((b) => r(b!), "image/jpeg", 0.7),
        );
        const url = URL.createObjectURL(blob);
        objectUrls.current.push(url);
        strip.push(url);
        setThumbs([...strip]);
      }
    } catch {
      setError(
        "That file could not be opened. If it asks for a password, remove it with the unlock tool first.",
      );
    }
  }, []);

  /* A file dropped on the home page arrives here already chosen. */
  useEffect(() => {
    const handed = takeHandoff();
    if (handed?.length) load(handed[0]);
    return () => {
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, [load]);

  /* --------------------------------------------------------- page render */

  useEffect(() => {
    const doc = docRef.current;
    const size = pages[page];
    if (!doc || !size || !canvas.current) return;
    let cancelled = false;

    const draw = async () => {
      const width = surface.current?.clientWidth ?? size.w;
      const next = Math.min(width / size.w, 2);
      if (!cancelled) setScale(next);

      const p = await doc.getPage(page + 1);
      /* Rendered at device resolution so the page stays crisp on a retina
         screen, then scaled back down by CSS. */
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const v = p.getViewport({ scale: next * dpr, rotation: 0 });
      const c = canvas.current;
      if (!c || cancelled) return;
      c.width = Math.floor(v.width);
      c.height = Math.floor(v.height);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      await p.render({ canvasContext: ctx, viewport: v }).promise;
    };

    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [page, pages]);

  /* ------------------------------------------------------- interactions */

  /** Screen point → unrotated page points, which is what items are stored in. */
  const toPage = (e: { clientX: number; clientY: number }) => {
    const rect = surface.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (tool === "select") return;
    const at = toPage(e);

    if (tool === "text") {
      const id = uid();
      push([
        ...items,
        { id, page, type: "text", x: at.x, y: at.y, text: "", size, color },
      ]);
      setEditing(id);
      return;
    }

    if (tool === "image") {
      imageInput.current?.click();
      return;
    }

    /* Capture on the surface, not on whatever was under the cursor, so a
       stroke that starts on top of an existing item still belongs to the
       page — and never let a capture failure swallow the stroke. */
    try {
      surface.current?.setPointerCapture(e.pointerId);
    } catch {}
    setStroke([[at.x, at.y]]);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!stroke) return;
    const at = toPage(e);
    setStroke((s) => (s ? [...s, [at.x, at.y]] : s));
  };

  const onPointerUp = () => {
    if (!stroke) return;
    if (stroke.length > 1) {
      push([
        ...items,
        {
          id: uid(),
          page,
          type: "draw",
          points: stroke,
          color: tool === "highlight" ? "#ffd400" : color,
          width: tool === "highlight" ? size * 1.4 : Math.max(1, size / 8),
          opacity: tool === "highlight" ? 0.35 : 1,
        },
      ]);
    }
    setStroke(null);
  };

  /** Drags an existing item. Runs on the item itself, not the surface. */
  const startDrag = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item || item.type === "draw") return;
    const origin = toPage(e);
    const from = { x: item.x, y: item.y };
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      const at = toPage(ev);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id && i.type !== "draw"
            ? { ...i, x: from.x + (at.x - origin.x), y: from.y + (at.y - origin.y) }
            : i,
        ),
      );
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      setSaved(null);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };

  const addImage = async (incoming: File | undefined) => {
    if (!incoming) return;
    const bytes = new Uint8Array(await incoming.arrayBuffer());
    const png = /png/i.test(incoming.type) || /\.png$/i.test(incoming.name);
    const bitmap = await createImageBitmap(incoming);
    const preview = URL.createObjectURL(incoming);
    objectUrls.current.push(preview);
    const w = Math.min(220, pages[page].w * 0.5);
    const h = (bitmap.height / bitmap.width) * w;
    push([
      ...items,
      {
        id: uid(),
        page,
        type: "image",
        x: (pages[page].w - w) / 2,
        y: (pages[page].h - h) / 2,
        w,
        h,
        bytes,
        png,
        preview,
      },
    ]);
    setTool("select");
  };

  const save = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      /* An empty text box is one that was clicked and abandoned. */
      const real = items.filter((i) => i.type !== "text" || i.text.trim());
      setSaved(await applyEdits(file, real));
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "That file could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!saved) return;
    const url = URL.createObjectURL(saved.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = saved.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  /* -------------------------------------------------------------- empty */

  if (!file || !pages.length) {
    return (
      <div>
        <div
          className="dropzone flex flex-col items-center justify-center px-6 py-20 text-center md:py-24"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) load(f);
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) load(f);
            }}
          />
          <Magnetic>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              data-cursor="hover"
              className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-accent text-center text-sm leading-tight font-medium text-white md:h-40 md:w-40"
            >
              Choose
              <br />
              a file
            </button>
          </Magnetic>
          <p className="mt-8 text-[15px] text-muted">
            or drop it here — nothing is uploaded
          </p>
        </div>
        {error && (
          <p role="alert" className="mt-6 border-l-2 border-accent pl-4 text-[15px]">
            {error}
          </p>
        )}
      </div>
    );
  }

  const size0 = pages[page];
  const onThisPage = items.filter((i) => i.page === page);

  return (
    <div>
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          addImage(f);
        }}
      />

      {/* ---------------------------------------------------------- toolbar */}
      <div className="sticky top-20 z-30 mb-6 flex flex-wrap items-center gap-x-2 gap-y-3 rounded-full border border-line bg-bg/90 px-3 py-2 backdrop-blur-md">
        {TOOLS.map((t) => {
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              title={t.hint}
              aria-pressed={active}
              data-cursor="hover"
              className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                active ? "text-bg" : "text-muted hover:text-fg"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tool-pill"
                  transition={{ duration: 0.4, ease: EASE }}
                  className="absolute inset-0 rounded-full bg-fg"
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}

        <span className="mx-1 h-6 w-px bg-line" aria-hidden />

        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              data-cursor="hover"
              className="h-6 w-6 rounded-full border transition-transform duration-300 hover:scale-110"
              style={{
                background: c,
                borderColor: color === c ? "var(--fg)" : "var(--line)",
                transform: color === c ? "scale(1.15)" : undefined,
              }}
            />
          ))}
        </div>

        <label className="ml-2 flex items-center gap-2 text-xs text-muted">
          Size
          <input
            type="range"
            min={8}
            max={48}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24 accent-[var(--accent)]"
          />
        </label>

        <button
          type="button"
          onClick={undo}
          disabled={!history.current.length}
          data-cursor="hover"
          className="ml-auto rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-fg disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            fileInput.current?.click();
          }}
          data-cursor="hover"
          className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-fg"
        >
          New file
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) load(f);
          }}
        />
      </div>

      <p className="mb-6 text-sm text-muted">
        {TOOLS.find((t) => t.id === tool)?.hint}.
      </p>

      <div className="flex gap-6">
        {/* -------------------------------------------------------- pages */}
        {thumbs.length > 1 && (
          <div className="hidden max-h-[70vh] w-24 shrink-0 overflow-y-auto pr-1 lg:block">
            {thumbs.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setPage(i)}
                data-cursor="hover"
                aria-label={`Page ${i + 1}`}
                aria-current={i === page}
                className="mb-2 block w-full overflow-hidden rounded-lg border transition-colors duration-300"
                style={{
                  borderColor: i === page ? "var(--accent)" : "var(--line)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="block w-full" />
              </button>
            ))}
          </div>
        )}

        {/* --------------------------------------------------------- page */}
        <div className="min-w-0 flex-1">
          <div
            ref={surface}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            /* A page wider than about 820px is harder to work on, not
               easier — the toolbar is a long way from the cursor. */
            className="relative mx-auto w-full max-w-[820px] overflow-hidden rounded-[18px] border border-line bg-white shadow-sm"
            style={{
              aspectRatio: `${size0.w} / ${size0.h}`,
              cursor: tool === "select" ? "default" : "crosshair",
              touchAction: tool === "draw" || tool === "highlight" ? "none" : "auto",
            }}
          >
            <canvas ref={canvas} className="block h-full w-full" />

            {/* strokes, live and committed */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${size0.w} ${size0.h}`}
              preserveAspectRatio="none"
            >
              {onThisPage
                .filter((i) => i.type === "draw")
                .map((i) =>
                  i.type === "draw" ? (
                    <polyline
                      key={i.id}
                      points={i.points.map((p) => p.join(",")).join(" ")}
                      fill="none"
                      stroke={i.color}
                      strokeWidth={i.width}
                      strokeOpacity={i.opacity}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null,
                )}
              {stroke && (
                <polyline
                  points={stroke.map((p) => p.join(",")).join(" ")}
                  fill="none"
                  stroke={tool === "highlight" ? "#ffd400" : color}
                  strokeWidth={tool === "highlight" ? size * 1.4 : Math.max(1, size / 8)}
                  strokeOpacity={tool === "highlight" ? 0.35 : 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* text and images */}
            {onThisPage.map((item) => {
              if (item.type === "draw") return null;
              const common = {
                onPointerDown: (e: React.PointerEvent) => startDrag(e, item.id),
                className:
                  "group absolute cursor-move outline-none ring-offset-2 focus-within:ring-1 focus-within:ring-[var(--accent)]",
                style: {
                  left: item.x * scale,
                  top: item.y * scale,
                },
              };

              if (item.type === "image") {
                return (
                  <div
                    key={item.id}
                    {...common}
                    style={{ ...common.style, width: item.w * scale }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.preview}
                      alt=""
                      draggable={false}
                      className="block w-full select-none"
                    />
                    <Remove onClick={() => push(items.filter((i) => i.id !== item.id))} />
                  </div>
                );
              }

              return (
                <div key={item.id} {...common}>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    autoFocus={editing === item.id}
                    onBlur={(e) => {
                      const text = e.currentTarget.innerText.replace(/\n$/, "");
                      setEditing(null);
                      setItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id && i.type === "text" ? { ...i, text } : i,
                        ),
                      );
                      setSaved(null);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="min-w-[2ch] whitespace-pre outline-none"
                    style={{
                      /* Helvetica on screen because Helvetica is what gets
                         written into the file — so what you type is what
                         comes out, at the same width. */
                      fontFamily: "Helvetica, Arial, sans-serif",
                      fontSize: item.size * scale,
                      lineHeight: 1.25,
                      color: item.color,
                    }}
                  >
                    {item.text}
                  </div>
                  <Remove onClick={() => push(items.filter((i) => i.id !== item.id))} />
                </div>
              );
            })}
          </div>

          {/* page nav */}
          <div className="mt-5 flex items-center justify-center gap-6 text-sm">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              data-cursor="hover"
              className="text-muted transition-colors hover:text-fg disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="tabular-nums text-muted">
              Page {page + 1} of {pages.length}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
              disabled={page === pages.length - 1}
              data-cursor="hover"
              className="text-muted transition-colors hover:text-fg disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- save */}
      <div className="mt-10">
        <Magnetic strength={0.15}>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            data-cursor="hover"
            className="w-full rounded-full bg-fg px-8 py-5 text-[15px] font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save the edited PDF"}
          </button>
        </Magnetic>
      </div>

      {error && (
        <p role="alert" className="mt-6 border-l-2 border-accent pl-4 text-[15px]">
          {error}
        </p>
      )}

      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4 rounded-[28px] bg-card p-8"
          >
            <div className="min-w-0 flex-1">
              <p className="display text-2xl md:text-3xl">Done.</p>
              <p className="mt-2 truncate text-[15px] text-muted">
                {saved.name} · {Math.round(saved.blob.size / 1024)} KB
              </p>
            </div>
            <Magnetic strength={0.2}>
              <button
                type="button"
                onClick={download}
                data-cursor="hover"
                className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Download
              </button>
            </Magnetic>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The little delete handle that appears on whatever you are hovering. */
function Remove({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-label="Remove"
      data-cursor="hover"
      className="absolute -top-3 -right-3 hidden h-6 w-6 place-items-center rounded-full bg-fg text-xs text-bg group-hover:grid"
    >
      ✕
    </button>
  );
}
