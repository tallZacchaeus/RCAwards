import Link from "next/link";
import { GROUP_LABELS, type CategorySummary } from "@/lib/site";
import { Reveal } from "./reveal";

const DEFAULT_GROUP_ORDER = ["city", "regional", "departmental", "satgo"];

/** The grouped, numbered category list shared by the home Categories section and
 *  the /nominate and /vote pickers. Rows link to `${hrefPrefix}/${slug}`. Groups
 *  are derived from the data, so a category enabled in any group shows up. */
export function CategoryIndex({
  categories,
  hrefPrefix,
  groupOrder = DEFAULT_GROUP_ORDER,
}: {
  categories: CategorySummary[];
  hrefPrefix: string;
  groupOrder?: string[];
}) {
  const grouped = groupOrder
    .map((group) => ({
      group,
      label: GROUP_LABELS[group] ?? group,
      items: categories.filter((c) => c.group === group),
    }))
    .filter((g) => g.items.length > 0);

  return (
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
                  <CategoryRow
                    key={cat.slug}
                    index={start + i + 1}
                    href={`${hrefPrefix}/${cat.slug}`}
                    category={cat}
                  />
                ))}
              </ul>
            </Reveal>
          </div>
        );
      })}
    </div>
  );
}

function CategoryRow({
  index,
  href,
  category,
}: {
  index: number;
  href: string;
  category: CategorySummary;
}) {
  return (
    <li>
      <Link
        href={href}
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
