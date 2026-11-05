import React, { useState } from 'react';
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  HelpCircle,
  Target
} from 'lucide-react';
import type { OpenInterestAnalysis, BuildupType } from '../types.js';

interface OpenInterestSectionProps {
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: string;
  currentPrice: number;
  oiAnalysis: OpenInterestAnalysis | null;
  lastUpdatedTime?: string;
  isLive?: boolean;
}

export const OpenInterestSection: React.FC<OpenInterestSectionProps> = ({
  symbol,
  symbolName,
  currentPrice,
  oiAnalysis,
  lastUpdatedTime,
  isLive = true
}) => {
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  if (!oiAnalysis || !oiAnalysis.strikes || oiAnalysis.strikes.length === 0) {
    return (
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Layers className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-300">Open Interest (OI) Analysis</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Data Unavailable. Live exchange option chain connection is initializing or awaiting trading session broadcast.
        </p>
      </div>
    );
  }

  const {
    spotPrice,
    atmStrike,
    expiryDate,
    totalCallOi,
    totalPutOi,
    totalCallOiChange,
    totalPutOiChange,
    pcr,
    pcrSentiment,
    highestCallOiStrike,
    highestPutOiStrike,
    secondHighestCallOiStrike,
    secondHighestPutOiStrike,
    maxPainStrike,
    overallBuildup,
    signal,
    signalReason,
    strikes
  } = oiAnalysis;

  const getBuildupBadge = (type: BuildupType) => {
    switch (type) {
      case 'LONG_BUILDUP':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-2.5 h-2.5" /> LB (Bullish)
          </span>
        );
      case 'SHORT_BUILDUP':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownRight className="w-2.5 h-2.5" /> SB (Bearish)
          </span>
        );
      case 'SHORT_COVERING':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-2.5 h-2.5" /> SC (Covering)
          </span>
        );
      case 'LONG_UNWINDING':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingDown className="w-2.5 h-2.5" /> LU (Unwinding)
          </span>
        );
    }
  };

  return (
    <section className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                OPEN INTEREST (OI) ANALYSIS
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
                {symbolName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Option Chain Derivatives Analysis • Expiry: <span className="font-semibold text-slate-200">{expiryDate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Market Signal Badge */}
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
            OI SIGNAL: {signal}
          </div>

          <button
            onClick={() => setInfoModalOpen(!infoModalOpen)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="OI Analysis Guide & Formula Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Helper Explanation Modal / Expandable Card */}
      {infoModalOpen && (
        <div className="p-4 rounded-xl bg-[#070a11] border border-cyan-500/30 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            How to Read Indian Market Open Interest (OI) & PCR:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400">
            <div>
              <p><strong className="text-white">Put-Call Ratio (PCR):</strong> Total Put OI ÷ Total Call OI. PCR &gt; 1.2 indicates bullish sentiment / heavy put writing (strong floor). PCR &lt; 0.8 indicates bearish sentiment / heavy call writing (strong ceiling).</p>
            </div>
            <div>
              <p><strong className="text-white">Build-up Classifications:</strong></p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><span className="text-emerald-400 font-semibold">Long Build-up:</span> Price Up + OI Up (Bullish buyers in control).</li>
                <li><span className="text-rose-400 font-semibold">Short Build-up:</span> Price Down + OI Up (Bearish sellers writing calls).</li>
                <li><span className="text-cyan-400 font-semibold">Short Covering:</span> Price Up + OI Down (Bearish shorts rushing to close).</li>
                <li><span className="text-amber-400 font-semibold">Long Unwinding:</span> Price Down + OI Down (Longs booking profits).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Call OI (Resistance Force) */}
        <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 mb-1">
            <span>TOTAL CALL OI</span>
            <span className="text-rose-400 font-mono">RESISTANCE</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-400 font-mono-numbers">
            {totalCallOi.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-slate-400">OI Change:</span>
            <span className={`font-mono font-bold ${totalCallOiChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalCallOiChange >= 0 ? '+' : ''}{totalCallOiChange.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Put OI (Support Force) */}
        <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 mb-1">
            <span>TOTAL PUT OI</span>
            <span className="text-emerald-400 font-mono">SUPPORT</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono-numbers">
            {totalPutOi.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-slate-400">OI Change:</span>
            <span className={`font-mono font-bold ${totalPutOiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPutOiChange >= 0 ? '+' : ''}{totalPutOiChange.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Put-Call Ratio (PCR) */}
        <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 mb-1">
            <span>PUT-CALL RATIO (PCR)</span>
            <span
              className={`font-mono font-bold ${
                pcrSentiment === 'BULLISH'
                  ? 'text-emerald-400'
                  : pcrSentiment === 'BEARISH'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {pcrSentiment}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono-numbers flex items-baseline gap-2">
            <span>{pcr.toFixed(2)}</span>
            <span className="text-[10px] font-medium text-slate-400 font-sans">
              {pcr >= 1.25 ? 'Heavy Put Writing' : pcr <= 0.80 ? 'Heavy Call Writing' : 'Balanced Sentiment'}
            </span>
          </div>
          {/* PCR Visual Meter Bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                pcr >= 1.15 ? 'bg-emerald-400' : pcr <= 0.85 ? 'bg-rose-400' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, (pcr / 2.0) * 100))}%` }}
            />
          </div>
        </div>

        {/* Max Pain & Overall Buildup */}
        <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800/80">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 mb-1">
            <span>MAX PAIN STRIKE</span>
            <span className="text-purple-400 font-mono">EXPIRY TARGET</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-300 font-mono-numbers">
            ₹{maxPainStrike.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center justify-between text-[10px] mt-1">
            <span className="text-slate-400">Market Buildup:</span>
            {getBuildupBadge(overallBuildup)}
          </div>
        </div>
      </div>

      {/* 3. Major OI Support & Resistance Level Badges */}
      <div className="p-3.5 rounded-xl bg-[#070a11] border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Strongest OI Support:</span>
          <span className="font-mono font-bold text-emerald-400">
            ₹{highestPutOiStrike.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            (Put OI: {strikes.find(s => s.strikePrice === highestPutOiStrike)?.putOi.toLocaleString('en-IN')})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="text-slate-400">Strongest OI Resistance:</span>
          <span className="font-mono font-bold text-rose-400">
            ₹{highestCallOiStrike.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            (Call OI: {strikes.find(s => s.strikePrice === highestCallOiStrike)?.callOi.toLocaleString('en-IN')})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">At-The-Money (ATM):</span>
          <span className="font-mono font-bold text-cyan-300">
            ₹{atmStrike.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Signal Reason Card */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Activity className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold text-white mr-1.5">Exchange OI Analysis:</span>
          {signalReason}
        </div>
      </div>
    </section>
  );
};
