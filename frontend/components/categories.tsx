import Link from "next/link";
import { getCategories } from "@/lib/api";
import { GROUP_LABELS, type CategorySummary } from "@/lib/site";
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

      <div className="mt-16 flex flex-col gap-20">
        {grouped.map((g) => (
          <div key={g.group}>
            <div className="mb-8 flex items-center gap-4">
              <span className="font-display text-sm uppercase tracking-[0.3em] text-gold">
                {g.label}
              </span>
              <span className="hairline flex-1" />
              <span className="rounded-full border border-gold/30 px-3 py-0.5 text-xs text-ink-muted">
                {g.items.length} {g.items.length === 1 ? "category" : "categories"}
              </span>
            </div>

            <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    <Link
      href={`/nominate/${category.slug}`}
      className="group relative flex flex-col gap-3 rounded-2xl border border-line bg-bg-raised/50 p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40 hover:bg-bg-elevated hover:shadow-[0_8px_32px_-8px_rgba(201,162,75,0.2)]"
      style={{
        backdropFilter: "blur(0px)",
        WebkitBackdropFilter: "blur(0px)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.5s ease",
      }}
    >
      {/* Inner glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(201,162,75,0.08), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Status badges */}
      {(category.nominations_open || category.voting_enabled) && (
        <div className="flex gap-2">
          {category.nominations_open && (
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gold">
              Open
            </span>
          )}
          {category.voting_enabled && (
            <span className="rounded-full bg-gold-hi/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gold-hi">
              Voting
            </span>
          )}
        </div>
      )}

      <h3 className="font-serif text-xl leading-snug text-ink transition-colors duration-300 group-hover:text-gold-hi">
        {category.name}
      </h3>
      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
        {category.description}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.25em] text-gold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
          Nominate →
        </span>
        <span className="h-6 w-6 rounded-full border border-gold/30 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 text-gold text-xs">
          ›
        </span>
      </div>

      {/* Bottom gold line reveal */}
      <div
        className="absolute bottom-0 left-6 right-6 h-px origin-left scale-x-0 rounded-full bg-gradient-to-r from-gold-deep via-gold to-transparent transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden="true"
      />
    </Link>
  );
}
