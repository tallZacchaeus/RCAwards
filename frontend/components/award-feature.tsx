import Link from "next/link";
import { EVENT } from "@/lib/site";
import { Reveal } from "./reveal";
import { TrophyMedia } from "./trophy-media";

/* Light editorial section: a framed photo on the left, the spinning trophy on
   the right. */
export function AwardFeature() {
  return (
    <section id="award" className="surface-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
        {/* Framed photo (left) */}
        <Reveal>
          <figure className="flex flex-col gap-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-rule bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/photos/about.webp"
                srcSet="/brand/photos/about-600.webp 600w, /brand/photos/about.webp 1120w"
                sizes="(min-width: 1024px) 560px, 90vw"
                width={1120}
                height={1400}
                alt="A distinguished honouree at the 2025 Redemption City Awards of Excellence ceremony"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <span className="absolute left-4 top-4 eyebrow text-white/80 mix-blend-difference">
                Redemption City
              </span>
            </div>
            <figcaption className="flex items-center justify-between text-xs text-slate">
              <span>Scenes from the 2025 ceremony</span>
              <span>Fig. 01</span>
            </figcaption>
          </figure>
        </Reveal>

        {/* Trophy + copy (right) */}
        <Reveal className="flex flex-col items-start gap-7">
          <span className="eyebrow text-gold-deep">About the Award</span>
          <h2 className="display text-[clamp(2.5rem,6vw,4.5rem)] text-graphite">
            a celebration
            <br />
            of greatness
          </h2>
          <p className="max-w-md text-base leading-relaxed text-slate">
            Powered by City Breed, the Award of Excellence celebrates and promotes a
            culture of excellence in Redemption City — honouring the people and
            organisations whose outstanding work elevates the city to world-class
            status.
          </p>

          <div className="flex w-full items-center justify-between border-t border-rule pt-6">
            <div className="flex items-baseline gap-2">
              <span className="display text-3xl text-graphite">{EVENT.edition}</span>
              <span className="text-xs text-slate">{EVENT.dateLabel}</span>
            </div>
            <TrophyMedia className="h-40 w-auto select-none sm:h-52" />
          </div>

          <Link
            href="/nominate"
            className="link-underline text-sm font-semibold uppercase tracking-wider text-graphite"
          >
            Nominate the extraordinary →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
