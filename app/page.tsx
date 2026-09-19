'use client';

import React, { useState, useEffect } from 'react';
import { HexagonalLogo } from './components/HexagonalLogo';
import { usePersistentAuth } from './hooks/usePersistentAuth';
import TradingViewWidget from './components/TradingViewWidget';

export default function TradePage() {
  const { session, login, logout, updateBalance } = usePersistentAuth();
  const [pairsData, setPairsData] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [accessCode, setAccessCode] = useState('');

  // Meta Data 16 Koin
  const pairsMeta = [
    { symbol: 'BTC/USDT', name: 'Bitcoin', binanceSymbol: 'BTCUSDT', leverage: '100x', category: 'Top' },
    { symbol: 'ETH/USDT', name: 'Ethereum', binanceSymbol: 'ETHUSDT', leverage: '50x', category: 'Top' },
    { symbol: 'SOL/USDT', name: 'Solana', binanceSymbol: 'SOLUSDT', leverage: '20x', category: 'Layer 1' },
    { symbol: 'LINK/USDT', name: 'Chainlink', binanceSymbol: 'LINKUSDT', leverage: '10x', category: 'DeFi' },
    { symbol: 'DOGE/USDT', name: 'Dogecoin', binanceSymbol: 'DOGEUSDT', leverage: '10x', category: 'Meme' },
    { symbol: 'XRP/USDT', name: 'XRP', binanceSymbol: 'XRPUSDT', leverage: '10x', category: 'Top' },
    { symbol: 'BNB/USDT', name: 'BNB', binanceSymbol: 'BNBUSDT', leverage: '20x', category: 'Top' },
    { symbol: 'ADA/USDT', name: 'Cardano', binanceSymbol: 'ADAUSDT', leverage: '10x', category: 'Layer 1' },
    { symbol: 'TRX/USDT', name: 'TRON', binanceSymbol: 'TRXUSDT', leverage: '10x', category: 'Layer 1' },
    { symbol: 'DOT/USDT', name: 'Polkadot', binanceSymbol: 'DOTUSDT', leverage: '10x', category: 'Layer 1' },
    { symbol: 'LTC/USDT', name: 'Litecoin', binanceSymbol: 'LTCUSDT', leverage: '10x', category: 'Top' },
    { symbol: 'NEAR/USDT', name: 'NEAR Protocol', binanceSymbol: 'NEARUSDT', leverage: '5x', category: 'Layer 1' },
    { symbol: 'SUI/USDT', name: 'Sui', binanceSymbol: 'SUIUSDT', leverage: '10x', category: 'Layer 1' },
    { symbol: 'ARB/USDT', name: 'Arbitrum', binanceSymbol: 'ARBUSDT', leverage: '10x', category: 'Layer 1' },
    { symbol: 'OP/USDT', name: 'Optimism', binanceSymbol: 'OPUSDT', leverage: '10x', category: 'Layer 1' },
    { symbol: 'PEPE/USDT', name: 'Pepe', binanceSymbol: 'PEPEUSDT', leverage: '5x', category: 'Meme' }
  ];

  // Realtime WebSocket Connection
  useEffect(() => {
    const initialData = pairsMeta.map(p => ({
      ...p,
      price: 0,
      change24h: 0,
      volume24h: 0
    }));
    setPairsData(initialData);
    setSelectedPair(initialData[0]);

    const streamNames = pairsMeta.map(p => `${p.binanceSymbol.toLowerCase()}@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamNames}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.s) {
          setPairsData(prev => prev.map(item => {
            if (item.binanceSymbol === data.s) {
              return {
                ...item,
                price: parseFloat(data.c),
                change24h: parseFloat(data.P),
                volume24h: parseFloat(data.q)
              };
            }
            return item;
          }));
        }
      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  if (!session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-[#121820] border border-gray-800 rounded-2xl p-8 max-w-md w-full flex flex-col items-center shadow-2xl">
          <HexagonalLogo className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Join Waitlist / Access DEX</h1>
          <p className="text-gray-400 text-sm mb-6 text-center">Masukkan Access Code waitlist kamu untuk masuk ke platform.</p>

          <form onSubmit={(e) => { e.preventDefault(); login(); }} className="w-full flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Enter Waitlist / Access Code" 
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full bg-[#0B0F14] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition duration-200 mt-2"
            >
              Enter App
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activePair = pairsData.find(p => p.binanceSymbol === selectedPair?.binanceSymbol) || pairsData[0] || pairsMeta[0];
  const currentPrice = activePair?.price || 0;

  // Helper untuk format desimal koin kecil (seperti PEPE/DOGE)
  const formatPrice = (p: number) => {
    if (!p) return '0.00';
    if (p < 0.01) return p.toFixed(6);
    if (p < 1) return p.toFixed(4);
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Dynamic Generator Orderbook Realtime
  const spreadMultiplier = currentPrice < 1 ? 0.001 : 0.0003;
  const asks = [4, 3, 2, 1].map((step, idx) => ({
    price: currentPrice + (currentPrice * spreadMultiplier * step),
    amount: (Math.sin(currentPrice + idx) * 0.5 + 0.6).toFixed(3)
  }));
  const bids = [1, 2, 3, 4].map((step, idx) => ({
    price: currentPrice - (currentPrice * spreadMultiplier * step),
    amount: (Math.cos(currentPrice + idx) * 0.5 + 0.6).toFixed(3)
  }));

  const filteredPairs = pairsData.filter(p => {
    const matchesTab = activeTab === 'All' || p.category === activeTab;
    const matchesSearch = p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0B0F14] text-gray-200 font-sans flex flex-col h-screen overflow-hidden">
      <header className="h-14 border-b border-[#1F2937] bg-[#0B0F14] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <HexagonalLogo />
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button className="text-blue-400 border-b-2 border-blue-500 pb-4 pt-4">Trade</button>
            <button className="text-gray-400 hover:text-white">Portfolio</button>
            <button className="text-gray-400 hover:text-white">Earn</button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121820] border border-gray-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
            <span className="text-gray-400 text-xs">Demo:</span>
            <span className="font-semibold text-white">${session.demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <button 
            onClick={logout}
            className="bg-[#121820] border border-gray-800 hover:border-red-500/50 text-xs text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-2 transition"
          >
            <span>{session.address}</span>
            <span className="text-red-400 font-bold">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-0.5 bg-[#1F2937] overflow-hidden">
        {/* PANEL KIRI: PAIR LIST */}
        <div className="col-span-3 bg-[#0B0F14] flex flex-col h-full border-r border-[#1F2937]">
          <div className="p-3 border-b border-[#1F2937]">
            <input 
              type="text" 
              placeholder="Search coins..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121820] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 mt-2 overflow-x-auto text-[11px] text-gray-400 no-scrollbar">
              {['All', 'Top', 'Layer 1', 'DeFi', 'Meme'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-2 py-0.5 rounded ${activeTab === cat ? 'bg-gray-800 text-white' : 'hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-900">
            {filteredPairs.map((pair) => (
              <div 
                key={pair.symbol} 
                onClick={() => setSelectedPair(pair)}
                className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#121820] transition ${activePair?.binanceSymbol === pair.binanceSymbol ? 'bg-[#121820] border-l-2 border-blue-500' : ''}`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">{pair.symbol}</span>
                    <span className="text-[9px] bg-gray-800 text-amber-400 px-1 rounded">{pair.leverage}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{pair.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-white">
                    ${formatPrice(pair.price)}
                  </div>
                  <div className={`text-[10px] ${pair.change24h >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {pair.change24h >= 0 ? '+' : ''}{pair.change24h ? pair.change24h.toFixed(2) : '0.00'}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL TENGAH: CHART */}
        <div className="col-span-6 bg-[#0B0F14] flex flex-col h-full border-r border-[#1F2937]">
          <div className="p-3 border-b border-[#1F2937] flex items-center justify-between bg-[#0B0F14]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {activePair?.symbol || 'BTC/USDT'}
                <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-normal">Perp</span>
              </h2>
              <div>
                <div className="text-xs text-gray-400">Mark Price</div>
                <div className="text-sm font-semibold text-white">
                  ${formatPrice(currentPrice)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">24h Change</div>
                <div className={`text-sm font-semibold ${(activePair?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {(activePair?.change24h || 0) >= 0 ? '+' : ''}{(activePair?.change24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="h-[400px] bg-[#0B0F14] relative border-b border-[#1F2937]">
            <TradingViewWidget symbol={activePair?.binanceSymbol || 'BTCUSDT'} />
          </div>
        </div>

        {/* PANEL KANAN: REALTIME ORDERBOOK */}
        <div className="col-span-3 bg-[#0B0F14] flex flex-col h-full">
          <div className="p-3 border-b border-[#1F2937] flex justify-between items-center">
            <span className="text-xs font-bold text-white">Order Book</span>
            <span className="text-[10px] text-gray-500">Size (USDT)</span>
          </div>

          <div className="flex-1 p-3 flex flex-col justify-between text-[11px] font-mono">
            {/* ASKS (RED) */}
            <div className="space-y-1.5">
              {asks.map((ask, i) => (
                <div key={i} className="flex justify-between items-center text-rose-400 hover:bg-rose-950/20 px-1 rounded transition">
                  <span className="font-semibold">${formatPrice(ask.price)}</span>
                  <span className="text-gray-400">{ask.amount}</span>
                </div>
              ))}
            </div>

            {/* CURRENT SPREAD PRICE */}
            <div className="my-3 py-2 text-center font-bold text-emerald-400 text-xs bg-[#121820] rounded border border-gray-800/60 shadow-inner flex items-center justify-center gap-1">
              <span>${formatPrice(currentPrice)}</span>
              <span className="animate-pulse">⚡</span>
            </div>

            {/* BIDS (GREEN) */}
            <div className="space-y-1.5">
              {bids.map((bid, i) => (
                <div key={i} className="flex justify-between items-center text-emerald-400 hover:bg-emerald-950/20 px-1 rounded transition">
                  <span className="font-semibold">${formatPrice(bid.price)}</span>
                  <span className="text-gray-400">{bid.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                  }
                
