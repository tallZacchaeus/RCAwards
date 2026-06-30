import Link from "next/link";
import { EVENT } from "@/lib/site";
import { Reveal } from "./reveal";

/* Light editorial section: a framed photo on the left, the spinning trophy on
   the right. Drop a real image at /brand/photos/feature.jpg to replace the
   placeholder frame. */
export function AwardFeature() {
  return (
    <section id="award" className="surface-paper">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
        {/* Framed photo (left) */}
        <Reveal>
          <figure className="flex flex-col gap-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-rule bg-card">
              {/* Placeholder until a real photo is supplied */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate">
                <span className="eyebrow">2025 Ceremony</span>
                <span className="text-xs">Add /brand/photos/feature.jpg</span>
              </div>
              <span className="absolute left-4 top-4 eyebrow text-graphite/70">
                Redemption City
              </span>
            </div>
            <figcaption className="flex items-center justify-between text-xs text-slate">
              <span>The champions of 2025</span>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/award-3d.gif"
              alt="The Award of Excellence trophy"
              className="h-40 w-auto select-none sm:h-52"
              draggable={false}
            />
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
