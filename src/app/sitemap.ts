import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";
import { absolute } from "@/lib/seo";

/** Submit https://pdf.advorize.com/sitemap.xml in Search Console. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: absolute("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...tools.map((t) => ({
      url: absolute(`/${t.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      /* The three tools with real search volume carry the weight. */
      priority: ["merge-pdf", "compress-pdf", "split-pdf"].includes(t.slug)
        ? 0.9
        : 0.7,
    })),
  ];
}
