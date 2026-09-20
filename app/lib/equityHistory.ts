import { START_BALANCE } from "./trading";

export type EquityPoint = { t: number; equity: number };
export type Timeframe = "24H" | "7D" | "30D" | "ALL";

export const TIMEFRAMES: Timeframe[] = ["24H", "7D", "30D", "ALL"];

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const SAMPLE_EVERY_MS = MIN;

const WINDOW_MS: Record<Exclude<Timeframe, "ALL">, number> = {
  "24H": DAY,
  "7D": 7 * DAY,
  "30D": 30 * DAY,
};

export const TF_LABEL: Record<Timeframe, string> = {
  "24H": "24h",
  "7D": "7d",
  "30D": "30d",
  ALL: "All-time",
};

export function compactHistory(points: EquityPoint[], now = Date.now()): EquityPoint[] {
  const out: EquityPoint[] = [];
  let lastBucket = -1;
  let lastBucketSize = 0;

  for (const p of points) {
    const age = now - p.t;
    const size = age <= DAY ? 0 : age <= 30 * DAY ? 15 * MIN : 6 * HOUR;
    if (size === 0) {
      out.push(p);
      lastBucket = -1;
      continue;
    }
    const bucket = Math.floor(p.t / size);
    if (bucket === lastBucket && size === lastBucketSize) {
      out[out.length - 1] = p;
    } else {
      out.push(p);
      lastBucket = bucket;
      lastBucketSize = size;
    }
  }
  return out;
}

export function loadHistory(key: string): EquityPoint[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p) => p && Number.isFinite(p.t) && Number.isFinite(p.equity))
      .sort((a, b) => a.t - b.t);
  } catch {
    return [];
  }
}

export function saveHistory(key: string, points: EquityPoint[]) {
  try {
    localStorage.setItem(key, JSON.stringify(points));
  } catch {}
}

export type PnlSeries = {
  points: { t: number; pnl: number; equity: number }[];
  pnl: number;
  pct: number;
  baseline: number;
};

export function buildSeries(
  history: EquityPoint[],
  tf: Timeframe,
  currentEquity: number,
  now = Date.now()
): PnlSeries {
  const live: EquityPoint = { t: now, equity: currentEquity };
  const all = [...history, live];

  let baseline: number;
  let pts: EquityPoint[];

  if (tf === "ALL") {
    baseline = START_BALANCE;
    pts = all;
    if (pts[0].equity !== START_BALANCE) {
      pts = [{ t: pts[0].t - 1, equity: START_BALANCE }, ...pts];
    }
  } else {
    const start = now - WINDOW_MS[tf];
    const inWindow = all.filter((p) => p.t >= start);
    const before = [...all].reverse().find((p) => p.t < start);
    if (before) {
      baseline = before.equity;
      pts = [{ t: start, equity: before.equity }, ...inWindow];
    } else {
      baseline = inWindow[0].equity;
      pts = inWindow;
    }
  }

  const MAX = 240;
  if (pts.length > MAX) {
    const step = (pts.length - 1) / (MAX - 1);
    const sampled: EquityPoint[] = [];
    for (let i = 0; i < MAX - 1; i++) sampled.push(pts[Math.round(i * step)]);
    sampled.push(pts[pts.length - 1]);
    pts = sampled;
  }

  const points = pts.map((p) => ({
    t: p.t,
    equity: Number(p.equity.toFixed(2)),
    pnl: Number((p.equity - baseline).toFixed(2)),
  }));

  const pnl = currentEquity - baseline;
  return { points, pnl, pct: baseline > 0 ? (pnl / baseline) * 100 : 0, baseline };
}

export function formatTick(t: number, tf: Timeframe) {
  const d = new Date(t);
  if (tf === "24H") return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTooltipTime(t: number) {
  return new Date(t).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
               }
