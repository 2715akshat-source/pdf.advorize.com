/**
 * Editorial content types.
 *
 * Posts are written, not generated. A section is either prose or a list, and
 * that is deliberately all — the moment this grows a component system, the
 * temptation is to fill it with structure instead of sentences.
 */
export type Section = {
  h: string;
  /** a string is a paragraph, an array is a bulleted list */
  body: (string | string[])[];
};

export type Post = {
  slug: string;
  /** the SEO title — under ~60 characters */
  title: string;
  h1: string;
  description: string;
  /** ISO date; used for Article schema and the index ordering */
  date: string;
  /** the tool this post is about, so the two can link to each other */
  tool: string;
  /** how long it takes to read, in minutes — written, not counted */
  minutes: number;
  lead: string;
  sections: Section[];
  faqs: { q: string; a: string }[];
  keywords: string[];
};
