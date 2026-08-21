import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolRunner from "@/components/ToolRunner";
import PdfEditor from "@/components/PdfEditor";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import TransitionLink from "@/components/TransitionLink";
import ToolGlyph from "@/components/ToolGlyph";
import { FadeUp, Reveal } from "@/components/Reveal";
import { bySlug, tools } from "@/lib/tools";
import { buildMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  howToSchema,
  toolSchema,
} from "@/lib/schema";

/** One static page per tool — the whole site prerenders at build time. */
export function generateStaticParams() {
  return tools.map((t) => ({ tool: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = bySlug(slug);
  if (!tool) return {};
  return buildMetadata({
    path: `/${tool.slug}`,
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
  });
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool: slug } = await params;
  const tool = bySlug(slug);
  if (!tool) notFound();

  const related = tool.related
    .map(bySlug)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <>
      <JsonLd
        data={graph([
          toolSchema(tool),
          howToSchema(tool),
          faqSchema(tool),
          breadcrumbSchema([
            { name: "PDF Tools", path: "/" },
            { name: tool.name, path: `/${tool.slug}` },
          ]),
        ])}
      />

      {/* ------------------------------------------------------------ head */}
      <section className="shell pt-32 pb-2 md:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <TransitionLink
            href="/"
            data-cursor="hover"
            className="underline-grow"
          >
            PDF Tools
          </TransitionLink>
          <span aria-hidden className="px-2">
            /
          </span>
          <span className="text-fg">{tool.category}</span>
        </nav>

        {/* One line from md up — the headlines are written short enough for
            it, and a two-line title over a one-line intro reads as a stack of
            fragments rather than a masthead. */}
        <h1 className="display text-[9vw] leading-[1] md:text-[3.9vw] md:whitespace-nowrap">
          {tool.h1.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block pr-[0.22em]">
              <Reveal immediate delay={0.05 + i * 0.05}>{word}</Reveal>
            </span>
          ))}
        </h1>

        <FadeUp delay={0.3}>
          <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
            <p className="max-w-[54ch] text-lg leading-relaxed text-muted">
              {tool.intro}
            </p>
            {/* the glyph performs the operation once, as the page settles */}
            <ToolGlyph
              slug={tool.slug}
              className="w-56 shrink-0 text-fg md:w-[26vw] md:max-w-[420px]"
              play
            />
          </div>
        </FadeUp>
      </section>

      {/* ------------------------------------------------------------ tool */}
      <section className="shell pt-10 pb-8 md:pt-12">
        <div
          className={
            tool.custom
              ? "grid gap-12"
              : "grid gap-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-16"
          }
        >
          <FadeUp>
            {tool.custom === "editor" ? <PdfEditor /> : <ToolRunner tool={tool} />}
          </FadeUp>

          <FadeUp delay={0.1} className={tool.custom ? "" : "lg:sticky lg:top-32"}>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
              How it works
            </p>
            <ol className={tool.custom ? "mt-8 md:grid md:grid-cols-3 md:gap-8" : "mt-8"}>
              {tool.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-5 border-t border-line py-6 last:border-b"
                >
                  <span className="text-sm tabular-nums text-accent">
                    0{i + 1}
                  </span>
                  <span className="leading-relaxed text-muted">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-sm leading-relaxed text-muted">
              This tool runs entirely on your device. Your file is never sent to
              a server — disconnect from the internet and it still works.
            </p>
          </FadeUp>
        </div>
      </section>

      <Faq items={tool.faqs} title="Questions people ask" />

      {/* --------------------------------------------------------- related */}
      <section className="shell pb-8">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
          Next
        </p>
        <div className="border-t border-line">
          {related.map((t, i) => (
            <FadeUp key={t.slug} delay={i * 0.05}>
              <TransitionLink
                href={`/${t.slug}`}
                data-cursor="hover"
                data-cursor-text="Open"
                className="group flex items-baseline gap-6 border-b border-line py-6"
              >
                <span className="display text-2xl transition-colors group-hover:text-accent md:text-4xl">
                  {t.name}
                </span>
                <span className="hidden flex-1 text-sm text-muted md:block">
                  {t.tagline}
                </span>
                <span
                  aria-hidden
                  className="ml-auto text-xl text-muted transition-all duration-500 group-hover:translate-x-1 group-hover:text-accent md:ml-0"
                >
                  &rarr;
                </span>
              </TransitionLink>
            </FadeUp>
          ))}
        </div>
      </section>
    </>
  );
}
