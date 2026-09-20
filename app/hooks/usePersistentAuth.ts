"use client";

import { useCallback, useEffect, useState } from "react";

export interface UserSession {
  isLoggedIn: boolean;
  address: string;
  demoBalance: number;
  positions: any[];
  email?: string;
}

const DEFAULT_SESSION: UserSession = {
  isLoggedIn: false,
  address: "",
  demoBalance: 10000,
  positions: [],
};

async function readJson(res: Response) {
  const text = await res.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `Server returned an invalid response (${res.status}).`,
    };
  }
}

export function usePersistentAuth() {
  const [session, setSession] = useState<UserSession>(DEFAULT_SESSION);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hexagonal_dex_session");

      if (saved) {
        setSession(JSON.parse(saved));
      }
    } catch {
      setSession(DEFAULT_SESSION);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem("hexagonal_dex_session", JSON.stringify(session));
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }, [session, hydrated]);

  const restoreServerSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await readJson(res);

      if (!res.ok || !data.authenticated) {
        setSession(DEFAULT_SESSION);
        return false;
      }

      setSession((prev) => ({
        ...prev,
        isLoggedIn: true,
        address: data.email || prev.address,
        email: data.email || prev.email,
      }));

      return true;
    } catch {
      setSession(DEFAULT_SESSION);
      return false;
    }
  }, []);

  const authRequest = useCallback(
    async (
      path: "login" | "register",
      payload: Record<string, string>,
      fallbackError: string
    ) => {
      const res = await fetch(`/api/auth/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(data.error || fallbackError);
      }

      const email = String(data.email || payload.email);

      setSession((prev) => ({
        ...prev,
        isLoggedIn: true,
        address: email,
        email,
      }));

      return true;
    },
    []
  );

  // Returning users: email + password only.
  const login = useCallback(
    (email: string, password: string) =>
      authRequest("login", { email, password }, "Invalid email or password."),
    [authRequest]
  );

  // First time only: email + one-time access code + a new password.
  const register = useCallback(
    (email: string, code: string, password: string) =>
      authRequest("register", { email, code, password }, "Registration failed."),
    [authRequest]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setSession(DEFAULT_SESSION);

    try {
      localStorage.removeItem("hexagonal_dex_session");
    } catch {}
  }, []);

  const updateBalance = useCallback((newBalance: number) => {
    setSession((prev) => ({
      ...prev,
      demoBalance: newBalance,
    }));
  }, []);

  return {
    session,
    login,
    register,
    logout,
    updateBalance,
    restoreServerSession,
    setSession,
  };
}
