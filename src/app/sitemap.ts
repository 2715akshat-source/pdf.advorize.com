import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";
import { absolute } from "@/lib/seo";
import { bySlug } from "@/lib/tools";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return routes().map(({ path, lastModified }) => {
    const home = path === "/";
    const slug = path.slice(1);

    return {
      url: absolute(path),
      lastModified,
      changeFrequency: home ? ("weekly" as const) : ("monthly" as const),
      priority: home ? 1 : HEADLINE.has(slug) ? 0.9 : bySlug(slug) ? 0.7 : 0.5,
    };
  });
}
