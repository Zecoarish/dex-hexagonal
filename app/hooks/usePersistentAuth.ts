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
  const [session, setSession] =
    useState<UserSession>(DEFAULT_SESSION);

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "hexagonal_dex_session"
      );

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
      localStorage.setItem(
        "hexagonal_dex_session",
        JSON.stringify(session)
      );
    } catch (error) {
      console.error(
        "Failed to save session:",
        error
      );
    }
  }, [session, hydrated]);

  const restoreServerSession = useCallback(
    async () => {
      try {
        const res = await fetch(
          "/api/auth?action=session",
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        const data = await readJson(res);

        if (!res.ok || !data.authenticated) {
          setSession(DEFAULT_SESSION);
          return false;
        }

        setSession((prev) => ({
          ...prev,
          isLoggedIn: true,
          address:
            data.emailMasked || prev.address,
          email: data.emailMasked,
        }));

        return true;
      } catch {
        setSession(DEFAULT_SESSION);
        return false;
      }
    },
    []
  );

  const loginWithCode = useCallback(
    async (
      email: string,
      code: string
    ) => {
      const res = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            code,
          }),
        }
      );

      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Invalid access code."
        );
      }

      setSession((prev) => ({
        ...prev,
        isLoggedIn: true,
        address:
          data.emailMasked || email,
        email:
          data.emailMasked || email,
      }));

      return true;
    },
    []
  );

  const logout = useCallback(
    async () => {
      try {
        await fetch(
          "/api/auth?action=logout",
          {
            method: "POST",
            credentials: "include",
          }
        );
      } catch {}

      setSession(DEFAULT_SESSION);

      try {
        localStorage.removeItem(
          "hexagonal_dex_session"
        );
      } catch {}
    },
    []
  );

  const updateBalance = useCallback(
    (newBalance: number) => {
      setSession((prev) => ({
        ...prev,
        demoBalance: newBalance,
      }));
    },
    []
  );

  return {
    session,
    loginWithCode,
    logout,
    updateBalance,
    restoreServerSession,
    setSession,
  };
    }
