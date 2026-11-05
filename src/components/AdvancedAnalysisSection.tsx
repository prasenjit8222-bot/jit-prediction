import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Activity, 
  BarChart2, 
  Layers, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  Compass,
  Zap,
  Target
} from 'lucide-react';
import type { 
  TechnicalIndicators, 
  SupportResistanceLevels, 
  PriceActionAnalysis, 
  PredictionResult 
} from '../types.js';

interface AdvancedAnalysisSectionProps {
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: string;
  indicators: TechnicalIndicators | null;
  srLevels: SupportResistanceLevels | null;
  priceAction: PriceActionAnalysis | null;
  prediction: PredictionResult | null;
  currentPrice: number;
}

export const AdvancedAnalysisSection: React.FC<AdvancedAnalysisSectionProps> = ({
  symbol,
  symbolName,
  indicators,
  srLevels,
  priceAction,
  prediction,
  currentPrice
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<{
    explanation: string;
    reasoningPoints: string[];
    riskAssessment: string;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Fetch AI analysis directly from client Gemini SDK / local quantitative engine
  const fetchAiAnalysis = async () => {
    if (!prediction || !indicators || !srLevels || !priceAction) return;
    setLoadingAi(true);
    try {
      const { generateClientMarketExplanation } = await import('../utils/geminiClientService.js');
      const analysis = await generateClientMarketExplanation(
        prediction,
        indicators,
        srLevels,
        priceAction
      );
      setAiAnalysis(analysis);
    } catch {
      // safe fallback
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAiAnalysis();
  }, [symbol, prediction?.generatedAt]);

  if (!indicators || !srLevels || !priceAction || !prediction) {
    return (
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Activity className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
        Loading advanced quantitative metrics...
      </div>
    );
  }

  // Breakout vs Breakdown probability calculation based on proximity to levels and momentum
  const distToRes = Math.abs(srLevels.nearestResistance - currentPrice);
  const distToSup = Math.abs(currentPrice - srLevels.nearestSupport);
  const totalDist = distToRes + distToSup || 1;
  const breakoutProb = Math.min(85, Math.max(15, Math.round((distToSup / totalDist) * 70 + (prediction.predictedDirection === 'UP' ? 20 : 0))));
  const breakdownProb = Math.min(85, Math.max(15, Math.round((distToRes / totalDist) * 70 + (prediction.predictedDirection === 'DOWN' ? 20 : 0))));

  const isEmaBullish = indicators.ema.alignment.includes('BULLISH');
  const isMacdBullish = indicators.macd.trend.includes('BULLISH');
  const isSupertrendBullish = indicators.supertrend.trend === 'BULLISH';
  const isVwapBullish = currentPrice >= indicators.vwap;
  const isRsiBullish = indicators.rsi14 >= 50;

  return (
    <div className="space-y-6">
      {/* ================= 1. AI QUANTITATIVE MARKET EXPLANATION (GEMINI 3.8 FLASH) ================= */}
      <div className="bg-gradient-to-br from-[#0c1324] via-[#090e1a] to-[#070b14] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-950">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                AI Market Analysis & 15-Minute Forecast
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Grounded quantitative synthesis of orderflow, market structure, and technical evidence
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiAnalysis}
            disabled={loadingAi}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{loadingAi ? 'Synthesizing...' : 'Re-analyze'}</span>
          </button>
        </div>

        {/* AI Narrative Body */}
        {aiAnalysis ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {aiAnalysis.explanation}
            </p>

            {/* Key Reasoning Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiAnalysis.reasoningPoints.map((pt, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#060a14] border border-slate-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300 leading-snug">{pt}</span>
                </div>
              ))}
            </div>

            {/* Risk Assessment Box */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <strong className="text-rose-200 font-semibold uppercase tracking-wider text-[10px] block">
                  INVALIDATION RISK TRIGGER:
                </strong>
                {aiAnalysis.riskAssessment}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Generating AI market intelligence from latest verified candles...
          </div>
        )}
      </div>

      {/* ================= 2. TEN-POINT ADVANCED MARKET BREAKDOWN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Market Structure & Price Action */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Compass className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Structure & Price Action
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {/* Trend */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80">
              <span className="text-slate-400">Market Trend</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {prediction.trendStrength.replace('_', ' ')}
              </span>
            </div>

            {/* Candlestick Pattern */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80">
              <span className="text-slate-400">Candle Pattern</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                priceAction.patternType === 'BULLISH'
                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40'
                  : priceAction.patternType === 'BEARISH'
                  ? 'text-rose-400 bg-rose-950/60 border border-rose-500/40'
                  : 'text-slate-300 bg-slate-800'
              }`}>
                {priceAction.candlestickPattern || 'Neutral Consolidation'}
              </span>
            </div>

            {/* Break of Structure (BOS) */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80">
              <span className="text-slate-400">Break of Structure (BOS)</span>
              <span className={`font-bold ${priceAction.breakOfStructure.detected ? 'text-cyan-400' : 'text-slate-500'}`}>
                {priceAction.breakOfStructure.detected
                  ? `${priceAction.breakOfStructure.type} @ ₹${priceAction.breakOfStructure.level.toFixed(1)}`
                  : 'No active BOS'}
              </span>
            </div>

            {/* Liquidity Sweep */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80">
              <span className="text-slate-400">Liquidity Sweeps</span>
              <span className={`font-bold ${priceAction.liquiditySweep.detected ? 'text-amber-400' : 'text-slate-500'}`}>
                {priceAction.liquiditySweep.detected ? 'Sweep Confirmed' : 'None Detected'}
              </span>
            </div>

            {/* HH / HL Structure */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80">
              <span className="text-slate-400">Orderflow Flow</span>
              <span className="font-bold text-white">
                {priceAction.higherHighHigherLow
                  ? 'Higher Highs & Higher Lows'
                  : priceAction.lowerHighLowerLow
                  ? 'Lower Highs & Lower Lows'
                  : 'Sideways Bracket'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Breakout Probabilities & Momentum */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Probabilities & Momentum
            </h4>
          </div>

          <div className="space-y-4 text-xs">
            {/* Breakout vs Breakdown Probability Gauge */}
            <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 font-bold">Breakout Prob: {breakoutProb}%</span>
                <span className="text-rose-400 font-bold">Breakdown Prob: {breakdownProb}%</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${breakoutProb}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${breakdownProb}%` }} />
              </div>
            </div>

            {/* Volatility & ATR */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">ATR (14)</span>
                <span className="font-mono text-white font-bold text-sm">
                  {indicators.atr14} pts
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">BB BANDWIDTH</span>
                <span className="font-mono text-cyan-300 font-bold text-sm">
                  {indicators.bollingerBands.bandwidth}%
                </span>
              </div>
            </div>

            {/* ADX Trend Strength */}
            <div className="p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80 flex justify-between items-center">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">ADX MOMENTUM (14)</span>
                <span className="font-mono text-white font-bold text-sm">
                  {indicators.adx14.adx} ({indicators.adx14.trendStrength})
                </span>
              </div>
              <div className="text-right text-[11px] font-mono">
                <span className="text-emerald-400 mr-2">+DI: {indicators.adx14.plusDI}</span>
                <span className="text-rose-400">-DI: {indicators.adx14.minusDI}</span>
              </div>
            </div>

            {/* VWAP Proximity */}
            <div className="p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80 flex justify-between items-center">
              <span className="text-slate-400">Institutional VWAP</span>
              <span className={`font-mono font-bold ${isVwapBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{indicators?.vwap != null ? indicators.vwap.toLocaleString('en-IN') : '---'} ({isVwapBullish ? 'ABOVE' : 'BELOW'})
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Pivots & Key S/R Map */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Institutional S/R & Pivots
            </h4>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* Resistance Levels */}
            <div className="flex justify-between items-center p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
              <span className="font-sans text-[11px] text-rose-400 font-semibold">R3 / Intraday Peak</span>
              <span className="font-bold">₹{srLevels.classicPivots.r3}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
              <span className="font-sans text-[11px] text-rose-400 font-semibold">R1 Resistance</span>
              <span className="font-bold">₹{srLevels.classicPivots.r1}</span>
            </div>

            {/* Central Pivot */}
            <div className="flex justify-between items-center p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
              <span className="font-sans text-[11px] text-cyan-300 font-bold">Floor Central Pivot (PP)</span>
              <span className="font-bold">₹{srLevels.classicPivots.pivot}</span>
            </div>

            {/* Support Levels */}
            <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              <span className="font-sans text-[11px] text-emerald-400 font-semibold">S1 Support</span>
              <span className="font-bold">₹{srLevels.classicPivots.s1}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              <span className="font-sans text-[11px] text-emerald-400 font-semibold">S3 / Floor Base</span>
              <span className="font-bold">₹{srLevels.classicPivots.s3}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. INDICATOR CONFIRMATION MATRIX ================= */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          Technical Indicator Confirmation Matrix
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
          {/* RSI */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">RSI (14)</span>
            <div className={`text-sm font-bold font-mono ${isRsiBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.rsi14}
            </div>
            <span className="text-[10px] text-slate-400">
              {indicators.rsi14 > 70 ? 'Overbought' : indicators.rsi14 < 30 ? 'Oversold' : 'Neutral'}
            </span>
          </div>

          {/* MACD */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">MACD</span>
            <div className={`text-sm font-bold font-mono ${isMacdBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.macd.histogram > 0 ? '+' : ''}{indicators.macd.histogram}
            </div>
            <span className="text-[10px] text-slate-400">{indicators.macd.trend}</span>
          </div>

          {/* Supertrend */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">SUPERTREND</span>
            <div className={`text-sm font-bold font-mono ${isSupertrendBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.supertrend.trend}
            </div>
            <span className="text-[10px] text-slate-400">₹{indicators.supertrend.value}</span>
          </div>

          {/* EMA 9 */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">EMA 9</span>
            <div className="text-sm font-bold font-mono text-cyan-300">
              ₹{indicators.ema.ema9}
            </div>
            <span className="text-[10px] text-slate-400">Short trigger</span>
          </div>

          {/* EMA 20 */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">EMA 20</span>
            <div className="text-sm font-bold font-mono text-cyan-300">
              ₹{indicators.ema.ema20}
            </div>
            <span className="text-[10px] text-slate-400">Pullback baseline</span>
          </div>

          {/* EMA 50 */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">EMA 50</span>
            <div className="text-sm font-bold font-mono text-cyan-300">
              ₹{indicators.ema.ema50}
            </div>
            <span className="text-[10px] text-slate-400">Intermediate</span>
          </div>

          {/* EMA 200 */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">EMA 200</span>
            <div className="text-sm font-bold font-mono text-purple-300">
              ₹{indicators.ema.ema200}
            </div>
            <span className="text-[10px] text-slate-400">Major baseline</span>
          </div>

          {/* VWAP */}
          <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">VWAP</span>
            <div className={`text-sm font-bold font-mono ${isVwapBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{indicators.vwap}
            </div>
            <span className="text-[10px] text-slate-400">{isVwapBullish ? 'Support' : 'Resistance'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
