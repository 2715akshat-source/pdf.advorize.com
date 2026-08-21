import type { Section } from "@/content/types";
import { FadeUp } from "./Reveal";

/**
 * Body copy for the written pages. Two block types — a paragraph and a list —
 * because the value of these pages is in the sentences, and every extra
 * component is an invitation to write fewer of them.
 */
export default function Prose({ sections }: { sections: Section[] }) {
  return (
    <div className="mx-auto max-w-[68ch]">
      {sections.map((section, i) => (
        <FadeUp key={section.h} delay={Math.min(i, 4) * 0.05}>
          <section className="mt-16 first:mt-0">
            <h2 className="display text-[7vw] leading-[1.05] md:text-[2.2vw]">
              {section.h}
            </h2>
            {section.body.map((block, k) =>
              Array.isArray(block) ? (
                <ul key={k} className="mt-6 space-y-3">
                  {block.map((item) => (
                    <li key={item} className="flex gap-4 leading-relaxed text-muted">
                      <span aria-hidden className="mt-[0.6em] h-px w-4 shrink-0 bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={k} className="mt-6 text-[17px] leading-relaxed text-muted">
                  {block}
                </p>
              ),
            )}
          </section>
        </FadeUp>
      ))}
    </div>
  );
}
