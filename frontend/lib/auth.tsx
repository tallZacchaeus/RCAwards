"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type Session,
  clearSession,
  getSession,
  login as apiLogin,
} from "./admin-api";

type AuthState = {
  session: Session | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getSession());
    setReady(true);
  }, []);

  async function login(email: string, password: string) {
    setSession(await apiLogin(email, password));
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
