import { JURY } from "@/lib/site";
import { Reveal } from "./reveal";

export function MeetJury() {
  return (
    <section id="jury" className="surface-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-4">
            <span className="eyebrow text-gold-deep">The Jury</span>
            <h2 className="display text-[clamp(2.5rem,6vw,5rem)] text-graphite">
              meet the jury
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate">
            An independent committee of leaders and elders scores every shortlisted
            nominee against each category&apos;s criteria — the panel behind every
            winner.
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {JURY.map((j, i) => (
            <div
              key={i}
              className="flex items-baseline gap-5 border-t border-rule py-5"
            >
              <span className="w-8 shrink-0 font-sans text-sm tabular-nums text-slate">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col">
                <span className="font-serif text-xl text-graphite sm:text-2xl">
                  {j.name}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate">
                  {j.role}
                </span>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
