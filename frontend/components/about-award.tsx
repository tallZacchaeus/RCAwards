import { EVENT } from "@/lib/site";
import { Reveal } from "./reveal";
import { Lottie } from "./lottie";

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

        {/* Visual column — orbit rings */}
        <Reveal className="relative flex items-center justify-center py-8">
          <div className="relative flex h-[360px] w-[360px] items-center justify-center overflow-hidden sm:h-[420px] sm:w-[420px] sm:overflow-visible">
            {/* Orbit ring 1 — 95% of container */}
            <div
              aria-hidden="true"
              className="absolute rounded-full border border-dashed border-gold/12"
              style={{ inset: "2.5%", animation: "orbitSpin 30s linear infinite" }}
            />
            {/* Orbit ring 2 — 72% of container */}
            <div
              aria-hidden="true"
              className="absolute rounded-full border border-dashed border-gold/20"
              style={{ inset: "14%", animation: "orbitSpinReverse 20s linear infinite" }}
            />
            {/* Orbit ring 3 — 52% of container */}
            <div
              aria-hidden="true"
              className="absolute rounded-full border border-gold/15"
              style={{ inset: "24%", animation: "orbitSpin 14s linear infinite" }}
            />

            {/* Orbit dot on ring 1 */}
            <div
              aria-hidden="true"
              className="absolute"
              style={{ inset: "2.5%", animation: "orbitSpin 30s linear infinite" }}
            >
              <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_12px_3px_rgba(201,162,75,0.5)]" />
            </div>

            {/* Orbit dot on ring 2 */}
            <div
              aria-hidden="true"
              className="absolute"
              style={{ inset: "14%", animation: "orbitSpinReverse 20s linear infinite" }}
            >
              <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-hi shadow-[0_0_8px_2px_rgba(248,231,161,0.5)]" />
            </div>

            {/* Centre card */}
            <div className="relative z-10 flex flex-col items-center justify-center rounded-3xl border border-gold/30 bg-gradient-to-b from-bg-elevated to-bg p-8 text-center shadow-[0_0_60px_-20px_rgba(201,162,75,0.3)]"
              style={{ width: "180px", height: "180px" }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "radial-gradient(50% 50% at 50% 40%, rgba(201,162,75,0.18), transparent)",
                }}
                aria-hidden="true"
              />
              <Lottie src="/lottie/star.json" className="relative h-16 w-16" />
              <span className="relative mt-2 font-display text-[10px] uppercase tracking-[0.3em] text-ink">
                {EVENT.edition}
              </span>
              <span className="relative mt-1 font-accent text-sm italic text-gold-hi">
                {EVENT.tagline.split(".")[0]}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
