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
 *
 * File dates need one guard. Deployments normalise timestamps for
 * reproducible builds, and Vercel in particular hands every file the same
 * 2018 placeholder — which would tell a crawler that a page published today
 * has not changed in eight years. Anything implausible falls back to the
 * build time, and posts use their own editorial date, which is the better
 * signal anyway.
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

/** Baked in at build time; see next.config.ts. */
const BUILT = new Date(process.env.BUILD_TIME ?? Date.now());

/**
 * A file date is only usable if it looks like one. Build systems reset mtimes
 * to a fixed epoch, so anything older than this site is a placeholder rather
 * than a fact about the page.
 */
const REAL_DATES_START = new Date("2026-01-01");

const dated = (candidate: Date) =>
  candidate > REAL_DATES_START ? candidate : BUILT;

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
    out.push({ path, lastModified: dated(statSync(join(dir, page)).mtime) });
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
      const lastModified = dated(source > templateDate ? source : templateDate);
      const prefix = segments.length ? `/${segments.join("/")}` : "";
      for (const child of expand.slugs()) {
        out.push({
          path: `${prefix}/${child.slug}`,
          /* a written page dates itself better than any file can */
          lastModified: child.date ? new Date(child.date) : lastModified,
        });
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
  { slugs: () => { slug: string; date?: string }[]; source: string[] }
> = {
  "[tool]": {
    slugs: () => [
      ...tools.map((t) => ({ slug: t.slug })),
      ...variants.map((v) => ({ slug: v.slug })),
    ],
    source: ["src", "lib", "tools.ts"],
  },
  "[post]": {
    slugs: () => posts.map((p) => ({ slug: p.slug, date: p.date })),
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
  const now = BUILT;
  return [
    { path: "/", lastModified: now },
    { path: "/blog", lastModified: now },
    ...tools.map((t) => ({ path: `/${t.slug}`, lastModified: now })),
    ...variants.map((v) => ({ path: `/${v.slug}`, lastModified: now })),
    ...posts.map((p) => ({
      path: `/blog/${p.slug}`,
      lastModified: new Date(p.date),
    })),
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
