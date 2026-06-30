import { BREED } from "@/lib/site";
import { Reveal } from "./reveal";

export function BreedPillars() {
  return (
    <section id="about" className="surface-dark">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow text-gold">About City Breed</span>
          <h2 className="display text-[clamp(2.5rem,6vw,5rem)] text-ink">who we are</h2>
          <p className="max-w-xl text-base leading-relaxed text-ink-muted">
            Five pillars define our identity, drive our mission, and shape the
            destiny of Redemption City — <span className="text-ink">B.R.E.E.D.</span>
          </p>
        </Reveal>

        <Reveal className="mt-14">
          <ul>
            {BREED.map((pillar, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] items-start gap-6 border-t border-line py-8 sm:gap-12"
              >
                <span className="display w-[1.1em] leading-none text-gold text-[clamp(3rem,9vw,7rem)]">
                  {pillar.letter}
                </span>
                <div className="flex flex-col gap-2 pt-1 sm:pt-3">
                  <h3 className="font-serif text-2xl text-ink sm:text-3xl">{pillar.title}</h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
                    {pillar.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
