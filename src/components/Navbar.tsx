import React from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  Bell, 
  Volume2, 
  VolumeX, 
  Settings, 
  Smartphone, 
  BarChart2, 
  Compass, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  Download
} from 'lucide-react';
import type { MarketStatus } from '../types.js';

interface NavbarProps {
  activeTab: 'DASHBOARD' | 'NIFTY' | 'BANKNIFTY' | 'AI_ANALYSIS' | 'ACCURACY' | 'ANDROID' | 'SETTINGS';
  onTabChange: (tab: 'DASHBOARD' | 'NIFTY' | 'BANKNIFTY' | 'AI_ANALYSIS' | 'ACCURACY' | 'ANDROID' | 'SETTINGS') => void;
  marketStatus: MarketStatus | null;
  isOnline: boolean;
  lastUpdated: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  unreadAlertsCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
  userMode: 'FRIENDLY' | 'PRO';
  onToggleUserMode: () => void;
  onOpenApkModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  marketStatus,
  isOnline,
  lastUpdated,
  soundEnabled,
  onToggleSound,
  unreadAlertsCount,
  onOpenNotifications,
  onOpenSettings,
  deferredPrompt,
  onInstallPwa,
  userMode,
  onToggleUserMode,
  onOpenApkModal
}) => {
  const isMarketOpen = marketStatus?.isOpen;
  const isPreMarket = marketStatus?.isPreMarket;

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo with Official JIT Jharna Institute of Technology Emblem */}
        <div 
          onClick={() => onTabChange('DASHBOARD')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-lg shadow-cyan-950/60 ring-2 ring-emerald-500/50 transition-transform group-hover:scale-105 flex items-center justify-center overflow-hidden">
            <img 
              src="/jit-logo.png" 
              alt="JIT - Jharna Institute of Technology Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-white">JIT PREDICTION</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono">
                AI 15M
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Jharna Institute of Technology • NIFTY 50 & BANK NIFTY
            </div>
          </div>
        </div>

        {/* Status Badges: Market Status, Internet Connection, Clock */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Market Status Badge */}
          {marketStatus && (
            <div
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 font-bold text-[11px] ${
                isMarketOpen
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : isPreMarket
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title={marketStatus.message}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isMarketOpen ? 'bg-emerald-400 animate-ping' : isPreMarket ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>
                {isMarketOpen
                  ? 'NSE LIVE (09:15-15:30 IST)'
                  : isPreMarket
                  ? 'PRE-MARKET ACTIVE'
                  : 'NSE CLOSED (OFFICIAL)'}
              </span>
            </div>
          )}

          {/* Internet Status */}
          <div
            className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[11px] font-mono ${
              isOnline
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-bounce'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Offline (Reconnecting...)</span>
              </>
            )}
          </div>

          {/* Last Updated Tick Time */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tick: {lastUpdated || 'Streaming'}</span>
          </div>

          {/* Audio Alert Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-slate-900 border-slate-700 text-cyan-400'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 relative transition-all cursor-pointer"
            title="Trading Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Friendly vs Pro Mode Switcher */}
          <button
            onClick={onToggleUserMode}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              userMode === 'FRIENDLY'
                ? 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
            title="Switch between Friendly Easy View and Pro Terminal Charts"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{userMode === 'FRIENDLY' ? 'Friendly View' : 'Pro Charts'}</span>
          </button>

          {/* Direct Universal APK Download Button with Guide Trigger */}
          <button
            onClick={onOpenApkModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform hover:scale-105"
            title="Download JIT PREDICTION APK for all Android versions"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Download APK</span>
            <span className="hidden md:inline text-[9px] bg-slate-950/25 px-1.5 py-0.5 rounded-md font-mono">v1.0</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-t border-slate-800/60 bg-[#060912]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1 text-xs">
          <button
            onClick={() => onTabChange('DASHBOARD')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'DASHBOARD'
                ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Dual Dashboard
          </button>

          <button
            onClick={() => onTabChange('NIFTY')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'NIFTY'
                ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            NIFTY 50
          </button>

          <button
            onClick={() => onTabChange('BANKNIFTY')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'BANKNIFTY'
                ? 'bg-purple-600/20 border border-purple-500/40 text-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            BANK NIFTY
          </button>

          <button
            onClick={() => onTabChange('AI_ANALYSIS')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'AI_ANALYSIS'
                ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Analysis
          </button>

          <button
            onClick={() => onTabChange('ACCURACY')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'ACCURACY'
                ? 'bg-amber-600/20 border border-amber-500/40 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Accuracy & Backtesting
          </button>

          <button
            onClick={() => onTabChange('ANDROID')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'ANDROID'
                ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            Android APK Hub
          </button>
        </div>
      </div>
    </header>
  );
};
