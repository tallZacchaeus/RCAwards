"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const { login, session, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace("/admin/nominations");
  }, [ready, session, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await login(email, password);
      router.replace("/admin/nominations");
    } catch {
      setError("Incorrect email or password.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <span className="font-display text-lg font-bold tracking-[0.3em] text-ink">
            CITY<span className="text-gold">BREED</span>
          </span>
          <span className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            Awards Console
          </span>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-3xl border border-line bg-bg-raised/50 p-7"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
