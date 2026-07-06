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
    <section id="nominate" className="surface-dark border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="flex flex-col gap-5">
          <span className="eyebrow text-gold">2026 Awards · Open</span>
          <h2 className="display text-[clamp(3rem,10vw,9rem)] text-ink">
            nominate the
            <br />
            <span className="text-gold">extraordinary</span>
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-ink-muted">
            Be part of the movement that celebrates excellence and shapes the future
            of Redemption City.
          </p>
        </Reveal>

        <Reveal className="mt-14 flex flex-col gap-5">
          <span className="eyebrow text-ink-muted">Time remaining</span>
          <Countdown />
        </Reveal>

        <Reveal className="mt-14 flex flex-col gap-10 border-t border-line pt-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/nominate"
              className="btn-press focus-ring rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-bg hover:bg-gold-bright"
            >
              Submit a Nomination
            </Link>
          </div>

          <div className="w-full max-w-sm">
            <p className="mb-3 eyebrow text-ink-muted">Be first to know when nominations open</p>
            <form onSubmit={onSubmit} className="flex gap-2">
              <Honeypot value={hp} onChange={setHp} />
              <input
                type="email"
                id="notify-email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-full border border-line bg-bg px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50 focus:border-gold/60"
                aria-label="Email address for updates"
              />
              <button
                type="submit"
                disabled={status === "loading" || status === "done"}
                className="btn-press focus-ring shrink-0 rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink hover:border-gold/50 disabled:opacity-60"
              >
                {status === "done" ? "Done" : status === "loading" ? "…" : "Notify"}
              </button>
            </form>
            {status === "error" && (
              <p className="mt-2 text-xs text-red-400" role="alert">
                Something went wrong. Please try again.
              </p>
            )}
            {status === "done" && (
              <p className="mt-2 text-xs text-gold" role="status">
                You&apos;re on the list.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
