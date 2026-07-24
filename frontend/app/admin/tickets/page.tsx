"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listTickets, resendTicketEmail, downloadTicketsCsv, type TicketOut } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";

export default function AdminTicketsPage() {
  const { ready, session } = useAuth();
  const [tickets, setTickets] = useState<TicketOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !session || session.role !== "admin") return;
    listTickets()
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ready, session]);

  async function handleResend(ticketNumber: string) {
    setResending(ticketNumber);
    setError(null);
    setNotice(null);
    try {
      const updated = await resendTicketEmail(ticketNumber);
      setTickets((rows) => rows.map((r) => (r.ticket_number === ticketNumber ? updated : r)));
      setNotice(`Ticket ${ticketNumber} email re-sent.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email.");
    } finally {
      setResending(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Tickets</h1>
          <p className="text-sm text-ink-muted">
            See all bookings, their ticket numbers, and whether the confirmation email was sent.
          </p>
        </div>
        <Button type="button" onClick={() => downloadTicketsCsv().catch((e) => setError(e.message))}>
          Export CSV
        </Button>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && <p className="text-sm text-green-400">{notice}</p>}

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-bg-raised/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Email sent</th>
              <th className="px-4 py-3 font-medium">Checked in</th>
              <th className="px-4 py-3 font-medium">Booked</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{ticket.ticket_number}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {ticket.first_name} {ticket.last_name}
                </td>
                <td className="px-4 py-3 text-ink-muted">{ticket.email}</td>
                <td className="px-4 py-3 text-ink-muted">{ticket.location}</td>
                <td className="px-4 py-3">{ticket.email_sent ? "Yes" : "Pending"}</td>
                <td className="px-4 py-3">
                  {ticket.checked_in ? (
                    <span className="text-green-400">Yes</span>
                  ) : (
                    <span className="text-ink-muted">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(ticket.created_at).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    onClick={() => handleResend(ticket.ticket_number)}
                    disabled={resending === ticket.ticket_number}
                    className="px-3 py-1.5 text-xs"
                  >
                    {resending === ticket.ticket_number ? "Sending…" : "Resend email"}
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                  No tickets have been booked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
