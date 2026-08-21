# pdf.advorize.com

PDF tools that run entirely in the visitor's browser. No upload, no
account, no server-side processing — which is both the product promise and the
reason this deploys as a static site.

## How it works

- **pdf-lib** does everything structural: merge, split, page order, rotation,
  numbering, watermarks, cropping, metadata. Fast, and the text layer survives.
- **pdf.js** does everything that needs a page *rendered*: compress, flatten,
  greyscale, PDF→JPG/PNG, text extraction, page thumbnails, opening a
  password-protected file.
- **JSZip** packs the multi-file outputs, because browsers will not hand over
  twenty downloads at once.

Nothing here has a server component. `next build` emits static HTML for every
route, and the work happens in the tab.

## Layout

```
src/lib/tools.ts        the registry — routes, form controls, copy, FAQs, links
src/lib/pdf/engines.ts  one function per tool, all browser-side
src/components/         UI, sharing advorize.com's design system
scripts/                copies the pdf.js worker into public/ (see the file)
```

Adding a tool is one object in `src/lib/tools.ts` plus one function in
`engines.ts`. The route, sitemap entry, footer link, schema markup and nav
listing all follow from the registry.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # must pass before any commit
```

`npm install` and both scripts copy `pdf.worker.min.mjs` into `public/` first —
pdf.js will not run without it, and the copy is gitignored so it always matches
the installed version.

## Deploying

This is its own repository and its own Vercel project, separate from the main
site.

1. Push to a new GitHub repo and import it in Vercel. The framework preset is
   Next.js; no build settings need changing.
2. Add the domain `pdf.advorize.com` in the Vercel project, then point a CNAME
   at Vercel from the DNS provider that holds `advorize.com`.
3. Set `NEXT_PUBLIC_SITE_URL=https://pdf.advorize.com` so canonicals, the
   sitemap and the JSON-LD `@id`s resolve to the live host.
4. Submit `https://pdf.advorize.com/sitemap.xml` in Search Console as a
   separate property — a subdomain does not inherit the main site's.

## Analytics

Google Analytics 4, loaded with the standard gtag snippet in
`components/Analytics.tsx` and left out of development builds. Route changes
go through `router.push`, which is a history event, so GA4's enhanced
measurement counts the page views — firing our own on top would double-count
every navigation. Override the measurement ID with `NEXT_PUBLIC_GA_ID`.

On top of page views, `lib/analytics.ts` sends a small set of events:
`tool_run`, `tool_success` (with a duration), `tool_error` (with our own error
message), `download`, `editor_save`, `launcher_open` / `launcher_pick`, and
`feedback_open` / `feedback_sent`.

**None of them may describe a document.** No file names, no contents, nothing
derived from them — sizes are bucketed (`5-20MB`) rather than sent, so a
number can never identify a particular file. What is recorded is which tool
ran, how many files it was given, how long it took and whether it worked. That
is enough to see that compress is being abandoned on large scans, and useless
to anyone trying to learn what was in them. Keep it that way when adding
events: the promise on every page is that documents stay on the visitor's
machine, and analytics is the easiest place to quietly break it.

## SEO

Each tool page is a static page targeting one query, with its own title,
description, intro, three written FAQs and four internal links, plus
`WebApplication`, `HowTo`, `FAQPage` and `BreadcrumbList` markup. The registry
is the single source for all of it, so a page can never ship with another
page's description.
