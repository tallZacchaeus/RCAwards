"use client";

import { useState } from "react";
import Link from "next/link";
import { subscribe } from "@/lib/api";
import { Countdown } from "./countdown";
import { Reveal } from "./reveal";
import { Honeypot } from "./forms/honeypot";

type Status = "idle" | "loading" | "done" | "error";

export function NominateCta() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await subscribe(email, hp);
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="nominate"
      className="relative overflow-hidden border-t border-line bg-bg-raised/40"
    >
      <div className="gold-vignette absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[40vh] w-[70vw] -translate-x-1/2 rounded-full bg-gold/10 blur-[140px]"
        style={{ animation: "glowBreath 7s ease-in-out infinite" }}
        aria-hidden="true"
      />

      {/* Decorative corner blobs */}
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-gold-deep/8 blur-[80px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-gold/6 blur-[60px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 py-28 text-center sm:px-8">
        <Reveal className="flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 font-display text-xs uppercase tracking-[0.42em] text-gold">
            <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-gold" />
            2026 Awards Open
          </span>
          <h2 className="font-serif text-4xl leading-[1.05] text-ink sm:text-6xl">
            Nominate the{" "}
            <span className="text-metallic">extraordinary</span>
          </h2>
          <p className="max-w-xl font-accent text-lg text-ink-muted sm:text-xl">
            Nominations are open. Be part of the movement that celebrates
            excellence and shapes the future of Redemption City.
          </p>
        </Reveal>

        {/* Countdown */}
        <Reveal className="mt-14 w-full">
          <p className="mb-6 text-xs uppercase tracking-[0.35em] text-ink-muted/60">
            Time remaining until the awards
          </p>
          <Countdown />
        </Reveal>

        <Reveal className="mt-12 flex flex-col items-center gap-8 w-full">
          {/* Primary CTA */}
          <Link
            href="/nominate"
            className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright px-10 py-4 text-sm font-bold uppercase tracking-wider text-bg transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_50px_-8px_rgba(201,162,75,0.6)] btn-shimmer"
          >
            Submit a Nomination
            <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>

          {/* Email signup */}
          <div className="w-full max-w-md">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-ink-muted">
              Be first to know when nominations open
            </p>
            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-3 sm:flex-row"
            >
              <Honeypot value={hp} onChange={setHp} />
              <input
                type="email"
                id="notify-email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-full border border-line bg-bg px-5 py-3 text-sm text-ink outline-none transition-all duration-300 placeholder:text-ink-muted/50 focus:border-gold/60 focus:shadow-[0_0_0_3px_rgba(201,162,75,0.12)]"
                aria-label="Email address for updates"
              />
              <button
                type="submit"
                id="notify-submit"
                disabled={status === "loading" || status === "done"}
                className="rounded-full border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold-hi transition-all duration-300 hover:bg-gold/20 hover:border-gold/70 hover:shadow-[0_0_20px_-8px_rgba(201,162,75,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "done"
                  ? "Subscribed"
                  : status === "loading"
                  ? "Sending…"
                  : "Notify Me"}
              </button>
            </form>
            {status === "error" && (
              <p className="mt-2 text-xs text-red-400" role="alert">
                Something went wrong. Please try again.
              </p>
            )}
            {status === "done" && (
              <p className="mt-2 text-xs text-gold" role="status">
                You&apos;re on the list — we&apos;ll be in touch!
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
