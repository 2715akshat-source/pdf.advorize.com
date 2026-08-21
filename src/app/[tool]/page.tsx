import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ToolRunner from "@/components/ToolRunner";
import PdfEditor from "@/components/PdfEditor";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import Prose from "@/components/Prose";
import ToolGlyph from "@/components/ToolGlyph";
import TransitionLink from "@/components/TransitionLink";
import { FadeUp, Reveal } from "@/components/Reveal";
import { bySlug, tools, type Tool } from "@/lib/tools";
import { variantBySlug, variants, variantsForTool, traits } from "@/lib/variants";
import { postForTool } from "@/content/posts";
import { buildMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  howToSchema,
  toolSchema,
} from "@/lib/schema";

/**
 * Every single-segment page: the twenty-one tools, and the four intent pages
 * each of them has. They share this route because they share a shape — a
 * headline, an argument, and the working tool itself — and because a doorway
 * page that does not carry the tool is not worth publishing.
 */
export function generateStaticParams() {
  return [
    ...tools.map((t) => ({ tool: t.slug })),
    ...variants.map((v) => ({ tool: v.slug })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = bySlug(slug);
  if (tool) {
    return buildMetadata({
      path: `/${tool.slug}`,
      title: tool.title,
      description: tool.description,
      keywords: tool.keywords,
    });
  }
  const variant = variantBySlug(slug);
  if (!variant) return {};
  return buildMetadata({
    path: `/${variant.slug}`,
    title: variant.title,
    description: variant.description,
    keywords: variant.keywords,
  });
}

/** The tool itself — the editor has its own interface, everything else shares one. */
function Runner({ tool }: { tool: Tool }) {
  return tool.custom === "editor" ? <PdfEditor /> : <ToolRunner tool={tool} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool: slug } = await params;
  const tool = bySlug(slug);
  const variant = tool ? null : variantBySlug(slug);
  if (!tool && !variant) notFound();

  return tool ? <ToolPage tool={tool} /> : <VariantPage slug={slug} />;
}

/* ------------------------------------------------------------- tool page */

function ToolPage({ tool }: { tool: Tool }) {
  const related = tool.related
    .map(bySlug)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const post = postForTool(tool.slug);
  const intents = variantsForTool(tool.slug);

  return (
    <>
      <JsonLd
        data={graph([
          toolSchema(tool),
          howToSchema(tool),
          faqSchema(`/${tool.slug}`, tool.faqs),
          breadcrumbSchema([
            { name: "PDF Tools", path: "/" },
            { name: tool.name, path: `/${tool.slug}` },
          ]),
        ])}
      />

      <section className="shell pt-32 pb-2 md:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <TransitionLink href="/" data-cursor="hover" className="underline-grow">
            PDF Tools
          </TransitionLink>
          <span aria-hidden className="px-2">/</span>
          <span className="text-fg">{tool.category}</span>
        </nav>

        {/* One line from md up — the headlines are written short enough for
            it, and a two-line title over a one-line intro reads as a stack of
            fragments rather than a masthead. */}
        <h1 className="display text-[9vw] leading-[1] md:text-[3.9vw] md:whitespace-nowrap">
          {tool.h1.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block pr-[0.22em]">
              <Reveal immediate delay={0.05 + i * 0.05}>
                {word}
              </Reveal>
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

      <section className="shell pt-10 pb-8 md:pt-12">
        <div
          className={
            tool.custom
              ? "grid gap-12"
              : "grid gap-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-16"
          }
        >
          <FadeUp>
            <Runner tool={tool} />
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
                  <span className="text-sm tabular-nums text-accent">0{i + 1}</span>
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

      {/* the written guide for this tool */}
      {post && (
        <section className="shell pb-16">
          <FadeUp>
            <TransitionLink
              href={`/blog/${post.slug}`}
              data-cursor="hover"
              data-cursor-text="Read"
              className="group flex flex-col gap-6 rounded-[28px] border border-line p-8 md:flex-row md:items-center md:justify-between md:p-10"
            >
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
                  The guide · {post.minutes} min
                </p>
                <p className="display mt-3 max-w-[24ch] text-2xl transition-colors duration-500 group-hover:text-accent md:text-3xl">
                  {post.h1}
                </p>
              </div>
              <span
                aria-hidden
                className="text-2xl text-muted transition-all duration-500 group-hover:translate-x-1 group-hover:text-accent"
              >
                &rarr;
              </span>
            </TransitionLink>
          </FadeUp>
        </section>
      )}

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

        {/* the questions people arrive with, answered on their own pages */}
        <div className="mt-10 flex flex-wrap gap-2">
          {intents.map((v) => (
            <TransitionLink
              key={v.slug}
              href={`/${v.slug}`}
              data-cursor="hover"
              className="rounded-full border border-line px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {v.h1}
            </TransitionLink>
          ))}
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------- intent page */

function VariantPage({ slug }: { slug: string }) {
  const variant = variantBySlug(slug)!;
  const { tool } = variant;
  const t = traits(tool);
  const post = postForTool(tool.slug);
  const siblings = variantsForTool(tool.slug).filter((v) => v.slug !== slug);

  const facts: [string, string][] = [
    ["Is anything uploaded?", "No — the work happens in your browser"],
    ["Account needed?", "No"],
    ["Daily limit?", "None"],
    ["Watermark on the output?", "None"],
    ["What you get back", t.output],
    [
      "Text layer",
      t.keepsText ? "Preserved — the result is still searchable" : "Not preserved — pages are re-rendered",
    ],
    ["Works offline?", "Yes, once the page has loaded"],
    ["Price", "Free"],
  ];

  return (
    <>
      <JsonLd
        data={graph([
          toolSchema(tool),
          faqSchema(`/${variant.slug}`, variant.faqs),
          breadcrumbSchema([
            { name: "PDF Tools", path: "/" },
            { name: tool.name, path: `/${tool.slug}` },
            { name: variant.h1, path: `/${variant.slug}` },
          ]),
        ])}
      />

      <section className="shell pt-32 pb-2 md:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <TransitionLink href="/" data-cursor="hover" className="underline-grow">
            PDF Tools
          </TransitionLink>
          <span aria-hidden className="px-2">/</span>
          <TransitionLink
            href={`/${tool.slug}`}
            data-cursor="hover"
            className="underline-grow"
          >
            {tool.name}
          </TransitionLink>
        </nav>

        <h1 className="display max-w-[20ch] text-[9vw] leading-[1] md:text-[3.6vw]">
          {variant.h1.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block pr-[0.22em]">
              <Reveal immediate delay={0.04 + i * 0.04}>
                {word}
              </Reveal>
            </span>
          ))}
        </h1>

        <FadeUp delay={0.3}>
          <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
            <p className="max-w-[56ch] text-lg leading-relaxed text-muted">
              {variant.lead}
            </p>
            <ToolGlyph
              slug={tool.slug}
              className="w-52 shrink-0 text-fg md:w-[22vw] md:max-w-[380px]"
              play
            />
          </div>
        </FadeUp>
      </section>

      {/* the working tool, not a link to it */}
      <section className="shell pt-10 pb-8 md:pt-12">
        <FadeUp>
          <Runner tool={tool} />
        </FadeUp>
      </section>

      <section className="shell py-12">
        <Prose sections={variant.sections} />
      </section>

      {/* the facts, in the form people are actually comparing */}
      <section className="shell py-8">
        <FadeUp>
          <div className="mx-auto max-w-[68ch]">
            <h2 className="display text-[7vw] leading-[1.05] md:text-[2.2vw]">
              {tool.name} at a glance
            </h2>
            <dl className="mt-8 border-t border-line">
              {facts.map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col gap-1 border-b border-line py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                >
                  <dt className="text-[15px] text-muted">{k}</dt>
                  <dd className="text-[15px] sm:text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeUp>
      </section>

      <Faq items={variant.faqs} title="Questions people ask" />

      <section className="shell pb-8">
        <div className="mx-auto max-w-[68ch]">
          <p className="mb-5 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            Keep reading
          </p>
          <div className="flex flex-wrap gap-2">
            <TransitionLink
              href={`/${tool.slug}`}
              data-cursor="hover"
              className="rounded-full border border-line px-5 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
            >
              {tool.name}
            </TransitionLink>
            {post && (
              <TransitionLink
                href={`/blog/${post.slug}`}
                data-cursor="hover"
                className="rounded-full border border-line px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Guide: {post.h1}
              </TransitionLink>
            )}
            {siblings.map((v) => (
              <TransitionLink
                key={v.slug}
                href={`/${v.slug}`}
                data-cursor="hover"
                className="rounded-full border border-line px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {v.h1}
              </TransitionLink>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
