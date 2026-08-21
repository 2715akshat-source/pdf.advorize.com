import type { Metadata } from "next";
import Launcher from "@/components/Launcher";
import ToolGrid from "@/components/ToolGrid";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { FadeUp, Reveal } from "@/components/Reveal";
import { tools } from "@/lib/tools";
import { BRAND, PARENT_URL, absolute, buildMetadata } from "@/lib/seo";
import { graph } from "@/lib/schema";

export const metadata: Metadata = buildMetadata({
  path: "/",
  title: "Free PDF Tools — Merge, Split & Compress in Your Browser",
  description:
    "Twenty free PDF tools that run entirely in your browser: merge, split, compress, convert, rotate and watermark. No upload, no sign-up, no watermark on your file.",
  keywords: [
    "free pdf tools",
    "online pdf editor no upload",
    "merge pdf free",
    "compress pdf online",
    "pdf tools without sign up",
  ],
});

const PROMISES = [
  {
    n: "01",
    title: "Nothing is uploaded",
    body: "Every tool runs in JavaScript inside this tab. Your file is read from disk, worked on in memory and handed back — it never touches a server, ours or anyone else's.",
  },
  {
    n: "02",
    title: "No account, no watermark",
    body: "No sign-up wall, no daily cap, and no badge stamped across the file you get back. Run a tool ten times in a row if that is what the job needs.",
  },
  {
    n: "03",
    title: "It works offline",
    body: "Once this page has loaded you can disconnect and everything still works. That is the simplest proof your documents are staying exactly where they are.",
  },
];

const FAQS = [
  {
    q: "Are my files really never uploaded?",
    a: "Really. Each tool reads your file with the browser's own File API and does the work in memory using pdf-lib and pdf.js. There is no upload endpoint to send it to — which you can verify by loading a tool, going offline, and using it anyway.",
  },
  {
    q: "Why is this free with no sign-up?",
    a: "We are a marketing and web development studio, not a SaaS company. These tools are the clearest demonstration of how we build, and the people who need them are often the people who later need a website or a campaign.",
  },
  {
    q: "How big a file can I work with?",
    a: "There is no imposed limit. The ceiling is your device's memory, since everything happens locally — a hundred-megabyte PDF is fine on a normal laptop, and rasterising tools like compress use more memory than the ones that only rearrange pages.",
  },
  {
    q: "Which browsers are supported?",
    a: "Any current version of Chrome, Edge, Firefox or Safari, on desktop or mobile. The tools need JavaScript, and the heavier ones benefit from a desktop machine's memory.",
  },
  {
    q: "Do you keep any record of what I do here?",
    a: "The filenames, page counts and contents of your documents never leave your browser, so there is nothing for us to keep. Ordinary anonymous traffic analytics tell us which tool pages are visited, and nothing about the files opened in them.",
  },
];

export default function Home() {
  return (
    <>
      <JsonLd
        data={graph([
          {
            "@type": "ItemList",
            "@id": `${absolute("/")}#tools`,
            name: `${BRAND} — all tools`,
            numberOfItems: tools.length,
            itemListElement: tools.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.name,
              url: absolute(`/${t.slug}`),
            })),
          },
        ])}
      />

      {/*
       * Opening block. A tool site's job is to get you working, so this is a
       * masthead rather than a full-screen hero: the headline, the claim, and
       * the drop well all sit above the fold together.
       */}
      <section className="shell pt-36 pb-10 md:pt-44">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="mb-8 text-[11px] font-semibold tracking-[0.25em] text-accent uppercase">
              {tools.length} tools · free · nothing uploaded
            </p>
            <h1 className="display text-[13vw] leading-[0.95] md:text-[7vw]">
              {"Your PDFs never leave this tab".split(" ").map((word, i) => (
                <span key={`${word}-${i}`} className="inline-block pr-[0.22em]">
                  <Reveal delay={0.05 + i * 0.06}>{word}</Reveal>
                </span>
              ))}
            </h1>
          </div>

          <FadeUp delay={0.4}>
            <p className="text-lg leading-relaxed text-muted md:text-xl">
              Merge, split, compress, convert, rotate, watermark and unlock —
              twenty tools that run inside your browser. No upload step, no
              sign-up, and no watermark on the file you get back.
            </p>
          </FadeUp>
        </div>

        <FadeUp delay={0.5} className="mt-14">
          <Launcher />
        </FadeUp>
      </section>

      {/* --------------------------------------------------------- promises */}
      <section className="shell py-20 md:py-28">
        <div className="grid gap-12 border-t border-line pt-12 md:grid-cols-3">
          {PROMISES.map((p, i) => (
            <FadeUp key={p.n} delay={i * 0.1}>
              <span className="text-sm tabular-nums text-muted">{p.n}</span>
              <h2 className="display mt-4 text-2xl md:text-3xl">{p.title}</h2>
              <p className="mt-4 leading-relaxed text-muted">{p.body}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      <ToolGrid />

      <Faq items={FAQS} title="Questions people ask" />

      {/* -------------------------------------------------------------- who */}
      <section className="shell pb-8">
        <FadeUp>
          <div className="rounded-[28px] border border-line p-8 md:p-16">
            <h2 className="display max-w-[18ch] text-[7vw] leading-[1] md:text-[3.4vw]">
              Built by Advorize
            </h2>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-muted">
              We are a performance marketing and web development studio working
              out of India with clients across the US, Canada and the UAE. These
              tools are the same engineering we put into client work — fast,
              private, and built to be used rather than signed up for. If you
              want something like this for your own product, that is our day job.
            </p>
            <a
              href={`${PARENT_URL}/contact`}
              data-cursor="hover"
              className="mt-10 inline-flex h-12 items-center rounded-full bg-fg px-7 text-sm font-medium text-bg transition-colors hover:bg-accent"
            >
              Talk to us
            </a>
          </div>
        </FadeUp>
      </section>
    </>
  );
}
