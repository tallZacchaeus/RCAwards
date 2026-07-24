"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listTickets, type TicketOut } from "@/lib/admin-api";

export default function AdminTicketsPage() {
  const { ready, session } = useAuth();
  const [tickets, setTickets] = useState<TicketOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !session || session.role !== "admin") return;
    listTickets()
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ready, session]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-3xl text-ink">Tickets</h1>
        <p className="text-sm text-ink-muted">
          See all bookings, their ticket numbers, and whether the confirmation email was sent.
        </p>
      </header>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-bg-raised/60 text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Email sent</th>
              <th className="px-4 py-3 font-medium">Booked</th>
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
                <td className="px-4 py-3 text-ink-muted">
                  {new Date(ticket.created_at).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
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
