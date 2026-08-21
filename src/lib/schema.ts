import { BRAND, PARENT_URL, SITE_URL, absolute } from "./seo";
import type { Tool } from "./tools";

/** Wraps a set of nodes in the single @graph every page emits. */
export const graph = (nodes: object[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

export const organizationSchema = () => ({
  "@type": "Organization",
  "@id": `${PARENT_URL}/#organization`,
  name: "Advorize",
  url: PARENT_URL,
  email: "sales@advorize.com",
});

export const websiteSchema = () => ({
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: BRAND,
  inLanguage: "en-IN",
  publisher: { "@id": `${PARENT_URL}/#organization` },
});

/**
 * Each tool is a real piece of software that runs in the browser, so
 * WebApplication is the honest type — and the free/no-signup claim is
 * something we can back up, which is what makes the offer markup safe.
 */
export const toolSchema = (tool: Tool) => ({
  "@type": "WebApplication",
  "@id": `${absolute(`/${tool.slug}`)}#app`,
  name: `${tool.name} — ${BRAND}`,
  url: absolute(`/${tool.slug}`),
  description: tool.description,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any — runs in a web browser",
  browserRequirements: "Requires JavaScript",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  featureList: tool.steps,
  publisher: { "@id": `${PARENT_URL}/#organization` },
});

export const faqSchema = (
  path: string,
  faqs: { q: string; a: string }[],
) => ({
  "@type": "FAQPage",
  "@id": `${absolute(path)}#faq`,
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const howToSchema = (tool: Tool) => ({
  "@type": "HowTo",
  "@id": `${absolute(`/${tool.slug}`)}#howto`,
  name: tool.h1,
  totalTime: "PT1M",
  step: tool.steps.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    text: s,
  })),
});

export const breadcrumbSchema = (trail: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: absolute(t.path),
  })),
});
