import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";
import { absolute } from "@/lib/seo";
import { bySlug } from "@/lib/tools";
import { variantBySlug } from "@/lib/variants";

/**
 * Generated from the routes that exist, at request time — see lib/routes.ts.
 * Submit https://pdf.advorize.com/sitemap.xml in Search Console.
 */
export const dynamic = "force-dynamic";

/** The tools worth pointing a crawler at first. */
const HEADLINE = new Set([
  "edit-pdf",
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
]);

/** Tools first, then the guides, then the intent pages they support. */
function weight(path: string): number {
  if (path === "/") return 1;
  const slug = path.slice(1);
  if (HEADLINE.has(slug)) return 0.9;
  if (bySlug(slug)) return 0.8;
  if (path === "/blog") return 0.7;
  if (path.startsWith("/blog/")) return 0.6;
  if (variantBySlug(slug)) return 0.5;
  return 0.4;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routes().map(({ path, lastModified }) => ({
    url: absolute(path),
    lastModified,
    changeFrequency:
      path === "/" || path === "/blog" ? ("weekly" as const) : ("monthly" as const),
    priority: weight(path),
  }));
}
