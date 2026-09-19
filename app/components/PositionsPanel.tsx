"use client";

import React, { useState } from "react";
import { Position, Trade, decOf, fmt, liqPrice, pnlOf } from "../lib/trading";
import type { Prices } from "../hooks/useLivePrices";

type Props = {
  positions: Position[];
  history: Trade[];
  prices: Prices;
  onClose: (id: number) => void;
  onReverse: (id: number) => void;
  onEdit: (id: number, tp: number | null, sl: number | null) => string | null;
};

const G = "text-[#4ade80]";
const R = "text-[#f87171]";
const btn = "text-[12px] py-2 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-medium";
const field =
  "w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] font-mono text-white focus:outline-none focus:border-white/25";

function Cell({ k, v, cls = "" }: { k: string; v: string; cls?: string }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-500">{k}</p>
      <p className={`text-[12px] font-mono tabular-nums ${cls}`}>{v}</p>
    </div>
  );
}

function PositionCard({
  p,
  mark,
  onClose,
  onReverse,
  onEdit,
}: {
  p: Position;
  mark: number | null;
  onClose: (id: number) => void;
  onReverse: (id: number) => void;
  onEdit: (id: number, tp: number | null, sl: number | null) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [tp, setTp] = useState(p.tp ? String(p.tp) : "");
  const [sl, setSl] = useState(p.sl ? String(p.sl) : "");
  const [err, setErr] = useState("");

  const d = decOf(p.pair);
  const price = mark ?? p.entry;
  const pnl = pnlOf(p, price);
  const roe = (pnl / p.margin) * 100;
  const profit = pnl >= 0;
  const long = p.side === "LONG";

  const save = () => {
    const e = onEdit(p.id, tp ? Number(tp) : null, sl ? Number(sl) : null);
    setErr(e ?? "");
    if (!e) setOpen(false);
  };

  return (
    <div className="border border-white/[0.06] rounded-lg p-3 bg-black/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{p.pair}/USD</span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              long ? "bg-[#22c55e]/15 text-[#4ade80]" : "bg-[#ef4444]/15 text-[#f87171]"
            }`}
          >
            {p.side} {Math.round(p.lev * 10) / 10}x
          </span>
        </div>
        <div className="text-right">
          <p className={`font-mono text-[14px] font-semibold tabular-nums ${profit ? G : R}`}>
            {profit ? "+" : ""}
            {fmt(pnl)}
          </p>
          <p className={`font-mono text-[11px] ${profit ? G : R}`}>
            {profit ? "+" : ""}
            {fmt(roe)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-y-2.5 gap-x-2 mb-3">
        <Cell k="Ukuran" v={`$${fmt(p.qty * p.entry)}`} />
        <Cell k="Margin" v={`$${fmt(p.margin)}`} />
        <Cell k="Harga masuk" v={fmt(p.entry, d)} />
        <Cell k="Harga mark" v={fmt(price, d)} />
        <Cell k="Likuidasi" v={fmt(liqPrice(p), d)} cls="text-[#facc15]" />
        <Cell k="TP / SL" v={`${p.tp ? fmt(p.tp, d) : "—"} / ${p.sl ? fmt(p.sl, d) : "—"}`} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setOpen(!open)} className={btn}>
          TP/SL
        </button>
        <button onClick={() => onReverse(p.id)} className={btn}>
          Reverse
        </button>
        <button onClick={() => onClose(p.id)} className={btn}>
          Close
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="TP harga"
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              className={field}
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="SL harga"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              className={field}
            />
          </div>
          {err && <p className="text-[11px] text-[#f87171]">{err}</p>}
          <button onClick={save} className="w-full text-[12px] py-2 rounded-md bg-white text-black font-semibold">
            Simpan
          </button>
        </div>
      )}
    </div>
  );
}

export default function PositionsPanel({ positions, history, prices, onClose, onReverse, onEdit }: Props) {
  const [tab, setTab] = useState<"pos" | "hist">("pos");

  const tabCls = (t: string) =>
    `pb-2 text-[13px] font-medium border-b-2 -mb-px ${
      tab === t ? "border-white text-white" : "border-transparent text-zinc-500"
    }`;

  return (
    <div className="bg-[#0c0d0f] border border-white/[0.06] rounded-xl p-4">
      <div className="flex gap-5 border-b border-white/[0.06] mb-3">
        <button onClick={() => setTab("pos")} className={tabCls("pos")}>
          Positions ({positions.length})
        </button>
        <button onClick={() => setTab("hist")} className={tabCls("hist")}>
          History
        </button>
      </div>

      {tab === "pos" ? (
        positions.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {positions.map((p) => (
              <PositionCard
                key={p.id}
                p={p}
                mark={prices[p.pair]?.price ?? null}
                onClose={onClose}
                onReverse={onReverse}
                onEdit={onEdit}
              />
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-zinc-500 text-center py-6">Belum ada posisi terbuka.</p>
        )
      ) : history.length ? (
        <div>
          {history.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between py-2 border-b border-white/[0.04] text-[12px]"
            >
              <div>
                <p>
                  <span className="font-semibold">{h.pair}</span>{" "}
                  <span className={h.side === "LONG" ? G : R}>{h.side}</span>{" "}
                  <span className="text-zinc-500">· {h.reason}</span>
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {fmt(h.entry, decOf(h.pair))} → {fmt(h.exit, decOf(h.pair))}
                </p>
              </div>
              <span className={`font-mono font-semibold ${h.pnl >= 0 ? G : R}`}>
                {h.pnl >= 0 ? "+" : ""}
                {fmt(h.pnl)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-zinc-500 text-center py-6">Belum ada riwayat trade.</p>
      )}
    </div>
  );
    }
