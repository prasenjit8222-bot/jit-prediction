import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Scale, 
  Activity, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  Info,
  Clock,
  ArrowRight,
  Flame,
  Zap
} from 'lucide-react';
import type { MarketDepthData, DepthLevel } from '../types.js';

interface MarketDepthSectionProps {
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: string;
  currentPrice: number;
  marketDepth: MarketDepthData | null;
  lastUpdatedTime?: string;
  isLive?: boolean;
}

export const MarketDepthSection: React.FC<MarketDepthSectionProps> = ({
  symbol,
  symbolName,
  currentPrice,
  marketDepth,
  lastUpdatedTime,
  isLive = true
}) => {
  const [depthMode, setDepthMode] = useState<'5_LEVEL' | 'ALL'>('5_LEVEL');

  if (!marketDepth || !marketDepth.levels || marketDepth.levels.length === 0) {
    return (
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Scale className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-300">Live Market Depth (Level 2 Order Book)</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Data Unavailable. Live market depth feed is awaiting next tick packet from exchange order matching engine.
        </p>
      </div>
    );
  }

  const {
    spotPrice,
    levels,
    totalBuyQuantity,
    totalSellQuantity,
    totalBuyOrders,
    totalSellOrders,
    buyPressurePercent,
    sellPressurePercent,
    orderBookImbalance,
    spread,
    signal,
    signalStrength,
    pressureSummary
  } = marketDepth;

  // Find max quantity in depth to calculate relative horizontal volume bars
  const maxQty = Math.max(
    ...levels.map(l => Math.max(l.buyQuantity, l.sellQuantity)),
    100
  );

  return (
    <section className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                MARKET DEPTH & ORDER BOOK
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-mono">
                LEVEL 2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-Time Institutional Bid / Ask Order Flow • Spread: <span className="font-mono font-bold text-slate-200">{spread.toFixed(2)} pts</span>
            </p>
          </div>
        </div>

        {/* Depth Signal Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs border tracking-wider ${
            signal === 'BULLISH'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : signal === 'BEARISH'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-500/10'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          {signal === 'BULLISH' ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : signal === 'BEARISH' ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
          DEPTH SIGNAL: {signal} ({signalStrength})
        </div>
      </div>

      {/* 2. Top Pressure Gauge & Order Book Imbalance (OBI) Bar */}
      <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800/80 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
              BUY PRESSURE: {buyPressurePercent}%
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              ({totalBuyQuantity.toLocaleString('en-IN')} units)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-[10px]">
              ({totalSellQuantity.toLocaleString('en-IN')} units)
            </span>
            <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
              SELL PRESSURE: {sellPressurePercent}%
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
          </div>
        </div>

        {/* Dual-color Imbalance Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden flex p-0.5 border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-l-full transition-all duration-500 flex items-center justify-start pl-2 text-[9px] font-black text-slate-950 font-mono"
            style={{ width: `${buyPressurePercent}%` }}
          >
            {buyPressurePercent > 18 ? `${buyPressurePercent}%` : ''}
          </div>
          <div
            className="bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-r-full transition-all duration-500 flex items-center justify-end pr-2 text-[9px] font-black text-slate-950 font-mono"
            style={{ width: `${sellPressurePercent}%` }}
          >
            {sellPressurePercent > 18 ? `${sellPressurePercent}%` : ''}
          </div>
        </div>

        {/* Metrics Row: Imbalance %, Order Ratio, Spread */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">ORDER BOOK IMBALANCE</span>
            <span
              className={`font-mono font-black text-sm ${
                orderBookImbalance > 0
                  ? 'text-emerald-400'
                  : orderBookImbalance < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {orderBookImbalance > 0 ? '+' : ''}{orderBookImbalance}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">TOTAL ACTIVE ORDERS</span>
            <span className="font-mono font-bold text-sm text-slate-200">
              <span className="text-emerald-400">{totalBuyOrders}</span> / <span className="text-rose-400">{totalSellOrders}</span>
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">BID-ASK SPREAD</span>
            <span className="font-mono font-bold text-sm text-cyan-400">
              {spread.toFixed(2)} pts
            </span>
          </div>
        </div>
      </div>

      {/* 3. Five-Level Order Book Depth Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[640px] px-4 sm:px-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* BUY ORDERS (BIDS) */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-emerald-950/40 border-b border-slate-800/80 px-3 py-2 flex justify-between items-center text-[11px] font-bold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  BUY ORDERS (BIDS)
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Total: {totalBuyQuantity.toLocaleString('en-IN')}
                </span>
              </div>

              <table className="w-full text-left font-mono-numbers">
                <thead>
                  <tr className="border-b border-slate-800/60 text-[10px] uppercase font-semibold text-slate-500 bg-slate-900/40">
                    <th className="py-2 px-3 text-left">Orders</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right text-emerald-400">Bid Price (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {levels.map((lvl) => {
                    const barWidth = Math.min(100, (lvl.buyQuantity / maxQty) * 100);
                    return (
                      <tr key={`bid-${lvl.level}`} className="relative hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-3 text-slate-400 text-xs font-mono">
                          {lvl.buyOrders}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200 font-semibold relative">
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                          <span className="relative z-10">{lvl.buyQuantity.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          ₹{lvl.bidPrice.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-800 text-[11px] font-bold bg-slate-900/50 text-slate-300">
                    <td className="py-2 px-3 text-emerald-400 font-mono">{totalBuyOrders}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-300">{totalBuyQuantity.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right text-[10px] text-slate-500 uppercase">Total Bids</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* SELL ORDERS (ASKS) */}
            <div className="bg-[#070b14] border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-rose-950/40 border-b border-slate-800/80 px-3 py-2 flex justify-between items-center text-[11px] font-bold text-rose-400">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  SELL ORDERS (ASKS)
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  Total: {totalSellQuantity.toLocaleString('en-IN')}
                </span>
              </div>

              <table className="w-full text-left font-mono-numbers">
                <thead>
                  <tr className="border-b border-slate-800/60 text-[10px] uppercase font-semibold text-slate-500 bg-slate-900/40">
                    <th className="py-2 px-3 text-left text-rose-400">Ask Price (₹)</th>
                    <th className="py-2 px-3 text-left">Qty</th>
                    <th className="py-2 px-3 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {levels.map((lvl) => {
                    const barWidth = Math.min(100, (lvl.sellQuantity / maxQty) * 100);
                    return (
                      <tr key={`ask-${lvl.level}`} className="relative hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-3 text-left font-bold text-rose-400">
                          ₹{lvl.askPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-left text-slate-200 font-semibold relative">
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                          <span className="relative z-10">{lvl.sellQuantity.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400 text-xs font-mono">
                          {lvl.sellOrders}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-800 text-[11px] font-bold bg-slate-900/50 text-slate-300">
                    <td className="py-2 px-3 text-left text-[10px] text-slate-500 uppercase">Total Asks</td>
                    <td className="py-2 px-3 text-left font-mono text-rose-300">{totalSellQuantity.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right text-rose-400 font-mono">{totalSellOrders}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Actionable Liquidity Flow Takeaway */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Activity className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold text-white mr-1.5">Order Book Insight:</span>
          {pressureSummary}
        </div>
      </div>
    </section>
  );
};
