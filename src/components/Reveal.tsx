"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Slides its children up from behind a mask when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /**
   * Plays on mount rather than on scroll. Anything above the fold should use
   * it: an in-view trigger for content that is already in view depends on an
   * observer firing at the right moment, and when it does not, the word stays
   * hidden behind its own mask.
   */
  immediate?: boolean;
}) {
  return (
    /* pb/-mb pair: the mask clears descenders without changing line rhythm */
    <span className={`block overflow-hidden pb-[0.18em] -mb-[0.18em] ${className ?? ""}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        {...(immediate
          ? { animate: { y: 0 } }
          : { whileInView: { y: 0 }, viewport: { once: true, margin: "-10%" } })}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Fades + lifts a block of content into view. */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
