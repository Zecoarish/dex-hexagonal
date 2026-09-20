"use client";

import React, { useMemo, useState } from "react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTrading } from "../context/TradingContext";
import { decOf, fmt, liqPrice, pnlOf } from "../lib/trading";
import {
  TIMEFRAMES,
  TF_LABEL,
  Timeframe,
  buildSeries,
  formatTick,
  formatTooltipTime,
} from "../lib/equityHistory";

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

  const [tf, setTf] = useState<Timeframe>("24H");
  const [metric, setMetric] = useState<"pnl" | "equity">("pnl");

  const series = useMemo(
    () => buildSeries(equityHistory, tf, equity),
    [equityHistory, tf, equity]
  );

  const chartUp = series.pnl >= 0;
  const chartColor = metric === "equity" ? "#3B82F6" : chartUp ? "#4ade80" : "#f87171";
  const dataKey = metric;
  const hasEnoughData = series.points.length > 1;

  return (
    <main className="p-3 max-w-6xl mx-auto space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Total Balance" value={`$${fmt(acct.balance)}`} />
        <StatCard label="Equity" value={`$${fmt(equity)}`} />
        <StatCard label="Margin Used" value={`$${fmt(used)}`} />
        <StatCard label="Unrealized PnL" value={`${upnl >= 0 ? "+" : ""}${fmt(upnl)}`} cls={upnl >= 0 ? G : R} />
      </div>

      <section className="bg-[#0c0d0f] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[12px] text-zinc-500">
              {metric === "pnl" ? `${TF_LABEL[tf]} PnL` : "Equity"}
            </h3>
            <p
              className={`font-mono text-[22px] font-semibold tabular-nums leading-tight ${
                metric === "equity" ? "text-white" : chartUp ? G : R
              }`}
            >
              {metric === "pnl"
                ? `${chartUp ? "+" : "-"}$${fmt(Math.abs(series.pnl))}`
                : `$${fmt(equity)}`}
            </p>
            <p className={`font-mono text-[11px] tabular-nums ${chartUp ? G : R}`}>
              {chartUp ? "+" : "-"}
              {fmt(Math.abs(series.pct))}% · {TF_LABEL[tf]}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-0.5 p-0.5 bg-black/40 rounded-lg">
              {(["pnl", "equity"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    metric === m ? "bg-white/[0.14] text-white" : "text-zinc-500"
                  }`}
                >
                  {m === "pnl" ? "PnL" : "Equity"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition ${
                tf === t ? "bg-white text-black" : "bg-white/[0.05] text-zinc-400 hover:text-white"
              }`}
            >
              {t === "ALL" ? "All-time" : t}
            </button>
          ))}
        </div>

        <div className="h-[220px]">
          {hasEnoughData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series.points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  tickFormatter={(t) => formatTick(t, tf)}
                  minTickGap={40}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) =>
                    metric === "pnl"
                      ? `${v >= 0 ? "+" : "-"}$${Math.abs(Math.round(v))}`
                      : `$${Math.round(v)}`
                  }
                  tickLine={false}
                  axisLine={false}
                />
                {metric === "pnl" && (
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
                )}
                <Tooltip
                  contentStyle={{ background: "#121820", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }}
                  labelFormatter={(t) => formatTooltipTime(Number(t))}
                  formatter={(v: number) => [
                    metric === "pnl" ? `${v >= 0 ? "+" : "-"}$${fmt(Math.abs(v))}` : `$${fmt(v)}`,
                    metric === "pnl" ? "PnL" : "Equity",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#pfFill)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[12px] text-zinc-500 text-center px-6">
              Collecting data — the chart fills in as you keep trading and revisit this page.
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
