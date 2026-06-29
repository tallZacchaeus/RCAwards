import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getCategory } from "@/lib/api";
import { GROUP_LABELS } from "@/lib/site";
import { NominationForm } from "@/components/forms/nomination-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return {
    title: category
      ? `Nominate — ${category.name}`
      : "Nominate — Redemption City Awards",
  };
}

export default async function CategoryNominatePage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-28 pt-32 sm:px-8">
      <Link
        href="/nominate"
        className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-gold"
      >
        <ArrowLeft className="h-4 w-4" /> All categories
      </Link>

      {!category ? (
        <Unavailable />
      ) : !category.nominations_open ? (
        <Closed name={category.name} />
      ) : (
        <>
          <header className="mb-12 flex flex-col gap-4 border-b border-line pb-10">
            <span className="font-display text-xs uppercase tracking-[0.3em] text-gold">
              {GROUP_LABELS[category.group] ?? category.group} · Nomination
            </span>
            <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
              {category.name}
            </h1>
            <p className="text-base leading-relaxed text-ink-muted">
              {category.description}
            </p>
          </header>

          <NominationForm category={category} />
        </>
      )}
    </div>
  );
}

function Unavailable() {
  return (
    <div className="rounded-3xl border border-line bg-bg-raised/50 px-6 py-16 text-center">
      <h1 className="font-serif text-3xl text-ink">Category not found</h1>
      <p className="mt-3 text-ink-muted">
        This category may be unavailable, or the nomination service is offline.
        Please return to the full list of categories.
      </p>
      <Link
        href="/nominate"
        className="mt-6 inline-block text-sm uppercase tracking-[0.2em] text-gold hover:text-gold-hi"
      >
        View all categories →
      </Link>
    </div>
  );
}

function Closed({ name }: { name: string }) {
  return (
    <div className="rounded-3xl border border-line bg-bg-raised/50 px-6 py-16 text-center">
      <h1 className="font-serif text-3xl text-ink">{name}</h1>
      <p className="mt-3 text-ink-muted">
        Nominations for this category are currently closed. Thank you for your
        interest in celebrating excellence.
      </p>
    </div>
  );
}
