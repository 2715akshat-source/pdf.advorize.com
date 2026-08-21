/**
 * pdf.js is only ever loaded in the browser, and only by the tools that need
 * to *render* a page (rasterising, thumbnails, text extraction, password
 * removal). Everything that just rearranges pages uses pdf-lib, which is far
 * lighter.
 *
 * The import is deferred rather than top-level so the library is not pulled
 * into the server prerender, and the worker is loaded from /public by path —
 * see scripts/copy-pdf-worker.mjs for why that indirection exists.
 */
type Pdfjs = typeof import("pdfjs-dist");

let pending: Promise<Pdfjs> | null = null;

export function getPdfjs(): Promise<Pdfjs> {
  pending ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return pdfjs;
  });
  return pending;
}
