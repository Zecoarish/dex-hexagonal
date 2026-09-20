"use client";

import React, { useState } from "react";
import TradingViewWidget from "./TradingViewWidget";
import OrderPanel from "./OrderPanel";
import PositionsPanel from "./PositionsPanel";
import { useTrading } from "../context/TradingContext";
import { PAIRS, fmt } from "../lib/trading";

const G = "text-[#4ade80]";
const R = "text-[#f87171]";

export default function TradeApp() {
  const {
    prices,
    status,
    acct,
    upnl,
    equity,
    toast,
    openPosition,
    closePosition,
    reversePosition,
    editTpSl,
    resetDemo,
  } = useTrading();

  const [sel, setSel] = useState("BTC");

  const pair = PAIRS.find((p) => p.name === sel) ?? PAIRS[0];
  const tick = prices[pair.name];
  const mark = tick ? tick.price : null;
  const chg = tick ? ((tick.price - tick.open) / tick.open) * 100 : 0;

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
              {status === "live" ? "Hexagonal Testnet · Live" : "Connecting to Hexagonal Testnet..."}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-mono font-semibold tabular-nums ${chg >= 0 ? G : R}`}>
              {tick ? `$${fmt(tick.price, pair.decimals)}` : "—"}
            </p>
            <p className={`text-[11px] font-mono ${chg >= 0 ? G : R}`}>
              {chg >= 0 ? "+" : ""}
              {chg.toFixed(2)}% 24h
            </p>
          </div>
        </div>

        <div className="h-[340px] rounded-lg border border-white/[0.06] overflow-hidden bg-black/30">
          <TradingViewWidget symbol={pair.tv} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Balance", `$${fmt(acct.balance)}`, ""],
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
        onOpen={(o) => openPosition(sel, mark, o)}
      />

      <div className="lg:col-span-3">
        <PositionsPanel
          positions={acct.positions}
          history={acct.history}
          prices={prices}
          balance={acct.balance}
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
