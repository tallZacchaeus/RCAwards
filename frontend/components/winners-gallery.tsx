import { Reveal } from "./reveal";

// Real 2025 honourees on stage. We show the photographs without asserting names —
// swap in verified names/categories here once the roll of honour is confirmed.
const PAST_WINNERS = [
  { year: "2025", image: "/brand/winners/winner1-800.webp" },
  { year: "2025", image: "/brand/winners/winner2-800.webp" },
  { year: "2025", image: "/brand/winners/winner3-800.webp" },
  { year: "2025", image: "/brand/winners/winner4-800.webp" },
  { year: "2025", image: "/brand/winners/winner5-800.webp" },
  { year: "2025", image: "/brand/winners/winner6-800.webp" },
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
            The honourees who set the standard — celebrated on stage at the 2025
            edition of the Redemption City Awards of Excellence.
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {PAST_WINNERS.map((w, i) => (
            <figure key={i} className="group flex flex-col gap-4">
              <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border border-line bg-bg-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.image}
                  alt={`Honouree on stage at the ${w.year} Redemption City Awards`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover grayscale-[0.15] transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 font-sans text-xs tabular-nums text-ink/45">
                  {String(i + 1).padStart(2, "0")} / {w.year}
                </span>
              </div>
              <figcaption className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <span className="font-serif text-lg text-ink">Honoured at the {w.year} ceremony</span>
                <span className="shrink-0 text-right text-xs uppercase tracking-wider text-ink-muted">
                  Redemption City
                </span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
