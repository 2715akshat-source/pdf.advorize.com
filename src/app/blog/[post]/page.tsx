import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Prose from "@/components/Prose";
import Faq from "@/components/Faq";
import ToolGlyph from "@/components/ToolGlyph";
import TransitionLink from "@/components/TransitionLink";
import Magnetic from "@/components/Magnetic";
import { FadeUp, Reveal } from "@/components/Reveal";
import { posts, postBySlug } from "@/content/posts";
import { bySlug } from "@/lib/tools";
import { absolute, buildMetadata, BRAND, PARENT_URL } from "@/lib/seo";
import { breadcrumbSchema, faqSchema, graph } from "@/lib/schema";

export function generateStaticParams() {
  return posts.map((p) => ({ post: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ post: string }>;
}): Promise<Metadata> {
  const { post: slug } = await params;
  const post = postBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.description,
    keywords: post.keywords,
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ post: string }>;
}) {
  const { post: slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();

  const tool = bySlug(post.tool);

  return (
    <>
      <JsonLd
        data={graph([
          {
            "@type": "BlogPosting",
            "@id": `${absolute(`/blog/${post.slug}`)}#post`,
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            dateModified: post.date,
            url: absolute(`/blog/${post.slug}`),
            inLanguage: "en-IN",
            author: { "@id": `${PARENT_URL}/#organization` },
            publisher: { "@id": `${PARENT_URL}/#organization` },
            mainEntityOfPage: absolute(`/blog/${post.slug}`),
            ...(tool && {
              about: { "@type": "Thing", name: tool.name },
            }),
          },
          faqSchema(`/blog/${post.slug}`, post.faqs),
          breadcrumbSchema([
            { name: "PDF Tools", path: "/" },
            { name: "Guides", path: "/blog" },
            { name: post.h1, path: `/blog/${post.slug}` },
          ]),
        ])}
      />

      <article>
        <header className="shell pt-32 pb-8 md:pt-36">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
            <TransitionLink href="/" data-cursor="hover" className="underline-grow">
              PDF Tools
            </TransitionLink>
            <span aria-hidden className="px-2">/</span>
            <TransitionLink href="/blog" data-cursor="hover" className="underline-grow">
              Guides
            </TransitionLink>
          </nav>

          <h1 className="display max-w-[20ch] text-[9vw] leading-[1] md:text-[4vw]">
            {post.h1.split(" ").map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block pr-[0.22em]">
                <Reveal immediate delay={0.04 + i * 0.03}>
                  {word}
                </Reveal>
              </span>
            ))}
          </h1>

          <FadeUp delay={0.3}>
            <div className="mt-10 grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
              <p className="max-w-[60ch] text-lg leading-relaxed text-muted">
                {post.lead}
              </p>
              {tool && (
                <ToolGlyph
                  slug={tool.slug}
                  className="w-52 shrink-0 text-fg md:w-[22vw] md:max-w-[360px]"
                  play
                />
              )}
            </div>
            <p className="mt-8 text-sm text-muted">
              {post.minutes} minute read · {BRAND}
            </p>
          </FadeUp>
        </header>

        <div className="shell py-12">
          <Prose sections={post.sections} />
        </div>

        {/* the tool the guide is about, one click away at the point it is
            most likely to be wanted */}
        {tool && (
          <section className="shell py-12">
            <FadeUp>
              <div className="mx-auto flex max-w-[68ch] flex-col gap-6 rounded-[28px] border border-line p-8 md:flex-row md:items-center md:justify-between md:p-10">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
                    The tool
                  </p>
                  <p className="display mt-3 text-2xl md:text-3xl">{tool.name}</p>
                  <p className="mt-2 max-w-[42ch] text-[15px] text-muted">
                    {tool.tagline}
                  </p>
                </div>
                <Magnetic strength={0.2}>
                  <TransitionLink
                    href={`/${tool.slug}`}
                    data-cursor="hover"
                    className="inline-flex h-12 shrink-0 items-center rounded-full bg-accent px-7 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Open it
                  </TransitionLink>
                </Magnetic>
              </div>
            </FadeUp>
          </section>
        )}

        <Faq items={post.faqs} title="Questions people ask" />
      </article>
    </>
  );
}
