/* Client-only helpers: a stable per-device id (one half of the anti-fraud
   signal; the server hashes the IP for the other half) and a record of which
   categories this device has already voted in, for instant UX. */

const DEVICE_KEY = "rca_device_id";
const VOTED_KEY = "rca_voted";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function readVoted(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Returns the nominee id this device voted for in `categorySlug`, if any. */
export function getVotedNominee(categorySlug: string): number | undefined {
  return readVoted()[categorySlug];
}

export function rememberVote(categorySlug: string, nomineeId: number): void {
  if (typeof window === "undefined") return;
  const voted = readVoted();
  voted[categorySlug] = nomineeId;
  localStorage.setItem(VOTED_KEY, JSON.stringify(voted));
}
