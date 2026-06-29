import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

// Placeholder past-winner highlights until real photography is supplied.
const PAST_WINNERS = [
  { name: "Organisation of the Year", year: "2025" },
  { name: "Inspirational Leader", year: "2025" },
  { name: "Business Owner of the Year", year: "2025" },
  { name: "Under-30 Impact", year: "2025" },
  { name: "Event of the Year", year: "2025" },
  { name: "CSR Organisation", year: "2025" },
];

export function WinnersGallery() {
  return (
    <section id="winners" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <SectionHeading
        eyebrow="Our Gallery"
        title="Meet the champions"
        subtitle="Relive the magic of previous editions and celebrate the pioneers who set the standard for excellence in Redemption City."
      />

      <Reveal stagger className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PAST_WINNERS.map((w, i) => (
          <article
            key={i}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-bg-elevated to-bg-raised"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 gold-vignette" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-6xl text-gold/15 transition-all duration-500 group-hover:scale-110 group-hover:text-gold/25">
              ★
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-bg to-transparent p-6">
              <span className="text-xs uppercase tracking-[0.3em] text-gold">
                {w.year} Winner
              </span>
              <span className="font-serif text-xl text-ink">{w.name}</span>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
