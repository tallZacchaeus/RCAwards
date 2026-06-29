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
      <div className="gold-vignette absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[30vh] w-[60vw] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 py-28 text-center sm:px-8">
        <Reveal className="flex flex-col items-center gap-6">
          <span className="font-display text-xs uppercase tracking-[0.42em] text-gold">
            2026 Awards
          </span>
          <h2 className="font-serif text-4xl leading-[1.05] text-ink sm:text-6xl">
            Nominate the <span className="text-metallic">extraordinary</span>
          </h2>
          <p className="max-w-xl font-accent text-lg text-ink-muted sm:text-xl">
            Nominations are open. Be part of the movement that celebrates
            excellence and shapes the future of Redemption City.
          </p>
        </Reveal>

        <Reveal className="mt-12 w-full">
          <Countdown />
        </Reveal>

        <Reveal className="mt-12 flex flex-col items-center gap-6">
          <Link
            href="/nominate"
            className="rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright px-10 py-4 text-sm font-bold uppercase tracking-wider text-bg transition-transform hover:scale-[1.03]"
          >
            Submit a Nomination
          </Link>

          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            Be first to know when nominations open
          </p>
          <form
            onSubmit={onSubmit}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Honeypot value={hp} onChange={setHp} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-full border border-line bg-bg px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-gold/60"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "done"}
              className="rounded-full border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold-hi transition-colors hover:bg-gold/20 disabled:opacity-60"
            >
              {status === "done" ? "Subscribed ✓" : status === "loading" ? "…" : "Notify Me"}
            </button>
          </form>
          {status === "error" && (
            <span className="text-xs text-red-400">
              Something went wrong. Please try again.
            </span>
          )}
        </Reveal>
      </div>
    </section>
  );
}
