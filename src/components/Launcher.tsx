"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ToolGlyph from "./ToolGlyph";
import { useTransitionNav } from "./TransitionProvider";
import { handoff } from "@/lib/handoff";
import { tools, type Tool } from "@/lib/tools";

const ease = [0.16, 1, 0.3, 1] as const;

const isPdf = (f: File) =>
  f.type === "application/pdf" || /\.pdf$/i.test(f.name);

/** Which tools can actually do something with what was dropped. */
function candidates(files: File[]): Tool[] {
  const pdf = files.some(isPdf);
  return tools.filter((t) =>
    pdf ? t.accept.includes("pdf") : t.accept.includes("image"),
  );
}

/**
 * Drop a file on the home page and it asks what you want done with it, then
 * carries the file into that tool — no second file picker on the other side.
 *
 * The whole window is the drop target, not just the well: dragging anything
 * over the page raises the overlay, which is how people actually behave when
 * a page tells them to drop a file on it.
 */
export default function Launcher() {
  const navigate = useTransitionNav();
  const [dragging, setDragging] = useState(false);
  const [dropped, setDropped] = useState<File[] | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  const accept = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    setDropped(Array.from(list));
  }, []);

  /* Window-level drag tracking. dragenter/leave fire for every child element,
     so they are counted rather than treated as a single pair. */
  useEffect(() => {
    const enter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      depth.current += 1;
      setDragging(true);
    };
    const leave = () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      accept(e.dataTransfer?.files ?? null);
    };

    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, [accept]);

  const launch = (tool: Tool) => {
    if (dropped) handoff.files = dropped;
    setDropped(null);
    navigate(`/${tool.slug}`);
  };

  const list = dropped ? candidates(dropped) : [];

  return (
    <>
      {/* ------------------------------------------------------- drop well */}
      <div
        className="dropzone group relative flex flex-col items-center gap-1 px-6 py-12 text-center md:flex-row md:justify-between md:px-12 md:py-10 md:text-left"
        data-over={dragging}
      >
        <input
          ref={input}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            accept(e.target.files);
            e.target.value = "";
          }}
        />

        <div>
          <p className="display text-2xl md:text-4xl">
            Drop a file anywhere on this page
          </p>
          <p className="mt-3 text-muted">
            We will show you every tool that can work on it, then hand it
            straight over. Still no upload.
          </p>
        </div>

        <button
          type="button"
          onClick={() => input.current?.click()}
          data-cursor="hover"
          className="mt-6 inline-flex h-14 shrink-0 items-center rounded-full border border-line px-8 text-sm font-medium transition-colors hover:border-accent hover:text-accent md:mt-0"
        >
          Or browse
        </button>
      </div>

      {/* -------------------------------------------------- drag indicator */}
      <AnimatePresence>
        {dragging && !dropped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-bg/70 backdrop-blur-sm"
          >
            <motion.p
              className="display text-[9vw] text-accent md:text-[5vw]"
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease }}
            >
              Let go
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------- tool chooser */}
      <AnimatePresence>
        {dropped && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease }}
            className="fixed inset-0 z-[85] overflow-y-auto bg-fg py-24 text-bg"
          >
            <div className="shell">
              <div className="flex items-start justify-between gap-8">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-50">
                    {dropped.length === 1
                      ? dropped[0].name
                      : `${dropped.length} files`}
                  </p>
                  <h2 className="display mt-4 text-[9vw] leading-[0.95] md:text-[4.5vw]">
                    What should we do with it?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDropped(null)}
                  aria-label="Cancel"
                  data-cursor="hover"
                  className="mt-2 shrink-0 text-3xl leading-none opacity-60 transition-opacity hover:opacity-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-14 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((tool, i) => (
                  <motion.button
                    key={tool.slug}
                    type="button"
                    onClick={() => launch(tool)}
                    data-cursor="hover"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.02, duration: 0.5, ease }}
                    className="group flex items-center gap-4 border-b border-bg/15 py-4 text-left"
                  >
                    <motion.span
                      initial="rest"
                      whileHover="active"
                      className="w-14 shrink-0 opacity-70"
                    >
                      <ToolGlyph slug={tool.slug} className="w-full" />
                    </motion.span>
                    <span className="display text-xl transition-opacity group-hover:opacity-60 md:text-2xl">
                      {tool.name}
                    </span>
                    <span
                      aria-hidden
                      className="ml-auto opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100"
                    >
                      &rarr;
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
