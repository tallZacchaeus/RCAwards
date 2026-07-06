import Link from "next/link";
import { EVENT } from "@/lib/site";
import { HeroCarousel } from "./hero-carousel";

export function Hero() {
  return (
    <section
      id="top"
      className="hero-enter surface-dark relative flex min-h-screen flex-col justify-center gap-10 overflow-hidden px-5 pb-14 pt-24 sm:px-8"
    >
      {/* The carousel images carry the visible branding; this is the real,
          visually-hidden page heading for screen readers and SEO. */}
      <h1 className="sr-only">
        The Redemption City Awards of Excellence 2026 — powered by City Breed
      </h1>

      {/* Top meta row */}
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between">
        <p className="eyebrow max-w-[12rem] text-ink-muted">
          The Redemption City · {EVENT.edition}
        </p>
        <p className="eyebrow text-right text-ink-muted">
          Powered by
          <br />
          <span className="text-gold">City Breed</span>
        </p>
      </div>

      {/* Hero carousel */}
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-line shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
        <HeroCarousel />
      </div>

      {/* Intro + CTAs */}
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <p className="max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
          An esteemed recognition platform honouring outstanding achievement across
          Redemption City — the individuals, businesses and organisations that
          elevate the city toward global greatness.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/nominate"
            className="btn-press focus-ring rounded-full bg-gold px-7 py-3 text-sm font-semibold text-bg hover:bg-gold-bright"
          >
            Nominate
          </Link>
          <Link
            href="/#how-to-nominate"
            className="btn-press focus-ring rounded-full border border-line px-7 py-3 text-sm font-semibold text-ink hover:border-gold/50"
          >
            How to nominate
          </Link>
        </div>
      </div>
    </section>
  );
}
