import { NextResponse } from 'next/server';

export const PAIRS = [
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

export async function GET() {
  try {
    const symbols = JSON.stringify(PAIRS.map(p => p.binanceSymbol));
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`, {
      cache: 'no-store'
    });
    const data = await res.json();
    
    const formattedData = PAIRS.map(pair => {
      const ticker = Array.isArray(data) ? data.find((t: any) => t.symbol === pair.binanceSymbol) : null;
      return {
        ...pair,
        price: ticker ? parseFloat(ticker.lastPrice) : 0,
        change24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
        volume24h: ticker ? parseFloat(ticker.quoteVolume) : 0,
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch price data' }, { status: 500 });
  }
}
