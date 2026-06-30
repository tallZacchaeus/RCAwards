import Link from "next/link";
import { EVENT } from "@/lib/site";

const QUICK_LINKS = [
  { label: "About the Award", href: "/#award" },
  { label: "Categories", href: "/#categories" },
  { label: "Previous Winners", href: "/#winners" },
  { label: "FAQ", href: "/#faq" },
];

const PARTICIPATE = [
  { label: "Nominate", href: "/nominate" },
  { label: "Vote", href: "/vote" },
  { label: "Nomination Portal", href: EVENT.nominateUrl },
  { label: "Sign in", href: "/admin/login" },
];

export function SiteFooter({ eventDate }: { eventDate: string }) {
  return (
    <footer className="surface-dark border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        {/* Oversized wordmark */}
        <div className="flex flex-col gap-3 border-b border-line pb-12">
          <span className="display text-[clamp(2.5rem,8vw,7rem)] text-ink">
            awards <span className="text-gold">2026</span>
          </span>
          <p className="max-w-md text-sm leading-relaxed text-ink-muted">
            The Redemption City Award of Excellence — powered by City Breed, a
            community of builders, repairers, executors and champions of excellence.
          </p>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-3">
          <FooterColumn title="Explore" links={QUICK_LINKS} />
          <FooterColumn title="Participate" links={PARTICIPATE} />
          <div className="flex flex-col gap-3">
            <span className="eyebrow text-gold">Follow</span>
            <span className="text-sm text-ink-muted">{EVENT.social}</span>
            <span className="text-sm text-ink-muted">Facebook · Instagram · X · YouTube</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Redemption City Award of Excellence. Powered by City Breed.</span>
          <span>{eventDate}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="eyebrow text-gold">{title}</span>
      {links.map((l) => (
        <Link key={l.label} href={l.href} className="link-underline w-fit text-sm text-ink-muted hover:text-ink">
          {l.label}
        </Link>
      ))}
    </div>
  );
}
