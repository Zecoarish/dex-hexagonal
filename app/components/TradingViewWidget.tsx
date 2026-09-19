"use client";

import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol = "BINANCE:BTCUSDT.P" }: { symbol?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    el.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "5",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0c0d0f",
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);
    return () => {
      el.innerHTML = "";
    };
  }, [symbol]);

  return <div ref={container} style={{ height: "100%", width: "100%" }} />;
}

export default memo(TradingViewWidget);
