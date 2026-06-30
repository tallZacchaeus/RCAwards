import Link from "next/link";
import { HOW_TO_NOMINATE } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function HowToNominate() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-bg-raised/40">
      <div className="gold-vignette absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <SectionHeading
          eyebrow="Channels of Nomination"
          title="How to nominate"
          subtitle="The power is in your hands. Recognise excellence by nominating your most deserving individuals and organisations."
        />

        {/* Steps with connecting line on desktop */}
        <Reveal stagger className="relative mt-16 grid gap-8 md:grid-cols-4">
          {/* Connector line */}
          <div
            className="absolute hidden md:block top-8 left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--color-gold)/30 20%, var(--color-gold)/30 80%, transparent)",
            }}
            aria-hidden="true"
          />

          {HOW_TO_NOMINATE.map((s) => (
            <article key={s.step} className="relative flex flex-col gap-4">
              {/* Step number circle */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-bg-raised transition-all duration-300 group-hover:border-gold/60 relative z-10">
                <span className="font-display text-2xl font-bold text-metallic">
                  {s.step}
                </span>
              </div>

              <h3 className="font-serif text-xl text-ink">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </article>
          ))}
        </Reveal>

        <Reveal className="mt-14 flex justify-center">
          <Link
            href="/nominate"
            className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright px-9 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_40px_-8px_rgba(201,162,75,0.5)] btn-shimmer"
          >
            Open the Nomination Portal
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
