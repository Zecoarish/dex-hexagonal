"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Users,
  ChevronRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useChainlinkPrice } from "./hooks/useChainlinkPrice";

const ADMIN_PASSWORD = "Kanjut666";

export default function HexagonalTrade() {
  const [activeTab, setActiveTab] = useState<"trade" | "waitlist" | "admin">("trade");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { price, history, loading, error } = useChainlinkPrice();

  const [balance, setBalance] = useState(10000);
  const [position, setPosition] = useState<"LONG" | "SHORT" | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [leverage, setLeverage] = useState(10);
  const [tradeAmount, setTradeAmount] = useState("100");

  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [waitlistUsers, setWaitlistUsers] = useState([
    { id: 1, email: "trader1@gmail.com", status: "Approved", balance: "$10,000 USDH" },
    { id: 2, email: "crypto_boss@yahoo.com", status: "Pending", balance: "$0 USDH" },
    { id: 3, email: "hex_trader@outlook.com", status: "Pending", balance: "$0 USDH" },
  ]);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setWaitlistUsers([...waitlistUsers, { id: Date.now(), email, status: "Pending", balance: "$0 USDH" }]);
      setEmail("");
    }
  };

  const handleApprove = (id: number) => {
    setWaitlistUsers(
      waitlistUsers.map((u) => (u.id === id ? { ...u, status: "Approved", balance: "$10,000 USDH" } : u))
    );
  };

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-1.5 rounded text-[13px] font-medium transition ${
        activeTab === id ? "bg-white text-black" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100 font-sans antialiased">
      {/* Top nav */}
      <nav className="border-b border-white/[0.06] bg-[#0c0d0f]/90 backdrop-blur px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold text-xs text-black">
            H
          </div>
          <span className="font-semibold text-[13px] tracking-wide text-zinc-300">HEXAGONAL</span>
        </div>
        <div className="flex gap-0.5 bg-white/[0.04] p-0.5 rounded-lg">
          {tabBtn("trade", "Trade")}
          {tabBtn("waitlist", "Waitlist")}
          {tabBtn("admin", "Admin")}
        </div>
      </nav>

      <main className="p-3 max-w-6xl mx-auto">
        {/* TRADE */}
        {activeTab === "trade" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-semibold tracking-tight">BTC/USDH</h2>
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

              <div className="h-44 bg-black/30 rounded-lg border border-white/[0.06] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="time" hide />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 10, fill: "#71717a" }}
                      width={55}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0c0d0f", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, borderRadius: 6 }}
                      labelStyle={{ color: "#71717a" }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#4ade80" dot={false} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
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
                    <div
                      className={`mt-3 p-3 rounded-lg border ${
                        isProfit ? "bg-[#4ade80]/[0.06] border-[#4ade80]/20" : "bg-[#f87171]/[0.06] border-[#f87171]/20"
                      }`}
                    >
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
                          {isProfit ? "+" : ""}
                          {pnlUsd.toFixed(2)} ({(pnlPct * 100).toFixed(2)}%)
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
                  <label className="text-[11px] text-zinc-500 block mb-1.5">Margin (USDH)</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg p-2.5 text-[13px] font-mono text-white focus:outline-none focus:border-white/20"
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
        )}

        {/* WAITLIST */}
        {activeTab === "waitlist" && (
          <div className="max-w-sm mx-auto my-6 bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-6 text-center">
            <div className="w-10 h-10 bg-white/[0.06] text-zinc-300 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock size={18} />
            </div>
            <h2 className="text-[16px] font-semibold mb-1.5">Join Waitlist</h2>
            <p className="text-[12px] text-zinc-500 mb-5">
              Get admin approval for <span className="text-zinc-300">$10,000 USDH</span> testnet balance.
            </p>

            {isSubmitted ? (
              <div className="bg-[#4ade80]/[0.08] border border-[#4ade80]/20 p-3 rounded-lg text-[#4ade80] text-[12px] flex items-center gap-2 justify-center">
                <CheckCircle2 size={15} /> Registered — awaiting approval.
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-2.5">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/20"
                />
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 text-[13px]"
                >
                  Request Access <ChevronRight size={14} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ADMIN */}
        {activeTab === "admin" &&
          (isAdminUnlocked ? (
            <div className="bg-[#0c0d0f] border border-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-3">
                <Users size={15} className="text-zinc-400" />
                <div>
                  <h3 className="text-[13px] font-semibold">Waitlist Approval</h3>
                  <p className="text-[11px] text-zinc-500">Approve to credit $10,000 USDH demo balance.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/[0.06]">
                      <th className="py-2 px-2 font-medium">Email</th>
                      <th className="py-2 px-2 font-medium">Status</th>
                      <th className="py-2 px-2 font-medium">Balance</th>
                      <th className="py-2 px-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlistUsers.map((u) => (
                      <tr key={u.id} className="border-b border-white/[0.04]">
                        <td className="py-2.5 px-2 font-mono text-zinc-300">{u.email}</td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              u.status === "Approved"
                                ? "bg-[#4ade80]/10 text-[#4ade80]"
                                : "bg-[#facc15]/10 text-[#facc15]"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-zinc-400">{u.balance}</td>
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
              <button
                onClick={() => {
                  if (adminPassword === ADMIN_PASSWORD) setIsAdminUnlocked(true);
                  else alert("Password salah");
                }}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 rounded-lg text-[13px]"
              >
                Unlock
              </button>
            </div>
          ))}
      </main>
    </div>
  );
}
