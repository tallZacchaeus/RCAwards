"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  type NominationListItem,
  downloadCsv,
  downloadXlsx,
  downloadReport,
  listNominations,
} from "@/lib/admin-api";
import { getCategories } from "@/lib/api";
import type { CategorySummary } from "@/lib/site";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["", "submitted", "shortlisted", "rejected"];
const PAGE_SIZE = 100;

export default function NominationsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<NominationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // Reload the first page whenever the filters change. Ignore a stale response
  // if the filters changed again before it resolved.
  useEffect(() => {
    let active = true;
    setLoading(true);
    listNominations({
      category: category || undefined,
      status: status || undefined,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((r) => {
        if (!active) return;
        setRows(r);
        setHasMore(r.length === PAGE_SIZE);
        setError(undefined);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category, status]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const more = await listNominations({
        category: category || undefined,
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: rows.length,
      });
      setRows((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  const catName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c.name]));
    return (slug: string) => map.get(slug) ?? slug;
  }, [categories]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Nominations</h1>
          <p className="text-sm text-ink-muted">
            {loading
              ? "Loading…"
              : `${rows.length}${hasMore ? "+" : ""} nomination${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {session?.role === "admin" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadXlsx(category || undefined)}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReport(category || undefined)}
            >
              <FileText className="h-4 w-4" /> PDF report
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCsv(category || undefined)}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:border-gold/60"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-line bg-bg px-4 py-2.5 text-sm capitalize text-ink outline-none focus:border-gold/60"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="bg-bg-raised/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Nominator</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Submitted</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => router.push(`/admin/nominations/${r.id}`)}
                className="cursor-pointer border-t border-line transition-colors hover:bg-bg-raised/40"
              >
                <td className="px-4 py-3 text-ink">{catName(r.category_slug)}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {r.nominator_name ?? "—"}
                  <span className="block text-xs text-ink-muted/60">{r.nominator_contact}</span>
                </td>
                <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">
                  {new Date(r.created_at).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-muted">
                  No nominations match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
