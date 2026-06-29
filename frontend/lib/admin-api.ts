/* Token-aware client for the admin/judging endpoints. */
import { API_BASE } from "./api";

const TOKEN_KEY = "rca_admin_token";
const ROLE_KEY = "rca_admin_role";
const EMAIL_KEY = "rca_admin_email";

export type Session = { token: string; role: "admin" | "judge"; email: string };

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY) as Session["role"] | null;
  const email = localStorage.getItem(EMAIL_KEY);
  return token && role && email ? { token, role, email } : null;
}

function setSession(s: Session) {
  localStorage.setItem(TOKEN_KEY, s.token);
  localStorage.setItem(ROLE_KEY, s.role);
  localStorage.setItem(EMAIL_KEY, s.email);
}

export function clearSession() {
  [TOKEN_KEY, ROLE_KEY, EMAIL_KEY].forEach((k) => localStorage.removeItem(k));
}

export class AuthError extends Error {}

export async function login(email: string, password: string): Promise<Session> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new AuthError("Incorrect email or password");
  const data = (await res.json()) as { access_token: string; role: Session["role"]; email: string };
  const session: Session = { token: data.access_token, role: data.role, email: data.email };
  setSession(session);
  return session;
}

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = getSession();
  if (!session) throw new AuthError("Not authenticated");
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
      Authorization: `Bearer ${session.token}`,
    },
  });
  if (res.status === 401) {
    clearSession();
    throw new AuthError("Session expired");
  }
  return res;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const msg = typeof detail?.detail === "string" ? detail.detail : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

// --- Types --------------------------------------------------------------------

export type NominationListItem = {
  id: number;
  category_slug: string;
  nominator_name: string | null;
  nominator_contact: string | null;
  status: string;
  created_at: string;
};

export type FileRef = { field_key: string; url: string; kind?: string | null };

export type NominationDetail = NominationListItem & {
  residency: string | null;
  answers: Record<string, string | number>;
  files: FileRef[];
};

export type LeaderboardEntry = {
  nomination_id: number;
  nominee: string | null;
  average_total: number;
  judge_count: number;
  status: string;
};

export type NomineeOut = {
  id: number;
  category_slug: string;
  display_name: string;
  summary: string | null;
  photo_url: string | null;
  vote_count: number;
  is_winner: boolean;
};

// --- Endpoints ----------------------------------------------------------------

export async function listNominations(params: {
  category?: string;
  status?: string;
}): Promise<NominationListItem[]> {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.status) q.set("status", params.status);
  return json(await adminFetch(`/admin/nominations?${q.toString()}`));
}

export async function getNomination(id: number): Promise<NominationDetail> {
  return json(await adminFetch(`/admin/nominations/${id}`));
}

export async function updateStatus(id: number, status: string): Promise<NominationListItem> {
  return json(
    await adminFetch(`/admin/nominations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  );
}

export async function submitScore(
  id: number,
  criteria: Record<string, number>
): Promise<{ total: number }> {
  return json(
    await adminFetch(`/admin/nominations/${id}/scores`, {
      method: "POST",
      body: JSON.stringify({ criteria }),
    })
  );
}

export async function getLeaderboard(slug: string): Promise<LeaderboardEntry[]> {
  return json(await adminFetch(`/admin/categories/${slug}/leaderboard`));
}

export async function shortlistNomination(id: number): Promise<NomineeOut> {
  return json(await adminFetch(`/admin/nominations/${id}/shortlist`, { method: "POST" }));
}

export async function listNominees(category?: string): Promise<NomineeOut[]> {
  const q = category ? `?category=${category}` : "";
  return json(await adminFetch(`/admin/nominees${q}`));
}

export async function createNominee(payload: {
  category_slug: string;
  display_name: string;
  summary?: string;
}): Promise<NomineeOut> {
  return json(
    await adminFetch(`/admin/nominees`, { method: "POST", body: JSON.stringify(payload) })
  );
}

export async function setWinner(id: number, isWinner: boolean): Promise<NomineeOut> {
  return json(
    await adminFetch(`/admin/nominees/${id}?is_winner=${isWinner}`, { method: "PATCH" })
  );
}

export type AdminSettings = {
  voting_opens_at: string | null;
  voting_closes_at: string | null;
  voting_results_public: boolean;
};

export async function getSettings(): Promise<AdminSettings> {
  return json(await adminFetch(`/admin/settings`));
}

export async function updateSettings(
  payload: Partial<AdminSettings>
): Promise<AdminSettings> {
  return json(
    await adminFetch(`/admin/settings`, { method: "PUT", body: JSON.stringify(payload) })
  );
}

export async function downloadCsv(category?: string): Promise<void> {
  const q = category ? `?category=${category}` : "";
  const res = await adminFetch(`/admin/nominations/export/csv${q}`);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nominations-${category || "all"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
