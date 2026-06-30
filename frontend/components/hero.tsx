"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { EVENT } from "@/lib/site";

gsap.registerPlugin(useGSAP);

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-meta", { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 })
        .from(".hero-word", { opacity: 0, yPercent: 40, duration: 0.9, stagger: 0.08 }, "-=0.2")
        .from(".hero-trophy", { opacity: 0, scale: 0.92, duration: 1.1, ease: "power2.out" }, "-=0.7")
        .from(".hero-foot", { opacity: 0, y: 16, duration: 0.7, stagger: 0.1 }, "-=0.5");
    },
    { scope: root }
  );

  return (
    <section
      id="top"
      ref={root}
      className="surface-dark relative flex min-h-screen flex-col overflow-hidden px-5 pb-10 pt-24 sm:px-8"
    >
      {/* Top meta row */}
      <div className="mx-auto flex w-full max-w-7xl items-start justify-between">
        <p className="hero-meta eyebrow max-w-[12rem] text-ink-muted">
          The Redemption City · {EVENT.edition}
        </p>
        <p className="hero-meta eyebrow text-right text-ink-muted">
          Powered by
          <br />
          <span className="text-gold">City Breed</span>
        </p>
      </div>

      {/* Stage: oversized wordmark with the trophy overlapping */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center"
        >
          <span className="hero-word display text-[clamp(3.5rem,17vw,14rem)] text-ink/95">
            awards
          </span>
          <span className="hero-word display -mt-[0.08em] text-[clamp(3.5rem,17vw,14rem)] text-gold">
            2026
          </span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/award-3d.gif"
          alt="The Redemption City Award of Excellence trophy"
          width={1300}
          height={1300}
          className="hero-trophy relative z-10 h-[clamp(360px,68vh,760px)] w-auto select-none"
          style={{ filter: "drop-shadow(0 36px 44px rgba(0,0,0,0.55))" }}
          draggable={false}
        />
      </div>

      {/* Intro + CTAs */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <p className="hero-foot max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
            An esteemed recognition platform honouring outstanding achievement across
            Redemption City — the individuals, businesses and organisations that
            elevate the city toward global greatness.
          </p>
          <div className="hero-foot flex shrink-0 items-center gap-3">
            <Link
              href="/nominate"
              className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-bg transition-colors hover:bg-gold-bright"
            >
              Nominate
            </Link>
            <Link
              href="/vote"
              className="rounded-full border border-line px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-gold/50"
            >
              Vote
            </Link>
          </div>
        </div>

        {/* Year marquee */}
        <div className="hero-foot relative overflow-hidden border-y border-line py-3">
          <div className="marquee-track gap-10 text-ink-muted/40">
            {Array.from({ length: 2 }).map((_, g) => (
              <div key={g} className="flex gap-10" aria-hidden={g === 1}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className="display text-2xl">
                    2026
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
