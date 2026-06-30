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
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-bg-raised/60 p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_8px_32px_-8px_rgba(201,162,75,0.2)]"
          >
            {/* Number + line */}
            <div className="flex items-center gap-3">
              <span className="font-display text-sm text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="hairline flex-1" />
            </div>

            <h3 className="font-serif text-2xl text-ink transition-colors duration-300 group-hover:text-gold-hi">
              {obj.title}
            </h3>
            <p className="text-sm leading-relaxed text-ink-muted">{obj.body}</p>

            {/* Corner accent */}
            <div
              className="pointer-events-none absolute right-4 bottom-4 font-display text-4xl font-extrabold text-gold/6 transition-all duration-500 group-hover:text-gold/12 group-hover:scale-110 select-none"
              aria-hidden="true"
            >
              {String(i + 1)}
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
