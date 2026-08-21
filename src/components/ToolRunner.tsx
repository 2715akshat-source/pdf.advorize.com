"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Magnetic from "./Magnetic";
import PagePicker from "./PagePicker";
import { takeHandoff } from "@/lib/handoff";
import { engines, type Options } from "@/lib/pdf/engines";
import type { OutFile } from "@/lib/pdf/util";
import type { Tool } from "@/lib/tools";

const EASE = [0.16, 1, 0.3, 1] as const;

const formatBytes = (n: number) =>
  n < 1024 * 1024
    ? `${Math.max(1, Math.round(n / 1024))} KB`
    : `${(n / (1024 * 1024)).toFixed(1)} MB`;

/** Seeds the options object from the field defaults in the registry. */
const initialOptions = (tool: Tool): Options =>
  Object.fromEntries(
    (tool.fields ?? []).map((f) => [f.key, f.default ?? ""]),
  ) as Options;

export default function ToolRunner({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<File[]>([]);
  const [opts, setOpts] = useState<Options>(() => initialOptions(tool));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OutFile[] | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dragging = useRef<number | null>(null);

  /* A file dropped on the home page is waiting for whichever tool it
     launched — pick it up so nobody is asked for the same file twice. */
  useEffect(() => {
    const handed = takeHandoff();
    if (handed?.length) setFiles(tool.multiple ? handed : handed.slice(0, 1));
  }, [tool.multiple]);

  const reset = () => {
    setResults(null);
    setError(null);
    setProgress(0);
  };

  const add = useCallback(
    (incoming: FileList | null) => {
      if (!incoming?.length) return;
      const list = Array.from(incoming);
      setFiles((prev) => (tool.multiple ? [...prev, ...list] : list.slice(0, 1)));
      reset();
    },
    [tool.multiple],
  );

  const move = (from: number, to: number) =>
    setFiles((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const run = async () => {
    if (!files.length) return;
    setBusy(true);
    reset();
    try {
      const out = await engines[tool.engine](files, opts, (f) =>
        setProgress(Math.min(1, f)),
      );
      setResults(out);
      setProgress(1);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "That file could not be processed. It may be corrupt or encrypted.",
      );
    } finally {
      setBusy(false);
    }
  };

  const download = (file: OutFile) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div>
      {/* ------------------------------------------------------ drop well */}
      <div
        className="dropzone flex flex-col items-center justify-center px-6 py-20 text-center md:py-24"
        data-over={over}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
      >
        <input
          ref={input}
          type="file"
          accept={tool.accept}
          multiple={tool.multiple}
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />

        <Magnetic>
          <button
            type="button"
            onClick={() => input.current?.click()}
            data-cursor="hover"
            className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-accent text-center text-sm leading-tight font-medium text-white md:h-40 md:w-40"
          >
            {files.length ? (
              <>
                Add
                <br />
                more
              </>
            ) : (
              <>
                Choose
                <br />
                {tool.multiple ? "files" : "a file"}
              </>
            )}
          </button>
        </Magnetic>

        <p className="mt-8 text-[15px] text-muted">
          or drop {tool.multiple ? "them" : "it"} here — nothing is uploaded
        </p>
      </div>

      {/* ------------------------------------------------------- file list */}
      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-10 border-t border-line"
          >
            {files.map((file, i) => (
              <motion.li
                key={`${file.name}-${i}`}
                layout
                draggable={tool.multiple}
                onDragStart={() => (dragging.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging.current !== null) move(dragging.current, i);
                  dragging.current = null;
                }}
                transition={{ duration: 0.4, ease: EASE }}
                className="group flex items-center gap-4 border-b border-line py-4"
              >
                <span className="w-7 shrink-0 text-sm tabular-nums text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-sm text-muted">
                  {formatBytes(file.size)}
                </span>

                {tool.multiple && files.length > 1 && (
                  <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      aria-label={`Move ${file.name} up`}
                      onClick={() => move(i, i - 1)}
                      data-cursor="hover"
                      className="px-2 text-muted transition-colors hover:text-accent"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${file.name} down`}
                      onClick={() => move(i, i + 1)}
                      data-cursor="hover"
                      className="px-2 text-muted transition-colors hover:text-accent"
                    >
                      ↓
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    setFiles((p) => p.filter((_, k) => k !== i));
                    reset();
                  }}
                  data-cursor="hover"
                  className="shrink-0 px-2 text-muted transition-colors hover:text-accent"
                >
                  ✕
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------- page contact sheet */}
      {files.length === 1 && tool.fields?.some((f) => f.key === "pages") && (
        <PagePicker
          file={files[0]}
          value={opts.pages ?? ""}
          onChange={(next) => {
            setOpts((p) => ({ ...p, pages: next }));
            reset();
          }}
        />
      )}

      {/* ---------------------------------------------------------- options */}
      {files.length > 0 && tool.fields && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
          className="mt-10"
        >
          <p className="mb-6 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            Options
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {tool.fields.map((field) => {
              /* The two split modes each have their own control; only the one
                 matching the chosen mode is worth showing. */
              if (tool.slug === "split-pdf") {
                if (field.key === "every" && opts.mode !== "every") return null;
                if (field.key === "ranges" && opts.mode !== "ranges") return null;
              }
              const id = `field-${field.key}`;
              const set = (value: string) =>
                setOpts((p) => ({ ...p, [field.key]: value }));

              return (
                <div
                  key={field.key}
                  className={field.type === "toggle" ? "sm:col-span-2" : ""}
                >
                  {field.type === "toggle" ? (
                    <label
                      htmlFor={id}
                      data-cursor="hover"
                      className="flex items-center gap-3 text-[15px]"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={opts[field.key] === "on"}
                        onChange={(e) => set(e.target.checked ? "on" : "")}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <label
                        htmlFor={id}
                        className="mb-2 block text-[13px] text-muted"
                      >
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          id={id}
                          className="field"
                          data-cursor="hover"
                          value={opts[field.key] ?? ""}
                          onChange={(e) => set(e.target.value)}
                        >
                          {field.options!.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={id}
                          className="field"
                          type={field.type === "number" ? "number" : "text"}
                          min={field.min}
                          max={field.max}
                          placeholder={field.placeholder}
                          value={opts[field.key] ?? ""}
                          onChange={(e) => set(e.target.value)}
                        />
                      )}
                    </>
                  )}
                  {field.help && (
                    <p className="mt-2 text-xs text-muted">{field.help}</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------- action */}
      {files.length > 0 && (
        <div className="mt-10">
          <Magnetic strength={0.15}>
            <button
              type="button"
              onClick={run}
              disabled={busy}
              data-cursor="hover"
              className="relative w-full overflow-hidden rounded-full bg-fg px-8 py-5 text-[15px] font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
            >
              {/* the progress bar is the button filling up, not a separate rule */}
              <motion.span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-accent"
                animate={{ width: busy ? `${progress * 100}%` : "0%" }}
                transition={{ duration: 0.3, ease: "linear" }}
              />
              <span className="relative">
                {busy ? `Working… ${Math.round(progress * 100)}%` : tool.action}
              </span>
            </button>
          </Magnetic>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 border-l-2 border-accent pl-4 text-[15px] leading-relaxed"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------- results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mt-10 rounded-[28px] bg-card p-8"
          >
            <p className="display text-2xl md:text-3xl">Done.</p>
            <ul className="mt-6">
              {results.map((file) => (
                <li
                  key={file.name}
                  className="flex flex-wrap items-center gap-4 border-t border-line py-5"
                >
                  <span className="min-w-0 flex-1 truncate text-[15px] text-muted">
                    {file.name} · {formatBytes(file.blob.size)}
                  </span>
                  <Magnetic strength={0.2}>
                    <button
                      type="button"
                      onClick={() => download(file)}
                      data-cursor="hover"
                      className="inline-flex h-12 shrink-0 items-center rounded-full bg-accent px-7 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      Download
                    </button>
                  </Magnetic>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
