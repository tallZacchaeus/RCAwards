"use client";

import { useEffect, useState } from "react";
import { NAV, EVENT } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line bg-bg/80 backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold tracking-[0.3em] text-ink">
            CITY<span className="text-gold">BREED</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.34em] text-ink-muted">
            Redemption City
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-ink-muted transition-colors hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={EVENT.nominateUrl}
          className="hidden rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold-hi transition-all hover:bg-gold/20 hover:shadow-[0_0_24px_-6px] hover:shadow-gold/50 md:inline-block"
        >
          Nominate Now
        </a>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center text-gold md:hidden"
        >
          <span className="text-xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line bg-bg/95 px-5 py-4 md:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm text-ink-muted hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
