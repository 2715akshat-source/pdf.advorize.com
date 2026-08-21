import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Prose from "@/components/Prose";
import Faq from "@/components/Faq";
import ToolGrid from "@/components/ToolGrid";
import TransitionLink from "@/components/TransitionLink";
import { FadeUp, Reveal } from "@/components/Reveal";
import { tools } from "@/lib/tools";
import { absolute, buildMetadata, BRAND } from "@/lib/seo";
import { breadcrumbSchema, faqSchema, graph } from "@/lib/schema";

/**
 * The hub for the question people ask about the whole site rather than about
 * one tool: is this actually free, and what is the catch. It is the page the
 * intent pages point up at, and the one worth linking to from anywhere else.
 */
export const metadata: Metadata = buildMetadata({
  path: "/free-pdf-tools-no-signup",
  title: "Free PDF Tools With No Signup — Nothing Uploaded",
  description:
    "Twenty-one PDF tools with no account, no daily limit and no watermark, all running in your browser rather than on a server. What that means, and where the money comes from.",
  keywords: [
    "free pdf tools no signup",
    "pdf tools without registration",
    "free pdf tools no watermark",
    "pdf tools without uploading",
    "online pdf tools no account",
  ],
});

const SECTIONS = [
  {
    h: "What free normally means in this category",
    body: [
      "Almost every free PDF site is a trial wearing the word free. The shapes repeat: two files a day, a watermark on anything you export, the quality setting locked, a size cap set just below the file you are actually holding, or an email address demanded before the download appears.",
      "None of that is dishonest — it is arithmetic. Processing a document on a server costs money per file, so the free tier exists to become a paid one. The interesting question is what happens when the processing does not cost anything.",
    ] as (string | string[])[],
  },
  {
    h: "Why these tools have nothing to gate",
    body: [
      "Everything here runs in your browser. The page loads a PDF library, reads your file from disk, does the work with your own processor and hands the result back as a download. No file is uploaded, so no server time is consumed, so there is no per-use cost to recover.",
      "That removes the machinery: no quota to enforce, so no account to hold it; no queue, so no paid lane; no server storage, so no retention policy to write. The absence of a signup wall is not generosity, it is a consequence of the architecture.",
      [
        "No account, email or verification.",
        "No daily limit — run any tool as often as you like.",
        "No watermark and nothing appended to your document.",
        "No paid tier: every setting on every tool is the full one.",
        "No file size cap beyond what your own device can hold in memory.",
      ],
    ] as (string | string[])[],
  },
  {
    h: "So where does the money come from",
    body: [
      "Advorize is a performance marketing and web development studio. These tools are the clearest demonstration of how we build — fast, private, and usable without an onboarding flow — and a proportion of the people who find them later need a website or a campaign built.",
      "That is the whole model. It does not need your email address, and it does not need your document.",
    ] as (string | string[])[],
  },
  {
    h: "The proof takes ten seconds",
    body: [
      "Open any tool, disconnect from the internet, and use it. It keeps working, because everything it needs is already in the tab.",
      "No privacy policy can demonstrate that, and it is the one claim in this category you can verify for yourself rather than taking on trust.",
    ] as (string | string[])[],
  },
  {
    h: "What a browser genuinely cannot do",
    body: [
      "Being straight about the limits is part of the argument:",
      [
        "OCR — turning a scanned page into searchable text needs a trained model and real processing.",
        "Very large documents, where a server has more memory than your laptop.",
        "Rewriting existing text so paragraphs reflow, which needs the source document rather than any PDF tool.",
        "Certified digital signatures, which need a certificate authority.",
      ],
      "Everything else — merging, splitting, compressing, converting, signing, marking up — is well within what a browser can do, and it is the majority of what anyone actually needs.",
    ] as (string | string[])[],
  },
];

const FAQS = [
  {
    q: "Are these PDF tools really free?",
    a: "Yes — no account, no daily cap, no watermark and no paid tier. There is no per-file cost to recover, because the work happens on your machine rather than on our servers.",
  },
  {
    q: "Do I have to sign up for anything?",
    a: "No. There is no account system at all, so there is nothing to sign up to, nothing to verify and no marketing to unsubscribe from later.",
  },
  {
    q: "Are my documents uploaded?",
    a: "No. Every tool runs in JavaScript inside your browser tab — your file is read from disk, worked on in memory and handed back. There is no upload endpoint, which you can confirm by using a tool with your Wi-Fi switched off.",
  },
  {
    q: "Is there a file size limit?",
    a: "None imposed. The ceiling is your device's memory, since that is the only thing doing the work — a hundred-megabyte PDF is fine on an ordinary laptop.",
  },
  {
    q: "Will there be a watermark on my file?",
    a: "No. Nothing is added to your document that you did not add yourself, and no promotional page is appended to it.",
  },
];

export default function FreeToolsPage() {
  return (
    <>
      <JsonLd
        data={graph([
          {
            "@type": "CollectionPage",
            "@id": `${absolute("/free-pdf-tools-no-signup")}#page`,
            name: "Free PDF tools with no signup",
            url: absolute("/free-pdf-tools-no-signup"),
            about: { "@type": "Thing", name: "Free browser-based PDF tools" },
            isPartOf: { "@id": `${absolute("/")}#website` },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: tools.length,
              itemListElement: tools.map((t, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: t.name,
                url: absolute(`/${t.slug}`),
              })),
            },
          },
          faqSchema("/free-pdf-tools-no-signup", FAQS),
          breadcrumbSchema([
            { name: "PDF Tools", path: "/" },
            { name: "Free, no signup", path: "/free-pdf-tools-no-signup" },
          ]),
        ])}
      />

      <section className="shell pt-32 pb-2 md:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <TransitionLink href="/" data-cursor="hover" className="underline-grow">
            PDF Tools
          </TransitionLink>
          <span aria-hidden className="px-2">/</span>
          <span className="text-fg">Free, no signup</span>
        </nav>

        <h1 className="display max-w-[18ch] text-[10vw] leading-[1] md:text-[4.4vw]">
          {"Free PDF tools with nothing to sign up to".split(" ").map((w, i) => (
            <span key={`${w}-${i}`} className="inline-block pr-[0.22em]">
              <Reveal immediate delay={0.04 + i * 0.04}>
                {w}
              </Reveal>
            </span>
          ))}
        </h1>

        <FadeUp delay={0.35}>
          <p className="mt-10 max-w-[60ch] text-lg leading-relaxed text-muted">
            {tools.length} tools, no account, no daily limit, no watermark — and
            no upload step, because every one of them runs in your browser
            rather than on a server. {BRAND} is built by a studio that makes its
            money elsewhere, which is the only reason any of that is possible.
          </p>
        </FadeUp>
      </section>

      <section className="shell py-14">
        <Prose sections={SECTIONS} />
      </section>

      <ToolGrid />

      <Faq items={FAQS} title="Questions people ask" />
    </>
  );
}
