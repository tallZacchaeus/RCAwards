"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Trophy, Star, Settings, BarChart3, Layers, ScanLine, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Nominations", href: "/admin/nominations", icon: ClipboardList, adminOnly: false },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, adminOnly: true },
  { label: "Leaderboard", href: "/admin/leaderboard", icon: Trophy, adminOnly: false },
  { label: "Tickets", href: "/admin/tickets", icon: Layers, adminOnly: true },
  { label: "Check-in", href: "/admin/checkin", icon: ScanLine, adminOnly: true },
  { label: "Nominees", href: "/admin/nominees", icon: Star, adminOnly: true },
  { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const items = NAV.filter((n) => !n.adminOnly || session?.role === "admin");

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-bg-raised/50 p-5 md:flex">
        <Link href="/admin/nominations" className="mb-8 flex flex-col leading-none">
          <span className="font-display text-sm font-bold tracking-[0.3em] text-ink">
            CITY<span className="text-gold">BREED</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.3em] text-ink-muted">
            Awards Console
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-gold/10 text-gold-hi"
                    : "text-ink-muted hover:bg-bg-elevated hover:text-ink"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex flex-col">
            <span className="truncate text-sm text-ink">{session?.email}</span>
            <span className="text-xs uppercase tracking-wider text-gold">{session?.role}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-ink-muted transition-colors hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
          <span className="font-display text-sm font-bold tracking-[0.2em] text-ink">
            CITY<span className="text-gold">BREED</span> Console
          </span>
          <button onClick={logout} className="text-xs text-ink-muted hover:text-red-400">
            Sign out
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 md:hidden">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-colors",
                  active ? "bg-gold/10 text-gold-hi" : "text-ink-muted hover:text-gold"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">
          {/* Re-mount keyed by route so each admin page fades in on navigation. */}
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
