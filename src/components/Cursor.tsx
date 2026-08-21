"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Trailing dot cursor. Any element with `data-cursor="hover"` grows it,
 * and `data-cursor-text="View"` puts a label inside it.
 */
export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.6 });

  const [label, setLabel] = useState("");
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor], a, button",
      );
      setActive(Boolean(target));
      setLabel(target?.dataset.cursorText ?? "");
    };

    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  const size = label ? 96 : active ? 56 : 14;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] hidden items-center justify-center rounded-full mix-blend-difference [@media(pointer:fine)]:flex"
      style={{ x: springX, y: springY, backgroundColor: "#fff" }}
      animate={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        opacity: visible ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
    >
      {label && (
        <span className="text-xs font-medium tracking-wide text-black uppercase">
          {label}
        </span>
      )}
    </motion.div>
  );
}
