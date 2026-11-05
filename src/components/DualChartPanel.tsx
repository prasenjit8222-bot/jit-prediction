import React, { useState, useMemo } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Layers, 
  Clock, 
  Crosshair, 
  Activity, 
  Eye, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import type { Candle, ProjectedCandle, SupportResistanceLevels, PredictionResult } from '../types.js';

interface DualChartPanelProps {
  symbol: '^NSEI' | '^NSEBANK';
  symbolName: string;
  candles: Candle[];
  projectedCandles: ProjectedCandle[];
  srLevels: SupportResistanceLevels;
  prediction: PredictionResult | null;
  timeframe: '1m' | '3m' | '5m' | '15m';
  onTimeframeChange: (tf: '1m' | '3m' | '5m' | '15m') => void;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  dataStatus: 'LIVE' | 'CLOSED_HISTORICAL' | 'DELAYED';
  isLive: boolean;
}

export const DualChartPanel: React.FC<DualChartPanelProps> = ({
  symbol,
  symbolName,
  candles,
  projectedCandles,
  srLevels,
  prediction,
  timeframe,
  onTimeframeChange,
  currentPrice,
  priceChange,
  priceChangePercent,
  dataStatus,
  isLive
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverProjectionIndex, setHoverProjectionIndex] = useState<number | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<'NONE' | 'LEFT' | 'RIGHT'>('NONE');
  const [showSRLevels, setShowSRLevels] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [mobileView, setMobileView] = useState<'SPLIT' | 'LIVE_ONLY' | 'PREDICTION_ONLY'>('SPLIT');

  // Slice last 35 candles for clear readability on mobile and desktop
  const displayCandles = useMemo(() => {
    return candles.slice(-36);
  }, [candles]);

  // Compute scale min/max for live chart
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (displayCandles.length === 0) return { minPrice: 20000, maxPrice: 25000, maxVol: 100000 };
    const lows = displayCandles.map(c => c.low);
    const highs = displayCandles.map(c => c.high);
    const vols = displayCandles.map(c => c.volume || 0);

    let min = Math.min(...lows);
    let max = Math.max(...highs);

    if (showSRLevels && srLevels) {
      if (srLevels.nearestSupport) min = Math.min(min, srLevels.nearestSupport);
      if (srLevels.nearestResistance) max = Math.max(max, srLevels.nearestResistance);
    }

    const padding = (max - min) * 0.08 || 20;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      maxVol: Math.max(...vols, 1000)
    };
  }, [displayCandles, showSRLevels, srLevels]);

  // Compute scale for prediction chart (combines last 8 real candles + projected candles)
  const contextCandles = useMemo(() => displayCandles.slice(-10), [displayCandles]);
  const { predMinPrice, predMaxPrice } = useMemo(() => {
    const prices: number[] = [
      ...contextCandles.map(c => c.low),
      ...contextCandles.map(c => c.high)
    ];
    for (const p of projectedCandles) {
      if (p.lowerConfidenceBound != null) prices.push(p.lowerConfidenceBound);
      if (p.upperConfidenceBound != null) prices.push(p.upperConfidenceBound);
      if (p.projectedLow != null) prices.push(p.projectedLow);
      if (p.projectedHigh != null) prices.push(p.projectedHigh);
    }
    if (prediction && prediction.expectedPriceRange) {
      if (prediction.expectedPriceRange.targetHigh != null) prices.push(prediction.expectedPriceRange.targetHigh);
      if (prediction.expectedPriceRange.targetLow != null) prices.push(prediction.expectedPriceRange.targetLow);
    }

    const validPrices = prices.filter(p => typeof p === 'number' && !isNaN(p) && isFinite(p));

    if (validPrices.length === 0) {
      const base = currentPrice > 0 ? currentPrice : symbol === '^NSEI' ? 24000 : 52000;
      return {
        predMinPrice: base - 150,
        predMaxPrice: base + 150
      };
    }

    let min = Math.min(...validPrices);
    let max = Math.max(...validPrices);
    const padding = (max - min) * 0.12 || 25;
    return {
      predMinPrice: min - padding,
      predMaxPrice: max + padding
    };
  }, [contextCandles, projectedCandles, prediction, currentPrice, symbol]);

  // Dimensions
  const chartHeight = 360;
  const candleAreaHeight = showVolume ? 280 : 330;
  const volumeAreaHeight = 70;

  const getY = (val: number, min: number, max: number) => {
    if (max === min) return candleAreaHeight / 2;
    return candleAreaHeight - ((val - min) / (max - min)) * candleAreaHeight;
  };

  const getVolY = (vol: number) => {
    if (maxVol === 0) return chartHeight;
    const barHeight = (vol / maxVol) * volumeAreaHeight;
    return chartHeight - barHeight;
  };

  const isUpTrend = prediction?.predictedDirection === 'UP';
  const isDownTrend = prediction?.predictedDirection === 'DOWN';
  const isSideways = prediction?.predictedDirection === 'SIDEWAYS';
  const isNoSignal = prediction?.predictedDirection === 'NO CLEAR SIGNAL';

  const hoveredCandle = hoverIndex !== null ? displayCandles[hoverIndex] : displayCandles[displayCandles.length - 1];

  return (
    <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Top Header & Controls */}
      <div className="px-4 py-3 bg-[#0d1527] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Symbol & Price Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              {symbolName}
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                {symbol}
              </span>
            </h2>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white font-mono-numbers">
              ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded font-mono-numbers flex items-center gap-0.5 ${
                priceChange >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}
              {priceChangePercent.toFixed(2)}%)
            </span>
          </div>

          {dataStatus === 'LIVE' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
              LIVE NSE
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
              NSE CLOSED (OFFICIAL)
            </span>
          )}
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Timeframe Switcher */}
          <div className="flex items-center bg-[#070a11] p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['1m', '3m', '5m', '15m'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* S/R & Volume Toggles */}
          <button
            onClick={() => setShowSRLevels(!showSRLevels)}
            className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-all ${
              showSRLevels
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Support & Resistance Overlay"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">S/R</span>
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-all ${
              showVolume
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Volume Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vol</span>
          </button>

          {/* Mobile View Toggle */}
          <div className="flex md:hidden bg-[#070a11] p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setMobileView('SPLIT')}
              className={`px-2 py-0.5 rounded ${mobileView === 'SPLIT' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              Split
            </button>
            <button
              onClick={() => setMobileView('LIVE_ONLY')}
              className={`px-2 py-0.5 rounded ${mobileView === 'LIVE_ONLY' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              Live
            </button>
            <button
              onClick={() => setMobileView('PREDICTION_ONLY')}
              className={`px-2 py-0.5 rounded ${mobileView === 'PREDICTION_ONLY' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              15m AI
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
        
        {/* ================= LEFT PANEL: LIVE MARKET CHART ================= */}
        {(mobileView !== 'PREDICTION_ONLY' || expandedPanel === 'LEFT') && (
          <div className={`p-4 flex flex-col justify-between relative ${expandedPanel === 'RIGHT' ? 'hidden' : ''}`}>
            {/* Panel Bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  Live Market Candlestick Chart
                </span>
                <span className="text-[10px] text-slate-500 font-mono">({timeframe})</span>
              </div>

              {/* Hover Candle OHLC readout */}
              {hoveredCandle && (
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono-numbers">
                  <span className="text-slate-500">{hoveredCandle.timeStr}</span>
                  <span className="text-slate-400">O: <strong className="text-slate-200">{hoveredCandle.open}</strong></span>
                  <span className="text-slate-400">H: <strong className="text-emerald-400">{hoveredCandle.high}</strong></span>
                  <span className="text-slate-400">L: <strong className="text-rose-400">{hoveredCandle.low}</strong></span>
                  <span className="text-slate-400">C: <strong className="text-slate-100">{hoveredCandle.close}</strong></span>
                </div>
              )}
            </div>

            {/* SVG Live Candlestick Canvas */}
            <div className="relative w-full h-[360px] select-none bg-[#070b14]/90 rounded-xl border border-slate-900 overflow-hidden">
              <svg 
                className="w-full h-full cursor-crosshair"
                viewBox={`0 0 600 ${chartHeight}`}
                preserveAspectRatio="none"
                onMouseLeave={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient id="volGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="volRedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map(ratio => {
                  const y = candleAreaHeight * ratio;
                  const priceAtGrid = maxPrice - ratio * (maxPrice - minPrice);
                  return (
                    <g key={ratio}>
                      <line x1="0" y1={y} x2="600" y2={y} stroke="#172033" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="590" y={y - 4} textAnchor="end" fill="#475569" fontSize="9" fontFamily="monospace">
                        ₹{priceAtGrid.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* S/R Lines Overlay */}
                {showSRLevels && srLevels && (
                  <>
                    {/* Resistance Line */}
                    <line
                      x1="0"
                      y1={getY(srLevels.nearestResistance, minPrice, maxPrice)}
                      x2="600"
                      y2={getY(srLevels.nearestResistance, minPrice, maxPrice)}
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.75"
                    />
                    <text
                      x="10"
                      y={getY(srLevels.nearestResistance, minPrice, maxPrice) - 4}
                      fill="#f87171"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      RESISTANCE: ₹{srLevels.nearestResistance}
                    </text>

                    {/* Support Line */}
                    <line
                      x1="0"
                      y1={getY(srLevels.nearestSupport, minPrice, maxPrice)}
                      x2="600"
                      y2={getY(srLevels.nearestSupport, minPrice, maxPrice)}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.75"
                    />
                    <text
                      x="10"
                      y={getY(srLevels.nearestSupport, minPrice, maxPrice) + 12}
                      fill="#34d399"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      SUPPORT: ₹{srLevels.nearestSupport}
                    </text>

                    {/* Intraday High & Low Lines */}
                    <line
                      x1="0"
                      y1={getY(srLevels.intradayHigh, minPrice, maxPrice)}
                      x2="600"
                      y2={getY(srLevels.intradayHigh, minPrice, maxPrice)}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity="0.5"
                    />
                  </>
                )}

                {/* Volume Bars */}
                {showVolume && displayCandles.map((c, i) => {
                  const stepX = 600 / displayCandles.length;
                  const x = i * stepX + stepX * 0.15;
                  const barWidth = stepX * 0.7;
                  const volY = getVolY(c.volume || 100);
                  const isGreen = c.close >= c.open;
                  return (
                    <rect
                      key={`vol-${i}`}
                      x={x}
                      y={volY}
                      width={barWidth}
                      height={chartHeight - volY}
                      fill={isGreen ? 'url(#volGreenGrad)' : 'url(#volRedGrad)'}
                      rx="1"
                    />
                  );
                })}

                {/* Candlesticks */}
                {displayCandles.map((c, i) => {
                  const stepX = 600 / displayCandles.length;
                  const x = i * stepX + stepX * 0.5;
                  const candleWidth = Math.max(3, stepX * 0.7);

                  const openY = getY(c.open, minPrice, maxPrice);
                  const closeY = getY(c.close, minPrice, maxPrice);
                  const highY = getY(c.high, minPrice, maxPrice);
                  const lowY = getY(c.low, minPrice, maxPrice);

                  const isGreen = c.close >= c.open;
                  const color = isGreen ? '#10b981' : '#ef4444';
                  const bodyY = Math.min(openY, closeY);
                  const bodyHeight = Math.max(2, Math.abs(openY - closeY));

                  return (
                    <g 
                      key={`candle-${i}`}
                      onMouseEnter={() => setHoverIndex(i)}
                      className="transition-opacity hover:opacity-80"
                    >
                      {/* Wick */}
                      <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" />
                      {/* Body */}
                      <rect
                        x={x - candleWidth / 2}
                        y={bodyY}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                })}

                {/* Live Current Price Horizontal Line */}
                {displayCandles.length > 0 && (
                  <g>
                    <line
                      x1="0"
                      y1={getY(currentPrice, minPrice, maxPrice)}
                      x2="600"
                      y2={getY(currentPrice, minPrice, maxPrice)}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />
                    <rect
                      x="525"
                      y={getY(currentPrice, minPrice, maxPrice) - 10}
                      width="75"
                      height="20"
                      rx="4"
                      fill="#0284c7"
                    />
                    <text
                      x="562"
                      y={getY(currentPrice, minPrice, maxPrice) + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ₹{currentPrice.toFixed(1)}
                    </text>
                  </g>
                )}

                {/* Crosshair on hover */}
                {hoverIndex !== null && (
                  <g>
                    <line
                      x1={hoverIndex * (600 / displayCandles.length) + (600 / displayCandles.length) * 0.5}
                      y1="0"
                      x2={hoverIndex * (600 / displayCandles.length) + (600 / displayCandles.length) * 0.5}
                      y2={chartHeight}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* Time labels below live chart */}
            <div className="flex justify-between items-center px-1 pt-2 text-[10px] text-slate-500 font-mono">
              <span>{displayCandles[0]?.timeStr || '09:15'}</span>
              <span>{displayCandles[Math.floor(displayCandles.length / 2)]?.timeStr || '12:00'}</span>
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Latest: {displayCandles[displayCandles.length - 1]?.timeStr || '15:30'}
              </span>
            </div>
          </div>
        )}

        {/* ================= RIGHT PANEL: 15-MINUTE ADVANCE PREDICTION CHART ================= */}
        {(mobileView !== 'LIVE_ONLY' || expandedPanel === 'RIGHT') && (
          <div className={`p-4 flex flex-col justify-between relative bg-gradient-to-b from-[#090e1a] to-[#070b14] ${expandedPanel === 'LEFT' ? 'hidden' : ''}`}>
            {/* Panel Bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  15-Minute Advance Prediction Chart
                </span>
                
                {/* Direction pill */}
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                    isUpTrend
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      : isDownTrend
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                      : isSideways
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isUpTrend && <TrendingUp className="w-3 h-3" />}
                  {isDownTrend && <TrendingDown className="w-3 h-3" />}
                  {isSideways && <Minus className="w-3 h-3" />}
                  {prediction?.predictedDirection || 'CALCULATING...'}
                </span>
              </div>

              {prediction && (
                <div className="text-[11px] font-mono-numbers text-slate-400 flex items-center gap-2">
                  <span className="text-slate-500">Confidence:</span>
                  <strong className={`${prediction.confidenceScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {prediction.confidenceScore}%
                  </strong>
                </div>
              )}
            </div>

            {/* SVG Prediction Canvas */}
            <div className="relative w-full h-[360px] select-none bg-[#050811] rounded-xl border border-slate-900 overflow-hidden">
              <svg
                className="w-full h-full cursor-crosshair"
                viewBox={`0 0 600 ${chartHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Uncertainty cone gradient */}
                  <linearGradient id="bullishConeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.05}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.25}/>
                  </linearGradient>
                  <linearGradient id="bearishConeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05}/>
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.25}/>
                  </linearGradient>
                  <linearGradient id="neutralConeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.05}/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map(ratio => {
                  const y = candleAreaHeight * ratio;
                  const priceAtGrid = predMaxPrice - ratio * (predMaxPrice - predMinPrice);
                  return (
                    <g key={`pred-grid-${ratio}`}>
                      <line x1="0" y1={y} x2="600" y2={y} stroke="#172033" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="590" y={y - 4} textAnchor="end" fill="#475569" fontSize="9" fontFamily="monospace">
                        ₹{priceAtGrid.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Divider separating Actual Historical Context vs Future 15m Forecast */}
                <line x1="320" y1="0" x2="320" y2={chartHeight} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6"/>
                <rect x="260" y="8" width="60" height="18" rx="4" fill="#1e293b" opacity="0.9"/>
                <text x="290" y="21" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">ACTUAL</text>

                <rect x="325" y="8" width="105" height="18" rx="4" fill="#0f2b20" stroke="#10b981" strokeWidth="0.8"/>
                <text x="377" y="21" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">15-MIN FORECAST</text>

                {/* Render Last 8 Context Historical Candles (X: 0 to 320) */}
                {contextCandles.map((c, i) => {
                  const stepX = 320 / contextCandles.length;
                  const x = i * stepX + stepX * 0.5;
                  const candleWidth = Math.max(3, stepX * 0.65);

                  const openY = getY(c.open, predMinPrice, predMaxPrice);
                  const closeY = getY(c.close, predMinPrice, predMaxPrice);
                  const highY = getY(c.high, predMinPrice, predMaxPrice);
                  const lowY = getY(c.low, predMinPrice, predMaxPrice);

                  const isGreen = c.close >= c.open;
                  const color = isGreen ? '#10b981' : '#ef4444';
                  const bodyY = Math.min(openY, closeY);
                  const bodyHeight = Math.max(2, Math.abs(openY - closeY));

                  return (
                    <g key={`context-${i}`} opacity="0.85">
                      <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" />
                      <rect
                        x={x - candleWidth / 2}
                        y={bodyY}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                })}

                {/* Uncertainty Range Envelope Polygon for next 15 mins (X: 320 to 580) */}
                {projectedCandles.length > 0 && (
                  (() => {
                    const stepPredX = (580 - 330) / projectedCandles.length;
                    const startY = getY(currentPrice, predMinPrice, predMaxPrice);
                    
                    const upperPoints: string[] = [`320,${startY}`];
                    const lowerPoints: string[] = [`320,${startY}`];

                    projectedCandles.forEach((p, idx) => {
                      const px = 330 + (idx + 1) * stepPredX;
                      const upY = getY(p.upperConfidenceBound, predMinPrice, predMaxPrice);
                      const lowY = getY(p.lowerConfidenceBound, predMinPrice, predMaxPrice);
                      upperPoints.push(`${px},${upY}`);
                      lowerPoints.push(`${px},${lowY}`);
                    });

                    const polygonPath = `${upperPoints.join(' L ')} L ${lowerPoints.reverse().join(' L ')} Z`;
                    const coneGrad = isUpTrend ? 'url(#bullishConeGrad)' : isDownTrend ? 'url(#bearishConeGrad)' : 'url(#neutralConeGrad)';

                    return (
                      <path
                        d={`M ${polygonPath}`}
                        fill={coneGrad}
                        stroke={isUpTrend ? '#10b981' : isDownTrend ? '#ef4444' : '#f59e0b'}
                        strokeWidth="1"
                        strokeDasharray="4,3"
                        opacity="0.7"
                      />
                    );
                  })()
                )}

                {/* Projected Candlesticks in 15m advance window (X: 330 to 580) */}
                {projectedCandles.map((p, idx) => {
                  const stepPredX = (580 - 330) / projectedCandles.length;
                  const x = 330 + idx * stepPredX + stepPredX * 0.5;
                  const candleWidth = Math.max(5, stepPredX * 0.6);

                  const openY = getY(p.projectedOpen, predMinPrice, predMaxPrice);
                  const closeY = getY(p.projectedClose, predMinPrice, predMaxPrice);
                  const highY = getY(p.projectedHigh, predMinPrice, predMaxPrice);
                  const lowY = getY(p.projectedLow, predMinPrice, predMaxPrice);

                  const isGreen = p.projectedClose >= p.projectedOpen;
                  const color = isGreen ? '#00f59b' : '#ff3b5c';
                  const bodyY = Math.min(openY, closeY);
                  const bodyHeight = Math.max(3, Math.abs(openY - closeY));

                  return (
                    <g key={`proj-candle-${idx}`}>
                      {/* Projected Wick with dashed style */}
                      <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="2" strokeDasharray="3,2" />
                      
                      {/* Projected Body with glowing border */}
                      <rect
                        x={x - candleWidth / 2}
                        y={bodyY}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={color}
                        fillOpacity="0.75"
                        stroke={color}
                        strokeWidth="1.5"
                        rx="2"
                      />

                      {/* Time label under future candle */}
                      <text
                        x={x}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        +{idx * 5 + 5}m
                      </text>
                    </g>
                  );
                })}

                {/* Target High & Low Horizontal Lines */}
                {prediction && (
                  <>
                    <line
                      x1="320"
                      y1={getY(prediction.expectedPriceRange.targetHigh, predMinPrice, predMaxPrice)}
                      x2="600"
                      y2={getY(prediction.expectedPriceRange.targetHigh, predMinPrice, predMaxPrice)}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                    />
                    <text
                      x="585"
                      y={getY(prediction.expectedPriceRange.targetHigh, predMinPrice, predMaxPrice) - 4}
                      textAnchor="end"
                      fill="#34d399"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      TARGET HIGH: ₹{prediction.expectedPriceRange.targetHigh}
                    </text>

                    <line
                      x1="320"
                      y1={getY(prediction.expectedPriceRange.targetLow, predMinPrice, predMaxPrice)}
                      x2="600"
                      y2={getY(prediction.expectedPriceRange.targetLow, predMinPrice, predMaxPrice)}
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                    />
                    <text
                      x="585"
                      y={getY(prediction.expectedPriceRange.targetLow, predMinPrice, predMaxPrice) + 12}
                      textAnchor="end"
                      fill="#f87171"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      TARGET LOW: ₹{prediction.expectedPriceRange.targetLow}
                    </text>
                  </>
                )}
              </svg>
            </div>

            {/* Prediction Footer Status */}
            <div className="flex justify-between items-center px-1 pt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3" />
                Valid for next 15 Minutes
              </span>

              {prediction && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Range:</span>
                  <span className="font-mono text-white font-bold">
                    ₹{prediction.expectedPriceRange.targetLow} - ₹{prediction.expectedPriceRange.targetHigh}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
