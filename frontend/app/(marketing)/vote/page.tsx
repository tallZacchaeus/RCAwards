import type { Metadata } from "next";
import { getCategories, getVotingStatus } from "@/lib/api";
import { Reveal } from "@/components/reveal";
import { CategoryIndex } from "@/components/category-index";

export const metadata: Metadata = {
  title: "Vote — Redemption City Awards of Excellence 2026",
  description: "Cast your vote for the shortlisted nominees across the award categories.",
};

export default async function VotePage() {
  const [categories, status] = await Promise.all([getCategories(), getVotingStatus()]);
  const votable = categories.filter((c) => c.voting_enabled !== false);

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

        <CategoryIndex categories={votable} hrefPrefix="/vote" />
      </div>
    </main>
  );
}
