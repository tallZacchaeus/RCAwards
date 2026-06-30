import { JURY } from "@/lib/site";
import { Reveal } from "./reveal";

function initials(name: string) {
  return name
    .replace(/^(Pastor|Dr\.|Sis\.|Mr\.|Mrs\.)\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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
            A committee of leaders and elders scores every shortlisted nominee
            against each category&apos;s criteria — the independent panel behind
            every winner.
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {JURY.map((j, i) => (
            <figure key={i} className="group flex flex-col gap-4">
              <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden border border-rule bg-card">
                <span className="display text-5xl text-slate/40 transition-colors duration-500 group-hover:text-gold-deep">
                  {initials(j.name)}
                </span>
                <span className="absolute left-3 top-3 font-sans text-xs tabular-nums text-slate">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <figcaption className="flex flex-col gap-0.5 border-t border-rule pt-3">
                <span className="font-serif text-lg text-graphite">{j.name}</span>
                <span className="text-xs uppercase tracking-wider text-slate">{j.role}</span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
