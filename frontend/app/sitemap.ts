import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories();

  const top: MetadataRoute.Sitemap = ["", "/tickets", "/nominate", "/vote"].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const perCategory: MetadataRoute.Sitemap = categories.flatMap((c) =>
    [`/nominate/${c.slug}`, `/vote/${c.slug}`].map((path) => ({
      url: `${BASE}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [...top, ...perCategory];
}
