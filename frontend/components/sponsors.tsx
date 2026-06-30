import { Reveal } from "./reveal";

const SPONSORS = [
  "City Breed",
  "RCCG",
  "Redemption City",
  "SATGO",
  "Youth Province",
  "City Breed",
  "RCCG",
  "Redemption City",
  "SATGO",
  "Youth Province",
];

export function Sponsors() {
  return (
    <section id="sponsors" className="border-y border-line bg-bg-raised/30 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <Reveal className="flex flex-col items-center gap-10">
          <span className="font-display text-xs uppercase tracking-[0.42em] text-gold">
            Our Partners
          </span>

          {/* Marquee — duplicated entries for seamless loop */}
          <div
            className="relative w-full overflow-hidden"
            aria-label="Partner organisations"
            role="list"
          >
            {/* Fade edges */}
            <div
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24"
              style={{
                background:
                  "linear-gradient(to right, var(--color-bg-raised), transparent)",
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24"
              style={{
                background:
                  "linear-gradient(to left, var(--color-bg-raised), transparent)",
              }}
              aria-hidden="true"
            />

            {/* Track — duplicated twice for seamless loop */}
            <div className="marquee-track" role="presentation">
              {[...SPONSORS, ...SPONSORS].map((s, i) => (
                <span
                  key={i}
                  role="listitem"
                  className="mx-10 font-display text-lg uppercase tracking-[0.2em] text-ink-muted/60 transition-colors hover:text-gold whitespace-nowrap"
                  style={{ cursor: "default" }}
                >
                  {s}
                  <span
                    className="mx-10 inline-block h-1 w-1 rounded-full bg-gold/30 align-middle"
                    aria-hidden="true"
                  />
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
