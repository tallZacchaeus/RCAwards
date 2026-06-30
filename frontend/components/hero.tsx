"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { EVENT } from "@/lib/site";
import { AnimatedTrophy } from "./animated-trophy";

// Deterministic particle field — no Math.random to avoid hydration mismatch.
// Each particle gets a CSS custom property for horizontal drift.
const PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 1 + ((i * 13) % 4),
  delay: (i % 9) * 0.7,
  duration: 8 + ((i * 7) % 9),
  opacity: 0.25 + ((i % 6) * 0.1),
  drift: (((i * 19) % 40) - 20), // px left/right drift
}));

// Split "AWARDS" into individual letters for clip-path stagger reveal
const AWARD_LETTERS = "AWARDS".split("");

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl
        // Eyebrow fades up
        .from(".hero-eyebrow", { opacity: 0, y: 12, duration: 0.6 })
        // Individual letters clip in from left, staggered
        .from(
          ".hero-letter",
          {
            clipPath: "inset(0 100% 0 0)",
            opacity: 0,
            duration: 0.65,
            stagger: 0.055,
          },
          "-=0.3"
        )
        // "of Excellence" slides up
        .from(".hero-sub-title", { opacity: 0, y: 20, duration: 0.7 }, "-=0.3")
        // Underline draws in
        .from(
          ".hero-underline",
          { scaleX: 0, duration: 0.8, ease: "power3.inOut", transformOrigin: "left" },
          "-=0.5"
        )
        // Description
        .from(".hero-desc", { opacity: 0, y: 16, duration: 0.7 }, "-=0.5")
        // CTAs
        .from(
          ".hero-cta",
          { opacity: 0, y: 16, duration: 0.6, stagger: 0.12 },
          "-=0.4"
        )
        // Meta info
        .from(".hero-meta", { opacity: 0, duration: 0.7 }, "-=0.3");
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
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full bg-gold-hi"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              "--drift": `${p.drift}px`,
              animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Animated top bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[45vh] w-[70vw] -translate-x-1/2 rounded-full bg-gold/8 blur-[140px]"
        style={{ animation: "glowBreath 6s ease-in-out infinite" }}
      />

      {/* Side accent blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-gold-deep/10 blur-[80px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-1/3 h-48 w-48 rounded-full bg-gold/8 blur-[60px]"
      />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 text-center">
        <span className="hero-eyebrow font-display text-xs uppercase tracking-[0.5em] text-gold sm:text-sm">
          The Redemption City
        </span>

        {/* Letter-by-letter reveal */}
        <h1 className="mt-4 font-display text-[15vw] font-extrabold leading-[0.92] sm:text-7xl md:text-8xl lg:text-[8.5rem]">
          {AWARD_LETTERS.map((letter, i) => (
            <span
              key={i}
              className="hero-letter text-metallic inline-block"
              style={{ clipPath: "inset(0 0 0 0)" }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* Underline */}
        <div
          className="hero-underline mt-2 h-px w-64 origin-left"
          style={{
            background:
              "linear-gradient(90deg in oklch, transparent, var(--color-gold) 40%, var(--color-gold-hi) 60%, transparent)",
          }}
        />

        <span className="hero-sub-title mt-3 inline-block font-display text-base uppercase tracking-[0.5em] text-ink sm:text-xl md:text-2xl">
          of Excellence
        </span>

        {/* The master-brand trophy, alive */}
        <AnimatedTrophy
          className="mt-4 w-full"
          imgHeightClass="h-[clamp(220px,32vh,380px)]"
        />

        <p className="hero-desc mt-4 max-w-2xl font-accent text-lg text-ink-muted sm:text-2xl">
          Honouring the individuals, businesses, and organisations that elevate
          Redemption City toward global greatness.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/nominate"
            className="hero-cta group relative overflow-hidden rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_40px_-8px] hover:shadow-gold/60 btn-shimmer"
          >
            Nominate for 2026
          </Link>
          <a
            href="#award"
            className="hero-cta group rounded-full border border-gold/40 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-gold-hi transition-all duration-300 hover:bg-gold/10 hover:border-gold/70 hover:shadow-[0_0_20px_-8px] hover:shadow-gold/40"
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

      {/* Scroll indicator */}
      <div
        className="hero-meta absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink-muted/60"
        aria-hidden="true"
      >
        <span>Scroll</span>
        <span
          className="block h-8 w-px origin-top"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-gold)/40, transparent)",
            animation: "drawLine 2s ease-in-out infinite alternate",
          }}
        />
      </div>
    </section>
  );
}
