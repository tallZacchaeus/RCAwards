import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getVotingStatus } from "@/lib/api";
import { GROUP_LABELS, type CategorySummary } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Vote — Redemption City Awards of Excellence 2026",
  description: "Cast your vote for the shortlisted nominees across the award categories.",
};

const GROUP_ORDER = ["city", "regional"];

export default async function VotePage() {
  const [categories, status] = await Promise.all([getCategories(), getVotingStatus()]);
  const votable = categories.filter((c) => c.voting_enabled !== false);
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group] ?? group,
    items: votable.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-36 sm:px-8">
      <SectionHeading
        eyebrow="2026 Public Vote"
        title="Cast your vote"
        subtitle="Have your say in who takes home the night. Choose a category to see the shortlisted nominees — one vote per category."
      />

      <Reveal className="mx-auto mt-8 flex max-w-xl justify-center">
        <StatusBanner
          open={status.open}
          opensAt={status.opens_at}
          closesAt={status.closes_at}
        />
      </Reveal>

      <div className="mt-14 flex flex-col gap-14">
        {grouped.map((g) => (
          <div key={g.group}>
            <div className="mb-6 flex items-center gap-4">
              <span className="font-display text-sm uppercase tracking-[0.3em] text-gold">
                {g.label}
              </span>
              <span className="hairline flex-1" />
            </div>
            <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((cat) => (
                <VoteCard key={cat.slug} category={cat} />
              ))}
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBanner({
  open,
  opensAt,
  closesAt,
}: {
  open: boolean;
  opensAt: string | null;
  closesAt: string | null;
}) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const message = open
    ? closesAt
      ? `Voting is open — closes ${fmt(closesAt)}.`
      : "Voting is open."
    : opensAt && new Date(opensAt) > new Date()
      ? `Voting opens ${fmt(opensAt)}.`
      : "Voting is currently closed.";

  return (
    <div
      className={cnBanner(open)}
    >
      <span className={`h-2 w-2 rounded-full ${open ? "bg-gold" : "bg-ink-muted"}`} />
      {message}
    </div>
  );
}

function cnBanner(open: boolean) {
  return `inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm ${
    open ? "border-gold/40 bg-gold/10 text-gold-hi" : "border-line bg-bg-raised/60 text-ink-muted"
  }`;
}

function VoteCard({ category }: { category: CategorySummary }) {
  return (
    <Link
      href={`/vote/${category.slug}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-bg-raised/50 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:bg-bg-elevated hover:shadow-[0_8px_32px_-8px_rgba(201,162,75,0.2)]"
    >
      {/* Bottom sweep accent */}
      <div
        className="absolute bottom-0 inset-x-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold via-gold-bright to-transparent transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden="true"
      />

      <h3 className="font-serif text-xl leading-snug text-ink transition-colors group-hover:text-gold-hi">
        {category.name}
      </h3>
      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
        {category.description}
      </p>
      <span className="mt-2 flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-gold opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
        View nominees →
      </span>
    </Link>
  );
}

