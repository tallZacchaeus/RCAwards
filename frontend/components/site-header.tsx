"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      {/* CSS-only scroll progress bar */}
      <div className="scroll-progress" aria-hidden="true" />

      <header
        ref={navRef}
        className={cn(
          "fixed inset-x-0 top-2 z-50 mx-4 sm:mx-8 rounded-2xl transition-all duration-500",
          scrolled
            ? "glass border-gold/20 shadow-[0_8px_32px_-8px_rgba(201,162,75,0.15)]"
            : "border-transparent bg-transparent"
        )}
      >
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-7">
          <Link href="/#top" className="flex items-center" aria-label="City Breed — Redemption City, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt="City Breed — Redemption City"
              width={133}
              height={87}
              className="h-9 w-auto transition-opacity hover:opacity-90 sm:h-10"
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm text-ink-muted transition-colors hover:text-gold after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/nominate"
              className="hidden rounded-full border border-gold/40 bg-gold/10 px-5 py-2 text-sm font-semibold text-gold-hi transition-all duration-300 hover:bg-gold/20 hover:shadow-[0_0_24px_-6px] hover:shadow-gold/50 hover:scale-[1.03] md:inline-block btn-shimmer"
            >
              Nominate Now
            </Link>

            {/* Animated hamburger button */}
            <button
              id="mobile-menu-btn"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 text-gold md:hidden"
            >
              <span
                className={cn(
                  "block h-px w-5 bg-current origin-center transition-all duration-300",
                  open && "translate-y-[7px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "block h-px w-5 bg-current transition-all duration-300",
                  open && "opacity-0 scale-x-0"
                )}
              />
              <span
                className={cn(
                  "block h-px w-5 bg-current origin-center transition-all duration-300",
                  open && "-translate-y-[7px] -rotate-45"
                )}
              />
            </button>
          </div>
        </div>

        {/* Mobile nav — animated with max-height transition */}
        <div
          className={cn(
            "mobile-nav border-t border-line/50 md:hidden",
            !open && "[data-closed]"
          )}
          data-closed={open ? undefined : ""}
          aria-hidden={!open}
        >
          <nav className="flex flex-col gap-1 px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2.5 text-sm text-ink-muted transition-colors hover:text-gold border-b border-line/30 last:border-0"
              >
                <span className="h-px w-3 bg-gold/40 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
            <Link
              href="/nominate"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright px-6 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-bg transition-transform hover:scale-[1.02]"
            >
              Nominate Now
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
