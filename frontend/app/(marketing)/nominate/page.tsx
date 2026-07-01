import Link from "next/link";
import type { Metadata } from "next";
import { getCategories } from "@/lib/api";
import { GROUP_LABELS, type CategorySummary } from "@/lib/site";
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
    <main className="surface-paper min-h-screen">
      <div className="mx-auto max-w-7xl px-5 pb-28 pt-36 sm:px-8">
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow text-gold-deep">2026 Nominations</span>
          <h1 className="display max-w-3xl text-[clamp(2.5rem,6vw,5rem)] text-graphite">
            choose a category
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate">
            Recognise excellence by nominating your most deserving individuals and
            organisations. You can nominate for as many categories as you like.
          </p>
        </Reveal>

        <div className="mt-16 flex flex-col gap-16">
          {grouped.map((g, gi) => {
            const start = grouped
              .slice(0, gi)
              .reduce((sum, prev) => sum + prev.items.length, 0);
            return (
              <div key={g.group}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="eyebrow text-slate">{g.label}</span>
                  <span className="text-xs text-slate">
                    {String(g.items.length).padStart(2, "0")}
                  </span>
                </div>
                <Reveal>
                  <ul>
                    {g.items.map((cat, i) => (
                      <PickerRow key={cat.slug} index={start + i + 1} category={cat} />
                    ))}
                  </ul>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function PickerRow({ index, category }: { index: number; category: CategorySummary }) {
  return (
    <li>
      <Link
        href={`/nominate/${category.slug}`}
        className="group flex items-center gap-5 border-t border-rule py-5 sm:gap-8"
      >
        <span className="w-8 shrink-0 font-sans text-sm tabular-nums text-slate">
          {String(index).padStart(2, "0")}
        </span>
        <span className="display flex-1 text-[clamp(1.5rem,3.6vw,2.75rem)] text-graphite transition-colors group-hover:text-gold-deep">
          {category.name.toLowerCase()}
        </span>
        <span className="hidden max-w-xs shrink truncate text-sm text-slate md:block">
          {category.description}
        </span>
        <span className="shrink-0 text-gold-deep opacity-0 transition-opacity group-hover:opacity-100">
          →
        </span>
      </Link>
    </li>
  );
}
