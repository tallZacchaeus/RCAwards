"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import type { Nominee } from "@/lib/forms/types";
import { castVote } from "@/lib/api";
import { fireConfetti } from "@/lib/confetti";
import { getDeviceId, getVotedNominee, rememberVote } from "@/lib/vote-store";
import { Button } from "@/components/ui/button";
import { Lottie } from "@/components/lottie";
import { cn } from "@/lib/utils";

export function VoteGallery({
  categorySlug,
  initialNominees,
  votingOpen,
  resultsPublic,
}: {
  categorySlug: string;
  initialNominees: Nominee[];
  votingOpen: boolean;
  resultsPublic: boolean;
}) {
  const [nominees, setNominees] = useState(initialNominees);
  const [votedId, setVotedId] = useState<number | undefined>(undefined);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  // Read prior vote on the client only (avoids SSR hydration mismatch)
  useEffect(() => {
    setVotedId(getVotedNominee(categorySlug));
  }, [categorySlug]);

  async function vote(nomineeId: number) {
    if (votedId || pending) return;
    setError(undefined);
    setPending(nomineeId);
    const outcome = await castVote(nomineeId, getDeviceId());
    setPending(null);

    if (outcome.ok) {
      setNominees((prev) =>
        prev.map((n) => (n.id === nomineeId ? { ...n, vote_count: outcome.voteCount } : n))
      );
      rememberVote(categorySlug, nomineeId);
      setVotedId(nomineeId);
      fireConfetti();
    } else if (outcome.status === 409) {
      rememberVote(categorySlug, nomineeId);
      setVotedId(nomineeId);
      setError(outcome.message);
    } else {
      setError(outcome.message);
    }
  }

  if (nominees.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-bg-raised/50 px-6 py-20 text-center">
        <Lottie src="/lottie/star.json" className="mx-auto h-16 w-16" />
        <h2 className="mt-4 font-serif text-2xl text-ink">Shortlist coming soon</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-muted">
          Nominees for this category haven&apos;t been announced yet. Check back
          once the judging committee reveals the shortlist.
        </p>
      </div>
    );
  }

  const total = nominees.reduce((sum, n) => sum + n.vote_count, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Success / error banners */}
      {votedId && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm text-gold-hi"
        >
          <Check className="h-4 w-4 shrink-0" />
          Thank you — your vote in this category has been recorded.
        </div>
      )}
      {error && !votedId && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {nominees.map((n) => {
          const isVoted = votedId === n.id;
          const share = resultsPublic && total > 0 ? (n.vote_count / total) * 100 : 0;
          return (
            <article
              key={n.id}
              className={cn(
                "group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6 transition-all duration-500",
                isVoted
                  ? "border-gold/60 bg-bg-elevated shadow-[0_0_40px_-12px_rgba(201,162,75,0.35)]"
                  : "border-line bg-bg-raised/50 hover:border-gold/30 hover:bg-bg-elevated hover:-translate-y-1 hover:shadow-[0_8px_32px_-8px_rgba(201,162,75,0.15)]"
              )}
            >
              {/* Winner badge */}
              {n.is_winner && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[10px] uppercase tracking-wider text-gold-hi">
                  <Crown className="h-3 w-3" /> Winner
                </span>
              )}

              {/* Gold corner glow when voted */}
              {isVoted && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "radial-gradient(60% 50% at 50% 0%, rgba(201,162,75,0.1), transparent)",
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Avatar + info */}
              <div className="relative flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-bg-elevated transition-all duration-500",
                    isVoted ? "border-gold/60 shadow-[0_0_16px_-4px_rgba(201,162,75,0.5)]" : "border-gold/20"
                  )}
                >
                  {n.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.photo_url} alt={n.display_name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-xl text-gold/50">
                      {n.display_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-lg text-ink">{n.display_name}</h3>
                  {n.summary && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">{n.summary}</p>
                  )}
                </div>
              </div>

              {/* Vote bar */}
              {resultsPublic && (
                <div className="flex flex-col gap-2">
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-hi transition-all duration-700"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-muted">
                      {n.vote_count} {n.vote_count === 1 ? "vote" : "votes"}
                    </span>
                    {total > 0 && (
                      <span className="text-xs font-semibold text-gold">
                        {share.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Vote button */}
              <Button
                onClick={() => vote(n.id)}
                disabled={!votingOpen || Boolean(votedId) || pending !== null}
                variant={isVoted ? "primary" : "outline"}
                size="sm"
                className={cn("mt-auto w-full", isVoted && "btn-shimmer")}
              >
                {pending === n.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isVoted ? (
                  <>
                    <Check className="h-4 w-4" /> Voted
                  </>
                ) : votedId ? (
                  "Voted elsewhere"
                ) : votingOpen ? (
                  "Cast Vote"
                ) : (
                  "Voting closed"
                )}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
