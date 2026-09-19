"use client";

import { useEffect, useRef, useState } from "react";
import {
  createPublicClient,
  http,
} from "viem";
import { defineChain } from "viem";
import { PAIRS } from "../lib/trading";

export type Tick = {
  price: number;
  open: number;
};

export type Prices = Record<
  string,
  Tick
>;

const API =
  "https://api.hyperliquid.xyz/info";

const WS =
  "wss://api.hyperliquid.xyz/ws";

const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        "https://rpc.mainnet.arc.io",
      ],
    },
  },
});

const arcClient =
  createPublicClient({
    chain: arc,
    transport: http(),
  });

const BTC_USDC_POOL =
  "0x82916bee18fcef517b26c72d7cb5f13694e1db41" as const;

const CIRBTC =
  "0x171a4217b86a807a64eb94757db6849fb4bdbaa0";

const USDC =
  "0x3600000000000000000000000000000000000000";

const POOL_ABI = [
  {
    type: "function",
    name: "slot0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "sqrtPriceX96",
        type: "uint160",
      },
      {
        name: "tick",
        type: "int24",
      },
      {
        name: "observationIndex",
        type: "uint16",
      },
      {
        name: "observationCardinality",
        type: "uint16",
      },
      {
        name: "observationCardinalityNext",
        type: "uint16",
      },
      {
        name: "feeProtocol",
        type: "uint8",
      },
      {
        name: "unlocked",
        type: "bool",
      },
    ],
  },
  {
    type: "function",
    name: "token0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "token1",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
  },
] as const;

async function readArcBtcPrice() {
  const [
    slot0,
    token0,
    token1,
  ] = await Promise.all([
    arcClient.readContract({
      address: BTC_USDC_POOL,
      abi: POOL_ABI,
      functionName: "slot0",
    }),

    arcClient.readContract({
      address: BTC_USDC_POOL,
      abi: POOL_ABI,
      functionName: "token0",
    }),

    arcClient.readContract({
      address: BTC_USDC_POOL,
      abi: POOL_ABI,
      functionName: "token1",
    }),
  ]);

  const [
    decimals0,
    decimals1,
  ] = await Promise.all([
    arcClient.readContract({
      address: token0,
      abi: POOL_ABI,
      functionName: "decimals",
    }),

    arcClient.readContract({
      address: token1,
      abi: POOL_ABI,
      functionName: "decimals",
    }),
  ]);

  const sqrt = slot0[0];

  const rawRatio =
    Number(sqrt) ** 2 /
    Number(2n ** 192n);

  const token1PerToken0 =
    rawRatio *
    10 ** Number(decimals0) /
    10 ** Number(decimals1);

  const t0 =
    token0.toLowerCase();

  const t1 =
    token1.toLowerCase();

  if (
    t0 === CIRBTC &&
    t1 === USDC
  ) {
    return token1PerToken0;
  }

  if (
    t0 === USDC &&
    t1 === CIRBTC
  ) {
    return 1 / token1PerToken0;
  }

  return token1PerToken0 > 1000
    ? token1PerToken0
    : 1 / token1PerToken0;
}

export function useLivePrices() {
  const [prices, setPrices] =
    useState<Prices>({});

  const [status, setStatus] =
    useState<
      "connecting" | "live" | "offline"
    >("connecting");

  const mids =
    useRef<Record<string, number>>({});

  const dayOpen =
    useRef<Record<string, number>>({});

  const btcOpen =
    useRef<number | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;

    let retry:
      | ReturnType<typeof setTimeout>
      | undefined;

    let closed = false;

    const loadBase = async () => {
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            type: "metaAndAssetCtxs",
          }),
        });

        const [meta, ctxs] =
          await res.json();

        meta.universe.forEach(
          (
            u: { name: string },
            i: number
          ) => {
            const prev =
              parseFloat(
                ctxs[i]?.prevDayPx
              );

            const mark =
              parseFloat(
                ctxs[i]?.markPx
              );

            if (prev) {
              dayOpen.current[
                u.name
              ] = prev;
            }

            if (
              mark &&
              !mids.current[u.name]
            ) {
              mids.current[u.name] =
                mark;
            }
          }
        );
      } catch {}
    };

    const loadArcBtc =
      async () => {
        try {
          const price =
            await readArcBtcPrice();

          if (
            !Number.isFinite(
              price
            ) ||
            price <= 0
          ) {
            return;
          }

          mids.current.BTC =
            price;

          if (
            btcOpen.current ===
            null
          ) {
            btcOpen.current =
              price;
          }
        } catch (err) {
          console.error(
            "Arc BTC price read failed:",
            err
          );
        }
      };

    const connect = () => {
      ws = new WebSocket(WS);

      ws.onopen = () => {
        setStatus("live");

        ws?.send(
          JSON.stringify({
            method:
              "subscribe",
            subscription: {
              type: "allMids",
            },
          })
        );
      };

      ws.onmessage = (
        ev
      ) => {
        try {
          const msg =
            JSON.parse(
              ev.data
            );

          if (
            msg.channel !==
            "allMids"
          ) {
            return;
          }

          const m =
            msg.data.mids as Record<
              string,
              string
            >;

          PAIRS.forEach(
            (p) => {
              if (
                p.name ===
                "BTC"
              ) {
                return;
              }

              const v =
                parseFloat(
                  m[p.name]
                );

              if (v) {
                mids.current[
                  p.name
                ] = v;
              }
            }
          );
        } catch {}
      };

      ws.onclose = () => {
        if (closed) return;

        setStatus("offline");

        retry =
          setTimeout(
            connect,
            2000
          );
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    loadBase();
    loadArcBtc();
    connect();

    const btcTimer =
      setInterval(
        loadArcBtc,
        2000
      );

    const flush =
      setInterval(() => {
        const next: Prices = {};

        PAIRS.forEach(
          (p) => {
            const price =
              mids.current[
                p.name
              ];

            if (!price) return;

            next[p.name] = {
              price,
              open:
                p.name === "BTC"
                  ? btcOpen.current ??
                    price
                  : dayOpen.current[
                      p.name
                    ] ?? price,
            };
          }
        );

        setPrices(next);
      }, 1000);

    const reload =
      setInterval(
        loadBase,
        5 * 60 * 1000
      );

    return () => {
      closed = true;

      if (retry) {
        clearTimeout(retry);
      }

      clearInterval(
        btcTimer
      );

      clearInterval(
        flush
      );

      clearInterval(
        reload
      );

      ws?.close();
    };
  }, []);

  return {
    prices,
    status,
  };
    }
