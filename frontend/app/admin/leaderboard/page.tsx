"use client";

import { useEffect, useState } from "react";
import { type LeaderboardEntry, getLeaderboard } from "@/lib/admin-api";
import { getCategories } from "@/lib/api";
import type { CategorySummary } from "@/lib/site";
import { StatusBadge } from "@/components/admin/status-badge";

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [slug, setSlug] = useState("");
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getCategories().then((c) => {
      setCategories(c);
      if (c[0]) setSlug(c[0].slug);
    });
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getLeaderboard(slug)
      .then((r) => {
        setRows(r);
        setError(undefined);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-ink">Leaderboard</h1>
        <p className="text-sm text-ink-muted">
          Nominations ranked by average judge score — use this to shortlist the top
          performers.
        </p>
      </header>

      <select
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="max-w-xs rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:border-gold/60"
      >
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-raised/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nominee</th>
              <th className="px-4 py-3 font-medium">Avg. score</th>
              <th className="px-4 py-3 font-medium">Judges</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.nomination_id} className="border-t border-line">
                <td className="px-4 py-3 font-display text-gold">{i + 1}</td>
                <td className="px-4 py-3 text-ink">{r.nominee ?? `Nomination #${r.nomination_id}`}</td>
                <td className="px-4 py-3 text-ink">
                  {r.judge_count > 0 ? r.average_total.toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3 text-ink-muted">{r.judge_count}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No nominations in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
