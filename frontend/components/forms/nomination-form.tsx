"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { AnswerValue, CategoryDetail, Answers, FieldErrors, FileRef } from "@/lib/forms/types";
import { OTHER_SUFFIX } from "@/lib/forms/types";
import { validateForm } from "@/lib/forms/validate";
import { submitNomination } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FieldRenderer } from "./field-renderer";

export function NominationForm({ category }: { category: CategoryDetail }) {
  const form = category.form;
  const [answers, setAnswers] = useState<Answers>({});
  const [files, setFiles] = useState<Record<string, { url: string; filename?: string }>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string>();

  function setAnswer(key: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function setFile(key: string, url: string | undefined, filename?: string) {
    setFiles((prev) => {
      const next = { ...prev };
      if (url) next[key] = { url, filename };
      else delete next[key];
      return next;
    });
    setAnswer(key, url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    const clientErrors = validateForm(form, answers);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstError(clientErrors);
      return;
    }

    setSubmitting(true);
    const fileRefs: FileRef[] = Object.entries(files).map(([field_key, f]) => ({
      field_key,
      url: f.url,
    }));
    const result = await submitNomination(form.slug, answers, fileRefs);
    setSubmitting(false);

    if (result.ok) {
      setDoneId(result.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrors(result.fieldErrors);
      setFormError(result.message);
      if (Object.keys(result.fieldErrors).length) focusFirstError(result.fieldErrors);
    }
  }

  if (doneId !== null) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-gold/30 bg-bg-raised/60 px-6 py-16 text-center">
        <CheckCircle2 className="h-14 w-14 text-gold" />
        <h2 className="font-serif text-3xl text-ink">Nomination received</h2>
        <p className="max-w-md text-ink-muted">
          Thank you for recognising excellence. Your nomination for{" "}
          <span className="text-gold-hi">{category.name}</span> has been submitted
          and will be reviewed by the judging committee.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/nominate">Nominate another category</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-12" noValidate>
      {form.sections.map((section, si) => (
        <section key={si} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              Section {si + 1}
            </span>
            <h2 className="font-serif text-2xl text-ink">{section.title}</h2>
            {section.description && (
              <p className="text-sm text-ink-muted">{section.description}</p>
            )}
            <div className="hairline mt-3 w-full" />
          </div>

          <div className="flex flex-col gap-7">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={answers[field.key]}
                otherValue={answers[field.key + OTHER_SUFFIX]}
                fileUrl={files[field.key]?.url}
                error={errors[field.key]}
                otherError={errors[field.key + OTHER_SUFFIX]}
                onChange={(v) => setAnswer(field.key, v)}
                onOtherChange={(v) => setAnswer(field.key + OTHER_SUFFIX, v)}
                onFile={(url, filename) => setFile(field.key, url, filename)}
              />
            ))}
          </div>
        </section>
      ))}

      {formError && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {formError}
        </p>
      )}

      <div className="flex flex-col items-center gap-4">
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Submitting…" : "Submit Nomination"}
        </Button>
        <p className="text-xs text-ink-muted">
          All submissions are reviewed by the award committee.
        </p>
      </div>
    </form>
  );
}

function focusFirstError(errors: FieldErrors) {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return;
  const el = document.getElementById(firstKey.replace(/__other$/, ""));
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLElement).focus?.();
  }
}
