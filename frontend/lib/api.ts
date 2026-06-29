import { type CategorySummary, FALLBACK_CATEGORIES } from "./site";
import type {
  Answers,
  CategoryDetail,
  FieldErrors,
  FileRef,
  Nominee,
  VotingStatus,
} from "./forms/types";

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

export async function subscribe(email: string, website = ""): Promise<boolean> {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, website }),
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

export async function getVotingStatus(): Promise<VotingStatus> {
  try {
    const res = await fetch(`${API_BASE}/voting/status`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error();
    return (await res.json()) as VotingStatus;
  } catch {
    return { open: false, opens_at: null, closes_at: null, results_public: true };
  }
}

export async function getNominees(categorySlug: string): Promise<Nominee[]> {
  try {
    const res = await fetch(`${API_BASE}/nominees?category=${categorySlug}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    return (await res.json()) as Nominee[];
  } catch {
    return [];
  }
}

export type VoteOutcome =
  | { ok: true; voteCount: number }
  | { ok: false; status: number; message: string };

export async function castVote(
  nomineeId: number,
  fingerprint: string
): Promise<VoteOutcome> {
  const res = await fetch(`${API_BASE}/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nominee_id: nomineeId, voter_fingerprint: fingerprint }),
  });
  if (res.ok) {
    const data = (await res.json()) as { vote_count: number };
    return { ok: true, voteCount: data.vote_count };
  }
  const detail = await res.json().catch(() => null);
  const message =
    typeof detail?.detail === "string" ? detail.detail : "Could not record your vote.";
  return { ok: false, status: res.status, message };
}

export type SubmitResult =
  | { ok: true; id: number }
  | { ok: false; fieldErrors: FieldErrors; message?: string };

export async function submitNomination(
  categorySlug: string,
  answers: Answers,
  files: FileRef[],
  website = ""
): Promise<SubmitResult> {
  const res = await fetch(`${API_BASE}/nominations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category_slug: categorySlug, answers, files, website }),
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
