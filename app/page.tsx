"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ShieldCheck, 
  Clock, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function HexagonalTrade() {
  const [activeTab, setActiveTab] = useState<"trade" | "waitlist" | "admin">("trade");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // State Simulasi Balance & Waitlist
  const [balance, setBalance] = useState(10000); // 10,000 USDH Demo
  const [position, setPosition] = useState<"LONG" | "SHORT" | null>(null);
  const [leverage, setLeverage] = useState(10);
  const [tradeAmount, setTradeAmount] = useState("100");

  // Mock Data Waitlist Admin
  const [waitlistUsers, setWaitlistUsers] = useState([
    { id: 1, email: "trader1@gmail.com", status: "Approved", balance: "$10,000 USDH" },
    { id: 2, email: "crypto_boss@yahoo.com", status: "Pending", balance: "$0 USDH" },
    { id: 3, email: "hex_trader@outlook.com", status: "Pending", balance: "$0 USDH" }
  ]);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setWaitlistUsers([
        ...waitlistUsers,
        { id: Date.now(), email, status: "Pending", balance: "$0 USDH" }
      ]);
      setEmail("");
    }
  };

  const handleApprove = (id: number) => {
    setWaitlistUsers(
      waitlistUsers.map((user) =>
        user.id === id ? { ...user, status: "Approved", balance: "$10,000 USDH" } : user
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header / Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30">
            H
          </div>
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            HEXAGONAL
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab("trade")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "trade" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Trade
          </button>
          <button
            onClick={() => setActiveTab("waitlist")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "waitlist" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Waitlist
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "admin" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Admin
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="p-4 max-w-6xl mx-auto">
        {/* TAB 1: TRADING DASHBOARD */}
        {activeTab === "trade" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart / Market Panel */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[350px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    BTC/USDH <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">Perpetual</span>
                  </h2>
                  <p className="text-xs text-slate-400">Hexagonal Testnet Engine</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-emerald-400">$64,250.00</p>
                  <p className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                    <TrendingUp size={12} /> +2.45%
                  </p>
                </div>
              </div>

              {/* Simulated Chart Placeholder */}
              <div className="my-8 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-8 bg-slate-950/40">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                  <TrendingUp size={24} />
                </div>
                <p className="text-sm font-medium text-slate-300">Live Chart Interface</p>
                <p className="text-xs text-slate-500 text-center mt-1">TradingView Chart integration active upon mainnet release.</p>
              </div>

              {/* Demo Wallet Info */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Wallet size={16} className="text-indigo-400" /> Demo Balance:
                </span>
                <span className="font-mono font-bold text-white">${balance.toLocaleString()} USDH</span>
              </div>
            </div>

            {/* Order Execution Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-200 mb-4 border-b border-slate-800 pb-2">Place Order</h3>
                
                {/* Leverage Selector */}
                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-1">Leverage: {leverage}x</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={leverage} 
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                  />
                </div>

                {/* Margin Amount */}
                <div className="mb-4">
                  <label className="text-xs text-slate-400 block mb-1">Margin Amount (USDH)</label>
                  <input 
                    type="number" 
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => setPosition("LONG")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-emerald-900/20"
                >
                  <TrendingUp size={16} /> LONG
                </button>
                <button 
                  onClick={() => setPosition("SHORT")}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1 shadow-lg shadow-rose-900/20"
                >
                  <TrendingDown size={16} /> SHORT
                </button>
              </div>

              {position && (
                <div className="mt-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center text-xs text-indigo-300">
                  Active Order: <span className="font-bold">{position}</span> {leverage}x on BTC/USDH
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WAITLIST REGISTRATION */}
        {activeTab === "waitlist" && (
          <div className="max-w-md mx-auto my-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Join Hexagonal Waitlist</h2>
            <p className="text-xs text-slate-400 mb-6">
              Get instant approval from admin to claim your initial <span className="text-indigo-400 font-bold">$10,000 USDH</span> testnet balance.
            </p>

            {isSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-sm flex items-center gap-2 justify-center">
                <CheckCircle2 size={18} /> Registered! Awaiting admin approval.
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  Request Early Access <ChevronRight size={16} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: ADMIN DASHBOARD */}
        {activeTab === "admin" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Users size={18} className="text-indigo-400" /> Admin Access Approval
                </h3>
                <p className="text-xs text-slate-400">Approve waitlist users to credit $10,000 USDH demo balance.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">User Email</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Demo Balance</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistUsers.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800/50">
                      <td className="py-3 px-3 font-mono text-slate-200">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{u.balance}</td>
                      <td className="py-3 px-3 text-right">
                        {u.status === "Pending" ? (
                          <button 
                            onClick={() => handleApprove(u.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Approve $10k
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
         }
                        
