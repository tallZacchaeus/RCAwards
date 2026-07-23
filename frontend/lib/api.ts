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

// Server-side renders (marketing pages, generateMetadata, sitemap) run *inside*
// the frontend container. There, the public API_BASE (e.g.
// https://awards.thecitybreed.org/api) has to hairpin back out through the public
// domain to reach the backend — which fails on most single-host Docker/VPS setups
// (no NAT loopback), so the render silently falls back / 404s. For server calls we
// prefer an internal base that reaches the backend directly over the compose
// network (API_INTERNAL_BASE=http://backend:8000), falling back to the public base
// when it isn't set (local dev, where localhost is reachable). In the browser we
// always use the public base — client code can't resolve the internal hostname.
const SERVER_API_BASE =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_BASE || API_BASE
    : API_BASE;

// Cap how long a server render waits on the API. Without this, an up-but-slow
// backend (cold DB, launch-night load) hangs the whole page's TTFB. The callers
// below already fall back gracefully when the fetch throws (incl. on timeout).
const FETCH_TIMEOUT_MS = 3500;

/** Fetch live categories from the backend, falling back to the static list
 *  when the API is unreachable (e.g. at build time or offline). */
export async function getCategories(): Promise<CategorySummary[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/categories`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
    const res = await fetch(`${SERVER_API_BASE}/categories/${slug}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
    const res = await fetch(`${SERVER_API_BASE}/voting/status`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error();
    return (await res.json()) as VotingStatus;
  } catch {
    return { open: false, opens_at: null, closes_at: null, results_public: true };
  }
}

export async function getNominees(categorySlug: string): Promise<Nominee[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/nominees?category=${categorySlug}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    return (await res.json()) as Nominee[];
  } catch {
    return [];
  }
}

export type VoteOutcome =
  | { ok: true; voteCount: number }
  | { ok: false; status: number; message: string; code?: string };

export async function castVote(
  nomineeId: number,
  fingerprint: string
): Promise<VoteOutcome> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nominee_id: nomineeId, voter_fingerprint: fingerprint }),
    });
  } catch {
    // Network failure / server unreachable — surface it instead of leaving the
    // caller's pending state hanging forever.
    return {
      ok: false,
      status: 0,
      code: "network",
      message: "Could not reach the server. Check your connection and try again.",
    };
  }
  if (res.ok) {
    const data = (await res.json()) as { vote_count: number };
    return { ok: true, voteCount: data.vote_count };
  }
  const detail = await res.json().catch(() => null);
  const body = detail?.detail;
  // Backend returns { detail: { code, message } } for vote conflicts; older
  // endpoints may return a plain string.
  const message =
    typeof body === "string"
      ? body
      : body?.message ?? "Could not record your vote.";
  const code = body && typeof body === "object" ? (body.code as string) : undefined;
  return { ok: false, status: res.status, message, code };
}

export type SubmitResult =
  | { ok: true; id: number }
  | { ok: false; fieldErrors: FieldErrors; message?: string };

export type TicketAvailability = {
  available: boolean;
  remaining: number;
  total: number;
};

export type TicketCreatePayload = {
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  website?: string;
};

export type TicketCreated = {
  id: number;
  ticket_number: string;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  created_at: string;
};

export async function getTicketAvailability(): Promise<TicketAvailability> {
  const res = await fetch(`${API_BASE}/tickets/availability`);
  if (!res.ok) throw new Error("Could not load ticket availability");
  return (await res.json()) as TicketAvailability;
}

export async function bookTicket(
  payload: TicketCreatePayload,
): Promise<TicketCreated> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const message = typeof detail?.detail === "string" ? detail.detail : "Could not complete booking.";
    throw new Error(message);
  }
  return (await res.json()) as TicketCreated;
}

export async function submitNomination(
  categorySlug: string,
  answers: Answers,
  files: FileRef[],
  website = ""
): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/nominations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_slug: categorySlug, answers, files, website }),
    });
  } catch {
    // Network failure — return a result the form can show, never throw (which
    // would leave the submit button stuck disabled and strand the answers).
    return {
      ok: false,
      fieldErrors: {},
      message: "Could not reach the server. Your answers are still here — check your connection and try again.",
    };
  }

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
