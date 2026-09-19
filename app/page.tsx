"use client";

import React, { FormEvent, useEffect, useState } from "react";
import TradeApp from "./components/TradeApp";
import { HexagonalLogo } from "./components/HexagonalLogo";
import { usePersistentAuth } from "./hooks/usePersistentAuth";

export default function TradePage() {
  const {
    session,
    loginWithCode,
    logout,
    restoreServerSession,
  } = usePersistentAuth();

  const [mode, setMode] = useState<"access" | "waitlist">("access");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void restoreServerSession();
  }, [restoreServerSession]);

  if (session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white">
        <header className="h-14 border-b border-[#1F2937] px-4 flex items-center justify-between">
          <HexagonalLogo />

          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/50 hover:text-red-400"
          >
            Logout
          </button>
        </header>

        <TradeApp />
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    setMessage("");
    setBusy(true);

    try {
      if (mode === "waitlist") {
        const res = await fetch("/api/auth?action=waitlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || "Gagal masuk waitlist."
          );
        }

        setMessage(
          "Request masuk. Tunggu approval admin."
        );
      } else {
        await loginWithCode(email, code);
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <HexagonalLogo
            className="w-16 h-16"
            showText
          />
        </div>

        <div className="bg-[#121820] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl">

          <div className="flex gap-1 p-1 bg-black/30 rounded-xl mb-6">

            <button
              onClick={() => {
                setMode("access");
                setMessage("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm ${
                mode === "access"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400"
              }`}
            >
              Access DEX
            </button>

            <button
              onClick={() => {
                setMode("waitlist");
                setMessage("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm ${
                mode === "waitlist"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400"
              }`}
            >
              Join Waitlist
            </button>

          </div>

          <h1 className="text-2xl font-bold">
            {mode === "access"
              ? "Welcome to HEXAGONAL"
              : "Join the Waitlist"}
          </h1>

          <p className="text-sm text-zinc-400 mt-2 mb-6">
            {mode === "access"
              ? "Masukkan email dan access code yang sudah di-approve."
              : "Daftarkan email kamu. Admin akan review request sebelum akses diberikan."}
          </p>

          <form
            onSubmit={submit}
            className="space-y-3"
          >

            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3B82F6]"
            />

            {mode === "access" && (
              <input
                type="text"
                required
                placeholder="HEX-XXXX-XXXX"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase()
                  )
                }
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[#3B82F6]"
              />
            )}

            <button
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] font-bold disabled:opacity-50"
            >
              {busy
                ? "Processing..."
                : mode === "access"
                ? "Enter App"
                : "Request Access"}
            </button>

          </form>

          {message && (
            <p className="mt-4 text-sm text-zinc-300 bg-black/20 border border-white/5 rounded-lg p-3">
              {message}
            </p>
          )}

        </div>
      </div>
    </main>
  );
      }
