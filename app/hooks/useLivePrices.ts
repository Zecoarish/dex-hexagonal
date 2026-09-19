"use client";

import { useEffect, useRef, useState } from "react";
import { PAIRS } from "../lib/trading";

export type Tick = { price: number; open: number };
export type Prices = Record<string, Tick>;

const API = "https://api.hyperliquid.xyz/info";
const WS = "wss://api.hyperliquid.xyz/ws";

export function useLivePrices() {
  const [prices, setPrices] = useState<Prices>({});
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const mids = useRef<Record<string, number>>({});
  const dayOpen = useRef<Record<string, number>>({});

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    // Harga awal + harga 24 jam lalu (buat persen perubahan)
    const loadBase = async () => {
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "metaAndAssetCtxs" }),
        });
        const [meta, ctxs] = await res.json();
        meta.universe.forEach((u: { name: string }, i: number) => {
          const prev = parseFloat(ctxs[i]?.prevDayPx);
          const mark = parseFloat(ctxs[i]?.markPx);
          if (prev) dayOpen.current[u.name] = prev;
          if (mark && !mids.current[u.name]) mids.current[u.name] = mark;
        });
      } catch {}
    };

    const connect = () => {
      ws = new WebSocket(WS);
      ws.onopen = () => {
        setStatus("live");
        ws?.send(JSON.stringify({ method: "subscribe", subscription: { type: "allMids" } }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.channel !== "allMids") return;
          const m = msg.data.mids as Record<string, string>;
          PAIRS.forEach((p) => {
            const v = parseFloat(m[p.name]);
            if (v) mids.current[p.name] = v;
          });
        } catch {}
      };
      ws.onclose = () => {
        if (!closed) {
          setStatus("offline");
          retry = setTimeout(connect, 2000);
        }
      };
      ws.onerror = () => ws?.close();
    };

    loadBase();
    connect();

    // Tampilan cuma di-update 1x per detik biar nggak kebut
    const flush = setInterval(() => {
      const next: Prices = {};
      PAIRS.forEach((p) => {
        const price = mids.current[p.name];
        if (price) next[p.name] = { price, open: dayOpen.current[p.name] ?? price };
      });
      setPrices(next);
    }, 1000);
    const reload = setInterval(loadBase, 5 * 60 * 1000);

    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(flush);
      clearInterval(reload);
      ws?.close();
    };
  }, []);

  return { prices, status };
                        }
