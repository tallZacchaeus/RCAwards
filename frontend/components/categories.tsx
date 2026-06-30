import Link from "next/link";
import { getCategories } from "@/lib/api";
import { GROUP_LABELS, type CategorySummary } from "@/lib/site";
import { Reveal } from "./reveal";

const GROUP_ORDER = ["city", "regional", "departmental", "satgo"];

export async function Categories() {
  const categories = await getCategories();
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group] ?? group,
    items: categories.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <section id="categories" className="surface-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        {/* Editorial heading */}
        <Reveal className="flex flex-col gap-4">
          <span className="eyebrow text-gold-deep">Award Categories</span>
          <h2 className="display max-w-3xl text-[clamp(2.5rem,6vw,5rem)] text-graphite">
            twenty-three ways
            <br />
            to be recognised
          </h2>
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
                      <IndexRow key={cat.slug} index={start + i + 1} category={cat} />
                    ))}
                  </ul>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IndexRow({ index, category }: { index: number; category: CategorySummary }) {
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
