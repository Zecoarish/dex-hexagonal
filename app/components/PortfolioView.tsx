"use client";

import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTrading } from "../context/TradingContext";
import { decOf, fmt, liqPrice, pnlOf } from "../lib/trading";

const G = "text-[#4ade80]";
const R = "text-[#f87171]";

function StatCard({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="bg-black/30 border border-white/[0.06] rounded-lg p-3">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className={`font-mono text-[15px] font-semibold tabular-nums mt-0.5 ${cls}`}>{value}</p>
    </div>
  );
}

export default function PortfolioView() {
  const { acct, prices, used, upnl, equity, equityHistory } = useTrading();

  const closedTrades = acct.history;
  const realizedPnl = closedTrades.reduce((s, h) => s + h.pnl, 0);
  const wins = closedTrades.filter((h) => h.pnl > 0).length;
  const winRate = closedTrades.length ? (wins / closedTrades.length) * 100 : 0;

  const chartData = equityHistory.map((p) => ({
    time: new Date(p.t).toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" }),
    equity: Number(p.equity.toFixed(2)),
  }));

  return (
    <main className="p-3 max-w-6xl mx-auto space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Total Balance" value={`$${fmt(acct.balance)}`} />
        <StatCard label="Equity" value={`$${fmt(equity)}`} />
        <StatCard label="Margin Used" value={`$${fmt(used)}`} />
        <StatCard label="Unrealized PnL" value={`${upnl >= 0 ? "+" : ""}${fmt(upnl)}`} cls={upnl >= 0 ? G : R} />
      </div>

      <section className="bg-[#0c0d0f] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold">Equity (Realtime)</h3>
          <span className="text-[10px] text-zinc-500">Live · this session</span>
        </div>
        <div className="h-[220px]">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#71717a" }} minTickGap={30} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `$${Math.round(v)}`}
                />
                <Tooltip
                  contentStyle={{ background: "#121820", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }}
                  formatter={(v: number) => [`$${fmt(v)}`, "Equity"]}
                />
                <Line type="monotone" dataKey="equity" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[12px] text-zinc-500">
              Collecting data — keep this page open for a live equity curve.
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#0c0d0f] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-[14px] font-semibold mb-3">Open Positions ({acct.positions.length})</h3>
        {acct.positions.length ? (
          <div className="space-y-2">
            {acct.positions.map((p) => {
              const mark = prices[p.pair]?.price ?? p.entry;
              const pnl = pnlOf(p, mark);
              const d = decOf(p.pair);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-white/[0.06] rounded-lg p-3 text-[12px]"
                >
                  <div>
                    <p className="font-semibold">
                      {p.pair}/USD{" "}
                      <span className={p.side === "LONG" ? G : R}>
                        {p.side} {Math.round(p.lev * 10) / 10}x
                      </span>{" "}
                      <span className="text-zinc-500">{p.marginMode === "CROSS" ? "Cross" : "Isolated"}</span>
                    </p>
                    <p className="text-zinc-500 font-mono text-[11px] mt-0.5">
                      Entry {fmt(p.entry, d)} · Mark {fmt(mark, d)} · Liq{" "}
                      <span className="text-[#facc15]">{fmt(liqPrice(p, acct.balance), d)}</span>
                    </p>
                  </div>
                  <span className={`font-mono font-semibold ${pnl >= 0 ? G : R}`}>
                    {pnl >= 0 ? "+" : ""}
                    {fmt(pnl)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-zinc-500 text-center py-6">No open positions yet.</p>
        )}
      </section>

      <section className="bg-[#0c0d0f] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-[14px] font-semibold mb-3">Trading Stats</h3>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Closed Trades" value={String(closedTrades.length)} />
          <StatCard
            label="Realized PnL"
            value={`${realizedPnl >= 0 ? "+" : ""}${fmt(realizedPnl)}`}
            cls={realizedPnl >= 0 ? G : R}
          />
          <StatCard label="Win Rate" value={`${fmt(winRate, 1)}%`} />
        </div>
      </section>
    </main>
  );
                }
