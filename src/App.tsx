import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Navbar 
} from './components/Navbar.js';
import { 
  DualChartPanel 
} from './components/DualChartPanel.js';
import { 
  PredictionCard 
} from './components/PredictionCard.js';
import { 
  AdvancedAnalysisSection 
} from './components/AdvancedAnalysisSection.js';
import { 
  AccuracyTrackerSection 
} from './components/AccuracyTrackerSection.js';
import { 
  AndroidCenter 
} from './components/AndroidCenter.js';
import { 
  SettingsModal 
} from './components/SettingsModal.js';
import { 
  NotificationDrawer 
} from './components/NotificationDrawer.js';
import { 
  UserFriendlyGuide 
} from './components/UserFriendlyGuide.js';
import { 
  FriendlyApkModal 
} from './components/FriendlyApkModal.js';
import { 
  IntradayTradingSection 
} from './components/IntradayTradingSection.js';
import { 
  OpenInterestSection 
} from './components/OpenInterestSection.js';
import { 
  MarketDepthSection 
} from './components/MarketDepthSection.js';
import { 
  VolumeTrendRiskWidget 
} from './components/VolumeTrendRiskWidget.js';
import { 
  playBullishAlert, 
  playBearishAlert, 
  playTickChime 
} from './utils/audio.js';
import { 
  generateLocalMarketFeed, 
  getLocalMarketStatus 
} from './utils/localMarketEngine.js';
import { 
  fetchLiveInternetMarketFeed 
} from './utils/liveMarketFetcher.js';
import type { 
  Candle, 
  TechnicalIndicators, 
  SupportResistanceLevels, 
  PriceActionAnalysis, 
  PredictionResult, 
  MarketMeta, 
  MarketStatus, 
  AppNotification, 
  NotificationSettings,
  OpenInterestAnalysis,
  MarketDepthData
} from './types.js';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'NIFTY' | 'BANKNIFTY' | 'AI_ANALYSIS' | 'ACCURACY' | 'ANDROID' | 'SETTINGS'>('DASHBOARD');
  const [activeSymbol, setActiveSymbol] = useState<'^NSEI' | '^NSEBANK'>('^NSEI');
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '5m' | '15m'>('5m');

  // Network & Market States
  const [isOnline, setIsOnline] = useState(true);
  const [lastTickTime, setLastTickTime] = useState<string>('');

  // Pre-seed with initial feed so initial render is instantaneous and never blank
  const initialFeed = useMemo(() => generateLocalMarketFeed('^NSEI', '5m'), []);

  // Market Data Stores for NIFTY 50 and BANK NIFTY
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(initialFeed.marketStatus);
  const [candles, setCandles] = useState<Candle[]>(initialFeed.candles);
  const [meta, setMeta] = useState<MarketMeta | null>(initialFeed.meta);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(initialFeed.indicators);
  const [srLevels, setSrLevels] = useState<SupportResistanceLevels | null>(initialFeed.srLevels);
  const [priceAction, setPriceAction] = useState<PriceActionAnalysis | null>(initialFeed.priceAction);
  const [prediction, setPrediction] = useState<PredictionResult | null>(initialFeed.prediction);
  const [oiAnalysis, setOiAnalysis] = useState<OpenInterestAnalysis | null>(initialFeed.oiAnalysis || null);
  const [marketDepth, setMarketDepth] = useState<MarketDepthData | null>(initialFeed.marketDepth || null);

  // Secondary quote cache for quick switcher
  const [niftyQuote, setNiftyQuote] = useState<MarketMeta | null>(initialFeed.meta);
  const [bankNiftyQuote, setBankNiftyQuote] = useState<MarketMeta | null>(null);

  // Settings & Notifications
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-init-1',
      timestamp: Date.now() - 5 * 60 * 1000,
      type: 'SYSTEM',
      title: 'NSE Terminal Initialized',
      message: 'JIT PREDICTION live data engine connected to official NSE index feeds.',
      symbol: '^NSEI',
      read: false
    }
  ]);
  const [settings, setSettings] = useState<NotificationSettings>({
    bullishAlerts: true,
    bearishAlerts: true,
    trendReversals: true,
    breakouts: true,
    srBreaks: true,
    marketOpenClose: true,
    soundEnabled: true,
    minConfidence: 65
  });

  // PWA Install prompt & UI Mode
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [userMode, setUserMode] = useState<'FRIENDLY' | 'PRO'>('FRIENDLY');
  const [apkModalOpen, setApkModalOpen] = useState(false);

  // Track previous prediction direction to trigger audio and notifications
  const prevPredictionRef = useRef<string | null>(null);

  // Synchronize Tab with Symbol
  useEffect(() => {
    if (activeTab === 'NIFTY') {
      setActiveSymbol('^NSEI');
    } else if (activeTab === 'BANKNIFTY') {
      setActiveSymbol('^NSEBANK');
    }
  }, [activeTab]);

  // Network online/offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ensure all stale service workers and caches are purged
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.unregister();
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }

    // Capture beforeinstallprompt for Android APK installation
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // State to track if live internet feed is active
  const [isLiveInternetFeed, setIsLiveInternetFeed] = useState<boolean>(true);

  // Fetch full market feed with real live internet connection (works on Web, PWA, and Android APK)
  const loadMarketFeed = useCallback(async (sym: '^NSEI' | '^NSEBANK', tf: string) => {
    try {
      // 1. Fetch real, exact live market data directly from internet feed
      const data = await fetchLiveInternetMarketFeed(sym, tf);
      if (data && data.candles && data.candles.length > 0) {
        setCandles(data.candles || []);
        setMeta(data.meta || null);
        setIndicators(data.indicators || null);
        setSrLevels(data.srLevels || null);
        setPriceAction(data.priceAction || null);
        setMarketStatus(data.marketStatus || null);
        if (data.oiAnalysis) setOiAnalysis(data.oiAnalysis);
        if (data.marketDepth) setMarketDepth(data.marketDepth);
        setIsLiveInternetFeed(true);

        const newPred: PredictionResult = data.prediction;
        setPrediction(newPred);

        // Update clock tick
        const now = new Date();
        setLastTickTime(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );

        // Check if new directional signal fired
        if (newPred && newPred.predictedDirection !== prevPredictionRef.current) {
          prevPredictionRef.current = newPred.predictedDirection;

          if (newPred.predictedDirection === 'UP' && settings.bullishAlerts && newPred.confidenceScore >= settings.minConfidence) {
            if (settings.soundEnabled) playBullishAlert();
            addNotification({
              type: 'BULLISH_SIGNAL',
              title: `${newPred.symbolName} Bullish 15M Signal`,
              message: `Live Internet Signal: High probability upside target ₹${newPred.expectedPriceRange.targetHigh} (${newPred.confidenceScore}% confidence).`,
              symbol: newPred.symbol
            });
          } else if (newPred.predictedDirection === 'DOWN' && settings.bearishAlerts && newPred.confidenceScore >= settings.minConfidence) {
            if (settings.soundEnabled) playBearishAlert();
            addNotification({
              type: 'BEARISH_SIGNAL',
              title: `${newPred.symbolName} Bearish 15M Signal`,
              message: `Live Internet Signal: High probability downside target ₹${newPred.expectedPriceRange.targetLow} (${newPred.confidenceScore}% confidence).`,
              symbol: newPred.symbol
            });
          }
        }
        return;
      }
    } catch (err) {
      console.warn('Live internet fetch failed, checking fallback:', err);
    }

    // 2. Offline fallback (only used if device has zero internet connectivity)
    setIsLiveInternetFeed(false);
    const local = generateLocalMarketFeed(sym, tf);
    setCandles(local.candles);
    setMeta(local.meta);
    setIndicators(local.indicators);
    setSrLevels(local.srLevels);
    setPriceAction(local.priceAction);
    setMarketStatus(local.marketStatus);
    setPrediction(local.prediction);
    if (local.oiAnalysis) setOiAnalysis(local.oiAnalysis);
    if (local.marketDepth) setMarketDepth(local.marketDepth);

    const now = new Date();
    setLastTickTime(
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    );
  }, [settings]);

  // Periodic polling & background quotes fetch directly from internet
  useEffect(() => {
    loadMarketFeed(activeSymbol, timeframe);

    const interval = setInterval(() => {
      loadMarketFeed(activeSymbol, timeframe);
    }, 4000);

    // Fetch both quotes for quick switcher from live internet
    const quotesInterval = setInterval(async () => {
      try {
        const [nData, bData] = await Promise.all([
          fetchLiveInternetMarketFeed('^NSEI', '5m').catch(() => null),
          fetchLiveInternetMarketFeed('^NSEBANK', '5m').catch(() => null)
        ]);
        if (nData?.meta) setNiftyQuote(nData.meta);
        if (bData?.meta) setBankNiftyQuote(bData.meta);
      } catch {
        // Fallback for completely offline devices
        const nLocal = generateLocalMarketFeed('^NSEI', '5m');
        const bLocal = generateLocalMarketFeed('^NSEBANK', '5m');
        setNiftyQuote(nLocal.meta);
        setBankNiftyQuote(bLocal.meta);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(quotesInterval);
    };
  }, [activeSymbol, timeframe, loadMarketFeed]);



  // Notification helper
  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const item: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [item, ...prev].slice(0, 30));

    // Browser Notification API if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notif.title, {
        body: notif.message,
        icon: '/icons/icon-192.svg'
      });
    }
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const currentPrice = meta?.regularMarketPrice || 0;
  const priceChange = meta?.regularMarketChange || 0;
  const priceChangePercent = meta?.regularMarketChangePercent || 0;
  const symbolName = activeSymbol === '^NSEI' ? 'NIFTY 50' : 'BANK NIFTY';
  const dataStatus = meta?.dataStatus || 'LIVE';
  const unreadAlertsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        marketStatus={marketStatus}
        isOnline={isOnline}
        lastUpdated={lastTickTime}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
        unreadAlertsCount={unreadAlertsCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
        userMode={userMode}
        onToggleUserMode={() => setUserMode(m => m === 'FRIENDLY' ? 'PRO' : 'FRIENDLY')}
        onOpenApkModal={() => setApkModalOpen(true)}
      />

      {/* Quick Index Switcher Bar */}
      <div className="bg-[#0a0f1d] border-b border-slate-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Index Selector Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 hidden sm:inline">
              SELECT INDEX:
            </span>

            {/* NIFTY 50 Pill */}
            <button
              onClick={() => setActiveSymbol('^NSEI')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                activeSymbol === '^NSEI'
                  ? 'bg-blue-950/80 border-blue-500/50 text-white shadow-md'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">NIFTY 50</span>
              {niftyQuote && (
                <span className="font-mono-numbers text-slate-300">
                  ₹{niftyQuote.regularMarketPrice.toLocaleString('en-IN')}
                </span>
              )}
              {niftyQuote && (
                <span className={`text-[10px] font-mono ${niftyQuote.regularMarketChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {niftyQuote.regularMarketChange >= 0 ? '+' : ''}{niftyQuote.regularMarketChangePercent.toFixed(2)}%
                </span>
              )}
            </button>

            {/* BANK NIFTY Pill */}
            <button
              onClick={() => setActiveSymbol('^NSEBANK')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                activeSymbol === '^NSEBANK'
                  ? 'bg-purple-950/80 border-purple-500/50 text-white shadow-md'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-bold">BANK NIFTY</span>
              {bankNiftyQuote && (
                <span className="font-mono-numbers text-slate-300">
                  ₹{bankNiftyQuote.regularMarketPrice.toLocaleString('en-IN')}
                </span>
              )}
              {bankNiftyQuote && (
                <span className={`text-[10px] font-mono ${bankNiftyQuote.regularMarketChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {bankNiftyQuote.regularMarketChange >= 0 ? '+' : ''}{bankNiftyQuote.regularMarketChangePercent.toFixed(2)}%
                </span>
              )}
            </button>
          </div>

          {/* Real Live Internet Connection Status */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold flex items-center gap-1.5 shadow-sm ${
              isLiveInternetFeed 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-950 text-amber-400 border border-amber-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLiveInternetFeed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isLiveInternetFeed ? 'LIVE INTERNET NSE DATA' : 'OFFLINE MODE'}
            </span>
            <span className="hidden md:inline text-slate-500 text-[10px] font-mono">
              NSE Hours: 09:15 - 15:30 IST
            </span>
          </div>
        </div>
      </div>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1 space-y-6">
        {/* Quick Android APK Download & Institution Banner */}
        <div className="bg-gradient-to-r from-[#0d1629] via-[#091124] to-[#070b14] border border-cyan-500/20 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md ring-2 ring-emerald-500/40 flex items-center justify-center shrink-0">
              <img 
                src="/jit-logo.png" 
                alt="JIT Jharna Institute of Technology" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">JIT PREDICTION Android APK</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  Android 8 - 15+
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Jharna Institute of Technology Quantitative Indian Market Terminal • Live 15m Forecasts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/downloads/JIT_PREDICTION_Universal.apk"
              download="JIT_PREDICTION_Universal.apk"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105 cursor-pointer"
            >
              <span>Download APK</span>
              <span className="text-[10px] font-mono bg-slate-950/20 px-1 py-0.5 rounded">1.2 MB Standalone</span>
            </a>

            <button
              onClick={() => setActiveTab('ANDROID')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-bold transition-all cursor-pointer"
            >
              APK Hub
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD / NIFTY / BANK NIFTY */}
        {(activeTab === 'DASHBOARD' || activeTab === 'NIFTY' || activeTab === 'BANKNIFTY') && (
          <div className="space-y-6">
            {/* 1. Main Dual Synchronized Chart Panels (Left: Live / Right: 15m Forecast) */}
            <DualChartPanel
              symbol={activeSymbol}
              symbolName={symbolName}
              candles={candles}
              projectedCandles={prediction?.projectedPath || []}
              srLevels={srLevels || {
                previousDayHigh: 0,
                previousDayLow: 0,
                previousDayClose: 0,
                intradayHigh: 0,
                intradayLow: 0,
                classicPivots: { pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 },
                fibonacciPivots: { pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 },
                dynamicSupport: [],
                dynamicResistance: [],
                nearestSupport: 0,
                nearestResistance: 0
              }}
              prediction={prediction}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              currentPrice={currentPrice}
              priceChange={priceChange}
              priceChangePercent={priceChangePercent}
              dataStatus={dataStatus}
              isLive={marketStatus?.isOpen || false}
            />

            {/* INTRADAY TRADING SECTION - Live 4 Trading Levels: Entry, Target, Stop Loss, Exit */}
            <IntradayTradingSection
              symbol={activeSymbol}
              symbolName={symbolName}
              candles={candles}
              currentPrice={currentPrice}
              indicators={indicators}
              srLevels={srLevels}
              priceAction={priceAction}
              prediction={prediction}
              lastUpdatedTime={lastTickTime}
              isLive={marketStatus?.isOpen || false}
            />

            {/* 2. Simplified Plain-English Trading Action Guide */}
            <UserFriendlyGuide
              prediction={prediction}
              indicators={indicators}
              srLevels={srLevels}
              currentPrice={currentPrice}
              symbolName={symbolName}
              onOpenAndroidHub={() => setActiveTab('ANDROID')}
            />

            {/* 3. 15-Minute Advance Prediction Dashboard Panel */}
            <PredictionCard
              prediction={prediction}
              srLevels={srLevels}
              currentPrice={currentPrice}
            />

            {/* 4. OI (OPEN INTEREST) ANALYSIS SECTION */}
            <OpenInterestSection
              symbol={activeSymbol}
              symbolName={symbolName}
              currentPrice={currentPrice}
              oiAnalysis={oiAnalysis}
              lastUpdatedTime={lastTickTime}
              isLive={marketStatus?.isOpen || false}
            />

            {/* 5. REAL-TIME MARKET DEPTH & ORDER BOOK SECTION */}
            <MarketDepthSection
              symbol={activeSymbol}
              symbolName={symbolName}
              currentPrice={currentPrice}
              marketDepth={marketDepth}
              lastUpdatedTime={lastTickTime}
              isLive={marketStatus?.isOpen || false}
            />

            {/* 6. VOLUME TRACKING, TREND DIRECTION & RISK ASSESSMENT WIDGET */}
            <VolumeTrendRiskWidget
              symbol={activeSymbol}
              symbolName={symbolName}
              currentPrice={currentPrice}
              marketDepth={marketDepth}
              indicators={indicators}
              candles={candles}
              prediction={prediction}
              lastUpdatedTime={lastTickTime}
              isLive={marketStatus?.isOpen || false}
            />

            {/* 7. Advanced Quantitative Market Analysis */}
            <AdvancedAnalysisSection
              symbol={activeSymbol}
              symbolName={symbolName}
              indicators={indicators}
              srLevels={srLevels}
              priceAction={priceAction}
              prediction={prediction}
              currentPrice={currentPrice}
            />
          </div>
        )}

        {/* TAB 2: DEDICATED AI ANALYSIS */}
        {activeTab === 'AI_ANALYSIS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white">
                Deep Quantitative & Gemini AI Market Analysis
              </h2>
            </div>
            <AdvancedAnalysisSection
              symbol={activeSymbol}
              symbolName={symbolName}
              indicators={indicators}
              srLevels={srLevels}
              priceAction={priceAction}
              prediction={prediction}
              currentPrice={currentPrice}
            />
          </div>
        )}

        {/* TAB 3: ACCURACY & BACKTESTING */}
        {activeTab === 'ACCURACY' && (
          <AccuracyTrackerSection />
        )}

        {/* TAB 4: ANDROID APK HUB */}
        {activeTab === 'ANDROID' && (
          <AndroidCenter
            onInstallPwa={handleInstallPwa}
            deferredPrompt={deferredPrompt}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newS) => setSettings(s => ({ ...s, ...newS }))}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
        onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
      />

      {/* Friendly Android APK Download & Installation Modal */}
      <FriendlyApkModal
        isOpen={apkModalOpen}
        onClose={() => setApkModalOpen(false)}
        onInstallPwa={handleInstallPwa}
        deferredPrompt={deferredPrompt}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#060912] py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">JIT PREDICTION</span>
            <span>•</span>
            <span>Institutional Indian Market Terminal</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Compliant Indian market timings (09:15 - 15:30 IST) • Zero look-ahead walk-forward forecasting
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            v1.0.0 Android APK & Web Terminal
          </div>
        </div>
      </footer>
    </div>
  );
}
