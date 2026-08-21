"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ToolGlyph from "./ToolGlyph";
import TransitionLink from "./TransitionLink";
import { Reveal } from "./Reveal";
import { categories, tools, type Tool } from "@/lib/tools";

const ease = [0.16, 1, 0.3, 1] as const;

function Tile({ tool, index }: { tool: Tool; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.03, ease }}
    >
      <TransitionLink
        href={`/${tool.slug}`}
        data-cursor="hover"
        data-cursor-text="Open"
        className="group flex h-full flex-col rounded-[28px] border border-line p-7 transition-colors duration-500 hover:border-fg"
      >
        {/* the drawing performs the operation as you hover the tile */}
        <motion.span
          initial="rest"
          whileHover="active"
          className="mb-8 block w-28 text-fg"
        >
          <ToolGlyph slug={tool.slug} className="w-full" />
        </motion.span>

        <span className="display text-2xl transition-colors duration-500 group-hover:text-accent md:text-3xl">
          {tool.name}
        </span>
        <span className="mt-3 text-[15px] leading-relaxed text-muted">
          {tool.tagline}
        </span>

        <span className="mt-6 flex items-center gap-2 text-sm text-muted transition-colors duration-500 group-hover:text-accent">
          Open
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </span>
      </TransitionLink>
    </motion.div>
  );
}

export default function ToolGrid() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");

  /* Search covers the keywords too, so "reduce size" finds Compress and
     "password" finds Unlock — the words people actually arrive with. */
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (filter !== "All" && t.category !== filter) return false;
      if (!q) return true;
      return [t.name, t.tagline, ...t.keywords]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, filter]);

  return (
    <section id="tools" className="shell scroll-mt-28 py-24 md:py-32">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="display text-[11vw] leading-[0.95] md:text-[5vw]">
          <Reveal>{`${tools.length} tools`}</Reveal>
        </h2>

        <div className="lg:w-[340px]">
          <label htmlFor="tool-search" className="sr-only">
            Search the tools
          </label>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — try 'password' or 'too big'"
            data-cursor="hover"
            className="field"
          />
        </div>
      </div>

      {/* category pills */}
      <div className="mt-10 flex flex-wrap gap-2">
        {["All", ...categories].map((c) => {
          const active = filter === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              data-cursor="hover"
              aria-pressed={active}
              className={`relative rounded-full px-5 py-2 text-sm transition-colors duration-300 ${
                active ? "text-bg" : "text-muted hover:text-fg"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="pill"
                  transition={{ duration: 0.5, ease }}
                  className="absolute inset-0 rounded-full bg-fg"
                />
              )}
              <span className="relative">{c}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        layout
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {shown.map((tool, i) => (
            <Tile key={tool.slug} tool={tool} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>

      {shown.length === 0 && (
        <p className="mt-16 text-lg text-muted">
          Nothing matches “{query}”. We may not have built it yet — tell us what
          you were looking for.
        </p>
      )}
    </section>
  );
}
