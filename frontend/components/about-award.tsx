import { Reveal } from "./reveal";
import { AnimatedTrophy } from "./animated-trophy";

export function AboutAward() {
  return (
    <section
      id="award"
      className="relative overflow-hidden border-y border-line bg-bg-raised/40"
    >
      <div className="gold-vignette absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-28 sm:px-8 lg:grid-cols-2 lg:items-center">
        {/* Text column */}
        <Reveal className="flex flex-col gap-6">
          <span className="font-display text-xs uppercase tracking-[0.42em] text-gold">
            About the Award
          </span>
          <h2 className="font-serif text-4xl leading-[1.05] text-ink sm:text-5xl">
            A celebration of{" "}
            <span className="text-metallic">greatness</span>
          </h2>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
            <p>
              The Redemption City Award of Excellence celebrates and promotes a
              culture of excellence in Redemption City. Powered by City Breed,
              it holds that excellence is crucial in shaping our daily lives and
              elevating the city to a world-class metropolis.
            </p>
            <p>
              The award night recognises and honours individuals, businesses, and
              organisations that have demonstrated outstanding performance — as
              acknowledged by the people of Redemption City — instilling pride
              and fostering an environment of healthy competition.
            </p>
            <p>
              By recognising these achievements, the event celebrates individual
              success and inspires others to strive for greatness, driving the
              city to unprecedented heights.
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-2 grid grid-cols-3 gap-4">
            {[
              { value: "4th", label: "Edition" },
              { value: "19+", label: "Categories" },
              { value: "2026", label: "Year" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 rounded-xl border border-line bg-bg-raised/60 p-4"
              >
                <span className="font-display text-2xl font-bold text-metallic">
                  {stat.value}
                </span>
                <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Visual column — the master-brand trophy, alive */}
        <Reveal className="relative flex items-center justify-center py-8">
          <AnimatedTrophy className="h-[clamp(420px,60vh,620px)] w-full" />
        </Reveal>
      </div>
    </section>
  );
}
