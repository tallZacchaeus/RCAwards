import { EVENT } from "@/lib/site";
import { Reveal } from "./reveal";

export function AboutAward() {
  return (
    <section id="award" className="relative overflow-hidden border-y border-line bg-bg-raised/40">
      <div className="gold-vignette absolute inset-0" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-28 sm:px-8 lg:grid-cols-2 lg:items-center">
        <Reveal className="flex flex-col gap-6">
          <span className="font-display text-xs uppercase tracking-[0.42em] text-gold">
            About the Award
          </span>
          <h2 className="font-serif text-4xl leading-[1.05] text-ink sm:text-5xl">
            A celebration of greatness
          </h2>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
            <p>
              The Redemption City Award of Excellence celebrates and promotes a
              culture of excellence in Redemption City. Powered by City Breed, it
              holds that excellence is crucial in shaping our daily lives and
              elevating the city to a world-class metropolis.
            </p>
            <p>
              The award night recognises and honours individuals, businesses, and
              organisations that have demonstrated outstanding performance — as
              acknowledged by the people of Redemption City — instilling pride and
              fostering an environment of healthy competition.
            </p>
            <p>
              By recognising these achievements, the event celebrates individual
              success and inspires others to strive for greatness, driving the
              city to unprecedented heights.
            </p>
          </div>
        </Reveal>

        <Reveal className="relative">
          <div className="relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-b from-bg-elevated to-bg p-10 text-center">
            <div className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
            <span className="relative font-display text-7xl text-metallic">★</span>
            <span className="relative mt-6 font-display text-sm uppercase tracking-[0.3em] text-ink">
              City Breed
            </span>
            <span className="relative mt-2 font-serif text-2xl text-gold-hi">
              {EVENT.edition}
            </span>
            <p className="relative mt-4 font-accent text-lg italic text-ink-muted">
              {EVENT.tagline}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
