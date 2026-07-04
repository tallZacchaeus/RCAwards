"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  type NominationDetail,
  getMyScore,
  getNomination,
  shortlistNomination,
  submitScore,
  updateStatus,
} from "@/lib/admin-api";
import { getCategory } from "@/lib/api";
import type { CategoryDetail, FormField } from "@/lib/forms/types";
import { allFields } from "@/lib/forms/types";
import { StatusBadge } from "@/components/admin/status-badge";
import { LinearScale } from "@/components/forms/linear-scale";
import { Button } from "@/components/ui/button";

const STATUSES = ["submitted", "shortlisted", "rejected"];

export default function NominationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nominationId = Number(id);
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";

  const [nom, setNom] = useState<NominationDetail | null>(null);
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [shortlisting, setShortlisting] = useState(false);
  const [savingScores, setSavingScores] = useState(false);

  useEffect(() => {
    getNomination(nominationId)
      .then((n) => {
        setNom(n);
        return getCategory(n.category_slug);
      })
      .then((c) => setCategory(c))
      .catch((e) => setLoadError(e.message));
    // Prefill the judge's own existing scores so re-scoring doesn't start blank.
    getMyScore(nominationId)
      .then((s) => {
        if (s?.criteria) setScores(s.criteria);
      })
      .catch(() => {});
  }, [nominationId]);

  // Only a load failure replaces the page; action failures show inline (below)
  // so an in-progress score is never wiped by a transient error.
  if (loadError) return <p className="text-sm text-red-400">{loadError}</p>;
  if (!nom) return <p className="text-ink-muted">Loading…</p>;

  const fields = category ? allFields(category.form) : [];
  const labelFor = (key: string) =>
    fields.find((f) => f.key === key)?.label ?? key;
  const criteria: FormField[] = fields.filter((f) => f.type === "linear_scale_1_10");
  const fileFor = (key: string) => nom.files.find((f) => f.field_key === key);

  async function changeStatus(status: string) {
    setNotice(undefined);
    setActionError(undefined);
    try {
      const updated = await updateStatus(nominationId, status);
      setNom((prev) => (prev ? { ...prev, status: updated.status } : prev));
      setNotice(`Status set to ${status}.`);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function shortlist() {
    if (shortlisting) return;
    setNotice(undefined);
    setActionError(undefined);
    setShortlisting(true);
    try {
      await shortlistNomination(nominationId);
      setNom((prev) => (prev ? { ...prev, status: "shortlisted" } : prev));
      setNotice("Added to the voting slate as a nominee.");
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setShortlisting(false);
    }
  }

  async function saveScores() {
    if (savingScores) return;
    setNotice(undefined);
    setActionError(undefined);
    setSavingScores(true);
    try {
      const result = await submitScore(nominationId, scores);
      setNotice(`Score saved (total ${result.total}).`);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setSavingScores(false);
    }
  }

  const scoredCount = Object.keys(scores).length;
  const criteriaCount = criteria.length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link
        href="/admin/nominations"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> Back to nominations
      </Link>

      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <StatusBadge status={nom.status} />
          <span className="text-xs text-ink-muted">
            #{nom.id} · {new Date(nom.created_at).toLocaleString("en-GB")}
          </span>
        </div>
        <h1 className="font-serif text-3xl text-ink">
          {category?.name ?? nom.category_slug}
        </h1>
        <p className="text-sm text-ink-muted">
          Nominator: {nom.nominator_name ?? "—"} · {nom.nominator_contact ?? "—"}
          {nom.residency ? ` · Resident: ${nom.residency}` : ""}
        </p>
      </header>

      {notice && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-hi">
          {notice}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {actionError}
        </p>
      )}

      {/* Answers */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xs uppercase tracking-[0.3em] text-gold">
          Submission
        </h2>
        <dl className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {Object.entries(nom.answers)
            .filter(([k]) => !k.endsWith("__other"))
            .map(([key, value]) => {
              const file = fileFor(key);
              return (
                <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_1.4fr]">
                  <dt className="text-xs uppercase tracking-wider text-ink-muted">
                    {labelFor(key)}
                  </dt>
                  <dd className="text-sm text-ink">
                    {file ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-gold hover:text-gold-hi"
                      >
                        View file <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      String(value)
                    )}
                  </dd>
                </div>
              );
            })}
        </dl>
      </section>

      {/* Scoring (judge or admin) */}
      {criteria.length > 0 && (
        <section className="flex flex-col gap-5 rounded-2xl border border-line bg-bg-raised/40 p-6">
          <h2 className="font-display text-xs uppercase tracking-[0.3em] text-gold">
            Your scores
          </h2>
          {criteria.map((c) => (
            <div key={c.key} className="flex flex-col gap-2">
              <span className="text-sm text-ink">{c.label}</span>
              <LinearScale
                value={scores[c.key]}
                onChange={(n) => setScores((prev) => ({ ...prev, [c.key]: n }))}
              />
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <Button
              onClick={saveScores}
              disabled={scoredCount === 0 || savingScores}
              size="sm"
              className="self-start"
            >
              {savingScores ? "Saving…" : "Save scores"}
            </Button>
            {criteriaCount > 0 && scoredCount < criteriaCount && (
              <p className="text-xs text-ink-muted">
                {scoredCount} of {criteriaCount} criteria scored. Saving keeps any
                criteria you leave blank at their previous value.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-raised/40 p-6">
          <h2 className="font-display text-xs uppercase tracking-[0.3em] text-gold">
            Decision
          </h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={nom.status === s ? "primary" : "outline"}
                size="sm"
                onClick={() => changeStatus(s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
          <div className="border-t border-line pt-4">
            <Button variant="outline" size="sm" onClick={shortlist} disabled={shortlisting}>
              <Star className="h-4 w-4" /> {shortlisting ? "Adding…" : "Add to voting slate"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
