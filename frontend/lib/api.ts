import { type CategorySummary, FALLBACK_CATEGORIES } from "./site";
import type { Answers, CategoryDetail, FieldErrors, FileRef } from "./forms/types";

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

/** Fetch one category's full form definition. Returns null if unreachable. */
export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/categories/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as CategoryDetail;
  } catch {
    return null;
  }
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_BASE}/uploads`, { method: "POST", body });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `Upload failed (${res.status})`);
  }
  return (await res.json()) as { url: string };
}

export type SubmitResult =
  | { ok: true; id: number }
  | { ok: false; fieldErrors: FieldErrors; message?: string };

export async function submitNomination(
  categorySlug: string,
  answers: Answers,
  files: FileRef[]
): Promise<SubmitResult> {
  const res = await fetch(`${API_BASE}/nominations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category_slug: categorySlug, answers, files }),
  });

  if (res.status === 201) {
    const data = (await res.json()) as { id: number };
    return { ok: true, id: data.id };
  }

  const detail = await res.json().catch(() => null);
  // Backend shape: { detail: { field_errors: {...} } } for 422.
  const fieldErrors: FieldErrors =
    detail?.detail?.field_errors ?? {};
  const message =
    typeof detail?.detail === "string"
      ? detail.detail
      : "Could not submit. Please review the highlighted fields.";
  return { ok: false, fieldErrors, message };
}
