import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getVotingStatus } from "@/lib/api";
import { GROUP_LABELS, type CategorySummary } from "@/lib/site";
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

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const statusMsg = status.open
    ? status.closes_at
      ? `Voting is open — closes ${fmt(status.closes_at)}`
      : "Voting is open"
    : status.opens_at && new Date(status.opens_at) > new Date()
      ? `Voting opens ${fmt(status.opens_at)}`
      : "Voting is currently closed";

  return (
    <main className="surface-paper min-h-screen">
      <div className="mx-auto max-w-7xl px-5 pb-28 pt-36 sm:px-8">
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow text-gold-deep">2026 Public Vote</span>
          <h1 className="display max-w-3xl text-[clamp(2.5rem,6vw,5rem)] text-graphite">
            cast your vote
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate">
            Have your say in who takes home the night. Choose a category to see the
            shortlisted nominees — one vote per category.
          </p>
          <span className="mt-2 inline-flex items-center gap-2 text-sm text-graphite">
            <span className={`h-2 w-2 rounded-full ${status.open ? "bg-gold-deep" : "bg-slate"}`} />
            {statusMsg}
          </span>
        </Reveal>

        <div className="mt-16 flex flex-col gap-16">
          {grouped.map((g, gi) => {
            const start = grouped
              .slice(0, gi)
              .reduce((sum, prev) => sum + prev.items.length, 0);
            return (
              <div key={g.group}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="eyebrow text-slate">{g.label}</span>
                  <span className="text-xs text-slate">
                    {String(g.items.length).padStart(2, "0")}
                  </span>
                </div>
                <Reveal>
                  <ul>
                    {g.items.map((cat, i) => (
                      <VoteRow key={cat.slug} index={start + i + 1} category={cat} />
                    ))}
                  </ul>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function VoteRow({ index, category }: { index: number; category: CategorySummary }) {
  return (
    <li>
      <Link
        href={`/vote/${category.slug}`}
        className="group flex items-center gap-5 border-t border-rule py-5 sm:gap-8"
      >
        <span className="w-8 shrink-0 font-sans text-sm tabular-nums text-slate">
          {String(index).padStart(2, "0")}
        </span>
        <span className="display flex-1 text-[clamp(1.5rem,3.6vw,2.75rem)] text-graphite transition-colors group-hover:text-gold-deep">
          {category.name.toLowerCase()}
        </span>
        <span className="hidden max-w-xs shrink truncate text-sm text-slate md:block">
          {category.description}
        </span>
        <span className="shrink-0 text-gold-deep opacity-0 transition-opacity group-hover:opacity-100">
          →
        </span>
      </Link>
    </li>
  );
}
