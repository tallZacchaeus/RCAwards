import { OBJECTIVES } from "@/lib/site";
import { Reveal } from "./reveal";

export function Objectives() {
  return (
    <section id="objectives" className="surface-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow text-gold-deep">Our Objectives</span>
          <h2 className="display max-w-2xl text-[clamp(2.5rem,6vw,5rem)] text-graphite">
            what we aim
            <br />
            to achieve
          </h2>
        </Reveal>

        <Reveal className="mt-14 grid gap-x-12 sm:grid-cols-2">
          {OBJECTIVES.map((obj, i) => (
            <article
              key={i}
              className="flex flex-col gap-3 border-t border-rule py-8"
            >
              <span className="font-sans text-sm tabular-nums text-slate">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="display text-[clamp(1.75rem,3vw,2.5rem)] text-graphite">
                {obj.title.toLowerCase()}
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-slate">{obj.body}</p>
            </article>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
