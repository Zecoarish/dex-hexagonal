"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLivePrices, Prices } from "../hooks/useLivePrices";
import {
  Acct,
  OpenOrder,
  Position,
  START_BALANCE,
  Trade,
  liqPrice,
  pnlOf,
  settle,
} from "../lib/trading";

const KEY = "hexagonal_demo_v1";
const EMPTY: Acct = { balance: START_BALANCE, positions: [], history: [] };
const MAX_EQUITY_POINTS = 200;

export type EquityPoint = { t: number; equity: number };

type Ctx = {
  prices: Prices;
  status: string;
  acct: Acct;
  loaded: boolean;
  used: number;
  upnl: number;
  equity: number;
  equityHistory: EquityPoint[];
  toast: string;
  openPosition: (pair: string, mark: number | null, o: OpenOrder) => string | null;
  closePosition: (id: number) => void;
  reversePosition: (id: number) => void;
  editTpSl: (id: number, tp: number | null, sl: number | null) => string | null;
  resetDemo: () => void;
};

const TradingCtx = createContext<Ctx | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const { prices, status } = useLivePrices();
  const [acct, setAcct] = useState<Acct>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [equityHistory, setEquityHistory] = useState<EquityPoint[]>([]);
  const lastId = useRef<number | null>(null);
  const lastSample = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const a = JSON.parse(raw) as Acct;
        a.positions = a.positions.map((p) => ({ marginMode: "ISOLATED", ...p }));
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

  useEffect(() => {
    if (!loaded) return;
    setAcct((a) => {
      let next = a;
      for (const p of a.positions) {
        const t = prices[p.pair];
        if (!t) continue;
        const px = t.price;
        const long = p.side === "LONG";
        const liq = liqPrice(p, next.balance);
        if (long ? px <= liq : px >= liq) next = settle(next, p.id, liq, "Liquidated");
        else if (p.sl && (long ? px <= p.sl : px >= p.sl)) next = settle(next, p.id, p.sl, "Stop Loss");
        else if (p.tp && (long ? px >= p.tp : px <= p.tp)) next = settle(next, p.id, p.tp, "Take Profit");
      }
      return next;
    });
  }, [prices, loaded]);

  useEffect(() => {
    const h = acct.history[0];
    if (!loaded || !h || h.id === lastId.current) return;
    lastId.current = h.id;
    setToast(`${h.pair} ${h.side} closed (${h.reason}): ${h.pnl >= 0 ? "+" : ""}$${h.pnl.toFixed(2)}`);
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [acct.history, loaded]);

  const used = acct.positions.reduce((s, p) => s + p.margin, 0);
  const upnl = acct.positions.reduce((s, p) => s + pnlOf(p, prices[p.pair]?.price ?? p.entry), 0);
  const equity = acct.balance + used + upnl;

  useEffect(() => {
    if (!loaded) return;
    const now = Date.now();
    if (now - lastSample.current < 1000) return;
    lastSample.current = now;
    setEquityHistory((h) => [...h, { t: now, equity }].slice(-MAX_EQUITY_POINTS));
  }, [equity, loaded]);

  const openPosition = (pair: string, mark: number | null, o: OpenOrder): string | null => {
    if (mark === null) return "Price feed not ready yet, please wait a moment.";
    if (!(o.margin >= 10)) return "Minimum margin is $10.";
    if (o.margin > acct.balance) return "Insufficient balance.";
    const long = o.side === "LONG";
    if (o.tp !== null && (long ? o.tp <= mark : o.tp >= mark))
      return `Take Profit must be ${long ? "above" : "below"} the current price.`;
    if (o.sl !== null && (long ? o.sl >= mark : o.sl <= mark))
      return `Stop Loss must be ${long ? "below" : "above"} the current price.`;
    const cur = acct.positions.find((p) => p.pair === pair);
    if (cur && cur.side !== o.side) return `You already hold ${cur.side} ${pair}. Close or Reverse it first.`;

    const add = (o.margin * o.lev) / mark;
    setAcct((a) => {
      const c = a.positions.find((p) => p.pair === pair);
      let np: Position;
      if (c) {
        const qty = c.qty + add;
        const entry = (c.entry * c.qty + mark * add) / qty;
        const margin = c.margin + o.margin;
        np = {
          ...c,
          qty,
          entry,
          margin,
          lev: (qty * entry) / margin,
          tp: o.tp ?? c.tp,
          sl: o.sl ?? c.sl,
          marginMode: o.marginMode,
        };
      } else {
        np = {
          id: Date.now(),
          pair,
          side: o.side,
          entry: mark,
          qty: add,
          margin: o.margin,
          lev: o.lev,
          tp: o.tp,
          sl: o.sl,
          marginMode: o.marginMode,
        };
      }
      return {
        ...a,
        balance: a.balance - o.margin,
        positions: c ? a.positions.map((p) => (p.pair === pair ? np : p)) : [np, ...a.positions],
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
      const side = p.side === "LONG" ? "SHORT" : "LONG";
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
        marginMode: p.marginMode,
      };
      return { ...done, balance: done.balance - margin, positions: [np, ...done.positions] };
    });
  };

  const editTpSl = (id: number, tp: number | null, sl: number | null): string | null => {
    const p = acct.positions.find((x) => x.id === id);
    const t = p && prices[p.pair];
    if (!p || !t) return "Price feed not ready yet.";
    const long = p.side === "LONG";
    if (tp !== null && (long ? tp <= t.price : tp >= t.price))
      return `Take Profit must be ${long ? "above" : "below"} the current price.`;
    if (sl !== null && (long ? sl >= t.price : sl <= t.price))
      return `Stop Loss must be ${long ? "below" : "above"} the current price.`;
    setAcct((a) => ({ ...a, positions: a.positions.map((x) => (x.id === id ? { ...x, tp, sl } : x)) }));
    return null;
  };

  const resetDemo = () => {
    if (window.confirm("Reset demo balance to $10,000 and close all positions?")) {
      setAcct(EMPTY);
      setEquityHistory([]);
    }
  };

  return (
    <TradingCtx.Provider
      value={{
        prices,
        status,
        acct,
        loaded,
        used,
        upnl,
        equity,
        equityHistory,
        toast,
        openPosition,
        closePosition,
        reversePosition,
        editTpSl,
        resetDemo,
      }}
    >
      {children}
    </TradingCtx.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingCtx);
  if (!ctx) throw new Error("useTrading must be used inside <TradingProvider>");
  return ctx;
                          }
