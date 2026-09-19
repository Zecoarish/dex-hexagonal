"use client";

import React, { useState } from "react";
import { OpenOrder, Pair, Position, Side, estLiq, fmt } from "../lib/trading";

type Props = {
  pair: Pair;
  mark: number | null;
  balance: number;
  existing: Position | undefined;
  onOpen: (o: OpenOrder) => string | null;
};

const field =
  "w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] font-mono text-white focus:outline-none focus:border-white/25";
const chip = "flex-1 text-[11px] py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{k}</span>
      <span className="font-mono text-zinc-200">{v}</span>
    </div>
  );
}

export default function OrderPanel({ pair, mark, balance, existing, onOpen }: Props) {
  const [side, setSide] = useState<Side>("LONG");
  const [lev, setLev] = useState(10);
  const [margin, setMargin] = useState("100");
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [err, setErr] = useState("");

  const isLong = side === "LONG";
  const L = Math.min(lev, pair.maxLev);
  const m = Number(margin) || 0;
  const liq = mark ? estLiq(side, mark, L) : null;
  const blocked = !!existing && existing.side !== side;

  const roe = (v: string) => {
    const x = Number(v);
    if (!x || !mark) return null;
    return ((x - mark) / mark) * L * 100 * (isLong ? 1 : -1);
  };
  const tpRoe = roe(tp);
  const slRoe = roe(sl);

  const submit = () => {
    const e = onOpen({
      side,
      margin: m,
      lev: L,
      tp: tp ? Number(tp) : null,
      sl: sl ? Number(sl) : null,
    });
    setErr(e ?? "");
    if (!e) {
      setTp("");
      setSl("");
    }
  };

  return (
    <div className="bg-[#0c0d0f] border border-white/[0.06] rounded-xl p-4 space-y-4">
      <div className="grid grid-cols-2 gap-1 bg-black/40 rounded-lg p-1">
        {(["LONG", "SHORT"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              setErr("");
            }}
            className={`py-2 rounded-md text-[13px] font-semibold transition ${
              side === s
                ? s === "LONG"
                  ? "bg-[#22c55e] text-black"
                  : "bg-[#ef4444] text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {s === "LONG" ? "Long" : "Short"}
          </button>
        ))}
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[11px] text-zinc-500">Leverage</span>
          <span className="text-[12px] font-mono font-semibold">{L}x</span>
        </div>
        <input
          type="range"
          min={1}
          max={pair.maxLev}
          value={L}
          onChange={(e) => setLev(Number(e.target.value))}
          className="w-full accent-white h-1 cursor-pointer"
        />
        <div className="flex gap-1.5 mt-2">
          {Array.from(new Set([2, 5, 10, pair.maxLev])).map((x) => (
            <button key={x} onClick={() => setLev(x)} className={chip}>
              {x}x
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-[11px] text-zinc-500">Margin (USD)</label>
          <span className="text-[11px] text-zinc-500">Tersedia ${fmt(balance)}</span>
        </div>
        <input
          type="number"
          inputMode="decimal"
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          className={field}
        />
        <div className="flex gap-1.5 mt-2">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => setMargin(String(Math.floor(balance * pct) / 100))}
              className={chip}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-zinc-500 block mb-1.5">Take Profit</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Harga"
            value={tp}
            onChange={(e) => setTp(e.target.value)}
            className={field}
          />
          {tpRoe !== null && (
            <p className={`text-[10px] mt-1 font-mono ${tpRoe >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
              {tpRoe >= 0 ? "+" : ""}
              {fmt(tpRoe, 1)}% ROE
            </p>
          )}
        </div>
        <div>
          <label className="text-[11px] text-zinc-500 block mb-1.5">Stop Loss</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Harga"
            value={sl}
            onChange={(e) => setSl(e.target.value)}
            className={field}
          />
          {slRoe !== null && (
            <p className={`text-[10px] mt-1 font-mono ${slRoe >= 0 ? "text-[#4ade80]" : "text-[#f87171]"}`}>
              {slRoe >= 0 ? "+" : ""}
              {fmt(slRoe, 1)}% ROE
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-[12px] border-t border-white/[0.06] pt-3">
        <Row k="Ukuran posisi" v={`$${fmt(m * L)}`} />
        <Row k="Harga masuk (market)" v={mark ? `$${fmt(mark, pair.decimals)}` : "—"} />
        <Row k="Est. likuidasi" v={liq ? `$${fmt(liq, pair.decimals)}` : "—"} />
      </div>

      {blocked && existing && (
        <p className="text-[11px] text-[#facc15]">
          Lo lagi pegang {existing.side} {pair.name}. Close atau Reverse dulu di bagian Positions.
        </p>
      )}
      {err && <p className="text-[11px] text-[#f87171]">{err}</p>}

      <button
        onClick={submit}
        disabled={blocked || !mark}
        className={`w-full py-3 rounded-lg font-semibold text-[13px] text-black transition disabled:opacity-40 ${
          isLong ? "bg-[#22c55e] hover:bg-[#16a34a]" : "bg-[#ef4444] hover:bg-[#dc2626]"
        }`}
      >
        {existing && existing.side === side ? "Tambah " : "Open "}
        {isLong ? "Long" : "Short"} {pair.name}
      </button>
    </div>
  );
      }
