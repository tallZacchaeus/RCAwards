import { getCategories } from "@/lib/api";
import { Reveal } from "./reveal";
import { CategoryIndex } from "./category-index";

export async function Categories() {
  const categories = await getCategories();

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

        <CategoryIndex categories={categories} hrefPrefix="/nominate" />
      </div>
    </section>
  );
}
