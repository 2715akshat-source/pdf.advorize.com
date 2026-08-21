"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import Magnetic from "./Magnetic";
import TransitionLink from "./TransitionLink";
import ThemeToggle from "./ThemeToggle";
import Wordmark from "./Wordmark";
import { categories, tools } from "@/lib/tools";
import { PARENT_URL } from "@/lib/seo";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  /* Hide the bar on the way down, bring it back on the way up. */
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 200);
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        animate={{ y: hidden && !open ? "-110%" : "0%" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className="shell flex items-center justify-between bg-bg/80 py-5 backdrop-blur-md">
          <TransitionLink
            href="/"
            data-cursor="hover"
            className="flex items-center gap-3"
            aria-label="Advorize PDF Tools"
          >
            <Wordmark className="h-5 md:h-6" />
            <span className="hidden border-l border-line pl-3 text-[13px] text-muted sm:block">
              PDF Tools
            </span>
          </TransitionLink>

          <nav className="hidden items-center gap-9 text-[15px] lg:flex">
            <TransitionLink href="/#tools" className="underline-grow">
              All tools
            </TransitionLink>
            <TransitionLink href="/merge-pdf" className="underline-grow">
              Merge
            </TransitionLink>
            <TransitionLink href="/compress-pdf" className="underline-grow">
              Compress
            </TransitionLink>
            <a
              href={PARENT_URL}
              className="underline-grow"
              data-cursor="hover"
            >
              Advorize.com
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Magnetic className="hidden lg:block">
              <a
                href={`${PARENT_URL}/contact`}
                data-cursor="hover"
                className="inline-flex h-11 items-center rounded-full bg-fg px-6 text-sm font-medium text-bg transition-colors hover:bg-accent"
              >
                Work with us
              </a>
            </Magnetic>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-50 flex h-11 w-11 flex-col items-center justify-center gap-[6px] lg:hidden"
            >
              <motion.span
                animate={open ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                className={`block h-[2px] w-6 ${open ? "bg-bg" : "bg-fg"}`}
              />
              <motion.span
                animate={open ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                className={`block h-[2px] w-6 ${open ? "bg-bg" : "bg-fg"}`}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Full-screen menu. Twenty tools is too many for a wall of 5xl links,
          so it wipes in as the same five columns the footer uses. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="shell fixed inset-0 z-40 flex flex-col justify-center overflow-y-auto bg-fg py-28"
          >
            {categories.map((category, c) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + c * 0.05, duration: 0.5 }}
                className="mb-8"
              >
                <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-bg/40 uppercase">
                  {category}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {tools
                    .filter((t) => t.category === category)
                    .map((t) => (
                      <TransitionLink
                        key={t.slug}
                        href={`/${t.slug}`}
                        onNavigate={() => setOpen(false)}
                        className="display text-2xl text-bg transition-opacity hover:opacity-60"
                      >
                        {t.name}
                      </TransitionLink>
                    ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
