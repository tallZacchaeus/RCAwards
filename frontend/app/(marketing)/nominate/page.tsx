import type { Metadata } from "next";
import { getCategories } from "@/lib/api";
import { Reveal } from "@/components/reveal";
import { CategoryIndex } from "@/components/category-index";

export const metadata: Metadata = {
  title: "Nominate — Redemption City Awards of Excellence 2026",
  description: "Choose an award category and nominate the extraordinary.",
};

export default async function NominatePage() {
  const categories = await getCategories();

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

        <CategoryIndex categories={categories} hrefPrefix="/nominate" />
      </div>
    </main>
  );
}
