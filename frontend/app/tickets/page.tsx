import { useEffect, useState } from "react";
import { getTicketAvailability, bookTicket } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TicketsPage() {
  const [available, setAvailable] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
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
      setSuccess(
        `Your ticket is reserved! Your ticket number is ${result.ticket_number}. Check your inbox for the PDF confirmation.`
      );
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
    <main className="surface-paper min-h-screen">
      <div className="mx-auto max-w-3xl px-5 pb-28 pt-36 sm:px-8">
        <div className="mb-10">
          <span className="eyebrow text-gold-deep">Tickets</span>
          <h1 className="display text-4xl text-graphite">Book your seat at the awards.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">
            Reserve one of 305 tickets for the Redemption City Awards of Excellence. Each booking comes with a PDF ticket sent to your email.
          </p>
          {loading ? (
            <p className="mt-4 text-sm text-ink-muted">Checking availability…</p>
          ) : available ? (
            <p className="mt-4 text-sm text-ink-muted">
              {remaining} ticket{remaining === 1 ? "" : "s"} remaining.
            </p>
          ) : (
            <p className="mt-4 text-sm text-red-500">Tickets are sold out.</p>
          )}
        </div>

        {success ? (
          <div className="rounded-3xl border border-gold/20 bg-gold/10 p-6 text-ink">
            <p className="font-semibold">Success!</p>
            <p className="mt-2 text-sm">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 rounded-3xl border border-line bg-bg-raised/40 p-8">
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

            <Button type="submit" disabled={submitting || !available}>
              {submitting ? "Reserving…" : available ? "Reserve ticket" : "Sold out"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
