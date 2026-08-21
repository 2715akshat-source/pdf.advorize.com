"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { lenisRef } from "@/lib/lenis";
import { bySlug } from "@/lib/tools";
import Wordmark from "./Wordmark";

const NavContext = createContext<(href: string) => void>(() => {});
export const useTransitionNav = () => useContext(NavContext);

/** How long the curtain takes to fully cover before the route swaps. */
const COVER_MS = 620;
/** Home shows the mark rather than a word, and drawing it takes longer. */
const BRAND_COVER_MS = 1150;
const PANELS = 5;

/**
 * The wordmark arriving on the curtain: it blooms out of a blur, wipes in
 * left to right, and carries a soft halo that pulses once behind it. Lifted
 * wholesale from advorize.com so a jump between the two sites feels like one
 * property rather than two.
 */
function BrandMark() {
  return (
    <motion.span
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: 0.18 }}
    >
      <motion.span
        className="relative block w-[min(66vw,560px)]"
        initial={{ scale: 0.94, filter: "blur(14px)" }}
        animate={{ scale: 1, filter: "blur(0px)" }}
        exit={{ scale: 1.06, filter: "blur(12px)" }}
        transition={{ duration: 0.75, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.span
          aria-hidden
          className="absolute inset-0 block blur-[16px]"
          animate={{ opacity: [0.2, 0.75, 0.35] }}
          transition={{ duration: 1.3, delay: 0.25, ease: "easeInOut" }}
        >
          <Wordmark className="w-full text-bg" />
        </motion.span>

        <motion.span
          className="relative block"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <Wordmark className="w-full text-bg" />
        </motion.span>
      </motion.span>
    </motion.span>
  );
}

function Curtain({ label, brand }: { label: string; brand: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex">
      {Array.from({ length: PANELS }).map((_, i) => (
        <motion.div
          key={i}
          className="h-full flex-1 bg-fg"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{
            duration: 0.6,
            ease: [0.76, 0, 0.24, 1],
            /* panels sweep in left-to-right, and out in the same order */
            delay: i * 0.06,
          }}
        />
      ))}

      {brand ? (
        <BrandMark />
      ) : (
        <motion.span
          className="display absolute inset-0 flex items-center justify-center px-8 text-center text-4xl text-bg md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}

export default function TransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);
  const [label, setLabel] = useState("Advorize");
  const [brand, setBrand] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;

      /* In-page anchors don't need a full curtain — and a hash on the page
         you are already on is one, however it is written. Lenis owns the
         scroll position here, so the browser's own hash handling would be
         fighting it rather than doing the work. */
      const hash = href.indexOf("#");
      if (hash > -1) {
        const [path, id] = [href.slice(0, hash) || "/", href.slice(hash)];
        if (path === pathname) {
          const el = document.querySelector(id);
          if (el) {
            lenisRef.current
              ? lenisRef.current.scrollTo(el as HTMLElement)
              : el.scrollIntoView({ behavior: "smooth" });
          }
          return;
        }
      }

      /* Every route here is /<tool-slug>, so the curtain can name the tool
         you are on your way to. Home gets the mark instead. */
      const isHome = href === "/" || href.startsWith("/#");
      setBrand(isHome);
      setLabel(bySlug(href.replace(/^\//, ""))?.name ?? "PDF Tools");
      setPending(href);
    },
    [pathname],
  );

  /* Once the curtain is down, actually change the route. */
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(
      () => router.push(pending),
      brand ? BRAND_COVER_MS : COVER_MS,
    );
    return () => clearTimeout(timer);
  }, [pending, brand, router]);

  /* New route rendered: jump to the top, then lift the curtain. */
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    setPending(null);
  }, [pathname]);

  return (
    <NavContext.Provider value={navigate}>
      <AnimatePresence>
        {pending && <Curtain label={label} brand={brand} />}
      </AnimatePresence>
      {children}
    </NavContext.Provider>
  );
}
