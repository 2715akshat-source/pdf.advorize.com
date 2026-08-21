/**
 * Analytics.
 *
 * The whole promise of this site is that documents stay on the visitor's
 * machine, so nothing here may describe one: no file names, no page contents,
 * no anything derived from them. What is sent is which tool ran, how many
 * files it was given, how long it took and whether it worked — enough to see
 * that, say, compress is being abandoned on large documents, and useless to
 * anyone trying to learn what was in them.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-00W1HJP9W3";

/** Fire and forget — a blocked or absent tag must never break a tool. */
export function track(event: string, params: Record<string, unknown> = {}) {
  try {
    window.gtag?.("event", event, params);
  } catch {}
}

/** Buckets a byte count, so a size never identifies a particular file. */
export function sizeBucket(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return "<1MB";
  if (mb < 5) return "1-5MB";
  if (mb < 20) return "5-20MB";
  if (mb < 100) return "20-100MB";
  return ">100MB";
}
