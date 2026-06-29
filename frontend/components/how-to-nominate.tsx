import Link from "next/link";
import { HOW_TO_NOMINATE } from "@/lib/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function HowToNominate() {
  return (
    <section className="relative overflow-hidden border-y border-line bg-bg-raised/40">
      <div className="gold-vignette absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8">
        <SectionHeading
          eyebrow="Channels of Nomination"
          title="How to nominate"
          subtitle="The power is in your hands. Recognise excellence by nominating your most deserving individuals and organisations."
        />

        <Reveal stagger className="mt-16 grid gap-5 md:grid-cols-4">
          {HOW_TO_NOMINATE.map((s) => (
            <article key={s.step} className="relative flex flex-col gap-4">
              <span className="font-display text-5xl font-bold text-gold/30">
                {s.step}
              </span>
              <h3 className="font-serif text-xl text-ink">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </article>
          ))}
        </Reveal>

        <Reveal className="mt-14 flex justify-center">
          <Link
            href="/nominate"
            className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright px-9 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-transform hover:scale-[1.03]"
          >
            Open the Nomination Portal
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
