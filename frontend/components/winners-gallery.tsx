import { Reveal } from "./reveal";

const PAST_WINNERS = [
  { name: "RCCG Youth Office", year: "2025", category: "Organisation of the Year", image: "/brand/winners/winner1.jpg" },
  { name: "Dr. Adesuwa Rhodes", year: "2025", category: "Inspirational Leader", image: "/brand/winners/winner2.jpg" },
  { name: "David Adebayo", year: "2025", category: "Business Owner of the Year", image: "/brand/winners/winner3.jpg" },
  { name: "Tobi Amusan", year: "2025", category: "Under-30 Impact", image: "/brand/winners/winner4.jpg" },
  { name: "The City Breed Concert", year: "2025", category: "Event of the Year", image: "/brand/winners/winner5.jpg" },
  { name: "Greenfield Foundations", year: "2025", category: "CSR Organisation", image: "/brand/winners/winner6.jpg" },
];

export function WinnersGallery() {
  return (
    <section id="winners" className="surface-dark">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-4">
            <span className="eyebrow text-gold">Past Champions</span>
            <h2 className="display text-[clamp(2.5rem,6vw,5rem)] text-ink">
              the winners&apos; circle
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            The pioneers who set the standard. Relive the previous editions and the
            people who made Redemption City proud.
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {PAST_WINNERS.map((w, i) => (
            <figure key={i} className="group flex flex-col gap-4">
              <div className="relative aspect-[4/5] overflow-hidden border border-line bg-bg-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.image}
                  alt={w.name}
                  className="h-full w-full object-cover grayscale-[0.15] transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 font-sans text-xs tabular-nums text-ink/70">
                  {String(i + 1).padStart(2, "0")} / {w.year}
                </span>
              </div>
              <figcaption className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <span className="font-serif text-lg text-ink">{w.name}</span>
                <span className="shrink-0 text-right text-xs uppercase tracking-wider text-ink-muted">
                  {w.category}
                </span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
