import { Reveal } from "./reveal";

export function LetterDirector() {
  return (
    <section className="surface-dark border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* Portrait */}
          <Reveal className="lg:col-span-5">
            <figure className="flex flex-col gap-4">
              <div className="overflow-hidden border border-line bg-bg-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/winners/director.jpg"
                  alt="Pastor Leke Adeboye, Executive Host"
                  className="h-[460px] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                />
              </div>
              <figcaption className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="font-serif text-lg text-ink">Pastor Leke Adeboye</span>
                <span className="text-xs uppercase tracking-wider text-ink-muted">Executive Host</span>
              </figcaption>
            </figure>
          </Reveal>

          {/* Letter */}
          <div className="flex flex-col gap-8 lg:col-span-7">
            <Reveal className="flex flex-col gap-4">
              <span className="eyebrow text-gold">From the Host</span>
              <h2 className="display text-[clamp(2.25rem,5vw,4rem)] text-ink">
                a culture of service
                <br />
                &amp; distinction
              </h2>
            </Reveal>

            <Reveal className="flex max-w-2xl flex-col gap-5 text-base leading-relaxed text-ink-muted">
              <p>
                Welcome to the 4th edition of the Redemption City Awards of Excellence.
                As we gather to celebrate outstanding achievement within our beloved
                city, we reflect on the values of dedication, righteousness, and pure
                excellence that form the foundation of our community.
              </p>
              <p>
                Excellence is not an accident — it is the result of high intention,
                sincere effort, intelligent direction, and skillful execution. Our
                pillars of building, repairing, and executing are not corporate
                targets; they are a calling to elevate Redemption City into a global
                centre of progress and service.
              </p>
              <p>
                Through this platform we honour the builders who labour in silence, the
                business owners driving local growth, the young changemakers showing
                unprecedented impact, and the departments maintaining our welfare day
                in and day out. Thank you for striving together, and for lifting the
                standard of distinction in everything we do.
              </p>
            </Reveal>

            <Reveal className="flex flex-col gap-1 border-t border-line pt-6">
              <span className="font-serif text-xl text-ink">Pastor Leke Adeboye</span>
              <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">
                Executive Host · RCA 2026
              </span>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
