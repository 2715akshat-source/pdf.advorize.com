/**
 * Route discovery.
 *
 * The sitemap is built from the routes that actually exist rather than from a
 * list somebody has to remember to update: the app directory is walked for
 * `page` files, and the one dynamic segment is expanded from the same
 * registry that generates its static params. Add a page, and it is in the
 * sitemap — with a real last-modified date taken from the file itself.
 *
 * This runs on the server at request time, so the source tree has to be
 * present in the deployment; `outputFileTracingIncludes` in next.config.ts is
 * what puts it there. If it ever is not — an unusual runtime, a bundler that
 * traces differently — `fallback()` still returns every route, just without
 * the per-file dates, so the sitemap can never come back empty.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tools } from "./tools";

export type Route = {
  path: string;
  lastModified: Date;
};

const APP_DIR = join(process.cwd(), "src", "app");

const PAGE = /^page\.(tsx|ts|jsx|js|mdx)$/;

/** Route groups `(marketing)` and private folders `_lib` are not segments. */
const isGroup = (name: string) => name.startsWith("(") && name.endsWith(")");
const isPrivate = (name: string) => name.startsWith("_") || name.startsWith(".");
const isDynamic = (name: string) => name.startsWith("[");

function walk(dir: string, segments: string[], out: Route[]) {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  const page = entries.find((e) => PAGE.test(e));
  if (page) {
    const path = segments.length ? `/${segments.join("/")}` : "/";
    out.push({ path, lastModified: statSync(join(dir, page)).mtime });
  }

  for (const entry of entries) {
    if (isPrivate(entry)) continue;
    const full = join(dir, entry);
    let dirent;
    try {
      dirent = statSync(full);
    } catch {
      continue;
    }
    if (!dirent.isDirectory()) continue;

    if (isDynamic(entry)) {
      /* `[tool]` is the only dynamic segment on this site, and its params come
         from the registry. Its pages are all rendered by the same file, so
         they share that file's date — or the registry's, if the copy on them
         changed more recently than the template did. */
      const template = readdirSync(full).find((e) => PAGE.test(e));
      if (!template) continue;
      const templateDate = statSync(join(full, template)).mtime;
      const registryDate = registryModified();
      const lastModified =
        registryDate > templateDate ? registryDate : templateDate;
      for (const tool of tools) {
        out.push({ path: `/${tool.slug}`, lastModified });
      }
      continue;
    }

    walk(full, isGroup(entry) ? segments : [...segments, entry], out);
  }
}

function registryModified(): Date {
  try {
    return statSync(join(process.cwd(), "src", "lib", "tools.ts")).mtime;
  } catch {
    return new Date();
  }
}

/** Every route, without touching the filesystem. */
function fallback(): Route[] {
  const now = new Date();
  return [
    { path: "/", lastModified: now },
    ...tools.map((t) => ({ path: `/${t.slug}`, lastModified: now })),
  ];
}

export function routes(): Route[] {
  const found: Route[] = [];
  walk(APP_DIR, [], found);

  /* One route means the walk found nothing but the root, which on a site with
     twenty-odd tool pages means it did not really run. */
  if (found.length < 2) return fallback();

  return found.sort((a, b) => a.path.localeCompare(b.path));
}
