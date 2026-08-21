import type { Metadata } from "next";

/**
 * The tools sit on their own subdomain rather than under advorize.com/tools,
 * so canonicals, the sitemap and the schema @ids all have to say pdf. — set
 * NEXT_PUBLIC_SITE_URL if that ever changes.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pdf.advorize.com"
).replace(/\/$/, "");

export const PARENT_URL = "https://www.advorize.com";

export const BRAND = "Advorize PDF Tools";

export const absolute = (path: string) =>
  path === "/" ? SITE_URL : `${SITE_URL}${path}`;

export function buildMetadata({
  path,
  title,
  description,
  keywords,
}: {
  path: string;
  title?: string;
  description?: string;
  keywords?: string[];
}): Metadata {
  const url = absolute(path);
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: BRAND,
      title,
      description,
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
