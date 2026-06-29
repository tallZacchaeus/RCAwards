"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

function Gate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (ready && !session && !isLogin) router.replace("/admin/login");
  }, [ready, session, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
