"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Users,
  ClipboardList,
  Paperclip,
  Clock,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  type NominationAnalytics,
  getNominationAnalytics,
  downloadXlsx,
  downloadReport,
  downloadCsv,
} from "@/lib/admin-api";
import { getCategories } from "@/lib/api";
import type { CategorySummary } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GROUP_LABEL: Record<string, string> = {
  city: "City",
  regional: "Regional",
  departmental: "Departmental",
  satgo: "SATGO",
};

export default function AnalyticsPage() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [category, setCategory] = useState("");
  const [data, setData] = useState<NominationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<null | "xlsx" | "pdf" | "csv">(null);

  // Admins only — judges are bounced back to their review queue.
  useEffect(() => {
    if (ready && session && session.role !== "admin") {
      router.replace("/admin/nominations");
    }
  }, [ready, session, router]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getNominationAnalytics(category || undefined)
      .then((d) => {
        if (!active) return;
        setData(d);
        setError(undefined);
      })
      .catch((e) => active && setError((e as Error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

  async function run(kind: "xlsx" | "pdf" | "csv") {
    setBusy(kind);
    try {
      const scope = category || undefined;
      if (kind === "xlsx") await downloadXlsx(scope);
      else if (kind === "pdf") await downloadReport(scope);
      else await downloadCsv(scope);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const maxCat = data ? Math.max(1, ...data.by_category.map((c) => c.count)) : 1;
  const maxDay = data ? Math.max(1, ...data.timeline.map((d) => d.count)) : 1;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Analytics</h1>
          <p className="text-sm text-ink-muted">
            {loading
              ? "Loading…"
              : data
                ? `Nominations overview · updated ${new Date(data.generated_at).toLocaleString("en-GB")}`
                : "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => run("xlsx")}>
            <FileSpreadsheet className="h-4 w-4" /> {busy === "xlsx" ? "…" : "Excel"}
          </Button>
          <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => run("pdf")}>
            <FileText className="h-4 w-4" /> {busy === "pdf" ? "…" : "PDF report"}
          </Button>
          <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => run("csv")}>
            <Download className="h-4 w-4" /> {busy === "csv" ? "…" : "CSV"}
          </Button>
        </div>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi icon={<ClipboardList className="h-4 w-4" />} label="Nominations" value={data.total} />
            <Kpi icon={<Users className="h-4 w-4" />} label="Unique nominators" value={data.unique_nominators} />
            <Kpi
              icon={<Layers className="h-4 w-4" />}
              label="Categories filled"
              value={`${data.categories_with_entries}/${data.categories_total}`}
            />
            <Kpi icon={<Paperclip className="h-4 w-4" />} label="With evidence" value={data.with_evidence} />
            <Kpi icon={<Clock className="h-4 w-4" />} label="Last 24 hours" value={data.last_24h} />
            <Kpi icon={<Clock className="h-4 w-4" />} label="Last 7 days" value={data.last_7d} />
          </div>

          {/* Status + velocity */}
          <section className="grid gap-6 lg:grid-cols-3">
            <Card title="Status breakdown" className="lg:col-span-1">
              <StatusBars status={data.status} total={data.total} />
            </Card>

            <Card title="By group" className="lg:col-span-2">
              {data.by_group.length === 0 ? (
                <Empty />
              ) : (
                <div className="flex flex-col gap-3">
                  {data.by_group.map((g) => (
                    <Bar
                      key={g.group}
                      label={GROUP_LABEL[g.group] ?? g.group}
                      value={g.count}
                      max={Math.max(1, ...data.by_group.map((x) => x.count))}
                    />
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Timeline */}
          {data.timeline.length > 0 && (
            <Card title="Submissions over time">
              <div className="flex items-end gap-1.5" style={{ height: 96 }}>
                {data.timeline.map((d) => (
                  <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
                    <div
                      className="w-full rounded-t bg-gold/80 transition-colors group-hover:bg-gold"
                      style={{ height: `${Math.max(4, Math.round((d.count / maxDay) * 88))}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-ink-muted">
                <span>{data.timeline[0]?.date}</span>
                <span>{data.timeline[data.timeline.length - 1]?.date}</span>
              </div>
            </Card>
          )}

          {/* Per-category */}
          <Card title={`By category (${data.by_category.length})`}>
            <div className="flex flex-col gap-2.5">
              {data.by_category.map((c) => (
                <Bar key={c.slug} label={c.name} value={c.count} max={maxCat} muted={c.count === 0} />
              ))}
            </div>
            {data.empty_categories.length > 0 && (
              <p className="mt-5 border-t border-line pt-4 text-xs text-ink-muted">
                <span className="font-semibold text-ink">No nominations yet:</span>{" "}
                {data.empty_categories.join(", ")}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-raised/40 p-4">
      <div className="flex items-center gap-2 text-ink-muted">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-serif text-3xl tabular-nums text-ink">{value}</p>
    </div>
  );
}

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-bg-raised/30 p-5", className)}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gold">{title}</h2>
      {children}
    </section>
  );
}

function Bar({
  label,
  value,
  max,
  muted,
}: {
  label: string;
  value: number;
  max: number;
  muted?: boolean;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm text-ink" title={label}>
        {label}
      </span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full", muted ? "bg-line" : "bg-gold")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-ink-muted">{value}</span>
    </div>
  );
}

function StatusBars({
  status,
  total,
}: {
  status: { submitted: number; shortlisted: number; rejected: number };
  total: number;
}) {
  const rows: { label: string; value: number; color: string }[] = [
    { label: "Submitted", value: status.submitted, color: "bg-gold" },
    { label: "Shortlisted", value: status.shortlisted, color: "bg-emerald-500" },
    { label: "Rejected", value: status.rejected, color: "bg-red-500/70" },
  ];
  const max = Math.max(1, total);
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm text-ink">{r.label}</span>
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
            <div
              className={cn("absolute inset-y-0 left-0 rounded-full", r.color)}
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm tabular-nums text-ink-muted">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-ink-muted">No data yet.</p>;
}
