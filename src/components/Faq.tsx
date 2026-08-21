"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./Reveal";

/** Accordion of questions — the same one the main site uses. */
export default function Faq({
  items,
  title = "Common questions",
}: {
  items: { q: string; a: string }[];
  title?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <section className="shell py-24 md:py-36">
      <h2 className="display mb-14 text-[9vw] md:text-[5vw]">
        <Reveal>{title}</Reveal>
      </h2>

      <div className="mx-auto max-w-4xl border-t border-line">
        {items.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={faq.q} className="border-b border-line">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                data-cursor="hover"
                className="flex w-full items-center justify-between gap-6 py-7 text-left"
              >
                <span className="display text-xl md:text-2xl">{faq.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-xl leading-none"
                >
                  +
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-7 leading-relaxed text-muted">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
