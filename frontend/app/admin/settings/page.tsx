"use client";

import { useEffect, useState } from "react";
import { type AdminSettings, getSettings, updateSettings } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** ISO string → value for <input type="datetime-local"> (YYYY-MM-DDTHH:mm). */
function toLocalInput(iso: string | null): string {
  return iso ? iso.slice(0, 16) : "";
}

export default function SettingsPage() {
  const [opens, setOpens] = useState("");
  const [closes, setCloses] = useState("");
  const [resultsPublic, setResultsPublic] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setOpens(toLocalInput(s.voting_opens_at));
        setCloses(toLocalInput(s.voting_closes_at));
        setResultsPublic(s.voting_results_public);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(undefined);
    setError(undefined);
    try {
      const payload: Partial<AdminSettings> = {
        voting_opens_at: opens ? `${opens}:00` : "",
        voting_closes_at: closes ? `${closes}:00` : "",
        voting_results_public: resultsPublic,
      };
      await updateSettings(payload);
      setNotice("Settings saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">
          Control the public voting window and whether live results are shown.
        </p>
      </header>

      {!loaded ? (
        <p className="text-ink-muted">Loading…</p>
      ) : (
        <form
          onSubmit={save}
          className="flex flex-col gap-5 rounded-2xl border border-line bg-bg-raised/40 p-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="opens">Voting opens</Label>
            <input
              id="opens"
              type="datetime-local"
              value={opens}
              onChange={(e) => setOpens(e.target.value)}
              className="rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-gold/60 [color-scheme:dark]"
            />
            <p className="text-xs text-ink-muted">Leave blank to open immediately.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="closes">Voting closes</Label>
            <input
              id="closes"
              type="datetime-local"
              value={closes}
              onChange={(e) => setCloses(e.target.value)}
              className="rounded-xl border border-line bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-gold/60 [color-scheme:dark]"
            />
            <p className="text-xs text-ink-muted">Leave blank to keep voting open.</p>
          </div>

          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={resultsPublic}
              onChange={(e) => setResultsPublic(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-gold)]"
            />
            Show live vote counts on the public voting pages
          </label>

          {notice && <p className="text-sm text-gold-hi">{notice}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={busy} size="sm" className="self-start">
            {busy ? "Saving…" : "Save settings"}
          </Button>
        </form>
      )}
    </div>
  );
}
