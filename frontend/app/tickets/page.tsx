"use client";

import { useEffect, useState } from "react";
import { getTicketAvailability, bookTicket, ticketPdfUrl, type TicketCreated } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { Faq } from "@/components/faq";
import { SiteFooter } from "@/components/site-footer";
import { EVENT } from "@/lib/site";

export default function TicketsPage() {
  const [available, setAvailable] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState<TicketCreated | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTicketAvailability()
      .then((availability) => {
        setAvailable(availability.available);
        setRemaining(availability.remaining);
        setTotal(availability.total);
      })
      .catch(() => {
        setError("Could not load ticket availability. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await bookTicket({
        first_name: firstName,
        last_name: lastName,
        email,
        location,
        website,
      });
      setBooked(result);
      setFirstName("");
      setLastName("");
      setEmail("");
      setLocation("");
      setWebsite("");
      const nextRemaining = Math.max(0, remaining - 1);
      setAvailable(nextRemaining > 0);
      setRemaining(nextRemaining);
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Something went wrong.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="surface-dark min-h-screen pt-28">
        <div className="mx-auto max-w-4xl px-5 pb-28 pt-14 sm:px-8">
          <header className="mb-14 flex flex-col gap-4 border-b border-line/40 pb-10">
            <span className="eyebrow text-gold">Redemption City · Ticket</span>
            <h1 className="display max-w-3xl text-[clamp(2.8rem,5vw,4.5rem)] text-ink">
              reserve your place at the awards.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-ink-muted">
              Book your seat for the 2026 Redemption City Awards
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-ink-muted">Checking availability…</p>
            ) : available ? (
              <p className="mt-4 text-sm text-ink-muted">
                {remaining} ticket{remaining === 1 ? "" : "s"} remaining.
              </p>
            ) : (
              <p className="mt-4 text-sm text-red-400">Tickets are sold out.</p>
            )}
          </header>

          {booked ? (
            <div className="rounded-3xl border border-gold/20 bg-gold/10 p-8 text-ink">
              <p className="font-serif text-xl text-ink">ticket confirmed</p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
                Your ticket is reserved! Your ticket number is{" "}
                <span className="font-semibold text-ink">{booked.ticket_number}</span>. We&apos;ve
                emailed your PDF confirmation to {booked.email} — if it doesn&apos;t arrive, download
                it below and keep it for entry.
              </p>
              <a
                href={ticketPdfUrl(booked.ticket_number, booked.token)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block"
              >
                <Button type="button" className="px-6 py-3 text-base">
                  Download your ticket (PDF)
                </Button>
              </a>
            </div>
          ) : (
            <section className="rounded-[2.5rem] border border-line/50 bg-bg-raised/70 p-8 shadow-[0_35px_120px_-50px_rgba(0,0,0,0.6)] sm:p-10">
              <div className="flex flex-col gap-10">
                <div className="border-b border-line/20 pb-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-4">
                      <span className="display text-2xl text-gold">01</span>
                      <div className="flex flex-col gap-2">
                        <span className="font-serif text-xl text-ink">Your details</span>
                        <p className="text-sm text-ink-muted">
                          Enter your details to reserve {total > 0 ? `one of the ${total}` : "an"} awards {total === 1 ? "ticket" : "tickets"} and receive your PDF pass.
                        </p>
                      </div>
                    </div>
                    <p className="text-sm uppercase tracking-[0.28em] text-ink-muted">
                      
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="sr-only">
                    <Label htmlFor="website">Website</Label>
                    <Textarea
                      id="website"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button
                    type="submit"
                    disabled={submitting || !available}
                    className="w-full py-4 text-base"
                  >
                    {submitting ? "Reserving…" : available ? "Reserve ticket" : "Sold out"}
                  </Button>
                </form>
              </div>
            </section>
          )}
        </div>

        <Faq />
      </main>
      <SiteFooter eventDate={EVENT.dateLabel} />
    </>
  );
}
