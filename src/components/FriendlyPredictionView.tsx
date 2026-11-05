import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Clock, 
  Target, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Download,
  Smartphone,
  ChevronRight,
  Info
} from 'lucide-react';
import type { PredictionResult, SupportResistanceLevels } from '../types.js';

interface FriendlyPredictionViewProps {
  prediction: PredictionResult | null;
  srLevels: SupportResistanceLevels | null;
  currentPrice: number;
  symbolName: string;
  onOpenApkModal: () => void;
}

export const FriendlyPredictionView: React.FC<FriendlyPredictionViewProps> = ({
  prediction,
  srLevels,
  currentPrice,
  symbolName,
  onOpenApkModal
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [countdown, setCountdown] = useState<string>('15:00');

  useEffect(() => {
    if (!prediction) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, prediction.expiresAt - now);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [prediction]);

  if (!prediction) {
    return (
      <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 text-center animate-pulse">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-spin" />
        <p className="text-slate-300 font-medium">Analyzing market orderflow for {symbolName}...</p>
      </div>
    );
  }

  const isUp = prediction.predictedDirection === 'UP';
  const isDown = prediction.predictedDirection === 'DOWN';
  const isSideways = prediction.predictedDirection === 'SIDEWAYS';
  const isNoSignal = prediction.predictedDirection === 'NO CLEAR SIGNAL';

  const stopLoss = isUp
    ? (srLevels?.nearestSupport || currentPrice * 0.997).toFixed(1)
    : isDown
    ? (srLevels?.nearestResistance || currentPrice * 1.003).toFixed(1)
    : '---';

  const profitPoints = isUp
    ? (prediction.expectedPriceRange.targetHigh - currentPrice).toFixed(1)
    : isDown
    ? (currentPrice - prediction.expectedPriceRange.targetLow).toFixed(1)
    : '0';

  // Voice Announcement using Web Speech API
  const speakSignal = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let text = '';
    if (isUp) {
      text = `JIT Prediction for ${symbolName}. Bullish Call signal. Target price is ${prediction.expectedPriceRange.targetHigh} rupees. Confidence is ${prediction.confidenceScore} percent.`;
    } else if (isDown) {
      text = `JIT Prediction for ${symbolName}. Bearish Put signal. Downside target is ${prediction.expectedPriceRange.targetLow} rupees. Confidence is ${prediction.confidenceScore} percent.`;
    } else {
      text = `JIT Prediction for ${symbolName}. Market is currently sideways. Recommendation is to wait for the next fifteen minute candle.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4">
      {/* Friendly Signal Card */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border shadow-2xl transition-all relative overflow-hidden ${
          isUp
            ? 'bg-gradient-to-br from-[#062419] via-[#091b15] to-[#070b14] border-emerald-500/50 shadow-emerald-950/40'
            : isDown
            ? 'bg-gradient-to-br from-[#280c12] via-[#1c0d12] to-[#070b14] border-rose-500/50 shadow-rose-950/40'
            : 'bg-gradient-to-br from-[#1c1808] via-[#14120a] to-[#070b14] border-amber-500/40 shadow-amber-950/30'
        }`}
      >
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-300">
              SIMPLE TRADING DECISION
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-black/40 text-cyan-300 font-mono font-bold border border-cyan-500/30">
              {symbolName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Readout Button */}
            <button
              onClick={speakSignal}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse'
                  : 'bg-black/40 border-white/20 text-slate-200 hover:bg-black/60'
              }`}
              title="Listen to trade signal audio announcement"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>{isSpeaking ? 'Speaking...' : 'Listen Signal'}</span>
            </button>

            {/* 15m Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{countdown}</span>
            </div>
          </div>
        </div>

        {/* Big Friendly Action Banner */}
        <div className="my-5 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              15-MINUTE RECOMMENDATION
            </span>
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  isUp
                    ? 'bg-emerald-500 shadow-emerald-500/30'
                    : isDown
                    ? 'bg-rose-500 shadow-rose-500/30'
                    : 'bg-amber-500 shadow-amber-500/30'
                }`}
              >
                {isUp && <TrendingUp className="w-8 h-8 stroke-[2.5]" />}
                {isDown && <TrendingDown className="w-8 h-8 stroke-[2.5]" />}
                {isSideways && <Minus className="w-8 h-8 stroke-[2.5]" />}
                {isNoSignal && <HelpCircle className="w-8 h-8 stroke-[2.5]" />}
              </div>

              <div>
                <h3
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-amber-400'
                  }`}
                >
                  {isUp
                    ? 'BUY CALL / MARKET GOING UP'
                    : isDown
                    ? 'BUY PUT / MARKET GOING DOWN'
                    : isSideways
                    ? 'WAIT / MARKET IS SIDEWAYS'
                    : 'NO CLEAR TRADE / WAIT'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isUp
                    ? 'Strong buyer momentum detected. Expected upside within 15 minutes.'
                    : isDown
                    ? 'Sellers are dominating price action. Expected downside within 15 minutes.'
                    : 'Market is moving inside a tight range. Best to wait for a clean breakout.'}
                </p>
              </div>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-center min-w-[130px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              ACCURACY CONFIDENCE
            </span>
            <div
              className={`text-3xl font-black font-mono-numbers ${
                prediction.confidenceScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {prediction.confidenceScore}%
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {prediction.riskLevel} RISK
            </span>
          </div>
        </div>

        {/* 3 Core Numbers: Target, Current Price, Safe Stop Loss */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Target Price */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              EXPECTED 15M TARGET
            </span>
            <div className="text-xl font-black text-white font-mono-numbers">
              ₹{isUp
                ? (prediction.expectedPriceRange?.targetHigh != null ? prediction.expectedPriceRange.targetHigh.toLocaleString('en-IN') : '---')
                : isDown
                ? (prediction.expectedPriceRange?.targetLow != null ? prediction.expectedPriceRange.targetLow.toLocaleString('en-IN') : '---')
                : (prediction.expectedPriceRange?.targetMedian != null ? prediction.expectedPriceRange.targetMedian.toLocaleString('en-IN') : '---')}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">
              Expected Move: {profitPoints !== '0' ? `+${profitPoints} pts` : 'Range-bound'}
            </span>
          </div>

          {/* Current Spot Price */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              CURRENT LIVE PRICE
            </span>
            <div className="text-xl font-black text-cyan-300 font-mono-numbers">
              ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Live NSE Index Tick
            </span>
          </div>

          {/* Safe Stop Loss */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
            <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              RECOMMENDED STOP LOSS
            </span>
            <div className="text-xl font-black text-rose-400 font-mono-numbers">
              ₹{stopLoss}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Exit if price crosses this level
            </span>
          </div>
        </div>

        {/* Friendly AI Explanation */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-start gap-2.5 text-xs text-slate-200">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Why this trade? </strong>
            {prediction.keyFactors && prediction.keyFactors.length > 0
              ? prediction.keyFactors.join('. ') + '.'
              : 'Technical indicators show directional consensus on the 5-minute timeframe.'}
          </p>
        </div>
      </div>
    </div>
  );
};
