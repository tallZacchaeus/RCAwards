"use client";

import { Reveal } from "./reveal";

export function LetterDirector() {
  return (
    <section className="surface-dark border-b border-line py-24">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          
          {/* Portrait Column */}
          <div className="lg:col-span-5">
            <Reveal className="group relative flex flex-col items-center sm:items-start">
              {/* Photo frame */}
              <div className="relative overflow-hidden border border-line bg-bg-raised">

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/winners/director.jpg"
                  alt="Pastor Leke Adeboye, Event Director & SATGO Leader"
                  className="h-[440px] w-full object-cover rounded-xl grayscale opacity-90 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 sm:w-[380px] lg:w-[420px]"
                />
              </div>

              {/* Caption */}
              <div className="mt-5 text-center sm:text-left">
                <p className="font-display text-sm font-semibold tracking-wider text-gold">
                  PASTOR LEKE ADEBOYE
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mt-1">
                  Host & SATGO Youth Province Leader
                </p>
              </div>
            </Reveal>
          </div>

          {/* Letter Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-ink-muted">
            <Reveal className="flex flex-col gap-4">
              <span className="font-display text-xs uppercase tracking-[0.42em] text-gold block">
                Welcome Address
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight font-medium">
                A culture of <span className="italic text-gold-hi font-normal">service & distinction</span>
              </h2>
            </Reveal>

            <Reveal className="flex flex-col gap-5 text-base leading-relaxed font-sans mt-4">
              <p className="first-letter:font-serif first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:text-gold first-letter:font-bold first-letter:leading-none">
                Welcome to the 4th edition of the Redemption City Awards of Excellence. As we gather to celebrate the outstanding achievements within our beloved city, we reflect on the values of dedication, righteousness, and pure excellence that serve as the foundation of our community.
              </p>
              <p>
                Excellence is not an accident. It is the result of high intention, sincere effort, intelligent direction, and skillful execution. Our pillars of building, repairing, and executing are not just corporate targets—they are a calling to elevate Redemption City into a global center of progress and community service.
              </p>
              <p>
                Through this platform, we honor the builders who labor in silence, the business owners driving local growth, the young changemakers showing unprecedented impact, and the departments maintaining our welfare day in and day out. 
              </p>
              <p>
                Thank you for your continuous involvement and votes. Let us keep striving together, inspiring one another, and lifting the standard of distinction in everything we do.
              </p>
            </Reveal>

            {/* Signature Area */}
            <Reveal className="mt-8 flex flex-col items-start gap-2">
              <p className="font-accent text-3xl italic text-gold-hi tracking-wide font-normal">
                Pastor Leke Adeboye
              </p>
              <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">
                Executive Host, RCA 2026
              </span>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
