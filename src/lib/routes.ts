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
import { variants } from "./variants";
import { posts } from "../content/posts";

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
      /* A dynamic segment is expanded from whatever generates its static
         params. Its pages are all rendered by the same file, so they share
         that file's date — or the content module's, if the copy on them
         changed more recently than the template did. */
      const expand = EXPANDERS[entry];
      if (!expand) continue;
      const template = readdirSync(full).find((e) => PAGE.test(e));
      if (!template) continue;
      const templateDate = statSync(join(full, template)).mtime;
      const source = modified(expand.source);
      const lastModified = source > templateDate ? source : templateDate;
      const prefix = segments.length ? `/${segments.join("/")}` : "";
      for (const child of expand.slugs()) {
        out.push({ path: `${prefix}/${child}`, lastModified });
      }
      continue;
    }

    walk(full, isGroup(entry) ? segments : [...segments, entry], out);
  }
}

/**
 * One entry per dynamic segment in the app directory. `source` is the file
 * whose date the generated pages inherit, since that is where their copy
 * actually lives.
 */
const EXPANDERS: Record<
  string,
  { slugs: () => string[]; source: string[] }
> = {
  "[tool]": {
    slugs: () => [
      ...tools.map((t) => t.slug),
      ...variants.map((v) => v.slug),
    ],
    source: ["src", "lib", "tools.ts"],
  },
  "[post]": {
    slugs: () => posts.map((p) => p.slug),
    source: ["src", "content", "posts.ts"],
  },
};

function modified(parts: string[]): Date {
  try {
    return statSync(join(process.cwd(), ...parts)).mtime;
  } catch {
    return new Date();
  }
}

/** Every route, without touching the filesystem. */
function fallback(): Route[] {
  const now = new Date();
  return [
    { path: "/", lastModified: now },
    { path: "/blog", lastModified: now },
    ...tools.map((t) => ({ path: `/${t.slug}`, lastModified: now })),
    ...variants.map((v) => ({ path: `/${v.slug}`, lastModified: now })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, lastModified: now })),
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
