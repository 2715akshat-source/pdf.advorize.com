import { categories, tools } from "@/lib/tools";
import { PARENT_URL } from "@/lib/seo";
import { Reveal } from "./Reveal";
import Magnetic from "./Magnetic";
import TransitionLink from "./TransitionLink";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <footer className="shell pt-24 pb-10 md:pt-36">
      {/* The same oversized closing CTA the main site ends on. */}
      <h2 className="display text-[13vw] leading-[0.95] md:text-[8vw]">
        <Reveal>Need one built?</Reveal>
      </h2>

      <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <Magnetic className="inline-block">
          <a
            href="mailto:sales@advorize.com"
            data-cursor="hover"
            className="display inline-block border-b border-line pb-2 text-2xl transition-colors hover:border-accent hover:text-accent md:text-4xl"
          >
            sales@advorize.com
          </a>
        </Magnetic>

        <Magnetic>
          <a
            href={`${PARENT_URL}/contact`}
            data-cursor="hover"
            className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-accent text-center text-sm font-medium text-white md:h-40 md:w-40"
          >
            Start a
            <br />
            project
          </a>
        </Magnetic>
      </div>

      {/* Every tool, one click from every page — the internal linking that
          makes twenty near-identical pages worth crawling. */}
      <div className="mt-24 grid gap-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => (
          <div key={category}>
            <div className="font-medium">{category}</div>
            <ul className="mt-2 space-y-1">
              {tools
                .filter((t) => t.category === category)
                .map((t) => (
                  <li key={t.slug}>
                    <TransitionLink
                      href={`/${t.slug}`}
                      data-cursor="hover"
                      className="text-sm text-muted transition-colors hover:text-fg"
                    >
                      {t.name}
                    </TransitionLink>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
        <Wordmark className="h-5 text-muted" />
        <p className="max-w-md text-sm text-muted">
          Every tool here runs in your browser. No file is uploaded, and none
          ever will be.
        </p>
        <div className="flex gap-6 text-sm text-muted">
          <a href={PARENT_URL} data-cursor="hover" className="underline-grow">
            Advorize.com
          </a>
          <a
            href={`${PARENT_URL}/privacy`}
            data-cursor="hover"
            className="underline-grow"
          >
            Privacy
          </a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
