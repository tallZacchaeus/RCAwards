import { BREED } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function BreedPillars() {
  return (
    <section id="about" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <SectionHeading
        eyebrow="About City Breed"
        title={
          <>
            Who are we? <span className="text-metallic">B.R.E.E.D.</span>
          </>
        }
        subtitle="Five pillars that define our identity, drive our mission, and shape the destiny of Redemption City."
      />

      <Reveal
        stagger
        className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        {BREED.map((pillar, i) => (
          <article
            key={i}
            className="group relative flex flex-col gap-4 rounded-2xl border border-line bg-bg-raised/60 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:bg-bg-elevated"
          >
            <span className="font-display text-5xl font-extrabold text-metallic">
              {pillar.letter}
            </span>
            <h3 className="font-serif text-xl text-ink">{pillar.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{pillar.body}</p>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
