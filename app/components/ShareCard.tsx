"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Download, X as XIcon } from "lucide-react";
import { decOf, fmt } from "../lib/trading";

export type ShareData = {
  pair: string;
  side: "LONG" | "SHORT";
  lev: number;
  pnl: number;
  roe: number | null;
  entry: number;
  mark: number;
  closed: boolean;
};

const W = 1080;
const H = 940;

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const BLUE = "#3B82F6";
const VIOLET = "#8B5CF6";

const LOGO_HEX = "M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 Z";
const LOGO_H = "M32 30 H44 V42 H56 V30 H68 V70 H56 V54 H44 V70 H32 Z";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  const g = ctx.createLinearGradient(0, 0, 100, 100);
  g.addColorStop(0, BLUE);
  g.addColorStop(1, VIOLET);
  ctx.fillStyle = g;
  ctx.fill(new Path2D(LOGO_HEX));
  ctx.fillStyle = "#0B0F14";
  ctx.fill(new Path2D(LOGO_H));
  ctx.restore();
}

function drawHexGrid(ctx: CanvasRenderingContext2D) {
  const r = 52;
  const w = Math.sqrt(3) * r;
  ctx.save();
  ctx.lineWidth = 1.5;
  for (let row = -1; row < H / (r * 1.5) + 2; row++) {
    for (let col = -1; col < W / w + 2; col++) {
      const cx = col * w + (row % 2 ? w / 2 : 0);
      const cy = row * r * 1.5;
      const alpha = 0.075 * Math.max(0, 1 - cy / H);
      if (alpha <= 0.004) continue;
      ctx.strokeStyle = `rgba(148,163,255,${alpha})`;
      hexPath(ctx, cx, cy, r - 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function draw(canvas: HTMLCanvasElement, d: ShareData, showUsd: boolean, origin: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const profit = d.pnl >= 0;
  const neon = profit ? "#00ff85" : "#ff4d6a";
  const neonSoft = profit ? "rgba(0,255,133," : "rgba(255,77,106,";
  const dec = decOf(d.pair);

  ctx.clearRect(0, 0, W, H);
  ctx.save();

  roundRect(ctx, 0, 0, W, H, 44);
  ctx.clip();

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#070a13");
  bg.addColorStop(1, "#0e1230");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  let glow = ctx.createRadialGradient(150, 60, 0, 150, 60, 620);
  glow.addColorStop(0, "rgba(59,130,246,0.38)");
  glow.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  glow = ctx.createRadialGradient(W - 100, H - 120, 0, W - 100, H - 120, 640);
  glow.addColorStop(0, "rgba(139,92,246,0.34)");
  glow.addColorStop(1, "rgba(139,92,246,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  glow = ctx.createRadialGradient(W / 2, 520, 0, W / 2, 520, 480);
  glow.addColorStop(0, `${neonSoft}0.20)`);
  glow.addColorStop(1, `${neonSoft}0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  drawHexGrid(ctx);

  // top-left: pair pill
  const pillY = 62;
  const pillH = 84;
  ctx.font = `700 40px ${FONT}`;
  const pairW = ctx.measureText(d.pair).width;
  ctx.font = `500 36px ${FONT}`;
  const levText = `${Math.round(d.lev * 10) / 10}x`;
  const levW = ctx.measureText(levText).width;
  ctx.font = `700 32px ${FONT}`;
  const sideText = d.side === "LONG" ? "Long" : "Short";
  const sideW = ctx.measureText(sideText).width + 40;
  const pillW = 30 + pairW + 18 + levW + 18 + sideW + 14;

  roundRect(ctx, 60, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textBaseline = "middle";
  let x = 60 + 30;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillStyle = "#fff";
  ctx.fillText(d.pair, x, pillY + pillH / 2 + 1);
  x += pairW + 18;
  ctx.font = `500 36px ${FONT}`;
  ctx.fillStyle = "#a1a1aa";
  ctx.fillText(levText, x, pillY + pillH / 2 + 1);
  x += levW + 18;

  const sideCol = d.side === "LONG" ? "#4ade80" : "#f87171";
  roundRect(ctx, x, pillY + 14, sideW, pillH - 28, (pillH - 28) / 2);
  ctx.fillStyle = d.side === "LONG" ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.24)";
  ctx.fill();
  ctx.font = `700 32px ${FONT}`;
  ctx.fillStyle = sideCol;
  ctx.textAlign = "center";
  ctx.fillText(sideText, x + sideW / 2, pillY + pillH / 2 + 1);
  ctx.textAlign = "left";

  // top-right: brand
  ctx.font = `800 44px ${FONT}`;
  const brandText = "HEXAGONAL";
  const brandW = ctx.measureText(brandText).width;
  const logoSize = 84;
  const brandRight = W - 60;
  const brandX = brandRight - brandW;
  drawLogo(ctx, brandX - logoSize - 16, pillY, logoSize);
  const tg = ctx.createLinearGradient(brandX, 0, brandRight, 0);
  tg.addColorStop(0, "#60A5FA");
  tg.addColorStop(1, "#C084FC");
  ctx.fillStyle = tg;
  ctx.fillText(brandText, brandX, pillY + 30);
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = "#9ca3af";
  let lx = brandX + 3;
  for (const ch of "D E X") {
    ctx.fillText(ch, lx, pillY + 66);
    lx += ctx.measureText(ch).width + 4;
  }

  // centre emblem
  const ex = W / 2;
  const ey = 340;

  ctx.save();
  ctx.shadowColor = `${neonSoft}0.55)`;
  ctx.shadowBlur = 70;
  hexPath(ctx, ex, ey, 190);
  const eg = ctx.createLinearGradient(ex - 190, ey - 190, ex + 190, ey + 190);
  eg.addColorStop(0, BLUE);
  eg.addColorStop(1, VIOLET);
  ctx.fillStyle = eg;
  ctx.fill();
  ctx.restore();

  hexPath(ctx, ex, ey, 166);
  ctx.fillStyle = "#0B0F14";
  ctx.fill();

  hexPath(ctx, ex, ey, 150);
  const ig = ctx.createLinearGradient(ex - 150, ey - 150, ex + 150, ey + 150);
  ig.addColorStop(0, "rgba(59,130,246,0.30)");
  ig.addColorStop(1, "rgba(139,92,246,0.30)");
  ctx.fillStyle = ig;
  ctx.fill();

  ctx.save();
  ctx.translate(ex, ey + 8);
  ctx.scale(2.7, 2.7);
  ctx.translate(-50, -50);
  const hg = ctx.createLinearGradient(32, 30, 68, 70);
  hg.addColorStop(0, "#93C5FD");
  hg.addColorStop(1, "#C4B5FD");
  ctx.fillStyle = hg;
  ctx.fill(new Path2D(LOGO_H));
  ctx.restore();

  ctx.save();
  ctx.shadowColor = neon;
  ctx.shadowBlur = 22;
  ctx.fillStyle = neon;
  hexPath(ctx, ex - 42, ey - 98, 11);
  ctx.fill();
  hexPath(ctx, ex + 42, ey - 98, 11);
  ctx.fill();
  ctx.restore();

  const sparks: [number, number, number][] = [
    [250, 250, 16],
    [175, 420, 10],
    [835, 235, 12],
    [900, 400, 18],
    [790, 470, 8],
  ];
  for (const [sx, sy, sr] of sparks) {
    hexPath(ctx, sx, sy, sr);
    ctx.fillStyle = "rgba(139,92,246,0.35)";
    ctx.fill();
    ctx.strokeStyle = "rgba(96,165,250,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // PnL pill
  const pnlAbs = Math.abs(d.pnl);
  const useUsd = showUsd || d.roe === null;
  const bigText = useUsd
    ? `${profit ? "+" : "-"}$${pnlAbs >= 100 ? Math.round(pnlAbs).toLocaleString("en-US") : fmt(pnlAbs)}`
    : `${d.roe! >= 0 ? "+" : "-"}${fmt(Math.abs(d.roe!), 1)}%`;

  const pillBoxW = 800;
  const pillBoxH = 190;
  const pillBoxX = (W - pillBoxW) / 2;
  const pillBoxY = 470;

  for (const dir of [-1, 1]) {
    const cx = W / 2 + dir * (pillBoxW / 2 + 44);
    ctx.save();
    ctx.shadowColor = neon;
    ctx.shadowBlur = 18;
    for (let i = 0; i < 2; i++) {
      hexPath(ctx, cx + dir * i * 26, pillBoxY + pillBoxH / 2, 34 - i * 8);
      ctx.strokeStyle = neon;
      ctx.globalAlpha = i === 0 ? 0.9 : 0.5;
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    ctx.restore();
  }

  roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, pillBoxH / 2);
  ctx.fillStyle = profit ? "rgba(8,34,26,0.96)" : "rgba(40,12,20,0.96)";
  ctx.fill();
  ctx.strokeStyle = `${neonSoft}0.55)`;
  ctx.lineWidth = 3;
  ctx.stroke();

  let fs = 150;
  ctx.font = `800 ${fs}px ${FONT}`;
  while (ctx.measureText(bigText).width > pillBoxW - 110 && fs > 50) {
    fs -= 4;
    ctx.font = `800 ${fs}px ${FONT}`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.shadowColor = neon;
  ctx.shadowBlur = 36;
  ctx.fillStyle = neon;
  ctx.fillText(bigText, W / 2, pillBoxY + pillBoxH / 2 + 6);
  ctx.restore();

  let sub = "";
  if (d.roe !== null) {
    sub = useUsd
      ? `ROE ${d.roe >= 0 ? "+" : "-"}${fmt(Math.abs(d.roe), 1)}%`
      : `PnL ${profit ? "+" : "-"}$${fmt(pnlAbs)}`;
  }
  ctx.font = `600 34px ${FONT}`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(sub || (d.closed ? "Closed position" : "Open position"), W / 2, pillBoxY + pillBoxH + 52);
  ctx.textAlign = "left";

  // stats row
  const rowY = 780;
  const bar = ctx.createLinearGradient(0, rowY - 8, 0, rowY + 84);
  bar.addColorStop(0, BLUE);
  bar.addColorStop(1, VIOLET);
  ctx.fillStyle = bar;
  roundRect(ctx, 60, rowY - 6, 6, 92, 3);
  ctx.fill();

  const cols: [string, string, number][] = [
    ["Entry Price", fmt(d.entry, dec), 90],
    [d.closed ? "Exit Price" : "Mark Price", fmt(d.mark, dec), 350],
    ["Start Trading", origin.replace(/^https?:\/\//, ""), 600],
  ];
  ctx.textBaseline = "alphabetic";
  for (const [label, value, cx] of cols) {
    ctx.font = `500 28px ${FONT}`;
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(label, cx, rowY + 24);
    let vfs = 40;
    ctx.font = `700 ${vfs}px ${FONT}`;
    const maxW = W - 60 - cx;
    while (ctx.measureText(value).width > maxW && vfs > 16) {
      vfs -= 2;
      ctx.font = `700 ${vfs}px ${FONT}`;
    }
    ctx.fillStyle = "#fff";
    ctx.fillText(value, cx, rowY + 74);
  }

  // footer
  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = "rgba(148,163,184,0.75)";
  ctx.textAlign = "center";
  ctx.fillText("PAPER TRADING · HEXAGONAL DEX TESTNET", W / 2, H - 34);
  ctx.textAlign = "left";

  ctx.restore();

  // gradient border
  ctx.save();
  roundRect(ctx, 2, 2, W - 4, H - 4, 42);
  const bd = ctx.createLinearGradient(0, 0, W, H);
  bd.addColorStop(0, "rgba(59,130,246,0.9)");
  bd.addColorStop(1, "rgba(139,92,246,0.9)");
  ctx.strokeStyle = bd;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

export default function ShareCard({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showUsd, setShowUsd] = useState(true);
  const [note, setNote] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current, data, showUsd, origin);
  }, [data, showUsd, origin]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(""), 2500);
    return () => clearTimeout(t);
  }, [note]);

  const toBlob = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        if (!canvasRef.current) return resolve(null);
        canvasRef.current.toBlob((b) => resolve(b), "image/png");
      }),
    []
  );

  const fileName = `hexagonal-pnl-${data.pair}.png`;

  const save = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNote("Image saved");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(origin);
      setNote("Link copied");
    } catch {
      setNote("Could not copy link");
    }
  };

  const shareToX = async () => {
    const pnlText = `${data.pnl >= 0 ? "+" : "-"}$${fmt(Math.abs(data.pnl))}`;
    const text = `${pnlText} on ${data.pair} ${Math.round(data.lev * 10) / 10}x ${
      data.side === "LONG" ? "Long" : "Short"
    } — paper trading on Hexagonal DEX`;

    try {
      const blob = await toBlob();
      if (blob) {
        const file = new File([blob], fileName, { type: "image/png" });
        const nav = navigator as any;
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], text, url: origin });
          return;
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(origin)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setNote("Tip: tap Save and attach the image to your post");
  };

  const btn =
    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition active:scale-[0.98]";

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-full text-zinc-300 hover:bg-white/10"
            >
              <XIcon size={20} />
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full h-auto rounded-2xl shadow-2xl"
            style={{ aspectRatio: `${W} / ${H}` }}
          />

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={save}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-sm font-semibold"
            >
              <Download size={16} />
              Save
            </button>

            {data.roe !== null && (
              <button
                onClick={() => setShowUsd((v) => !v)}
                className="flex items-center gap-3 text-sm font-semibold text-zinc-300"
              >
                SHOW AS $
                <span
                  className={`relative w-12 h-7 rounded-full transition ${
                    showUsd ? "bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      showUsd ? "left-6" : "left-1"
                    }`}
                  />
                </span>
              </button>
            )}
          </div>

          <p className="text-sm text-zinc-400 mt-6 mb-2">Share this trade</p>
          <div className="flex gap-3">
            <button onClick={copyLink} className={`${btn} bg-white text-black`}>
              <Copy size={16} />
              COPY LINK
            </button>
            <button
              onClick={shareToX}
              className={`${btn} bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white`}
            >
              <span className="font-black text-base leading-none">𝕏</span>
              SHARE TO X
            </button>
          </div>

          <p className="h-5 mt-3 text-center text-xs text-zinc-400">{note}</p>
        </div>
      </div>
    </div>
  );
        }
