import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getCategory, getNominees, getVotingStatus } from "@/lib/api";
import { GROUP_LABELS } from "@/lib/site";
import { VoteGallery } from "@/components/voting/vote-gallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return {
    title: category ? `Vote — ${category.name}` : "Vote — Redemption City Awards",
  };
}

export default async function VoteCategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, nominees, status] = await Promise.all([
    getCategory(slug),
    getNominees(slug),
    getVotingStatus(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-32 sm:px-8">
      <Link
        href="/vote"
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> All categories
      </Link>

      {!category || category.voting_enabled === false ? (
        <Unavailable />
      ) : (
        <>
          <header className="mb-12 flex flex-col gap-4 border-b border-line pb-10">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              {GROUP_LABELS[category.group] ?? category.group} · Public Vote
            </span>
            <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
              {category.name}
            </h1>
            <p className="text-base leading-relaxed text-ink-muted">
              {category.description}
            </p>
          </header>

          <VoteGallery
            categorySlug={slug}
            initialNominees={nominees}
            votingOpen={status.open}
            resultsPublic={status.results_public}
          />
        </>
      )}
    </div>
  );
}

function Unavailable() {
  return (
    <div className="rounded-3xl border border-line bg-bg-raised/50 px-6 py-16 text-center">
      <h1 className="font-serif text-3xl text-ink">Voting unavailable</h1>
      <p className="mt-3 text-ink-muted">
        This category isn&apos;t open for public voting, or the service is
        offline. Please return to the list of categories.
      </p>
      <Link
        href="/vote"
        className="mt-6 inline-block text-sm uppercase tracking-[0.2em] text-gold hover:text-gold-hi"
      >
        View all categories →
      </Link>
    </div>
  );
}
