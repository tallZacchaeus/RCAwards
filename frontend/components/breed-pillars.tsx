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
            Who are we?{" "}
            <span className="text-metallic">B.R.E.E.D.</span>
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
            className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-bg-raised/60 p-6 transition-all duration-500 hover:-translate-y-2 hover:border-gold/50 hover:bg-bg-elevated hover:shadow-[0_0_40px_-12px_rgba(201,162,75,0.35)]"
          >
            {/* Gold glow behind letter on hover */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-24 w-24 rounded-br-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, rgba(201,162,75,0.15), transparent 70%)",
              }}
              aria-hidden="true"
            />

            {/* Bottom sweep */}
            <div
              className="absolute bottom-0 inset-x-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold via-gold-bright to-transparent transition-transform duration-500 group-hover:scale-x-100"
              aria-hidden="true"
            />

            <div className="flex items-start justify-between">
              <span className="font-display text-5xl font-extrabold text-metallic">
                {pillar.letter}
              </span>
            </div>

            <h3 className="font-serif text-xl text-ink transition-colors duration-300 group-hover:text-gold-hi">
              {pillar.title}
            </h3>
            <p className="text-sm leading-relaxed text-ink-muted">{pillar.body}</p>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
