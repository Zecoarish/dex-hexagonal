export type Side = "LONG" | "SHORT";

export type Pair = { name: string; tv: string; maxLev: number; decimals: number };

export const PAIRS: Pair[] = [
  { name: "BTC", tv: "BINANCE:BTCUSDT.P", maxLev: 50, decimals: 1 },
  { name: "ETH", tv: "BINANCE:ETHUSDT.P", maxLev: 50, decimals: 2 },
  { name: "SOL", tv: "BINANCE:SOLUSDT.P", maxLev: 25, decimals: 2 },
  { name: "BNB", tv: "BINANCE:BNBUSDT.P", maxLev: 25, decimals: 2 },
  { name: "XRP", tv: "BINANCE:XRPUSDT.P", maxLev: 20, decimals: 4 },
  { name: "HYPE", tv: "BINANCE:HYPEUSDT.P", maxLev: 10, decimals: 3 },
  { name: "AAVE", tv: "BINANCE:AAVEUSDT.P", maxLev: 10, decimals: 2 },
  { name: "SUI", tv: "BINANCE:SUIUSDT.P", maxLev: 10, decimals: 4 },
  { name: "APT", tv: "BINANCE:APTUSDT.P", maxLev: 10, decimals: 3 },
];

export type Position = {
  id: number;
  pair: string;
  side: Side;
  entry: number;
  qty: number;
  margin: number;
  lev: number;
  tp: number | null;
  sl: number | null;
};

export type Trade = {
  id: number;
  pair: string;
  side: Side;
  entry: number;
  exit: number;
  pnl: number;
  reason: string;
};

export type Acct = { balance: number; positions: Position[]; history: Trade[] };

export type OpenOrder = {
  side: Side;
  margin: number;
  lev: number;
  tp: number | null;
  sl: number | null;
};

export const START_BALANCE = 10000;
const MMR = 0.005;

export const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const decOf = (name: string) => PAIRS.find((p) => p.name === name)?.decimals ?? 2;

export const pnlOf = (p: Position, mark: number) =>
  (mark - p.entry) * p.qty * (p.side === "LONG" ? 1 : -1);

export const liqPrice = (p: Position) => {
  const m = p.margin / (p.qty * p.entry);
  return p.side === "LONG" ? p.entry * (1 - m + MMR) : p.entry * (1 + m - MMR);
};

export const estLiq = (side: Side, price: number, lev: number) =>
  side === "LONG" ? price * (1 - 1 / lev + MMR) : price * (1 + 1 / lev - MMR);

export function settle(a: Acct, id: number, exit: number, reason: string): Acct {
  const p = a.positions.find((x) => x.id === id);
  if (!p) return a;
  const pnl = reason === "Liquidated" ? -p.margin : Math.max(pnlOf(p, exit), -p.margin);
  const trade: Trade = {
    id: Date.now() + Math.random(),
    pair: p.pair,
    side: p.side,
    entry: p.entry,
    exit,
    pnl,
    reason,
  };
  return {
    balance: a.balance + p.margin + pnl,
    positions: a.positions.filter((x) => x.id !== id),
    history: [trade, ...a.history].slice(0, 30),
  };
  }
