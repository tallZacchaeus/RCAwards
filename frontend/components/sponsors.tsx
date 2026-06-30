import { Reveal } from "./reveal";

const PARTNERS = ["City Breed", "RCCG", "Redemption City", "SATGO", "Youth Province"];

export function Sponsors() {
  return (
    <section id="sponsors" className="surface-dark border-y border-line">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <Reveal className="flex flex-col gap-8">
          <span className="eyebrow text-center text-ink-muted">In partnership with</span>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-16">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="font-serif text-lg text-ink/70 transition-colors hover:text-gold sm:text-xl"
              >
                {p}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
