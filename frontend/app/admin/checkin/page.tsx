"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { checkInTicket, listTickets, type TicketOut, type TicketCheckInResult } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Banner =
  | { kind: "ok"; text: string }
  | { kind: "warn"; text: string }
  | { kind: "error"; text: string };

/** Parse a scanned QR value of the form `RCAE-001|<token>`. */
function parseScan(raw: string): { number: string; token?: string } {
  const [number, token] = raw.split("|");
  return { number: (number ?? "").trim(), token: token?.trim() || undefined };
}

export default function AdminCheckinPage() {
  const { ready, session } = useAuth();
  const isAdmin = ready && session?.role === "admin";

  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [banner, setBanner] = useState<Banner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanSupported, setScanSupported] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TicketOut[]>([]);
  const [searching, setSearching] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false); // a check-in request is in flight / cooling down

  // BarcodeDetector is available in Chromium/Android but not Safari/iOS; when
  // absent we fall back to name-search only.
  useEffect(() => {
    setScanSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const all = await listTickets();
      setStats({ total: all.length, checkedIn: all.filter((t) => t.checked_in).length });
    } catch {
      /* non-fatal — counter just won't update */
    }
  }, []);

  useEffect(() => {
    if (isAdmin) refreshStats();
  }, [isAdmin, refreshStats]);

  const applyResult = useCallback((r: TicketCheckInResult) => {
    const name = `${r.ticket.first_name} ${r.ticket.last_name}`;
    if (r.checked_in_now) {
      setBanner({ kind: "ok", text: `✓ ${name} (${r.ticket.ticket_number}) checked in` });
      setStats((s) => ({ ...s, checkedIn: s.checkedIn + 1 }));
    } else {
      const when = r.ticket.checked_in_at
        ? new Date(r.ticket.checked_in_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : "earlier";
      setBanner({ kind: "warn", text: `⚠ ${name} (${r.ticket.ticket_number}) was already checked in at ${when}` });
    }
  }, []);

  const doCheckIn = useCallback(
    async (ticketNumber: string, token?: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const result = await checkInTicket(ticketNumber, token);
        applyResult(result);
        // keep any visible search row in sync with its new checked-in state
        setResults((rows) =>
          rows.map((row) => (row.ticket_number === ticketNumber ? result.ticket : row)),
        );
      } catch (err) {
        setBanner({ kind: "error", text: err instanceof Error ? err.message : "Check-in failed" });
      } finally {
        // brief cooldown so a QR held in frame isn't scanned repeatedly
        setTimeout(() => {
          busyRef.current = false;
        }, 2000);
      }
    },
    [applyResult],
  );

  // Camera scan loop
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    let raf = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detector: any = null;

    async function start() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        setBanner({
          kind: "error",
          text: err instanceof Error ? `Camera unavailable: ${err.message}` : "Camera unavailable",
        });
        setScanning(false);
      }
    }

    async function tick() {
      if (cancelled || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length && !busyRef.current) {
          const { number, token } = parseScan(codes[0].rawValue);
          if (number) await doCheckIn(number, token);
        }
      } catch {
        /* transient detect errors are fine — keep looping */
      }
      raf = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [scanning, doCheckIn]);

  async function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    try {
      setResults(await listTickets(query));
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "Search failed" });
    } finally {
      setSearching(false);
    }
  }

  if (!isAdmin) {
    return <p className="text-sm text-ink-muted">Admin access required.</p>;
  }

  const bannerClass =
    banner?.kind === "ok"
      ? "border-green-500/40 bg-green-500/10 text-green-300"
      : banner?.kind === "warn"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-red-500/40 bg-red-500/10 text-red-300";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-ink">Door check-in</h1>
        <p className="text-sm text-ink-muted">
          Scan a guest&apos;s ticket QR, or search their name if the QR won&apos;t scan.
        </p>
        <p className="text-sm text-ink">
          <span className="font-semibold text-gold">{stats.checkedIn}</span> of {stats.total} booked
          guests checked in
        </p>
      </header>

      {banner && (
        <div className={`rounded-2xl border p-5 text-base font-medium ${bannerClass}`}>{banner.text}</div>
      )}

      {/* QR scanner */}
      <section className="flex flex-col gap-4 rounded-2xl border border-line p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">Scan QR</h2>
          {scanSupported ? (
            <Button type="button" onClick={() => setScanning((s) => !s)}>
              {scanning ? "Stop camera" : "Start camera"}
            </Button>
          ) : (
            <span className="text-xs text-ink-muted">Not supported on this browser — use search below</span>
          )}
        </div>
        {scanning && (
          <div className="overflow-hidden rounded-xl border border-line bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} className="mx-auto max-h-[60vh] w-full object-contain" muted playsInline />
          </div>
        )}
      </section>

      {/* Name search fallback */}
      <section className="flex flex-col gap-4 rounded-2xl border border-line p-5">
        <h2 className="font-serif text-xl text-ink">Search by name</h2>
        <form onSubmit={runSearch} className="flex gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email or ticket number"
            className="flex-1"
          />
          <Button type="submit" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </form>

        {results.length > 0 && (
          <ul className="flex flex-col divide-y divide-line">
            {results.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-ink">
                    {t.first_name} {t.last_name}{" "}
                    <span className="text-ink-muted">· {t.ticket_number}</span>
                  </p>
                  <p className="truncate text-xs text-ink-muted">{t.email}</p>
                </div>
                {t.checked_in ? (
                  <span className="shrink-0 text-xs font-medium text-green-400">Checked in</span>
                ) : (
                  <Button type="button" onClick={() => doCheckIn(t.ticket_number)}>
                    Check in
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
