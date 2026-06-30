import { EVENT } from "@/lib/site";
import Link from "next/link";

const QUICK_LINKS = [
  { label: "Home",              href: "#top" },
  { label: "About City Breed",  href: "#about" },
  { label: "About the Award",   href: "#award" },
  { label: "Categories",        href: "#categories" },
  { label: "Previous Winners",  href: "#winners" },
];

const PARTICIPATE = [
  { label: "Nominate Now",      href: "/nominate" },
  { label: "Vote",              href: "/vote" },
  { label: "Our Objectives",    href: "#objectives" },
  { label: "Nomination Portal", href: EVENT.nominateUrl },
  { label: "FAQ",               href: "#faq" },
];

export function SiteFooter({ eventDate }: { eventDate: string }) {
  return (
    <footer className="relative border-t border-line bg-bg-raised">
      {/* Top gradient accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg in oklch, transparent, var(--color-gold) 30%, var(--color-gold-hi) 50%, var(--color-gold) 70%, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr]">
        {/* Brand column */}
        <div className="flex flex-col gap-5">
          <a href="#top" className="inline-flex flex-col leading-none group w-fit">
            <span className="font-display text-lg tracking-[0.3em] text-ink transition-colors group-hover:text-gold-hi">
              CITY<span className="text-gold">BREED</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.34em] text-ink-muted mt-0.5">
              Redemption City
            </span>
          </a>

          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            The Redemption City Award of Excellence is powered by City Breed — a
            community of builders, repairers, executors, and champions of
            excellence committed to elevating Redemption City to world-class status.
          </p>

          {/* Social handle */}
          <a
            href={`https://instagram.com/${EVENT.social.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-gold transition-all duration-300 hover:bg-gold/10 hover:border-gold/60"
          >
            <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-gold" />
            {EVENT.social}
          </a>

          {/* Date badge */}
          <div className="flex items-center gap-2">
            <span className="hairline w-8" aria-hidden="true" />
            <span className="text-xs uppercase tracking-[0.25em] text-ink-muted/70">
              {EVENT.dateLabel}
            </span>
          </div>
        </div>

        <FooterColumn title="Quick Links" links={QUICK_LINKS} />
        <FooterColumn title="Participate"  links={PARTICIPATE} />
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="hairline" aria-hidden="true" />
        <div className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-muted/70 sm:flex-row">
          <span>
            © 2026 Redemption City Award of Excellence. Powered by{" "}
            <span className="text-gold">City Breed</span>.
          </span>
          <span className="hidden sm:block">{eventDate}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="font-display text-xs uppercase tracking-[0.3em] text-gold">
        {title}
      </span>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="group flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-gold"
            >
              <span
                className="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3"
                aria-hidden="true"
              />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
