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
  const [orderType, setOrderType] = useState<'Limit' | 'Market' | 'Trigger'>('Limit');
  const [margin, setMargin] = useState<number>(100);
  const [leverage, setLeverage] = useState<number>(35);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices');
        const json = await res.json();
        if (json.success) {
          setPairsData(json.data);
          if (!selectedPair) setSelectedPair(json.data[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  if (!session.isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-[#121820] border border-gray-800 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center shadow-2xl">
          <HexagonalLogo className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome to Hexagonal DEX</h1>
          <p className="text-gray-400 text-sm mb-6">Trade Perpetual Contracts with Ultra-Low Latency and Decentralized Liquidity.</p>
          <button
            onClick={() => login()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition duration-200"
          >
            Connect Wallet / Launch App
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = selectedPair?.price || 81230;

  return (
    <div className="min-h-screen bg-[#0B0F14] text-gray-200 font-sans flex flex-col h-screen overflow-hidden">
      <header className="h-14 border-b border-[#1F2937] bg-[#0B0F14] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <HexagonalLogo />
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button className="text-blue-400 border-b-2 border-blue-500 pb-4 pt-4">Trade</button>
            <button className="text-gray-400 hover:text-white">Portfolio</button>
            <button className="text-gray-400 hover:text-white">Earn</button>
            <button className="text-gray-400 hover:text-white">More ▾</button>
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
        <div className="col-span-2 bg-[#0B0F14] flex flex-col h-full border-r border-[#1F2937]">
          <div className="p-3 border-b border-[#1F2937]">
            <input 
              type="text" 
              placeholder="Search coins, pairs..." 
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
            {pairsData
              .filter(p => activeTab === 'All' || p.category === activeTab)
              .map((pair) => (
                <div 
                  key={pair.symbol} 
                  onClick={() => setSelectedPair(pair)}
                  className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#121820] transition ${selectedPair?.symbol === pair.symbol ? 'bg-[#121820] border-l-2 border-blue-500' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">{pair.symbol}</span>
                      <span className="text-[9px] bg-gray-800 text-amber-400 px-1 rounded">{pair.leverage}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{pair.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">${pair.price.toLocaleString()}</div>
                    <div className={`text-[10px] ${pair.change24h >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="col-span-7 bg-[#0B0F14] flex flex-col h-full overflow-y-auto">
          <div className="p-3 border-b border-[#1F2937] flex items-center justify-between bg-[#0B0F14]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {selectedPair?.symbol || 'BTC/USDT'}
                <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-normal">Perp</span>
              </h2>
              <div>
                <div className="text-xs text-gray-400">Mark Price</div>
                <div className="text-sm font-semibold text-white">${currentPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">24h Change</div>
                <div className={`text-sm font-semibold ${(selectedPair?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {(selectedPair?.change24h || 0) >= 0 ? '+' : ''}{(selectedPair?.change24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="h-[420px] bg-[#0B0F14] relative border-b border-[#1F2937]">
            <TradingViewWidget symbol={selectedPair?.binanceSymbol || 'BTCUSDT'} />
          </div>

          <div className="p-4 bg-[#0B0F14] flex-1">
            <div className="flex gap-4 border-b border-gray-800 pb-2 mb-4">
              {(['Limit', 'Market', 'Trigger'] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setOrderType(t)}
                  className={`text-xs font-semibold pb-1 ${orderType === t ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-400 mb-1 block">Order Price</label>
                <input 
                  type="number" 
                  value={currentPrice} 
                  readOnly 
                  className="w-full bg-[#121820] border border-gray-800 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 mb-1 block">Margin (USDT)</label>
                <input 
                  type="number" 
                  value={margin} 
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full bg-[#121820] border border-gray-800 rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Leverage</span>
                <span className="text-white font-bold">{leverage}x</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={leverage} 
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-emerald-500" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={() => updateBalance(session.demoBalance + 50)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-sm transition"
              >
                Long
              </button>
              <button 
                onClick={() => updateBalance(session.demoBalance - 50)}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-lg text-sm transition"
              >
                Short
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-3 bg-[#0B0F14] flex flex-col h-full border-l border-[#1F2937]">
          <div className="p-3 border-b border-[#1F2937] flex items-center justify-between">
            <span className="text-xs font-bold text-white">Order Book</span>
            <span className="text-[10px] text-gray-500">0.1 ▾</span>
          </div>

          <div className="flex-1 p-2 space-y-1 overflow-hidden text-[11px] font-mono">
            {[81267, 81266, 81265, 81264, 81263].map((p, i) => (
              <div key={i} className="flex justify-between text-rose-400">
                <span>{p}</span>
                <span className="text-gray-400">0.3245</span>
                <span className="text-gray-500">2.4187</span>
              </div>
            ))}
            
            <div className="my-2 py-1 text-center font-bold text-emerald-400 text-xs bg-[#121820] rounded">
              ${currentPrice.toLocaleString()} ↑
            </div>

            {[81257, 81256, 81255, 81254, 81253].map((p, i) => (
              <div key={i} className="flex justify-between text-emerald-400">
                <span>{p}</span>
                <span className="text-gray-400">0.1823</span>
                <span className="text-gray-500">0.1823</span>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#1F2937]">
            <span className="text-xs font-bold text-white block mb-2">Positions (0)</span>
            <div className="text-center py-6 text-gray-500 text-xs">
              No open positions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
                  }
