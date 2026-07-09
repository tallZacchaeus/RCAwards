import { JURY } from "@/lib/site";
import { Reveal } from "./reveal";
import { CountUp } from "./count-up";

const STATS: { value: string; label: string; count?: number }[] = [
  { value: "20", label: "Categories", count: 20 },
  { value: String(JURY.length), label: "Jurors", count: JURY.length },
  { value: "4th", label: "Edition" },
  { value: "2026", label: "The Night" },
];

export function Stats() {
  return (
    <section className="surface-dark border-y border-line">
      <Reveal className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-5 py-16 sm:px-8 lg:grid-cols-4 lg:divide-x lg:divide-line">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 lg:items-center lg:px-6">
            <span className="display text-[clamp(3rem,7vw,5.5rem)] leading-none text-gold tabular-nums">
              {s.count !== undefined ? <CountUp to={s.count} /> : s.value}
            </span>
            <span className="eyebrow text-ink-muted">{s.label}</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
