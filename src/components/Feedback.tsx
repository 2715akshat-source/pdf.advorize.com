"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Magnetic from "./Magnetic";
import { bySlug } from "@/lib/tools";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Public by design — Web3Forms keys live in client HTML in their own docs. */
const WEB3FORMS_KEY = "ff1aa8a1-0456-4f1e-b029-fd40dbd2c063";

const KINDS = [
  { id: "bug", label: "Something is broken" },
  { id: "idea", label: "A tool you want" },
  { id: "other", label: "Something else" },
] as const;

const field =
  "w-full border-b border-line bg-transparent pb-3 pt-6 text-lg outline-none transition-colors placeholder:text-muted focus:border-fg";

/**
 * The bookmark tab, and the form behind it.
 *
 * A tool site lives or dies on the reports it gets — a PDF that will not open
 * here is a bug we cannot reproduce without being told about it — so the way
 * in is pinned to the edge of every page rather than buried on a contact
 * page. The report carries the tool you were on and your browser string,
 * because a bug report without either is usually unactionable.
 */
export default function Feedback() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>(KINDS[0].id);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  /* Esc closes, and the page behind the panel does not scroll under it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const focus = setTimeout(() => firstField.current?.focus(), 350);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(focus);
    };
  }, [open]);

  /* A fresh form each time it is opened, so a second report is not shown the
     first one's thank-you. */
  useEffect(() => {
    if (open) {
      setSent(false);
      setError(null);
    }
  }, [open]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);

    const data = new FormData(event.currentTarget);

    /* honeypot: a bot fills every field it finds, a person cannot see this
       one. Pretend it worked and send nothing. */
    if (data.get("website")) {
      setSent(true);
      setSending(false);
      return;
    }

    const tool = bySlug(pathname.replace(/^\//, ""))?.name ?? "Home";
    const label = KINDS.find((k) => k.id === kind)?.label ?? kind;

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          /* Web3Forms' own spam trap, in addition to ours */
          botcheck: "",
          subject: `PDF Tools — ${label} (${tool})`,
          from_name: "Advorize PDF Tools",
          /* replying in the inbox goes straight back to the person */
          replyto: data.get("email"),
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          kind: label,
          tool,
          page: window.location.href,
          browser: navigator.userAgent,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false) {
        throw new Error(body.message ?? "Something went wrong.");
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That did not send. Email sales@advorize.com instead.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* ------------------------------------------------------- the tab */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4, ease: EASE }}
        className="fixed right-0 bottom-24 z-40 hidden md:block"
      >
        <Magnetic strength={0.25}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-cursor="hover"
            aria-haspopup="dialog"
            className="group flex flex-col items-center gap-3 rounded-l-2xl border border-r-0 border-line bg-bg py-6 pr-3 pl-3 transition-colors duration-500 hover:border-accent hover:bg-accent"
          >
            <Bookmark className="h-4 w-4 text-accent transition-colors duration-500 group-hover:text-white" />
            <span
              className="text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-500 group-hover:text-white"
              style={{ writingMode: "vertical-rl" }}
            >
              Feedback
            </span>
          </button>
        </Magnetic>
      </motion.div>

      {/* the same thing on a phone, where an edge tab is a scroll hazard */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4, ease: EASE }}
        aria-haspopup="dialog"
        aria-label="Send feedback"
        className="fixed right-4 bottom-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-accent text-white shadow-lg md:hidden"
      >
        <Bookmark className="h-4 w-4" />
      </motion.button>

      {/* ------------------------------------------------------ the panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center"
            initial="out"
            animate="in"
            exit="out"
          >
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              variants={{ out: { opacity: 0 }, in: { opacity: 1 } }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-fg/40 backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Send feedback"
              variants={{
                out: { y: 40, opacity: 0, scale: 0.98 },
                in: { y: 0, opacity: 1, scale: 1 },
              }}
              transition={{ duration: 0.6, ease: EASE }}
              className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] border border-line bg-bg p-8 sm:rounded-[28px] md:p-12"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                data-cursor="hover"
                className="absolute top-6 right-6 text-2xl leading-none text-muted transition-colors hover:text-fg"
              >
                ✕
              </button>

              {sent ? (
                <div className="py-8">
                  <p className="display text-[9vw] leading-[1] sm:text-5xl">
                    Thank you.
                  </p>
                  <p className="mt-6 leading-relaxed text-muted">
                    That is in our inbox. If you left an email and it was a bug,
                    you will hear back from us when it is fixed.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    data-cursor="hover"
                    className="mt-10 inline-flex h-12 items-center rounded-full bg-fg px-7 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white"
                  >
                    Back to the tools
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
                    Feedback
                  </p>
                  <h2 className="display mt-4 text-3xl md:text-4xl">
                    Found a bug? Tell us.
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted">
                    A file that will not open, a button that does nothing, a
                    tool we have not built yet — all of it is useful. Your
                    document itself is never sent, only what you write here.
                  </p>

                  <form onSubmit={onSubmit} className="mt-8">
                    <div className="flex flex-wrap gap-2">
                      {KINDS.map((k) => {
                        const active = kind === k.id;
                        return (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => setKind(k.id)}
                            aria-pressed={active}
                            data-cursor="hover"
                            className={`relative rounded-full px-5 py-2 text-sm transition-colors duration-300 ${
                              active ? "text-bg" : "text-muted hover:text-fg"
                            }`}
                          >
                            {active && (
                              <motion.span
                                layoutId="feedback-kind"
                                transition={{ duration: 0.4, ease: EASE }}
                                className="absolute inset-0 rounded-full bg-fg"
                              />
                            )}
                            <span className="relative">{k.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <label className="block">
                      <span className="text-sm text-muted">Your name</span>
                      <input
                        ref={firstField}
                        required
                        name="name"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        className={field}
                      />
                    </label>

                    <label className="mt-2 block">
                      <span className="text-sm text-muted">Your email</span>
                      <input
                        required
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="jane@company.com"
                        className={field}
                      />
                    </label>

                    <label className="mt-2 block">
                      <span className="text-sm text-muted">
                        What happened — and which file, if it was a file
                      </span>
                      <textarea
                        required
                        name="message"
                        rows={4}
                        placeholder="Compress PDF got to 40% and stopped on a 30 MB scan…"
                        className={`${field} resize-none`}
                      />
                    </label>

                    {/* honeypot — hidden from people, irresistible to bots */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      className="hidden"
                    />

                    <p className="mt-6 text-xs leading-relaxed text-muted">
                      We include the page you were on and your browser version,
                      which is usually what makes a bug reproducible.
                    </p>

                    {error && (
                      <p
                        role="alert"
                        className="mt-4 border-l-2 border-accent pl-4 text-sm"
                      >
                        {error}
                      </p>
                    )}

                    <Magnetic strength={0.15}>
                      <button
                        type="submit"
                        disabled={sending}
                        data-cursor="hover"
                        className="mt-8 w-full rounded-full bg-fg px-8 py-4 text-[15px] font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
                      >
                        {sending ? "Sending…" : "Send it"}
                      </button>
                    </Magnetic>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bookmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 3h12v18l-6-5-6 5z" />
    </svg>
  );
}
