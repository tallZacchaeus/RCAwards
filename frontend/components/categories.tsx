import { getCategories } from "@/lib/api";
import { GROUP_LABELS, EVENT, type CategorySummary } from "@/lib/site";
import { SectionHeading } from "./section-heading";
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
    <section id="categories" className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <SectionHeading
        eyebrow="Award Categories"
        title="2026 nomination categories"
        subtitle="Categories celebrating excellent people, places, and organisations in Redemption City and across RCCG."
      />

      <div className="mt-16 flex flex-col gap-16">
        {grouped.map((g) => (
          <div key={g.group}>
            <div className="mb-6 flex items-center gap-4">
              <span className="font-display text-sm uppercase tracking-[0.3em] text-gold">
                {g.label}
              </span>
              <span className="hairline flex-1" />
              <span className="text-xs text-ink-muted">{g.items.length}</span>
            </div>

            <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((cat) => (
                <CategoryCard key={cat.slug} category={cat} />
              ))}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: CategorySummary }) {
  return (
    <a
      href={EVENT.nominateUrl}
      className="group relative flex flex-col gap-3 rounded-2xl border border-line bg-bg-raised/50 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:bg-bg-elevated"
    >
      <h3 className="font-serif text-xl leading-snug text-ink transition-colors group-hover:text-gold-hi">
        {category.name}
      </h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">
        {category.description}
      </p>
      <span className="mt-2 text-xs uppercase tracking-[0.25em] text-gold opacity-0 transition-opacity group-hover:opacity-100">
        Nominate →
      </span>
    </a>
  );
}
