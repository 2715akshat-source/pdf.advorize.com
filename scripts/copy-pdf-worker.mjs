/**
 * pdf.js needs its worker as a real file at a stable URL.
 *
 * Resolving it with `new URL("pdfjs-dist/build/pdf.worker.min.mjs",
 * import.meta.url)` looks tidy but is not rewritten by the bundler, so at
 * runtime the worker 404s and every rasterising tool fails silently. Copying
 * the worker into /public and pointing at it by path is the version that
 * actually works — and it is pinned to the installed pdfjs, so the worker and
 * the library can never drift apart.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("pdfjs-dist/package.json"));
const from = join(dist, "build", "pdf.worker.min.mjs");
const to = join(process.cwd(), "public", "pdf.worker.min.mjs");

mkdirSync(dirname(to), { recursive: true });
copyFileSync(from, to);
console.log(`pdf.js worker → public/pdf.worker.min.mjs`);
