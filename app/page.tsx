"use client";

import React, { FormEvent, useEffect, useState } from "react";
import {
  Menu,
  X,
  LineChart as LineChartIcon,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import TradeApp from "./components/TradeApp";
import PortfolioView from "./components/PortfolioView";
import { HexagonalLogo } from "./components/HexagonalLogo";
import { usePersistentAuth } from "./hooks/usePersistentAuth";
import { TradingProvider, useTrading } from "./context/TradingContext";
import { fmt } from "./lib/trading";

type View = "trade" | "portfolio";

function AppHeader({
  view,
  setView,
  logout,
}: {
  view: View;
  setView: (v: View) => void;
  logout: () => void;
}) {
  const { acct, equity, upnl } = useTrading();
  const [menuOpen, setMenuOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const navItem = (key: View, label: string, Icon: typeof LineChartIcon) => (
    <button
      onClick={() => {
        setView(key);
        setMenuOpen(false);
      }}
      className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm rounded-lg transition ${
        view === key ? "bg-white text-black font-semibold" : "text-zinc-300 hover:bg-white/[0.06]"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  const comingSoonItem = (label: string, Icon: typeof LineChartIcon) => (
    <button
      onClick={() => {
        setComingSoon(label);
        setMenuOpen(false);
      }}
      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm rounded-lg transition text-zinc-300 hover:bg-white/[0.06]"
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="border-b border-[#1F2937] relative">
      <header className="h-14 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="p-2 -ml-2 rounded-lg text-zinc-300 hover:bg-white/[0.06] hover:text-white transition"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <HexagonalLogo />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight hidden sm:block">
            <p className="text-[10px] text-zinc-500">Total Balance</p>
            <p className="font-mono text-[13px] font-semibold tabular-nums">${fmt(acct.balance)}</p>
          </div>
          <div className="text-right leading-tight hidden md:block">
            <p className="text-[10px] text-zinc-500">Equity</p>
            <p className="font-mono text-[13px] font-semibold tabular-nums">${fmt(equity)}</p>
          </div>
          <div className="text-right leading-tight hidden md:block">
            <p className="text-[10px] text-zinc-500">uPnL</p>
            <p
              className={`font-mono text-[13px] font-semibold tabular-nums ${
                upnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"
              }`}
            >
              {upnl >= 0 ? "+" : ""}
              {fmt(upnl)}
            </p>
          </div>

          <button
            onClick={logout}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/50 hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile-friendly balance strip */}
      <div className="sm:hidden flex items-center justify-between px-4 pb-2 -mt-1">
        <span className="text-[11px] text-zinc-500">
          Balance <span className="font-mono text-white">${fmt(acct.balance)}</span>
        </span>
        <span className="text-[11px] text-zinc-500">
          Equity <span className="font-mono text-white">${fmt(equity)}</span>
        </span>
        <span className={`text-[11px] font-mono ${upnl >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
          {upnl >= 0 ? "+" : ""}
          {fmt(upnl)}
        </span>
      </div>

      {menuOpen && (
        <div className="absolute left-0 top-full mt-1 ml-2 z-50 w-56 bg-[#121820] border border-white/10 rounded-xl p-2 shadow-2xl">
          {navItem("trade", "Trade", ArrowLeftRight)}
          {navItem("portfolio", "Portfolio", LineChartIcon)}
          <div className="my-1 border-t border-white/[0.06]" />
          {comingSoonItem("Deposit", ArrowDownToLine)}
          {comingSoonItem("Withdraw", ArrowUpFromLine)}
        </div>
      )}

      {comingSoon && (
        <div
          className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setComingSoon(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121820] border border-white/10 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
          >
            <p className="text-sm font-semibold mb-1">{comingSoon}</p>
            <p className="text-sm text-zinc-400 mb-5">Coming soon on mainnet.</p>
            <button
              onClick={() => setComingSoon(null)}
              className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TradePage() {
  const { session, loginWithCode, logout, restoreServerSession } = usePersistentAuth();

  const [mode, setMode] = useState<"access" | "waitlist">("access");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("trade");

  useEffect(() => {
    void restoreServerSession();
  }, [restoreServerSession]);

  if (session.isLoggedIn) {
    return (
      <TradingProvider>
        <div className="min-h-screen bg-[#0B0F14] text-white">
          <AppHeader view={view} setView={setView} logout={logout} />
          {view === "trade" ? <TradeApp /> : <PortfolioView />}
        </div>
      </TradingProvider>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    setMessage("");
    setBusy(true);

    try {
      if (mode === "waitlist") {
        const res = await fetch("/api/auth/waitlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to join the waitlist.");
        }

        setMessage("Request submitted. Please wait for admin approval.");
      } else {
        await loginWithCode(email, code);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <HexagonalLogo className="w-16 h-16" showText />
        </div>

        <div className="bg-[#121820] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex gap-1 p-1 bg-black/30 rounded-xl mb-6">
            <button
              onClick={() => {
                setMode("access");
                setMessage("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm ${
                mode === "access" ? "bg-white text-black font-semibold" : "text-zinc-400"
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
                mode === "waitlist" ? "bg-white text-black font-semibold" : "text-zinc-400"
              }`}
            >
              Join Waitlist
            </button>
          </div>

          <h1 className="text-2xl font-bold">
            {mode === "access" ? "Welcome to HEXAGONAL" : "Join the Waitlist"}
          </h1>

          <p className="text-sm text-zinc-400 mt-2 mb-6">
            {mode === "access"
              ? "Enter your email and approved access code."
              : "Join the waitlist. Your request will be reviewed before access is granted."}
          </p>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3B82F6]"
            />

            {mode === "access" && (
              <input
                type="text"
                required
                placeholder="HEX-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-[#0B0F14] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[#3B82F6]"
              />
            )}

            <button
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] font-bold disabled:opacity-50"
            >
              {busy ? "Processing..." : mode === "access" ? "Enter DEX" : "Request Access"}
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
