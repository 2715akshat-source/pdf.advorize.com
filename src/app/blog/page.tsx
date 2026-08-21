import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import TransitionLink from "@/components/TransitionLink";
import { FadeUp, Reveal } from "@/components/Reveal";
import { posts } from "@/content/posts";
import { absolute, buildMetadata, BRAND } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";

export const metadata: Metadata = buildMetadata({
  path: "/blog",
  title: "PDF Guides — How to Merge, Split, Compress and Edit",
  description:
    "Written guides to the PDF jobs people actually have: why scans are enormous, what compression trades away, how to sign a document, and what a watermark does not do.",
  keywords: [
    "pdf guides",
    "how to work with pdfs",
    "pdf tips",
    "compress pdf guide",
  ],
});

export default function BlogIndex() {
  return (
    <>
      <JsonLd
        data={graph([
          {
            "@type": "Blog",
            "@id": `${absolute("/blog")}#blog`,
            name: `${BRAND} — Guides`,
            url: absolute("/blog"),
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absolute(`/blog/${p.slug}`),
              datePublished: p.date,
            })),
          },
          breadcrumbSchema([
            { name: "PDF Tools", path: "/" },
            { name: "Guides", path: "/blog" },
          ]),
        ])}
      />

      <section className="shell pt-32 pb-8 md:pt-36">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <TransitionLink href="/" data-cursor="hover" className="underline-grow">
            PDF Tools
          </TransitionLink>
          <span aria-hidden className="px-2">/</span>
          <span className="text-fg">Guides</span>
        </nav>

        <h1 className="display text-[11vw] leading-[0.95] md:text-[5vw]">
          <Reveal immediate>Guides</Reveal>
        </h1>
        <p className="mt-10 max-w-[58ch] text-lg leading-relaxed text-muted">
          One guide per tool, written by the people who built it. Why a scan is
          forty megabytes, what compression quietly takes away, why your
          rotation keeps disappearing, and which jobs a PDF tool genuinely
          cannot do.
        </p>
      </section>

      <section className="shell pb-8">
        <div className="border-t border-line">
          {posts.map((post, i) => (
            <FadeUp key={post.slug} delay={Math.min(i, 6) * 0.04}>
              <TransitionLink
                href={`/blog/${post.slug}`}
                data-cursor="hover"
                data-cursor-text="Read"
                className="group flex flex-col gap-3 border-b border-line py-8 md:flex-row md:items-baseline md:gap-10"
              >
                <span className="w-24 shrink-0 text-sm text-muted tabular-nums">
                  {post.minutes} min
                </span>
                <span className="min-w-0 flex-1">
                  <span className="display block text-2xl transition-colors duration-500 group-hover:text-accent md:text-3xl">
                    {post.h1}
                  </span>
                  <span className="mt-3 block max-w-[70ch] text-[15px] leading-relaxed text-muted">
                    {post.description}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-xl text-muted transition-all duration-500 group-hover:translate-x-1 group-hover:text-accent"
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
