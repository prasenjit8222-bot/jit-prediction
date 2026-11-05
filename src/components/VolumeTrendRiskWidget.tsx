import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Gauge, 
  Layers, 
  Scale, 
  Zap,
  Info
} from 'lucide-react';
import type { 
  MarketDepthData, 
  TechnicalIndicators, 
  Candle, 
  PredictionResult 
} from '../types.js';

interface VolumeTrendRiskWidgetProps {
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: string;
  currentPrice: number;
  marketDepth: MarketDepthData | null;
  indicators: TechnicalIndicators | null;
  candles?: Candle[];
  prediction?: PredictionResult | null;
  lastUpdatedTime?: string;
  isLive?: boolean;
}

export const VolumeTrendRiskWidget: React.FC<VolumeTrendRiskWidgetProps> = ({
  symbol,
  symbolName,
  currentPrice,
  marketDepth,
  indicators,
  candles = [],
  prediction,
  lastUpdatedTime,
  isLive = true
}) => {
  // If neither marketDepth nor candles exist, display clean Data Unavailable state
  if ((!marketDepth || !marketDepth.levels || marketDepth.levels.length === 0) && (!candles || candles.length === 0)) {
    return (
      <section className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Activity className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-300">Volume Flow & Trend Risk Widget</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Data Unavailable. Awaiting market depth and trade volume metrics from the exchange matching engine.
        </p>
      </section>
    );
  }

  // 1. VOLUME TRACKING CALCULATIONS
  // Extract or calculate buy volume vs sell volume
  let buyVolume = 0;
  let sellVolume = 0;

  if (marketDepth && marketDepth.totalBuyQuantity > 0 && marketDepth.totalSellQuantity > 0) {
    buyVolume = marketDepth.totalBuyQuantity;
    sellVolume = marketDepth.totalSellQuantity;
  } else if (candles && candles.length > 0) {
    // Fallback: estimate from recent intraday candles volume
    const recent = candles.slice(-20);
    for (const c of recent) {
      if (c.close >= c.open) {
        buyVolume += c.volume || 1000;
      } else {
        sellVolume += c.volume || 1000;
      }
    }
  } else {
    buyVolume = 125000;
    sellVolume = 115000;
  }

  const totalVolume = buyVolume + sellVolume;
  const buyPercent = totalVolume > 0 ? Number(((buyVolume / totalVolume) * 100).toFixed(1)) : 50.0;
  const sellPercent = totalVolume > 0 ? Number((100 - buyPercent).toFixed(1)) : 50.0;
  const volumeDelta = buyVolume - sellVolume;

  // 2. TREND / DIRECTION INDICATOR CALCULATIONS
  // Based on volume pressure and depth imbalance
  let trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
  let trendLabel = 'NEUTRAL / BALANCED';
  let trendReason = 'Buy and sell volume are evenly matched. Range-bound consolidation expected.';
  let trendConfidence = 50;

  if (buyPercent >= 53.0) {
    trendDirection = 'UP';
    trendLabel = 'UP (BULLISH)';
    trendConfidence = Math.min(96, Math.round(50 + (buyPercent - 50) * 2.2));
    trendReason = `Heavy buyer volume dominance of ${buyPercent}% over sell orders signals strong upward momentum.`;
  } else if (sellPercent >= 53.0) {
    trendDirection = 'DOWN';
    trendLabel = 'DOWN (BEARISH)';
    trendConfidence = Math.min(96, Math.round(50 + (sellPercent - 50) * 2.2));
    trendReason = `Heavy seller volume dominance of ${sellPercent}% over buy orders signals sustained downward pressure.`;
  } else {
    trendDirection = 'SIDEWAYS';
    trendLabel = 'SIDEWAYS (NEUTRAL)';
    trendConfidence = 52;
    trendReason = `Order book is in equilibrium (${buyPercent}% Buy vs ${sellPercent}% Sell). Awaiting clear breakout volume.`;
  }

  // 3. DYNAMIC RISK LEVEL ASSESSMENT CALCULATIONS
  // Factor 1: Volatility (ATR / Current Price)
  const atr = indicators?.atr14 || (candles.length > 1 ? (candles[candles.length - 1].high - candles[candles.length - 1].low) : currentPrice * 0.005);
  const volatilityPercent = Number(((atr / currentPrice) * 100).toFixed(2));
  
  // Factor 2: Spread
  const spread = marketDepth?.spread || (symbol === '^NSEBANK' ? 2.4 : 1.1);
  const spreadPercent = Number(((spread / currentPrice) * 100).toFixed(3));

  // Factor 3: Volume Disparity (Absolute difference in buy/sell percentage)
  const volumeDisparity = Math.abs(buyPercent - sellPercent);

  // Score dynamic risk
  let riskScore = 0; // 0 - 6
  if (volatilityPercent > 1.1) riskScore += 2;
  else if (volatilityPercent > 0.55) riskScore += 1;

  if (spread > (symbol === '^NSEBANK' ? 3.5 : 1.8)) riskScore += 2;
  else if (spread > (symbol === '^NSEBANK' ? 1.8 : 0.9)) riskScore += 1;

  if (volumeDisparity > 30) riskScore += 2;
  else if (volumeDisparity > 15) riskScore += 1;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  let riskExplanation = '';
  let riskBadgeColor = '';

  if (riskScore <= 1) {
    riskLevel = 'LOW';
    riskExplanation = 'Low volatility and tight bid-ask spread offer favorable, high-liquidity execution.';
    riskBadgeColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';
  } else if (riskScore <= 3) {
    riskLevel = 'MEDIUM';
    riskExplanation = 'Balanced intraday volatility with standard liquidity. Adhere to standard stop loss levels.';
    riskBadgeColor = 'text-amber-400 bg-amber-950/80 border-amber-500/40';
  } else {
    riskLevel = 'HIGH';
    riskExplanation = 'Elevated market volatility or widening spread detected. Exercise caution and reduce position size.';
    riskBadgeColor = 'text-rose-400 bg-rose-950/80 border-rose-500/40';
  }

  return (
    <section className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                VOLUME FLOW, TREND DIRECTION & RISK ASSESSMENT
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
                REAL-TIME
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live buy/sell volume balance, directional probability forecast, and dynamic multi-factor risk grading for {symbolName}
            </p>
          </div>
        </div>

        {/* Live Status and Timestamp */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            {lastUpdatedTime ? `Updated: ${lastUpdatedTime}` : 'Stream Active'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
            isLive 
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {isLive ? 'LIVE FEED' : 'HISTORICAL'}
          </span>
        </div>
      </div>

      {/* 2. Main 3-Column Grid for Volume Tracking, Trend Direction, and Risk Level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: VOLUME TRACKING */}
        <div className="bg-[#070b14] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Volume Tracking
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              volumeDelta >= 0 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
            }`}>
              {volumeDelta >= 0 ? '+BUY DOMINANT' : '-SELL DOMINANT'}
            </span>
          </div>

          {/* Volume Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Total Buy Volume */}
            <div className="bg-[#0b1324] border border-emerald-500/20 rounded-lg p-2.5">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Buy Volume
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm sm:text-base font-black text-white font-mono tabular-nums">
                  {buyVolume.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {buyPercent}%
                </span>
              </div>
            </div>

            {/* Total Sell Volume */}
            <div className="bg-[#170c14] border border-rose-500/20 rounded-lg p-2.5">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Sell Volume
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm sm:text-base font-black text-white font-mono tabular-nums">
                  {sellVolume.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  {sellPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Visual Progress / Ratio Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                Buy: {buyPercent}%
              </span>
              <span className="text-slate-500 text-[10px]">
                Net Delta: {volumeDelta >= 0 ? '+' : ''}{volumeDelta.toLocaleString('en-IN')}
              </span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                Sell: {sellPercent}%
              </span>
            </div>

            {/* Dual color segmented ratio bar */}
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex shadow-inner border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500" 
                style={{ width: `${buyPercent}%` }}
                title={`Buy Volume: ${buyPercent}%`}
              />
              <div 
                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-500" 
                style={{ width: `${sellPercent}%` }}
                title={`Sell Volume: ${sellPercent}%`}
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0%</span>
              <span className="text-slate-400 font-semibold">50:50 Neutral Axis</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* CARD 2: TREND / DIRECTION INDICATOR */}
        <div className="bg-[#070b14] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Trend / Direction Indicator
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Confidence: {trendConfidence}%
            </span>
          </div>

          {/* Large Directional Badge */}
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all ${
            trendDirection === 'UP'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
              : trendDirection === 'DOWN'
              ? 'bg-rose-950/40 border-rose-500/50 text-white'
              : 'bg-amber-950/40 border-amber-500/40 text-white'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              trendDirection === 'UP'
                ? 'bg-emerald-500 text-slate-950'
                : trendDirection === 'DOWN'
                ? 'bg-rose-500 text-white'
                : 'bg-amber-500 text-slate-950'
            }`}>
              {trendDirection === 'UP' && <TrendingUp className="w-6 h-6 stroke-[2.5]" />}
              {trendDirection === 'DOWN' && <TrendingDown className="w-6 h-6 stroke-[2.5]" />}
              {trendDirection === 'SIDEWAYS' && <Minus className="w-6 h-6 stroke-[2.5]" />}
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Predicted Direction
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-base sm:text-lg font-black tracking-tight ${
                  trendDirection === 'UP'
                    ? 'text-emerald-400'
                    : trendDirection === 'DOWN'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}>
                  {trendLabel}
                </span>
                {trendDirection === 'UP' && (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                )}
                {trendDirection === 'DOWN' && (
                  <ArrowDownRight className="w-5 h-5 text-rose-400" />
                )}
              </div>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="bg-[#0b1120] border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Volume Driver Context</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {trendReason}
            </p>
          </div>
        </div>

        {/* CARD 3: RISK LEVEL ASSESSMENT */}
        <div className="bg-[#070b14] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Risk Level Assessment
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Multi-Factor Engine
            </span>
          </div>

          {/* Risk Level Badge */}
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all ${riskBadgeColor}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              riskLevel === 'LOW' 
                ? 'bg-emerald-500 text-slate-950' 
                : riskLevel === 'MEDIUM' 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-rose-500 text-white'
            }`}>
              {riskLevel === 'LOW' && <ShieldCheck className="w-6 h-6 stroke-[2.5]" />}
              {riskLevel === 'MEDIUM' && <Shield className="w-6 h-6 stroke-[2.5]" />}
              {riskLevel === 'HIGH' && <ShieldAlert className="w-6 h-6 stroke-[2.5]" />}
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Risk Status
              </span>
              <span className="text-base sm:text-lg font-black tracking-tight">
                {riskLevel} RISK
              </span>
            </div>
          </div>

          {/* Dynamic Risk Factors Table */}
          <div className="bg-[#0b1120] border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Volatility (ATR):</span>
              <span className={`font-bold tabular-nums ${volatilityPercent > 1.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                {volatilityPercent}% (₹{atr.toFixed(1)})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Bid-Ask Spread:</span>
              <span className={`font-bold tabular-nums ${spread > 2.5 ? 'text-amber-400' : 'text-slate-200'}`}>
                ₹{spread.toFixed(2)} ({spreadPercent}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Volume Disparity:</span>
              <span className={`font-bold tabular-nums ${volumeDisparity > 25 ? 'text-amber-400' : 'text-slate-200'}`}>
                {volumeDisparity.toFixed(1)}% delta
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Summary Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Trading Context:</span>
          <span className="text-slate-200 font-medium">
            {riskExplanation}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>Total Traded Flow: <strong className="text-slate-200">{totalVolume.toLocaleString('en-IN')} units</strong></span>
          <span>·</span>
          <span>LTP: <strong className="text-cyan-400">₹{currentPrice.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>
    </section>
  );
};
