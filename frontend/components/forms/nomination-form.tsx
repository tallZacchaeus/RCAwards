"use client";

import { useState } from "react";
import Link from "next/link";
import { Lottie } from "@/components/lottie";
import type { AnswerValue, CategoryDetail, Answers, FieldErrors, FileRef } from "@/lib/forms/types";
import { OTHER_SUFFIX } from "@/lib/forms/types";
import { validateForm } from "@/lib/forms/validate";
import { submitNomination } from "@/lib/api";
import { fireConfetti } from "@/lib/confetti";
import { Button } from "@/components/ui/button";
import { FieldRenderer } from "./field-renderer";
import { Honeypot } from "./honeypot";

export function NominationForm({ category }: { category: CategoryDetail }) {
  const form = category.form;
  const [answers, setAnswers] = useState<Answers>({});
  const [files, setFiles] = useState<Record<string, { url: string; filename?: string }>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string>();
  const [hp, setHp] = useState("");

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
    const result = await submitNomination(form.slug, answers, fileRefs, hp);
    setSubmitting(false);

    if (result.ok) {
      setDoneId(result.id);
      fireConfetti();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrors(result.fieldErrors);
      setFormError(result.message);
      if (Object.keys(result.fieldErrors).length) focusFirstError(result.fieldErrors);
    }
  }

  if (doneId !== null) {
    return (
      <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-gold/30 bg-bg-raised/60 px-6 py-20 text-center">
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            background: "radial-gradient(55% 45% at 50% 30%, rgba(201,162,75,0.12), transparent)",
          }}
          aria-hidden="true"
        />
        {/* Star watermark */}
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-[0.07]"
          aria-hidden="true"
        >
          <Lottie src="/lottie/star.json" />
        </div>
        <Lottie src="/lottie/success.json" loop={false} className="relative h-20 w-20" />
        <div className="relative flex flex-col gap-2">
          <h2 className="font-serif text-3xl text-ink">Nomination received</h2>
          <p className="mx-auto max-w-md text-ink-muted">
            Thank you for recognising excellence. Your nomination for{" "}
            <span className="text-gold-hi">{category.name}</span> has been submitted
            and will be reviewed by the judging committee.
          </p>
        </div>
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <Button asChild className="btn-shimmer">
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
    <form onSubmit={onSubmit} className="flex flex-col gap-14" noValidate>
      <Honeypot value={hp} onChange={setHp} />
      {form.sections.map((section, si) => (
        <section key={si} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 font-display text-[10px] text-gold">
                {si + 1}
              </span>
              <span className="font-display text-xs uppercase tracking-[0.3em] text-gold">
                {section.title}
              </span>
            </div>
            {section.description && (
              <p className="mt-1 pl-9 text-sm text-ink-muted">{section.description}</p>
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
