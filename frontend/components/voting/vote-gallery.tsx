"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import type { Nominee } from "@/lib/forms/types";
import { castVote } from "@/lib/api";
import { getDeviceId, getVotedNominee, rememberVote } from "@/lib/vote-store";
import { Button } from "@/components/ui/button";
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

  // Read prior vote on the client only (avoids SSR hydration mismatch).
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
    } else if (outcome.status === 409) {
      // Already voted (perhaps on another device session) — lock the UI.
      rememberVote(categorySlug, nomineeId);
      setVotedId(nomineeId);
      setError(outcome.message);
    } else {
      setError(outcome.message);
    }
  }

  if (nominees.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-bg-raised/50 px-6 py-16 text-center">
        <h2 className="font-serif text-2xl text-ink">Shortlist coming soon</h2>
        <p className="mt-3 text-ink-muted">
          Nominees for this category haven&apos;t been announced yet. Check back
          once the judging committee reveals the shortlist.
        </p>
      </div>
    );
  }

  const total = nominees.reduce((sum, n) => sum + n.vote_count, 0);

  return (
    <div className="flex flex-col gap-5">
      {votedId && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-hi">
          Thank you — your vote in this category has been recorded.
        </p>
      )}
      {error && !votedId && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {nominees.map((n) => {
          const isVoted = votedId === n.id;
          const share = resultsPublic && total > 0 ? (n.vote_count / total) * 100 : 0;
          return (
            <article
              key={n.id}
              className={cn(
                "relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-bg-raised/50 p-6 transition-colors",
                isVoted ? "border-gold/60" : "border-line"
              )}
            >
              {n.is_winner && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[10px] uppercase tracking-wider text-gold-hi">
                  <Crown className="h-3 w-3" /> Winner
                </span>
              )}

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-bg-elevated">
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
                    <p className="line-clamp-2 text-xs text-ink-muted">{n.summary}</p>
                  )}
                </div>
              </div>

              {resultsPublic && (
                <div className="flex flex-col gap-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-hi transition-all duration-700"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-muted">
                    {n.vote_count} {n.vote_count === 1 ? "vote" : "votes"}
                  </span>
                </div>
              )}

              <Button
                onClick={() => vote(n.id)}
                disabled={!votingOpen || Boolean(votedId) || pending !== null}
                variant={isVoted ? "primary" : "outline"}
                size="sm"
                className="mt-auto w-full"
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
                  "Vote"
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
