"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, Plus } from "lucide-react";
import {
  type NomineeOut,
  createNominee,
  listNominees,
  setWinner,
} from "@/lib/admin-api";
import { getCategories } from "@/lib/api";
import type { CategorySummary } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function NomineesPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [nominees, setNominees] = useState<NomineeOut[]>([]);
  const [error, setError] = useState<string>();

  // create form
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCategories().then((c) => {
      setCategories(c.filter((x) => x.voting_enabled !== false));
      if (c[0]) setSlug(c[0].slug);
    });
    refresh();
  }, []);

  function refresh() {
    listNominees()
      .then(setNominees)
      .catch((e) => setError(e.message));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !name) return;
    setBusy(true);
    try {
      await createNominee({ category_slug: slug, display_name: name, summary: summary || undefined });
      setName("");
      setSummary("");
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleWinner(n: NomineeOut) {
    try {
      await setWinner(n.id, !n.is_winner);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const catName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c.name]));
    return (s: string) => map.get(s) ?? s;
  }, [categories]);

  const grouped = useMemo(() => {
    const by: Record<string, NomineeOut[]> = {};
    for (const n of nominees) (by[n.category_slug] ??= []).push(n);
    return by;
  }, [nominees]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-3xl text-ink">Voting slate</h1>
        <p className="text-sm text-ink-muted">
          Add shortlisted nominees and crown winners. Nominees appear on the public
          voting pages.
        </p>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Add nominee */}
      <form
        onSubmit={add}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-raised/40 p-6"
      >
        <h2 className="font-display text-xs uppercase tracking-[0.3em] text-gold">
          Add nominee
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cat">Category</Label>
            <select
              id="cat"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-gold/60"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nominee name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="summary">Summary (optional)</Label>
          <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <Button type="submit" size="sm" disabled={busy} className="self-start">
          <Plus className="h-4 w-4" /> {busy ? "Adding…" : "Add nominee"}
        </Button>
      </form>

      {/* Slate */}
      <div className="flex flex-col gap-8">
        {Object.entries(grouped).map(([catSlug, items]) => (
          <div key={catSlug} className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="font-display text-sm uppercase tracking-[0.2em] text-gold">
                {catName(catSlug)}
              </span>
              <span className="hairline flex-1" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border bg-bg-raised/40 px-4 py-3",
                    n.is_winner ? "border-gold/60" : "border-line"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{n.display_name}</p>
                    <p className="text-xs text-ink-muted">
                      {n.vote_count} {n.vote_count === 1 ? "vote" : "votes"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleWinner(n)}
                    title={n.is_winner ? "Remove winner" : "Crown winner"}
                    className={cn(
                      "shrink-0 rounded-full border p-2 transition-colors",
                      n.is_winner
                        ? "border-gold/60 bg-gold/15 text-gold-hi"
                        : "border-line text-ink-muted hover:text-gold"
                    )}
                  >
                    <Crown className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {nominees.length === 0 && (
          <p className="rounded-2xl border border-line bg-bg-raised/40 px-4 py-10 text-center text-ink-muted">
            No nominees yet. Add some above, or shortlist nominations from the
            nominations queue.
          </p>
        )}
      </div>
    </div>
  );
}
