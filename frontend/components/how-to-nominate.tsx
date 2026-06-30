import Link from "next/link";
import { HOW_TO_NOMINATE } from "@/lib/site";
import { Reveal } from "./reveal";

export function HowToNominate() {
  return (
    <section className="surface-dark border-y border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-4">
            <span className="eyebrow text-gold">Channels of Nomination</span>
            <h2 className="display text-[clamp(2.5rem,6vw,5rem)] text-ink">how to nominate</h2>
          </div>
          <Link
            href="/nominate"
            className="shrink-0 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-bg transition-colors hover:bg-gold-bright"
          >
            Open the portal
          </Link>
        </Reveal>

        <Reveal className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_TO_NOMINATE.map((s) => (
            <article key={s.step} className="flex flex-col gap-3 border-t border-line pt-6">
              <span className="display text-[clamp(2.5rem,5vw,4rem)] leading-none text-gold">
                {s.step}
              </span>
              <h3 className="font-serif text-xl text-ink">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
