# pdf.advorize.com

Twenty PDF tools that run entirely in the visitor's browser. No upload, no
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

## SEO

Each tool page is a static page targeting one query, with its own title,
description, intro, three written FAQs and four internal links, plus
`WebApplication`, `HowTo`, `FAQPage` and `BreadcrumbList` markup. The registry
is the single source for all of it, so a page can never ship with another
page's description.
