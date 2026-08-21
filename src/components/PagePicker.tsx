"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getPdfjs } from "@/lib/pdf/pdfjs";
import { parsePages } from "@/lib/pdf/util";

const ease = [0.16, 1, 0.3, 1] as const;

/** Turns 0-based indices into the compact text the page field expects. */
export function formatPages(indices: number[]): string {
  const sorted = [...indices].sort((a, b) => a - b);
  const parts: string[] = [];
  let start: number | null = null;
  let prev: number | null = null;

  for (const i of sorted) {
    if (start === null) start = prev = i;
    else if (prev !== null && i === prev + 1) prev = i;
    else {
      parts.push(start === prev ? `${start! + 1}` : `${start! + 1}-${prev! + 1}`);
      start = prev = i;
    }
  }
  if (start !== null)
    parts.push(start === prev ? `${start + 1}` : `${start + 1}-${prev! + 1}`);
  return parts.join(", ");
}

/**
 * Thumbnails of the loaded document, rendered locally with pdf.js.
 *
 * Typing "1, 4-6, last" is fine once you know the document; picking the pages
 * out of a contact sheet is how anyone works when they do not. The two stay in
 * sync — clicking rewrites the field, and typing re-highlights the sheet.
 */
export default function PagePicker({
  file,
  value,
  onChange,
}: {
  file: File;
  value: string;
  onChange: (next: string) => void;
}) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setThumbs([]);
      setError(false);
      try {
        const pdfjs = await getPdfjs();
        const doc = await pdfjs.getDocument({
          data: new Uint8Array(await file.arrayBuffer()),
        }).promise;

        const out: string[] = [];
        /* A 400-page document does not need 400 canvases to be useful. */
        const limit = Math.min(doc.numPages, 60);
        for (let n = 1; n <= limit; n++) {
          if (cancelled) break;
          const page = await doc.getPage(n);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          const blob: Blob = await new Promise((r) =>
            canvas.toBlob((b) => r(b!), "image/jpeg", 0.7),
          );
          const url = URL.createObjectURL(blob);
          urls.current.push(url);
          out.push(url);
          if (!cancelled) setThumbs([...out]);
        }
        await doc.destroy();
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      urls.current.forEach(URL.revokeObjectURL);
      urls.current = [];
    };
  }, [file]);

  if (error || !thumbs.length) return null;

  const selected = new Set(parsePages(value, thumbs.length));

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange(formatPages([...next]));
  };

  return (
    <div className="mt-10">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
          Pick the pages
        </p>
        <div className="flex gap-4 text-sm text-muted">
          <button
            type="button"
            data-cursor="hover"
            onClick={() => onChange(`1-${thumbs.length}`)}
            className="underline-grow"
          >
            Select all
          </button>
          <button
            type="button"
            data-cursor="hover"
            onClick={() => onChange("")}
            className="underline-grow"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {thumbs.map((src, i) => {
          const on = selected.has(i);
          return (
            <motion.button
              key={src}
              type="button"
              onClick={() => toggle(i)}
              data-cursor="hover"
              aria-pressed={on}
              aria-label={`Page ${i + 1}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.02, ease }}
              className="group relative block overflow-hidden rounded-xl border transition-colors duration-300"
              style={{
                borderColor: on ? "var(--accent)" : "var(--line)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="block w-full transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span
                className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                style={{
                  background: "var(--accent)",
                  opacity: on ? 0.14 : 0,
                }}
              />
              <span
                className="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[11px] tabular-nums transition-colors duration-300"
                style={{
                  background: on ? "var(--accent)" : "var(--bg)",
                  color: on ? "#fff" : "var(--muted)",
                }}
              >
                {i + 1}
              </span>
            </motion.button>
          );
        })}
      </div>

      {thumbs.length === 60 && (
        <p className="mt-4 text-xs text-muted">
          Showing the first 60 pages. Type page numbers above to reach the rest.
        </p>
      )}
    </div>
  );
}
