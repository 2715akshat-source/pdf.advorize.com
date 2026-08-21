"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const KEY = "advorize:theme";

/**
 * Light/dark switch.
 *
 * The theme itself is applied before first paint by the inline script in the
 * layout — this only flips the attribute and remembers the choice. The site
 * ships light for everyone; dark is opt-in and then remembered.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // light is the default; only a stored choice moves it
    setDark(localStorage.getItem(KEY) === "dark");
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    const root = document.documentElement;

    /*
     * The palette cross-fades rather than snapping. The flag is what turns
     * the transition on, and it comes off again afterwards so it never
     * interferes with ordinary hover states.
     */
    root.setAttribute("data-theme-switching", "");
    window.setTimeout(() => root.removeAttribute("data-theme-switching"), 500);

    setDark(next);
    root.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem(KEY, next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      data-cursor="hover"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className={`border-line hover:border-fg relative flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${className ?? ""}`}
    >
      {/* nothing renders until we know the theme, so the icon never flips */}
      {ready && (
        <motion.svg
          key={dark ? "moon" : "sun"}
          initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          {dark ? (
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4.2" />
              {[
                [12, 2, 12, 4],
                [12, 20, 12, 22],
                [2, 12, 4, 12],
                [20, 12, 22, 12],
                [4.9, 4.9, 6.4, 6.4],
                [17.6, 17.6, 19.1, 19.1],
                [4.9, 19.1, 6.4, 17.6],
                [17.6, 6.4, 19.1, 4.9],
              ].map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
            </>
          )}
        </motion.svg>
      )}
    </button>
  );
}
