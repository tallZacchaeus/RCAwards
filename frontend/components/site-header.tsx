"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <header
      ref={navRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled ? "glass" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        {/* Left: nav cluster */}
        <nav
          className="hidden flex-1 grid-cols-2 gap-x-8 gap-y-0.5 text-sm text-ink-muted md:grid md:max-w-[15rem]"
          aria-label="Main navigation"
        >
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="link-underline w-fit hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Center: wordmark */}
        <Link
          href="/#top"
          className="wordmark text-lg text-ink sm:text-xl"
          aria-label="Redemption City Awards, home"
        >
          redemption city <span className="text-gold">Awards</span>
          <sup className="ml-0.5 text-[0.5em] text-ink-muted">™</sup>
        </Link>

        {/* Right: profile + Vote */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <Link
            href="/admin/login"
            aria-label="Sign in"
            className="btn-press focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted hover:text-gold"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            href="/vote"
            className="btn-press focus-ring hidden rounded-full border border-line px-6 py-2 text-sm font-semibold text-ink hover:border-gold/50 sm:inline-block"
          >
            Vote
          </Link>

          {/* Mobile hamburger */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 text-ink md:hidden"
          >
            <span className={cn("block h-px w-5 bg-current transition-all", open && "translate-y-[7px] rotate-45")} />
            <span className={cn("block h-px w-5 bg-current transition-all", open && "opacity-0")} />
            <span className={cn("block h-px w-5 bg-current transition-all", open && "-translate-y-[7px] -rotate-45")} />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        className="mobile-nav glass md:hidden"
        data-closed={open ? undefined : ""}
        aria-hidden={!open}
        // inert removes the collapsed drawer's links from tab order and the a11y
        // tree, so keyboard focus can't disappear into the hidden menu.
        inert={!open}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/30 py-2.5 text-sm text-ink-muted transition-colors last:border-0 hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/nominate"
            onClick={() => setOpen(false)}
            className="btn-press focus-ring mt-3 rounded-full bg-gold px-6 py-2.5 text-center text-sm font-semibold text-bg"
          >
            Nominate
          </Link>
        </nav>
      </div>
    </header>
  );
}
