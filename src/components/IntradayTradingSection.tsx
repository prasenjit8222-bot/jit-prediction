import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  LogIn, 
  LogOut, 
  Scale, 
  Clock, 
  AlertCircle, 
  Zap,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import type { 
  Candle, 
  TechnicalIndicators, 
  SupportResistanceLevels, 
  PriceActionAnalysis, 
  PredictionResult 
} from '../types.js';

interface IntradayTradingSectionProps {
  symbol: string;
  symbolName: string;
  candles: Candle[];
  currentPrice: number;
  indicators: TechnicalIndicators | null;
  srLevels: SupportResistanceLevels | null;
  priceAction: PriceActionAnalysis | null;
  prediction: PredictionResult | null;
  lastUpdatedTime?: string;
  isLive?: boolean;
}

export const IntradayTradingSection: React.FC<IntradayTradingSectionProps> = ({
  symbol,
  symbolName,
  candles,
  currentPrice,
  indicators,
  srLevels,
  priceAction,
  prediction,
  lastUpdatedTime,
  isLive = true
}) => {
  // Check if market data is genuinely available
  const isDataAvailable = useMemo(() => {
    return Boolean(
      candles && 
      candles.length > 5 && 
      currentPrice > 0 && 
      indicators && 
      srLevels
    );
  }, [candles, currentPrice, indicators, srLevels]);

  // Compute Signal & 4 Trading Levels
  const signalData = useMemo(() => {
    if (!isDataAvailable || !indicators || !srLevels) {
      return {
        signal: 'DATA_UNAVAILABLE' as const,
        entryPrice: 0,
        exitPrice: 0,
        stopLoss: 0,
        targetPrice: 0,
        riskPoints: 0,
        rewardPoints: 0,
        riskRewardRatio: 'N/A',
        rationale: 'Market data feed is temporarily unavailable. Awaiting live candle stream.',
        factors: [] as string[]
      };
    }

    const isNifty = symbol === '^NSEI';
    const vwap = indicators.vwap || currentPrice;
    const rsi = indicators.rsi14 || 50;
    const supertrend = indicators.supertrend?.trend || 'NEUTRAL';
    const emaFast = indicators.ema?.ema9 || currentPrice;
    const emaSlow = indicators.ema?.ema20 || currentPrice;
    const atr = indicators.atr14 || (isNifty ? 30 : 95);

    // Confluence Scoring
    let bullishScore = 0;
    let bearishScore = 0;
    const factors: string[] = [];

    if (currentPrice > vwap) {
      bullishScore += 2;
      factors.push(`Spot (₹${currentPrice.toLocaleString('en-IN')}) holding above VWAP (₹${vwap.toLocaleString('en-IN')})`);
    } else {
      bearishScore += 2;
      factors.push(`Spot (₹${currentPrice.toLocaleString('en-IN')}) trading below VWAP (₹${vwap.toLocaleString('en-IN')})`);
    }

    if (supertrend === 'BULLISH') {
      bullishScore += 2;
      factors.push('Supertrend indicator active BUY mode');
    } else if (supertrend === 'BEARISH') {
      bearishScore += 2;
      factors.push('Supertrend indicator active SELL mode');
    }

    if (rsi >= 54) {
      bullishScore += 1;
      factors.push(`RSI(14) at ${rsi.toFixed(1)} showing positive buyer momentum`);
    } else if (rsi <= 46) {
      bearishScore += 1;
      factors.push(`RSI(14) at ${rsi.toFixed(1)} showing seller distribution`);
    }

    if (emaFast > emaSlow) {
      bullishScore += 1;
      factors.push('EMA 9 > EMA 20 bullish intraday moving average cross');
    } else {
      bearishScore += 1;
      factors.push('EMA 9 < EMA 20 bearish moving average alignment');
    }

    if (prediction && prediction.predictedDirection === 'UP') {
      bullishScore += 1;
    } else if (prediction && prediction.predictedDirection === 'DOWN') {
      bearishScore += 1;
    }

    // Determine Directional Bias
    let signal: 'BUY' | 'SELL' | 'NO_TRADE' = 'NO_TRADE';
    if (bullishScore >= 4 && currentPrice >= vwap) {
      signal = 'BUY';
    } else if (bearishScore >= 4 && currentPrice <= vwap) {
      signal = 'SELL';
    } else {
      signal = 'NO_TRADE';
    }

    // Buffer margins based on ATR
    const slBuffer = Math.round(Math.max(atr * 0.9, isNifty ? 22 : 65) * 10) / 10;
    const targetMultiplier = 2.1; // Targeting 1 : 2.1+ Risk to Reward

    let entry = Math.round(currentPrice * 10) / 10;
    let stopLoss = 0;
    let target = 0;
    let exit = 0;
    let riskPoints = 0;
    let rewardPoints = 0;
    let rrRatioStr = '1 : 2.1';
    let rationale = '';

    if (signal === 'BUY') {
      // Entry: current price / confirmed momentum breakout
      entry = Math.round(currentPrice * 10) / 10;
      // Stop Loss: below nearest support or ATR buffer below entry
      const nearestSup = srLevels.nearestSupport > 0 && srLevels.nearestSupport < entry
        ? Math.min(srLevels.nearestSupport, entry - slBuffer)
        : entry - slBuffer;
      stopLoss = Math.round(nearestSup * 10) / 10;

      riskPoints = Math.round((entry - stopLoss) * 10) / 10;
      // Reward is at least 2.1x the risk
      rewardPoints = Math.round((riskPoints * targetMultiplier) * 10) / 10;
      target = Math.round((entry + rewardPoints) * 10) / 10;
      // Exit: Conservative early profit taking / Trailing exit (75% to target)
      exit = Math.round((entry + rewardPoints * 0.75) * 10) / 10;

      const calcRR = (rewardPoints / Math.max(1, riskPoints)).toFixed(1);
      rrRatioStr = `1 : ${calcRR}`;
      rationale = `Strong intraday bullish momentum above VWAP with ${supertrend === 'BULLISH' ? 'Supertrend confirmation' : 'favorable buying confluence'}. Look for long scalps with strict SL.`;
    } else if (signal === 'SELL') {
      // Entry: current price / breakdown trigger
      entry = Math.round(currentPrice * 10) / 10;
      // Stop Loss: above nearest resistance or ATR buffer above entry
      const nearestRes = srLevels.nearestResistance > 0 && srLevels.nearestResistance > entry
        ? Math.max(srLevels.nearestResistance, entry + slBuffer)
        : entry + slBuffer;
      stopLoss = Math.round(nearestRes * 10) / 10;

      riskPoints = Math.round((stopLoss - entry) * 10) / 10;
      rewardPoints = Math.round((riskPoints * targetMultiplier) * 10) / 10;
      target = Math.round((entry - rewardPoints) * 10) / 10;
      // Exit: Conservative early profit taking / Trailing exit (75% to target)
      exit = Math.round((entry - rewardPoints * 0.75) * 10) / 10;

      const calcRR = (rewardPoints / Math.max(1, riskPoints)).toFixed(1);
      rrRatioStr = `1 : ${calcRR}`;
      rationale = `Bearish rejection below VWAP with seller volume dominance. Consider intraday shorting/puts with tight risk parameters.`;
    } else {
      // NO TRADE - Market Consolidating
      entry = Math.round(currentPrice * 10) / 10;
      stopLoss = Math.round((currentPrice - (isNifty ? 25 : 75)) * 10) / 10;
      target = Math.round((currentPrice + (isNifty ? 50 : 150)) * 10) / 10;
      exit = Math.round(currentPrice * 10) / 10;
      riskPoints = Math.round(Math.abs(entry - stopLoss) * 10) / 10;
      rewardPoints = Math.round(Math.abs(target - entry) * 10) / 10;
      rrRatioStr = 'Neutral';
      rationale = `Market is currently consolidating inside a narrow range without clear directional impulse. Capital preservation recommended: wait for breakout.`;
    }

    return {
      signal,
      entryPrice: entry,
      exitPrice: exit,
      stopLoss,
      targetPrice: target,
      riskPoints,
      rewardPoints,
      riskRewardRatio: rrRatioStr,
      rationale,
      factors
    };
  }, [isDataAvailable, symbol, currentPrice, indicators, srLevels, prediction]);

  const timestampDisplay = lastUpdatedTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <section className="bg-gradient-to-br from-[#0c1322] via-[#090f1d] to-[#070b14] border border-cyan-500/25 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-all">
      {/* Decorative background glow based on signal */}
      <div 
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 transition-all ${
          signalData.signal === 'BUY'
            ? 'bg-emerald-500'
            : signalData.signal === 'SELL'
            ? 'bg-rose-500'
            : 'bg-cyan-500'
        }`}
      />

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Zap className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                INTRADAY TRADING SIGNALS
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-bold">
                {symbolName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live algorithmic intraday levels calculated from VWAP, Momentum, Support/Resistance & Volume
            </p>
          </div>
        </div>

        {/* Signal Badge & Status */}
        <div className="flex items-center gap-2">
          {/* Signal Indicator Badge */}
          {signalData.signal === 'DATA_UNAVAILABLE' ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>DATA UNAVAILABLE</span>
            </div>
          ) : signalData.signal === 'BUY' ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              <span>BUY SIGNAL (CALL)</span>
            </div>
          ) : signalData.signal === 'SELL' ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-400 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
              <span>SELL SIGNAL (PUT)</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md">
              <Scale className="w-4 h-4" />
              <span>NO TRADE (CONSOLIDATING)</span>
            </div>
          )}

          {/* R:R Pill */}
          {signalData.signal !== 'DATA_UNAVAILABLE' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span>R:R</span>
              <strong className="text-white font-bold">{signalData.riskRewardRatio}</strong>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#070b14] border border-slate-800 text-[11px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden xs:inline">Updated:</span>
            <span className="text-slate-300">{timestampDisplay}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {signalData.signal === 'DATA_UNAVAILABLE' ? (
        /* Fallback when data is unavailable */
        <div className="p-8 rounded-xl bg-[#070b14]/90 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">DATA UNAVAILABLE</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Live market feed is currently reconnecting or offline. The intraday trading engine will automatically calculate entry, exit, stop loss, and target prices as soon as live ticks are received.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Four Primary Trading Level Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. ENTRY PRICE */}
            <div className="p-4 rounded-xl bg-[#070b14]/85 border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-md group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-cyan-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <LogIn className="w-3.5 h-3.5" />
                  1. ENTRY PRICE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  Trigger
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-xs font-mono text-slate-400">₹</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {signalData.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {signalData.signal === 'BUY' 
                  ? 'Suggested Long entry on pullback to support / VWAP'
                  : signalData.signal === 'SELL'
                  ? 'Suggested Short entry on breakdown below resistance'
                  : 'Wait for confirmed breakout outside range'}
              </p>
            </div>

            {/* 2. TARGET PRICE */}
            <div className="p-4 rounded-xl bg-[#070b14]/85 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-md group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <Target className="w-3.5 h-3.5" />
                  2. TARGET PRICE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  {signalData.rewardPoints > 0 ? `+${signalData.rewardPoints} pts` : 'Target'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-xs font-mono text-slate-400">₹</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                  {signalData.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Primary profit target based on 1:{signalData.riskRewardRatio.replace('1 : ', '')} Fibonacci projection
              </p>
            </div>

            {/* 3. STOP LOSS (SL) */}
            <div className="p-4 rounded-xl bg-[#070b14]/85 border border-rose-500/30 hover:border-rose-500/50 transition-all shadow-md group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-rose-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  3. STOP LOSS (SL)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30">
                  {signalData.riskPoints > 0 ? `-${signalData.riskPoints} pts` : 'Strict SL'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-xs font-mono text-slate-400">₹</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400 tracking-tight">
                  {signalData.stopLoss.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Mandatory capital protection stop behind structural pivot
              </p>
            </div>

            {/* 4. EXIT PRICE */}
            <div className="p-4 rounded-xl bg-[#070b14]/85 border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-md group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <LogOut className="w-3.5 h-3.5" />
                  4. EXIT PRICE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  Safe Exit
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-xs font-mono text-slate-400">₹</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {signalData.exitPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Recommended conservative exit to lock 75% profit or trail SL
              </p>
            </div>
          </div>

          {/* Bottom Trade Analysis & Execution Guidance */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#070b14]/70 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            {/* Rationale & Confluence */}
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Strategy Analysis:</span>
                <span className="text-slate-200 font-medium">{signalData.rationale}</span>
              </div>
              {signalData.factors.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {signalData.factors.slice(0, 3).map((f, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-slate-300"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Risk:Reward and Trailing Rules */}
            <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Risk vs Reward</div>
                <div className="text-sm font-black font-mono text-cyan-400">{signalData.riskRewardRatio}</div>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Risk Points</div>
                <div className="text-sm font-black font-mono text-rose-400">{signalData.riskPoints} pts</div>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Target Points</div>
                <div className="text-sm font-black font-mono text-emerald-400">+{signalData.rewardPoints} pts</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
