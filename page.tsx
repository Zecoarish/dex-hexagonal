"use client";

import React, { useState } from "react";
import { CheckCircle, AlertCircle, Lock, LogIn, UserCheck } from "lucide-react";

export default function HexagonalTrade() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inputEmail, setInputEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState(null);

  // Integrasi langsung ke Cloudflare Functions API
  const handleCheckOrJoin = async (e) => {
    e.preventDefault();
    if (!inputEmail) return;

    try {
      // 1. Cek apakah email sudah terdaftar & di-approve
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail, action: "check" }),
      });

      const data = await res.json();

      if (res.ok && data.status === "approved") {
        setCurrentUser(data);
        setMessage({ type: "success", text: "Email disetujui! Saldo demo $10,000 USDH aktif." });
        setTimeout(() => setIsModalOpen(false), 1200);
      } else if (res.ok && data.status === "pending") {
        setMessage({ type: "pending", text: "Email kamu masih dalam antrean approval Admin." });
      } else {
        // 2. Jika email belum ada di database, otomatis daftarkan ke waitlist
        const joinRes = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inputEmail, action: "join" }),
        });

        if (joinRes.ok) {
          setMessage({ type: "pending", text: "Pendaftaran berhasil! Tunggu email kamu di-approve Admin." });
        } else {
          setMessage({ type: "error", text: "Gagal mendaftar. Silakan coba lagi." });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi." });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-200 font-sans flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-800 bg-[#121721] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-black font-bold text-lg">
            H
          </div>
          <span className="text-xl font-bold tracking-wider text-white">
            HEXAGONAL <span className="text-emerald-400">TRADE</span>
          </span>
        </div>

        {/* Header Indicators */}
        <div>
          {currentUser && currentUser.status === "approved" ? (
            <div className="flex items-center gap-3">
              <div className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-md text-sm">
                <span className="text-gray-400">Demo Balance: </span>
                <span className="text-emerald-400 font-mono font-bold">
                  ${currentUser.demo_balance.toLocaleString()} USDH
                </span>
              </div>
              <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-md flex items-center gap-1.5 font-mono">
                <UserCheck size={14} /> {currentUser.email}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-md transition text-sm flex items-center gap-2"
            >
              <LogIn size={16} /> Join Waitlist / Login
            </button>
          )}
        </div>
      </header>

      {/* Main Trading Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Chart Area */}
        <div className="flex-1 border-r border-gray-800 flex flex-col">
          <div className="border-b border-gray-800 p-4 flex items-center justify-between bg-[#121721]">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-white">BTC-PERP</span>
              <span className="text-emerald-400 font-mono text-lg">$64,230.50</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">+2.45%</span>
            </div>
          </div>

          <div className="flex-1 bg-[#0b0e14] flex items-center justify-center border-b border-gray-800">
            <p className="text-sm text-gray-500">[ TradingView Chart Area ]</p>
          </div>

          <div className="h-48 bg-[#121721] p-4">
            <div className="flex gap-4 border-b border-gray-800 pb-2 text-sm font-semibold text-gray-400">
              <button className="text-emerald-400 border-b-2 border-emerald-400 pb-2">Positions (0)</button>
              <button className="hover:text-gray-200">Open Orders (0)</button>
            </div>
            <div className="flex items-center justify-center h-28 text-gray-600 text-sm">
              Tidak ada posisi aktif
            </div>
          </div>
        </div>

        {/* Right Side: Lock Guard / Trading Order Form */}
        <div className="w-full md:w-80 bg-[#121721] flex flex-col">
          {!currentUser || currentUser.status !== "approved" ? (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center bg-[#121721]">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                <Lock size={22} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Akses Trading Dikunci</h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Fitur trading hanya terbuka untuk email yang terdaftar di waitlist dan sudah di-<b>approve</b> oleh Admin.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-md text-sm transition"
              >
                Masukkan Email / Waitlist
              </button>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex gap-2">
                <button className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 py-2 rounded font-bold text-sm">
                  Buy / Long
                </button>
                <button className="flex-1 bg-gray-800 text-gray-400 hover:text-white py-2 rounded font-bold text-sm">
                  Sell / Short
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Amount (USDH)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="bg-[#0b0e14] border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded text-sm transition mt-2">
                Execute Order (Demo)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup Waitlist */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121721] border border-gray-800 rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setMessage(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Access Hexagonal Trade</h2>
            <p className="text-xs text-gray-400 mb-6">
              Masukkan email kamu untuk join waitlist atau login jika email sudah di-approve Admin.
            </p>

            <form onSubmit={handleCheckOrJoin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-[#0b0e14] border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-lg text-sm transition"
              >
                Cek Status / Join Waitlist
              </button>
            </form>

            {message && message.type === "pending" && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2 text-yellow-400 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{message.text}</p>
              </div>
            )}

            {message && message.type === "success" && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-emerald-400 text-xs">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <p>{message.text}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
