import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  BarChart3, 
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import type { AccuracyStats, PredictionResult } from '../types.js';

export const AccuracyTrackerSection: React.FC = () => {
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [filterSymbol, setFilterSymbol] = useState<'ALL' | '^NSEI' | '^NSEBANK'>('ALL');
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS' | 'PENDING'>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAccuracyStats = async () => {
    try {
      const res = await fetch('/api/accuracy/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setHistory(data.recentHistory || []);
      }
    } catch (err) {
      console.warn('Failed to load accuracy stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccuracyStats();
    const interval = setInterval(fetchAccuracyStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredHistory = history.filter(item => {
    if (filterSymbol !== 'ALL' && item.symbol !== filterSymbol) return false;
    if (filterOutcome === 'WIN') return item.actualOutcome?.wasAccurate === true;
    if (filterOutcome === 'LOSS') return item.actualOutcome && !item.actualOutcome.wasAccurate;
    if (filterOutcome === 'PENDING') return !item.actualOutcome;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Integrity Notice */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">
                Prediction Accuracy & Backtesting Engine
              </h3>
              <p className="text-xs text-slate-400">
                Transparent walk-forward 15-minute resolution verification without look-ahead bias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              Walk-Forward: STRICT
            </span>
            <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-mono">
              Zero Lookahead
            </span>
          </div>
        </div>

        {/* Warning / Integrity banner */}
        <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Institutional Transparency Guarantee:</strong> Financial markets involve probabilistic risk. JIT PREDICTION logs every forecast the instant it is generated and transparently evaluates the outcome after 15 minutes. Failed predictions are permanently cataloged to protect trader trust.
          </div>
        </div>

        {/* Rolling Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
            {/* Overall Directional Accuracy */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                OVERALL WIN RATE
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono-numbers">
                {stats.overallDirectionalAccuracy}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {stats.totalEvaluated} trades tracked
              </span>
            </div>

            {/* Rolling 50 Accuracy */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                ROLLING 50 TRADES
              </span>
              <div className="text-2xl font-black text-cyan-400 font-mono-numbers">
                {stats.rolling50Accuracy}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Recent window</span>
            </div>

            {/* Rolling 100 Accuracy */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                ROLLING 100 TRADES
              </span>
              <div className="text-2xl font-black text-purple-400 font-mono-numbers">
                {stats.rolling100Accuracy}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Multi-session</span>
            </div>

            {/* Bullish Accuracy */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                BULLISH WIN RATE
              </span>
              <div className="text-2xl font-black text-emerald-400 font-mono-numbers">
                {stats.bullishAccuracy}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Long calls</span>
            </div>

            {/* Bearish Accuracy */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                BEARISH WIN RATE
              </span>
              <div className="text-2xl font-black text-rose-400 font-mono-numbers">
                {stats.bearishAccuracy}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Short calls</span>
            </div>

            {/* Mean Absolute Error */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                AVG TARGET ERROR
              </span>
              <div className="text-2xl font-black text-amber-400 font-mono-numbers">
                ±{stats.averageErrorMarginPoints} pts
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">MAE from median</span>
            </div>
          </div>
        )}
      </div>

      {/* Prediction History Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Verified 15-Minute Outcome History
          </h4>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Symbol Filter */}
            <div className="flex bg-[#070a11] p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterSymbol('ALL')}
                className={`px-2.5 py-1 rounded font-medium ${filterSymbol === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSymbol('^NSEI')}
                className={`px-2.5 py-1 rounded font-medium ${filterSymbol === '^NSEI' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                NIFTY 50
              </button>
              <button
                onClick={() => setFilterSymbol('^NSEBANK')}
                className={`px-2.5 py-1 rounded font-medium ${filterSymbol === '^NSEBANK' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                BANK NIFTY
              </button>
            </div>

            {/* Outcome Filter */}
            <div className="flex bg-[#070a11] p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterOutcome('ALL')}
                className={`px-2.5 py-1 rounded font-medium ${filterOutcome === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterOutcome('WIN')}
                className={`px-2.5 py-1 rounded font-medium ${filterOutcome === 'WIN' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
              >
                Wins
              </button>
              <button
                onClick={() => setFilterOutcome('LOSS')}
                className={`px-2.5 py-1 rounded font-medium ${filterOutcome === 'LOSS' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}
              >
                Misses
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070b14] text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Index</th>
                <th className="p-3">Generated</th>
                <th className="p-3">Entry Price</th>
                <th className="p-3">Forecast</th>
                <th className="p-3">Target Range</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Resolved Price</th>
                <th className="p-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {filteredHistory.map((row) => {
                const date = new Date(row.generatedAt);
                const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                const isWin = row.actualOutcome?.wasAccurate;
                const isPending = !row.actualOutcome;

                return (
                  <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {row.symbolName}
                    </td>
                    <td className="p-3 text-slate-400">{timeStr} IST</td>
                    <td className="p-3 text-slate-200">₹{row.currentPrice.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          row.predictedDirection === 'UP'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : row.predictedDirection === 'DOWN'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {row.predictedDirection === 'UP' && <TrendingUp className="w-3 h-3" />}
                        {row.predictedDirection === 'DOWN' && <TrendingDown className="w-3 h-3" />}
                        {row.predictedDirection === 'SIDEWAYS' && <Minus className="w-3 h-3" />}
                        {row.predictedDirection}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      ₹{row.expectedPriceRange.targetLow} - ₹{row.expectedPriceRange.targetHigh}
                    </td>
                    <td className="p-3 font-bold text-slate-200">{row.confidenceScore}%</td>
                    <td className="p-3">
                      {row.actualOutcome ? (
                        <span className="text-white font-bold">
                          ₹{row.actualOutcome.actualPrice.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-cyan-400 animate-pulse text-[11px] font-sans">
                          In Progress (15m window)
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
                          PENDING
                        </span>
                      ) : isWin ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          ACCURATE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 w-max">
                          <XCircle className="w-3 h-3" />
                          MISSED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
