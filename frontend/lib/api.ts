import { type CategorySummary, FALLBACK_CATEGORIES } from "./site";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/** Fetch live categories from the backend, falling back to the static list
 *  when the API is unreachable (e.g. at build time or offline). */
export async function getCategories(): Promise<CategorySummary[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as CategorySummary[];
    return data.length ? data : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function subscribe(email: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Signup failed (${res.status})`);
  const data = (await res.json()) as { subscribed: boolean };
  return data.subscribed;
}
