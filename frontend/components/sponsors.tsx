import { Reveal } from "./reveal";

const SPONSORS = ["City Breed", "RCCG", "Redemption City", "SATGO", "Youth Province"];

export function Sponsors() {
  return (
    <section id="sponsors" className="border-y border-line bg-bg-raised/30">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <Reveal className="flex flex-col items-center gap-10">
          <span className="font-display text-xs uppercase tracking-[0.42em] text-gold">
            Our Partners
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {SPONSORS.map((s) => (
              <span
                key={s}
                className="font-display text-lg uppercase tracking-[0.2em] text-ink-muted/70 transition-colors hover:text-gold"
              >
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
