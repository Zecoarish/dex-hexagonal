"use client";

import React, { useEffect, useRef, useState } from "react";
import TradingViewWidget from "./TradingViewWidget";
import OrderPanel from "./OrderPanel";
import PositionsPanel from "./PositionsPanel";
import { useLivePrices } from "../hooks/useLivePrices";
import {
  Acct,
  OpenOrder,
  PAIRS,
  Position,
  Side,
  START_BALANCE,
  fmt,
  liqPrice,
  pnlOf,
  settle,
} from "../lib/trading";

const KEY = "hexagonal_demo_v1";
const EMPTY: Acct = { balance: START_BALANCE, positions: [], history: [] };
const G = "text-[#4ade80]";
const R = "text-[#f87171]";

export default function TradeApp() {
  const { prices, status } = useLivePrices();
  const [acct, setAcct] = useState<Acct>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState("BTC");
  const [toast, setToast] = useState("");
  const lastId = useRef<number | null>(null);

  const pair = PAIRS.find((p) => p.name === sel) ?? PAIRS[0];
  const tick = prices[pair.name];
  const mark = tick ? tick.price : null;
  const chg = tick ? ((tick.price - tick.open) / tick.open) * 100 : 0;

  // Muat & simpan saldo di browser
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const a = JSON.parse(raw) as Acct;
        setAcct(a);
        lastId.current = a.history[0]?.id ?? null;
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(acct));
    } catch {}
  }, [acct, loaded]);

  // Cek TP / SL / likuidasi tiap harga berubah
  useEffect(() => {
    if (!loaded) return;
    setAcct((a) => {
      let next = a;
      for (const p of a.positions) {
        const t = prices[p.pair];
        if (!t) continue;
        const px = t.price;
        const long = p.side === "LONG";
        const liq = liqPrice(p);
        if (long ? px <= liq : px >= liq) next = settle(next, p.id, liq, "Liquidated");
        else if (p.sl && (long ? px <= p.sl : px >= p.sl)) next = settle(next, p.id, p.sl, "Stop Loss");
        else if (p.tp && (long ? px >= p.tp : px <= p.tp)) next = settle(next, p.id, p.tp, "Take Profit");
      }
      return next;
    });
  }, [prices, loaded]);

  // Notifikasi tiap ada posisi yang ketutup
  useEffect(() => {
    const h = acct.history[0];
    if (!loaded || !h || h.id === lastId.current) return;
    lastId.current = h.id;
    setToast(`${h.pair} ${h.side} ditutup (${h.reason}): ${h.pnl >= 0 ? "+" : ""}$${fmt(h.pnl)}`);
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [acct.history, loaded]);

  const openPosition = (o: OpenOrder): string | null => {
    if (mark === null) return "Harga belum masuk, tunggu sebentar.";
    if (!(o.margin >= 10)) return "Margin minimal $10.";
    if (o.margin > acct.balance) return "Saldo nggak cukup.";
    const long = o.side === "LONG";
    if (o.tp !== null && (long ? o.tp <= mark : o.tp >= mark))
      return `TP harus di ${long ? "atas" : "bawah"} harga sekarang.`;
    if (o.sl !== null && (long ? o.sl >= mark : o.sl <= mark))
      return `SL harus di ${long ? "bawah" : "atas"} harga sekarang.`;
    const cur = acct.positions.find((p) => p.pair === sel);
    if (cur && cur.side !== o.side) return `Lo lagi pegang ${cur.side} ${sel}. Close atau Reverse dulu.`;

    const add = (o.margin * o.lev) / mark;
    setAcct((a) => {
      const c = a.positions.find((p) => p.pair === sel);
      let np: Position;
      if (c) {
        const qty = c.qty + add;
        const entry = (c.entry * c.qty + mark * add) / qty;
        const margin = c.margin + o.margin;
        np = { ...c, qty, entry, margin, lev: (qty * entry) / margin, tp: o.tp ?? c.tp, sl: o.sl ?? c.sl };
      } else {
        np = {
          id: Date.now(),
          pair: sel,
          side: o.side,
          entry: mark,
          qty: add,
          margin: o.margin,
          lev: o.lev,
          tp: o.tp,
          sl: o.sl,
        };
      }
      return {
        ...a,
        balance: a.balance - o.margin,
        positions: c ? a.positions.map((p) => (p.pair === sel ? np : p)) : [np, ...a.positions],
      };
    });
    return null;
  };

  const closePosition = (id: number) => {
    const p = acct.positions.find((x) => x.id === id);
    const t = p && prices[p.pair];
    if (!p || !t) return;
    setAcct((a) => settle(a, id, t.price, "Manual"));
  };

  const reversePosition = (id: number) => {
    const p = acct.positions.find((x) => x.id === id);
    const t = p && prices[p.pair];
    if (!p || !t) return;
    setAcct((a) => {
      const done = settle(a, id, t.price, "Reverse");
      const side: Side = p.side === "LONG" ? "SHORT" : "LONG";
      const margin = Math.min((p.qty * t.price) / p.lev, done.balance);
      if (margin < 1) return done;
      const np: Position = {
        id: Date.now() + 1,
        pair: p.pair,
        side,
        entry: t.price,
        qty: (margin * p.lev) / t.price,
        margin,
        lev: p.lev,
        tp: null,
        sl: null,
      };
      return { ...done, balance: done.balance - margin, positions: [np, ...done.positions] };
    });
  };

  const editTpSl = (id: number, tp: number | null, sl: number | null): string | null => {
    const p = acct.positions.find((x) => x.id === id);
    const t = p && prices[p.pair];
    if (!p || !t) return "Harga belum masuk.";
    const long = p.side === "LONG";
    if (tp !== null && (long ? tp <= t.price : tp >= t.price))
      return `TP harus di ${long ? "atas" : "bawah"} harga sekarang.`;
    if (sl !== null && (long ? sl >= t.price : sl <= t.price))
      return `SL harus di ${long ? "bawah" : "atas"} harga sekarang.`;
    setAcct((a) => ({ ...a, positions: a.positions.map((x) => (x.id === id ? { ...x, tp, sl } : x)) }));
    return null;
  };

  const resetDemo = () => {
    if (window.confirm("Reset saldo demo ke $10,000 dan hapus semua posisi?")) setAcct(EMPTY);
  };

  const used = acct.positions.reduce((s, p) => s + p.margin, 0);
  const upnl = acct.positions.reduce((s, p) => s + pnlOf(p, prices[p.pair]?.price ?? p.entry), 0);
  const equity = acct.balance + used + upnl;

  return (
    <main className="p-3 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3">
      <section className="lg:col-span-2 bg-[#0c0d0f] border border-white/[0.06] rounded-xl p-4">
        <div className="flex gap-1.5 overflow-x-auto pb-3 [scrollbar-width:none]">
          {PAIRS.map((p) => {
            const t = prices[p.name];
            const c = t ? ((t.price - t.open) / t.open) * 100 : null;
            return (
              <button
                key={p.name}
                onClick={() => setSel(p.name)}
                className={`shrink-0 px-3 py-1.5 rounded-lg border text-[12px] transition ${
                  sel === p.name
                    ? "bg-white text-black border-white"
                    : "border-white/[0.08] text-zinc-300 hover:border-white/20"
                }`}
              >
                <span className="font-semibold">{p.name}</span>
                {c !== null && (
                  <span className={`ml-1.5 font-mono ${sel === p.name ? "" : c >= 0 ? G : R}`}>
                    {c >= 0 ? "+" : ""}
                    {c.toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-[16px] font-semibold">
              {pair.name}/USD{" "}
              <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] text-zinc-400 rounded font-medium align-middle">
                PERP
              </span>
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${status === "live" ? "bg-[#4ade80]" : "bg-[#facc15]"}`}
              />
              {status === "live" ? "Hyperliquid oracle · demo" : "Menyambung ke harga..."}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-mono font-semibold tabular-nums ${chg >= 0 ? G : R}`}>
              {tick ? `$${fmt(tick.price, pair.decimals)}` : "—"}
            </p>
            <p className={`text-[11px] font-mono ${chg >= 0 ? G : R}`}>
              {chg >= 0 ? "+" : ""}
              {chg.toFixed(2)}% 24j
            </p>
          </div>
        </div>

        <div className="h-[340px] rounded-lg border border-white/[0.06] overflow-hidden bg-black/30">
          <TradingViewWidget symbol={pair.tv} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Saldo", `$${fmt(acct.balance)}`, ""],
            ["Equity", `$${fmt(equity)}`, ""],
            ["uPnL", `${upnl >= 0 ? "+" : ""}${fmt(upnl)}`, upnl >= 0 ? G : R],
          ].map(([k, v, c]) => (
            <div key={k} className="bg-black/30 border border-white/[0.06] rounded-lg p-2.5">
              <p className="text-[10px] text-zinc-500">{k}</p>
              <p className={`font-mono text-[13px] font-semibold tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </section>

      <OrderPanel
        key={sel}
        pair={pair}
        mark={mark}
        balance={acct.balance}
        existing={acct.positions.find((p) => p.pair === sel)}
        onOpen={openPosition}
      />

      <div className="lg:col-span-3">
        <PositionsPanel
          positions={acct.positions}
          history={acct.history}
          prices={prices}
          onClose={closePosition}
          onReverse={reversePosition}
          onEdit={editTpSl}
        />
        <button onClick={resetDemo} className="mt-3 text-[11px] text-zinc-600 hover:text-zinc-300">
          Reset demo
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] bg-white text-black text-[12px] font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
                                    }
