"use client";
import { useEffect, useRef, useState } from "react";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const BTC_USD_FEED = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43" as const;
const AGGREGATOR_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

export type PricePoint = { time: string; price: number };

export function useChainlinkPrice(maxPoints = 30) {
  const [displayPrice, setDisplayPrice] = useState<number | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetPriceRef = useRef<number | null>(null);
  const currentPriceRef = useRef<number | null>(null);

  // Polling on-chain tiap 3 detik — ambil harga "target"
  useEffect(() => {
    let active = true;
    async function fetchPrice() {
      try {
        const data = await client.readContract({
          address: BTC_USD_FEED,
          abi: AGGREGATOR_ABI,
          functionName: "latestRoundData",
        });
        const formatted = Number(data[1]) / 1e8;
        if (!active) return;
        targetPriceRef.current = formatted;
        if (currentPriceRef.current === null) currentPriceRef.current = formatted;
        setError(null);
        setHistory((prev) =>
          [...prev, { time: new Date().toLocaleTimeString(), price: formatted }].slice(-maxPoints)
        );
      } catch {
        if (active) setError("Gagal ambil harga on-chain");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [maxPoints]);

  // Animasi tiap frame — angka "meluncur" pelan menuju target
  useEffect(() => {
    let rafId: number;
    function animate() {
      const target = targetPriceRef.current;
      const current = currentPriceRef.current;
      if (target !== null && current !== null) {
        // Tambahin sedikit noise biar kerasa "hidup" antar update on-chain
        const jitter = (Math.random() - 0.5) * target * 0.00005;
        const next = current + (target - current) * 0.08 + jitter;
        currentPriceRef.current = next;
        setDisplayPrice(next);
      }
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return { price: displayPrice, history, loading, error };
                     }
