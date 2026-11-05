import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldCheck, 
  Compass, 
  Info, 
  Smartphone, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Download,
  Lightbulb
} from 'lucide-react';
import type { PredictionResult, TechnicalIndicators, SupportResistanceLevels } from '../types.js';

interface UserFriendlyGuideProps {
  prediction: PredictionResult | null;
  indicators: TechnicalIndicators | null;
  srLevels: SupportResistanceLevels | null;
  currentPrice: number;
  symbolName: string;
  onOpenAndroidHub: () => void;
}

export const UserFriendlyGuide: React.FC<UserFriendlyGuideProps> = ({
  prediction,
  indicators,
  srLevels,
  currentPrice,
  symbolName,
  onOpenAndroidHub
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  if (!prediction) return null;

  const isUp = prediction.predictedDirection === 'UP';
  const isDown = prediction.predictedDirection === 'DOWN';
  const isSideways = prediction.predictedDirection === 'SIDEWAYS';

  // Human-friendly simple trading takeaway
  let friendlyHeadline = '';
  let friendlyAdvice = '';
  let friendlyColor = '';

  if (isUp) {
    friendlyHeadline = `Bullish Momentum Favors Upside (Next 15 Mins)`;
    friendlyAdvice = `Buyers are in control. Look for pullbacks toward support (₹${srLevels?.nearestSupport || '---'}) for long setups targeting ₹${prediction.expectedPriceRange.targetHigh}. Keep stop loss below support.`;
    friendlyColor = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
  } else if (isDown) {
    friendlyHeadline = `Bearish Pressure Favors Downside (Next 15 Mins)`;
    friendlyAdvice = `Sellers are defending highs. Watch for tests of resistance (₹${srLevels?.nearestResistance || '---'}) failing, with potential target near ₹${prediction.expectedPriceRange.targetLow}.`;
    friendlyColor = 'border-rose-500/40 bg-rose-950/20 text-rose-300';
  } else {
    friendlyHeadline = `Range-Bound Consolidation (No Clear Trend)`;
    friendlyAdvice = `The index is moving sideways between support and resistance. It is best to wait for a breakout before taking aggressive positions.`;
    friendlyColor = 'border-amber-500/40 bg-amber-950/20 text-amber-300';
  }

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
      {/* Friendly Action Summary Banner */}
      <div className={`p-4 border-b ${friendlyColor} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            {isUp && <TrendingUp className="w-6 h-6 text-emerald-400" />}
            {isDown && <TrendingDown className="w-6 h-6 text-rose-400" />}
            {isSideways && <Minus className="w-6 h-6 text-amber-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900/90 text-white font-mono">
                SIMPLIFIED 15M ACTION GUIDE
              </span>
              <span className="text-xs font-bold text-slate-300">
                {symbolName}
              </span>
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {friendlyHeadline}
            </div>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isExpanded ? 'Hide Details' : 'Beginner Friendly Guide'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Friendly Advice */}
      <div className="p-4 bg-[#080d1a]">
        <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white mr-1.5">Quick Interpretation:</strong>
            {friendlyAdvice}
          </div>
        </div>
      </div>

      {/* Collapsible Educational & Friendly Tooltip Section */}
      {isExpanded && (
        <div className="p-5 bg-[#060a14] border-t border-slate-800/80 space-y-4 text-xs animate-fade-in">
          <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            Understanding the Indicators in Plain English:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* RSI Plain English */}
            <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center justify-between">
                <span>RSI (Momentum)</span>
                <span className="font-mono text-cyan-400">{indicators?.rsi14 || 50}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Measures buying vs selling speed. Above 55 means buyers have momentum. Above 75 is overheated (caution). Below 45 means sellers dominate.
              </p>
            </div>

            {/* VWAP Plain English */}
            <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center justify-between">
                <span>VWAP (Average Price)</span>
                <span className="font-mono text-cyan-400">₹{indicators?.vwap || '---'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Institutional benchmark price. When spot price is above VWAP, big institutions are actively buying. Below VWAP indicates institutional selling.
              </p>
            </div>

            {/* Supertrend Plain English */}
            <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center justify-between">
                <span>Supertrend (Compass)</span>
                <span className={`font-mono font-bold ${indicators?.supertrend.trend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {indicators?.supertrend.trend || 'NEUTRAL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Acts like a dynamic shield. Green means hold bullish trades; Red means defense. Flips signal potential intraday trend changes.
              </p>
            </div>
          </div>

          {/* Quick Risk Reminder */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Rule of Thumb:</strong> Always trade with strict stop losses and risk only what you can afford. Predictions represent statistical probability, not absolute certainty.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
