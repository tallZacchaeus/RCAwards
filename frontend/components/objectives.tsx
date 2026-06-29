import { OBJECTIVES } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function Objectives() {
  return (
    <section id="objectives" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <SectionHeading
        eyebrow="Our Objectives"
        title="What we aim to achieve"
        subtitle="Four pillars that drive every edition of the Redemption City Award of Excellence."
      />

      <Reveal stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {OBJECTIVES.map((obj, i) => (
          <article
            key={i}
            className="relative flex flex-col gap-3 rounded-2xl border border-line bg-bg-raised/60 p-7 transition-all duration-500 hover:border-gold/40"
          >
            <span className="font-display text-sm text-gold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="hairline w-12" />
            <h3 className="font-serif text-2xl text-ink">{obj.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{obj.body}</p>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
