import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  HelpCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Zap, 
  ChevronRight,
  Flame,
  Scale,
  Sparkles,
  Info
} from 'lucide-react';
import type { PredictionResult, SupportResistanceLevels } from '../types.js';

interface PredictionCardProps {
  prediction: PredictionResult | null;
  srLevels: SupportResistanceLevels | null;
  currentPrice: number;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  srLevels,
  currentPrice
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('15:00');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);

  useEffect(() => {
    if (!prediction) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, prediction.expiresAt - now);
      setSecondsRemaining(remaining);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prediction]);

  if (!prediction) {
    return (
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 text-center animate-pulse">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
        <p className="text-slate-400 text-sm">Synthesizing real-time market prediction engine...</p>
      </div>
    );
  }

  const isUp = prediction.predictedDirection === 'UP';
  const isDown = prediction.predictedDirection === 'DOWN';
  const isSideways = prediction.predictedDirection === 'SIDEWAYS';
  const isNoSignal = prediction.predictedDirection === 'NO CLEAR SIGNAL';

  const genDate = new Date(prediction.generatedAt * 1000);
  const expDate = new Date(prediction.expiresAt * 1000);
  const genTimeStr = `${genDate.getHours().toString().padStart(2, '0')}:${genDate.getMinutes().toString().padStart(2, '0')}:${genDate.getSeconds().toString().padStart(2, '0')}`;
  const expTimeStr = `${expDate.getHours().toString().padStart(2, '0')}:${expDate.getMinutes().toString().padStart(2, '0')}:${expDate.getSeconds().toString().padStart(2, '0')}`;

  // Theme styling based on direction
  const badgeColors = isUp
    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
    : isDown
    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
    : isSideways
    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
    : 'bg-slate-800/60 border-slate-700 text-slate-400';

  const glowClass = isUp ? 'glow-green' : isDown ? 'glow-red' : '';

  return (
    <div className={`bg-[#0b1120] border border-slate-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden ${glowClass}`}>
      {/* Background radial accent glow */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isUp ? 'bg-emerald-500' : isDown ? 'bg-rose-500' : isSideways ? 'bg-amber-500' : 'bg-slate-600'
        }`}
      />

      {/* Header bar: Title & 15m Expiry Timer */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-1.5">
              15-MINUTE ADVANCE PREDICTION
            </h3>
            <p className="text-[11px] text-slate-400">
              Institutional Orderflow & Multi-Indicator Confluence
            </p>
          </div>
        </div>

        {/* Real-time countdown timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070a11] border border-slate-800">
          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">RESOLVES IN</div>
            <div className="text-sm font-bold font-mono text-cyan-300">{timeLeftStr}</div>
          </div>
        </div>
      </div>

      {/* Core Direction Banner */}
      <div className="my-5 p-4 rounded-xl bg-[#080d1a] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Animated Direction Icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border text-2xl shadow-lg transition-transform ${
              isUp
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-emerald-950'
                : isDown
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-400 shadow-rose-950'
                : isSideways
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-400 shadow-amber-950'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {isUp && <TrendingUp className="w-8 h-8 animate-bounce" />}
            {isDown && <TrendingDown className="w-8 h-8 animate-bounce" />}
            {isSideways && <Minus className="w-8 h-8" />}
            {isNoSignal && <HelpCircle className="w-8 h-8" />}
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
              PREDICTED 15M DIRECTION
            </div>
            <div
              className={`text-2xl font-black tracking-wider flex items-center gap-2 ${
                isUp
                  ? 'text-emerald-400'
                  : isDown
                  ? 'text-rose-400'
                  : isSideways
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }`}
            >
              {prediction.predictedDirection}
              {prediction.predictedPercentageChange !== 0 && (
                <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                  {prediction.predictedPercentageChange > 0 ? '+' : ''}
                  {prediction.predictedPercentageChange}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-3 bg-[#0c1424] px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CONFIDENCE</div>
            <div className={`text-xl font-black font-mono-numbers ${prediction.confidenceScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {prediction.confidenceScore}%
            </div>
          </div>
          {/* Circular mini gauge bar */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="#1e293b"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke={isUp ? '#10b981' : isDown ? '#ef4444' : '#f59e0b'}
                strokeWidth="4"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * prediction.confidenceScore) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <ShieldCheck className="w-4 h-4 text-slate-300 absolute" />
          </div>
        </div>
      </div>

      {/* Target Price Ranges & Support / Resistance Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Expected High */}
        <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">EXPECTED HIGH</div>
          <div className="text-base font-bold text-emerald-400 font-mono-numbers">
            ₹{prediction.expectedPriceRange?.targetHigh != null ? prediction.expectedPriceRange.targetHigh.toLocaleString('en-IN') : '---'}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">
            +{((prediction.expectedPriceRange?.targetHigh ?? currentPrice) - currentPrice).toFixed(1)} pts
          </div>
        </div>

        {/* Expected Low */}
        <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">EXPECTED LOW</div>
          <div className="text-base font-bold text-rose-400 font-mono-numbers">
            ₹{prediction.expectedPriceRange?.targetLow != null ? prediction.expectedPriceRange.targetLow.toLocaleString('en-IN') : '---'}
          </div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">
            {((prediction.expectedPriceRange?.targetLow ?? currentPrice) - currentPrice).toFixed(1)} pts
          </div>
        </div>

        {/* Expected Support */}
        <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">EXPECTED SUPPORT</div>
          <div className="text-base font-bold text-cyan-300 font-mono-numbers">
            ₹{srLevels?.nearestSupport != null ? srLevels.nearestSupport.toLocaleString('en-IN') : '---'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Immediate floor</div>
        </div>

        {/* Expected Resistance */}
        <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">EXPECTED RESISTANCE</div>
          <div className="text-base font-bold text-purple-300 font-mono-numbers">
            ₹{srLevels?.nearestResistance != null ? srLevels.nearestResistance.toLocaleString('en-IN') : '---'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Immediate ceiling</div>
        </div>
      </div>

      {/* Bullish vs Bearish Probability Bar */}
      <div className="my-4 p-3.5 rounded-xl bg-[#070a11] border border-slate-800/80">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Bullish: {prediction.bullishProbability}%
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Neutral: {prediction.sidewaysProbability}%
          </span>
          <span className="font-bold text-rose-400 flex items-center gap-1">
            Bearish: {prediction.bearishProbability}%
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${prediction.bullishProbability}%` }}
          />
          <div
            className="h-full bg-amber-500/80 transition-all duration-500"
            style={{ width: `${prediction.sidewaysProbability}%` }}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${prediction.bearishProbability}%` }}
          />
        </div>
      </div>

      {/* Meta Indicators: Trend Strength, Risk Level & Timestamps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800/70 text-xs">
        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">TREND STRENGTH</span>
          <span className="font-bold text-slate-200">
            {prediction.trendStrength.replace('_', ' ')}
          </span>
        </div>

        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">RISK LEVEL</span>
          <span
            className={`font-bold ${
              prediction.riskLevel === 'LOW'
                ? 'text-emerald-400'
                : prediction.riskLevel === 'MEDIUM'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {prediction.riskLevel}
          </span>
        </div>

        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">GENERATED AT</span>
          <span className="font-mono text-slate-400">{genTimeStr} IST</span>
        </div>

        <div>
          <span className="text-slate-500 text-[10px] uppercase font-bold block">EXPIRY TIME</span>
          <span className="font-mono text-cyan-400 font-bold">{expTimeStr} IST</span>
        </div>
      </div>

      {/* Key Supporting Factors */}
      {prediction.keyFactors && prediction.keyFactors.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/70">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-cyan-400" />
            Key Technical Drivers
          </div>
          <div className="flex flex-wrap gap-2">
            {prediction.keyFactors.map((factor, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium"
              >
                • {factor}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
