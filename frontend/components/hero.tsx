"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { EVENT } from "@/lib/site";

// Deterministic particle field (no Math.random → no hydration mismatch).
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 1.5 + ((i * 13) % 4),
  delay: (i % 9) * 0.9,
  duration: 7 + ((i * 5) % 8),
  opacity: 0.3 + ((i % 5) * 0.12),
}));

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.7 })
        .from(
          ".hero-word",
          { opacity: 0, yPercent: 120, duration: 1, stagger: 0.12 },
          "-=0.3"
        )
        .from(".hero-sub", { opacity: 0, y: 18, duration: 0.8 }, "-=0.5")
        .from(".hero-cta", { opacity: 0, y: 18, duration: 0.7, stagger: 0.12 }, "-=0.4")
        .from(".hero-meta", { opacity: 0, duration: 0.8 }, "-=0.3");
    },
    { scope: root }
  );

  return (
    <section
      id="top"
      ref={root}
      className="relative flex min-h-screen items-center justify-center overflow-hidden gold-vignette pt-28"
    >
      {/* Particle field */}
      <div className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full bg-gold-hi"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Top light bloom */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[40vh] w-[60vw] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 text-center">
        <span className="hero-eyebrow font-display text-xs uppercase tracking-[0.45em] text-gold sm:text-sm">
          The Redemption City
        </span>

        <h1 className="mt-4 overflow-hidden font-display text-[15vw] font-extrabold leading-[0.92] sm:text-7xl md:text-8xl lg:text-[8.5rem]">
          <span className="inline-block overflow-hidden">
            <span className="hero-word text-metallic inline-block">AWARDS</span>
          </span>
        </h1>
        <span className="hero-word mt-1 inline-block font-display text-base uppercase tracking-[0.5em] text-ink sm:text-xl md:text-2xl">
          of Excellence
        </span>

        <p className="hero-sub mt-8 max-w-2xl font-accent text-lg text-ink-muted sm:text-2xl">
          Honouring the individuals, businesses, and organisations that elevate
          Redemption City toward global greatness.
        </p>

        <div className="hero-cta-group mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/nominate"
            className="hero-cta group relative overflow-hidden rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-transform hover:scale-[1.03]"
          >
            Nominate for 2026
          </Link>
          <a
            href="#award"
            className="hero-cta rounded-full border border-gold/40 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-gold-hi transition-colors hover:bg-gold/10"
          >
            Learn About the Award
          </a>
        </div>

        <div className="hero-meta mt-14 flex items-center gap-4 text-xs uppercase tracking-[0.34em] text-ink-muted">
          <span className="hairline w-10" />
          {EVENT.edition} · {EVENT.dateLabel}
          <span className="hairline w-10" />
        </div>
      </div>
    </section>
  );
}
