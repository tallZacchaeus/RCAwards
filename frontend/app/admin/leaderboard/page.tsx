"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  type LeaderboardEntry,
  downloadJudgingSheet,
  getLeaderboard,
} from "@/lib/admin-api";
import { getCategories } from "@/lib/api";
import type { CategorySummary } from "@/lib/site";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [slug, setSlug] = useState("");
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  async function onExport() {
    setExporting(true);
    try {
      await downloadJudgingSheet(slug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  const panelSize = rows[0]?.panel_size ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-ink">Leaderboard</h1>
        <p className="text-sm text-ink-muted">
          Nominations ranked by <span className="text-gold-hi">Ranked Score</span> —
          the sum of each criterion&apos;s average across the judging panel
          {panelSize > 0 ? ` (${panelSize} judges)` : ""}. This mirrors the
          committee&apos;s 2025 judging sheet.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <Button onClick={onExport} disabled={exporting || !slug} variant="outline" size="sm">
          <Download className="h-4 w-4" />
          {exporting ? "Exporting…" : "Download judging sheet"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-raised/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nominee</th>
              <th className="px-4 py-3 font-medium text-right">Ranked score</th>
              <th className="px-4 py-3 font-medium text-center">Judges</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.nomination_id} className="border-t border-line align-top">
                <td className="px-4 py-4 font-display text-gold">{i + 1}</td>
                <td className="px-4 py-4">
                  <div className="text-ink">
                    {r.nominee ?? `Nomination #${r.nomination_id}`}
                  </div>
                  {r.judge_count > 0 && r.criteria.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.criteria.map((c) => (
                        <span
                          key={c.key}
                          title={c.label}
                          className="rounded-full border border-line bg-bg-raised/60 px-2 py-0.5 text-[10px] text-ink-muted"
                        >
                          {c.label.length > 22 ? c.label.slice(0, 22) + "…" : c.label}:{" "}
                          <span className="text-gold">{c.average.toFixed(1)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-right font-display text-lg text-metallic">
                  {r.judge_count > 0 ? r.ranked_score.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-4 text-center text-ink-muted">{r.judge_count}</td>
                <td className="px-4 py-4">
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
