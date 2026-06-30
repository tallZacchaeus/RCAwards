import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Lottie } from "./lottie";

// Placeholder past-winner highlights until real photography is supplied.
const PAST_WINNERS = [
  { name: "Organisation of the Year", year: "2025", category: "City" },
  { name: "Inspirational Leader",     year: "2025", category: "City" },
  { name: "Business Owner of the Year", year: "2025", category: "City" },
  { name: "Under-30 Impact",          year: "2025", category: "Youth" },
  { name: "Event of the Year",        year: "2025", category: "City" },
  { name: "CSR Organisation",         year: "2025", category: "Regional" },
];

// Map index to a subtle diagonal gradient for variety
const CARD_GRADIENTS = [
  "from-[#1a0f04] to-[#0d0a07]",
  "from-[#150e05] to-[#0a0807]",
  "from-[#1c1108] to-[#0f0b06]",
  "from-[#190d03] to-[#0b0905]",
  "from-[#1a1004] to-[#0d0b07]",
  "from-[#160f05] to-[#0a0807]",
];

export function WinnersGallery() {
  return (
    <section id="winners" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <SectionHeading
        eyebrow="Our Gallery"
        title="Meet the champions"
        subtitle="Relive the magic of previous editions and celebrate the pioneers who set the standard for excellence in Redemption City."
      />

      <Reveal stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PAST_WINNERS.map((w, i) => (
          <article
            key={i}
            className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_16px_48px_-12px_rgba(201,162,75,0.25)]`}
          >
            {/* Background star — animates on hover */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-25 transition-opacity duration-700 group-hover:opacity-50"
              aria-hidden="true"
            >
              <Lottie src="/lottie/star.json" playOnHover className="h-40 w-40" />
            </div>

            {/* Gold vignette overlay on hover */}
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(60% 50% at 50% 100%, rgba(201,162,75,0.12), transparent)",
              }}
              aria-hidden="true"
            />

            {/* Animated border sweep on hover */}
            <div
              className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold to-transparent transition-transform duration-700 group-hover:scale-x-100"
              aria-hidden="true"
            />

            {/* Category badge */}
            <div className="absolute left-4 top-4">
              <span className="rounded-full border border-gold/30 bg-bg/50 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold backdrop-blur-sm">
                {w.category}
              </span>
            </div>

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-6"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,8,7,0.95) 0%, rgba(10,8,7,0.6) 60%, transparent 100%)",
              }}
            >
              <span className="text-xs uppercase tracking-[0.3em] text-gold">
                {w.year} Winner
              </span>
              <span className="font-serif text-xl text-ink">{w.name}</span>
              <span className="mt-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.25em] text-gold-hi opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                View winner ›
              </span>
            </div>
          </article>
        ))}
      </Reveal>

      {/* CTA to view all */}
      <Reveal className="mt-12 flex justify-center">
        <button
          className="rounded-full border border-gold/40 px-8 py-3 text-sm font-semibold uppercase tracking-wider text-gold-hi transition-all duration-300 hover:bg-gold/10 hover:border-gold/70 hover:shadow-[0_0_20px_-8px] hover:shadow-gold/40"
          type="button"
        >
          View All Previous Winners
        </button>
      </Reveal>
    </section>
  );
}
