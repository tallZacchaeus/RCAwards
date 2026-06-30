import Link from "next/link";
import type { Metadata } from "next";
import { getCategories } from "@/lib/api";
import { GROUP_LABELS, type CategorySummary } from "@/lib/site";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Nominate — Redemption City Awards of Excellence 2026",
  description: "Choose an award category and nominate the extraordinary.",
};

const GROUP_ORDER = ["city", "regional", "departmental", "satgo"];

export default async function NominatePage() {
  const categories = await getCategories();
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group] ?? group,
    items: categories.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-36 sm:px-8">
      <SectionHeading
        eyebrow="2026 Nominations"
        title="Choose a category"
        subtitle="Recognise excellence by nominating your most deserving individuals and organisations. You can nominate for as many categories as you like."
      />

      <div className="mt-16 flex flex-col gap-14">
        {grouped.map((g) => (
          <div key={g.group}>
            <div className="mb-6 flex items-center gap-4">
              <span className="font-display text-sm uppercase tracking-[0.3em] text-gold">
                {g.label}
              </span>
              <span className="hairline flex-1" />
            </div>
            <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((cat) => (
                <PickerCard key={cat.slug} category={cat} />
              ))}
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}

function PickerCard({ category }: { category: CategorySummary }) {
  return (
    <Link
      href={`/nominate/${category.slug}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-bg-raised/50 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:bg-bg-elevated hover:shadow-[0_8px_32px_-8px_rgba(201,162,75,0.2)]"
    >
      {/* Bottom sweep accent */}
      <div
        className="absolute bottom-0 inset-x-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold via-gold-bright to-transparent transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden="true"
      />
      <h3 className="font-serif text-xl leading-snug text-ink transition-colors group-hover:text-gold-hi">
        {category.name}
      </h3>
      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
        {category.description}
      </p>
      <span className="mt-2 flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-gold opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
        Nominate →
      </span>
    </Link>
  );
}
