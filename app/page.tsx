"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Lock,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { useChainlinkPrice } from "./hooks/useChainlinkPrice";
import TradingViewWidget from "./components/TradingViewWidget";

type Screen = "landing" | "code" | "app" | "admin";
type WaitlistEntry = {
  id: number;
  email: string;
  status: "Pending" | "Approved";
  code: string | null;
};

async function api(action: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function HexagonalTrade() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [menuOpen, setMenuOpen] = useState(false);

  // Waitlist
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  // Code entry
  const [codeEmail, setCodeEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  // Admin
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Trading
  const { price, history, loading, error } = useChainlinkPrice();
  const [balance, setBalance] = useState(10000);
  const [position, setPosition] = useState<"LONG" | "SHORT" | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [leverage, setLeverage] = useState(10);
  const [tradeAmount, setTradeAmount] = useState("100");

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setWaitlistError("");
    const { ok, data } = await api("waitlist", { email });
    setSubmitting(false);
    if (ok) {
      setIsSubmitted(true);
      setEmail("");
    } else {
      setWaitlistError(data.error || "Gagal daftar, coba lagi.");
    }
  };

  const loadAdmin = async () => {
    setAdminError("");
    const { ok, data } = await api("admin-list", { password: adminPassword });
    if (ok) {
      setWaitlist(data.list);
      setIsAdminUnlocked(true);
    } else {
      setAdminError(data.error || "Password salah");
    }
  };

  const handleApprove = async (id: number) => {
    const { ok, data } = await api("approve", { password: adminPassword, id });
    if (!ok) {
      alert(data.error || "Gagal approve");
      return;
    }
    if (!data.emailSent) {
      alert(
        `Approved, tapi email gagal terkirim. Kirim manual kode ini: ${data.code}`
      );
    }
    loadAdmin();
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok } = await api("unlock", { email: codeEmail, code: codeInput });
    if (ok) {
      setCodeError("");
      setScreen("app");
    } else {
      setCodeError("Email atau kode salah.");
    }
  };

  const HeaderNav = () => (
    <nav className="border-b border-white/[0.06] bg-[#0c0d0f]/90 backdrop-blur px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <button onClick={() => setScreen("landing")} className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold text-xs text-black">
          H
        </div>
        <span className="font-semibold text-[13px] tracking-wide text-zinc-300">HEXAGONAL</span>
      </button>
      <button onClick={() => setMenuOpen(true)} className="text-zinc-400 hover:text-white">
        <Menu size={20} />
      </button>
    </nav>
  );

  const SideMenu = () =>
    menuOpen && (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
        <div
          className="absolute top-0 right-0 h-full w-64 bg-[#0c0d0f] border-l border-white/[0.06] p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => setMenuOpen(false)} className="text-zinc-400 hover:text-white mb-6">
            <X size={20} />
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setScreen("landing");
                setMenuOpen(false);
              }}
              className="text-left text-[13px] text-zinc-300 hover:text-white py-2.5 border-b border-white/[0.06]"
            >
              Home
            </button>
            {screen === "app" && (
              <button
                onClick={() => {
                  setScreen("landing");
                  setMenuOpen(false);
                }}
                className="text-left text-[13px] text-zinc-300 hover:text-white py-2.5 border-b border-white/[0.06]"
              >
                Log Out
              </button>
            )}
            <button
              onClick={() => {
                setScreen("admin");
                setMenuOpen(false);
              }}
              className="text-left text-[13px] text-zinc-300 hover:text-white py-2.5 border-b border-white/[0.06]"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    );

  // ---------- LANDING ----------
  if (screen === "landing") {
    return (
      <div className="min-h-screen bg-[#08090a] text-zinc-100 font-sans antialiased flex flex-col">
        <HeaderNav />
        <SideMenu />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-[11px] tracking-[0.2em] text-zinc-500 mb-4 uppercase">Hexagonal Testnet</span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
            Join for Testnet<br />Early Access
          </h1>
          <p className="text-[13px] text-zinc-500 max-w-sm mb-8">
            Daftar email, tunggu approval admin, dan dapatkan kode akses untuk klaim $10,000 USD demo balance.
          </p>

          {isSubmitted ? (
            <div className="bg-[#4ade80]/[0.08] border border-[#4ade80]/20 p-3.5 rounded-lg text-[#4ade80] text-[12px] flex items-center gap-2 max-w-sm">
              <CheckCircle2 size={16} /> Terdaftar — tunggu kode akses lewat email.
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="w-full max-w-sm space-y-2.5">
              <input
                type="email"
                placeholder="Masukkan email aktif"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-white/20"
              />
              {waitlistError && <p className="text-[11px] text-[#f87171]">{waitlistError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white hover:bg-zinc-200 disabled:opacity-60 text-black font-semibold py-3 rounded-lg transition flex items-center justify-center gap-1.5 text-[13px]"
              >
                {submitting ? "Mengirim..." : "Join Waitlist"} <ArrowRight size={14} />
              </button>
            </form>
          )}

          <button
            onClick={() => setScreen("code")}
            className="mt-6 text-[12px] text-zinc-500 hover:text-white flex items-center gap-1.5"
          >
            <KeyRound size={13} /> Sudah punya kode akses?
          </button>
        </div>
      </div>
    );
  }

  // ---------- CODE ENTRY ----------
  if (screen === "code") {
    return (
      <div className="min-h-screen bg-[#08090a] text-zinc-100 font-sans antialiased flex flex-col">
        <HeaderNav />
        <SideMenu />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-[16px] font-semibold mb-1.5 text-center">Masukkan Kode Akses</h2>
            <p className="text-[12px] text-zinc-500 mb-5 text-center">
              Cek kode yang dikirim ke email lo, lalu masukkan email & kode di bawah.
            </p>
            <form onSubmit={handleUnlock} className="space-y-2.5">
              <input
                type="email"
                placeholder="Email terdaftar"
                required
                value={codeEmail}
                onChange={(e) => setCodeEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/20"
              />
              <input
                type="text"
                placeholder="Kode akses"
                required
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-white font-mono uppercase focus:outline-none focus:border-white/20"
              />
              {codeError && <p className="text-[11px] text-[#f87171]">{codeError}</p>}
              <button
                type="submit"
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 rounded-lg text-[13px]"
              >
                Unlock
              </button>
            </form>
            <button
              onClick={() => setScreen("landing")}
              className="mt-4 text-[11px] text-zinc-500 hover:text-white block mx-auto"
            >
              Belum punya kode? Balik ke waitlist
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ADMIN ----------
  if (screen === "admin") {
    return (
      <div className="min-h-screen bg-[#08090a] text-zinc-100 font-sans antialiased">
        <HeaderNav />
        <SideMenu />
        <div className="p-3 max-w-2xl mx-auto">
          {isAdminUnlocked ? (
            <div className="bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-3">
                <Users size={15} className="text-zinc-400" />
                <div className="flex-1">
                  <h3 className="text-[13px] font-semibold">Waitlist Approval</h3>
                  <p className="text-[11px] text-zinc-500">Approve → kode dibuat & dikirim otomatis ke email user.</p>
                </div>
                <button
                  onClick={loadAdmin}
                  className="text-[11px] bg-white/[0.06] hover:bg-white/[0.1] px-2 py-1 rounded text-zinc-300"
                >
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/[0.06]">
                      <th className="py-2 px-2 font-medium">Email</th>
                      <th className="py-2 px-2 font-medium">Status</th>
                      <th className="py-2 px-2 font-medium">Kode</th>
                      <th className="py-2 px-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((u) => (
                      <tr key={u.id} className="border-b border-white/[0.04]">
                        <td className="py-2.5 px-2 font-mono text-zinc-300">{u.email}</td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              u.status === "Approved" ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-[#facc15]/10 text-[#facc15]"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-zinc-400">{u.code ?? "—"}</td>
                        <td className="py-2.5 px-2 text-right">
                          {u.status === "Pending" ? (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="bg-white hover:bg-zinc-200 text-black text-[11px] font-semibold px-2.5 py-1 rounded"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {waitlist.length === 0 && (
                  <p className="text-[12px] text-zinc-500 text-center py-6">Belum ada yang daftar.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-xs mx-auto my-6 bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-6 text-center">
              <div className="w-10 h-10 bg-white/[0.06] text-zinc-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Lock size={16} />
              </div>
              <h2 className="text-[14px] font-semibold mb-3">Admin Access</h2>
              <input
                type="password"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white mb-2.5 focus:outline-none focus:border-white/20"
              />
              {adminError && <p className="text-[11px] text-[#f87171] mb-2">{adminError}</p>}
              <button
                onClick={loadAdmin}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 rounded-lg text-[13px]"
              >
                Unlock
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- APP (TRADING DASHBOARD) ----------
  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100 font-sans antialiased">
      <HeaderNav />
      <SideMenu />
      <main className="p-3 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold tracking-tight">BTC/USD</h2>
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] text-zinc-400 rounded font-medium">
                    PERP
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">Chainlink · Sepolia testnet</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-mono font-semibold text-[#4ade80] tabular-nums">
                  {loading ? "—" : error ? "N/A" : `$${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
                <p className="text-[11px] text-[#4ade80] flex items-center justify-end gap-1 font-mono">
                  <TrendingUp size={11} /> live
                </p>
              </div>
            </div>

            <div className="h-64 bg-black/30 rounded-lg border border-white/[0.06] overflow-hidden">
              <TradingViewWidget />
            </div>

            <div className="mt-3 bg-black/30 rounded-lg p-3 border border-white/[0.06] flex items-center justify-between">
              <span className="text-[12px] text-zinc-500 flex items-center gap-1.5">
                <Wallet size={13} /> Demo Balance
              </span>
              <span className="font-mono text-[13px] font-semibold tabular-nums">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {position && entryPrice && price && (
              (() => {
                const priceChangePct = (price - entryPrice) / entryPrice;
                const pnlPct = priceChangePct * leverage * (position === "LONG" ? 1 : -1);
                const margin = Number(tradeAmount) || 0;
                const pnlUsd = margin * pnlPct;
                const isProfit = pnlUsd >= 0;
                return (
                  <div className={`mt-3 p-3 rounded-lg border ${isProfit ? "bg-[#4ade80]/[0.06] border-[#4ade80]/20" : "bg-[#f87171]/[0.06] border-[#f87171]/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {position} {leverage}x @ ${entryPrice.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          setBalance((b) => b + pnlUsd);
                          setPosition(null);
                          setEntryPrice(null);
                        }}
                        className="text-[11px] bg-white/[0.06] hover:bg-white/[0.1] px-2 py-1 rounded text-zinc-300"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">Unrealized P&L</span>
                      <span className={`font-mono text-[13px] font-semibold tabular-nums ${isProfit ? "text-[#4ade80]" : "text-[#f87171]"}`}>
                        {isProfit ? "+" : ""}{pnlUsd.toFixed(2)} ({(pnlPct * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          <div className="bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-[12px] font-medium text-zinc-500 mb-3 uppercase tracking-wide">Place Order</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <label className="text-[11px] text-zinc-500">Leverage</label>
                  <span className="text-[11px] font-mono text-zinc-300">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full accent-white h-1 cursor-pointer"
                />
              </div>
              <div className="mb-4">
                <label className="text-[11px] text-zinc-500 block mb-1.5">Margin (USD)</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg p-2.5 text-[13px] font-mono text-white focus:outline-none focus:border-white/20",
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPosition("LONG");
                  setEntryPrice(price);
                }}
                className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-[13px]"
              >
                <TrendingUp size={14} /> Long
              </button>
              <button
                onClick={() => {
                  setPosition("SHORT");
                  setEntryPrice(price);
                }}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-black font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-[13px]"
              >
                <TrendingDown size={14} /> Short
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
          
