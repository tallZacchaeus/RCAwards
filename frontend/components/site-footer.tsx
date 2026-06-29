import { EVENT } from "@/lib/site";

const QUICK_LINKS = [
  { label: "Home", href: "#top" },
  { label: "About City Breed", href: "#about" },
  { label: "About the Award", href: "#award" },
  { label: "Categories", href: "#categories" },
];

const PARTICIPATE = [
  { label: "Nominate Now", href: "#nominate" },
  { label: "Previous Winners", href: "#winners" },
  { label: "Our Objectives", href: "#objectives" },
  { label: "Nomination Portal", href: EVENT.nominateUrl },
];

export function SiteFooter({ eventDate }: { eventDate: string }) {
  return (
    <footer className="relative border-t border-line bg-bg-raised">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <span className="font-display text-lg tracking-[0.3em] text-ink">
            CITY<span className="text-gold">BREED</span>
          </span>
          <p className="max-w-md text-sm leading-relaxed text-ink-muted">
            The Redemption City Award of Excellence is powered by City Breed — a
            community of builders, repairers, executors, and champions of
            excellence committed to elevating Redemption City to world-class
            status.
          </p>
          <span className="mt-2 text-xs uppercase tracking-[0.3em] text-gold">
            {EVENT.social}
          </span>
        </div>

        <FooterColumn title="Quick Links" links={QUICK_LINKS} />
        <FooterColumn title="Participate" links={PARTICIPATE} />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="hairline" />
        <div className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-muted sm:flex-row">
          <span>
            © 2026 Redemption City Award of Excellence. Powered by City Breed.
          </span>
          <span>{eventDate}</span>
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
    <div className="flex flex-col gap-3">
      <span className="font-display text-xs uppercase tracking-[0.3em] text-gold">
        {title}
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          className="text-sm text-ink-muted transition-colors hover:text-gold"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
