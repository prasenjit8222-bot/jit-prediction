import React from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  Sliders, 
  ShieldCheck, 
  Check, 
  Database,
  Radio,
  Clock
} from 'lucide-react';
import type { NotificationSettings } from '../types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: Partial<NotificationSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#0b1120] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1527] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Trading Terminal Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* 1. Smart Notifications Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Smart Notification Triggers
            </h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">New Bullish Prediction</span>
                  <span className="text-[11px] text-slate-500">Alert when a 15-minute UP setup triggers</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.bullishAlerts}
                  onChange={e => onUpdateSettings({ bullishAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">New Bearish Prediction</span>
                  <span className="text-[11px] text-slate-500">Alert when a 15-minute DOWN setup triggers</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.bearishAlerts}
                  onChange={e => onUpdateSettings({ bearishAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Major Trend Reversals (CHoCH)</span>
                  <span className="text-[11px] text-slate-500">Alert on structural market character changes</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.trendReversals}
                  onChange={e => onUpdateSettings({ trendReversals: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Breakouts & Break of Structure (BOS)</span>
                  <span className="text-[11px] text-slate-500">Notify on key pivot level breaches</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.breakouts}
                  onChange={e => onUpdateSettings({ breakouts: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Market Opening & Closing Bells</span>
                  <span className="text-[11px] text-slate-500">09:15 AM Open and 03:30 PM Close announcements</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.marketOpenClose}
                  onChange={e => onUpdateSettings({ marketOpenClose: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* 2. Confidence Filter Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Minimum Confidence Threshold
              </h4>
              <span className="font-bold font-mono text-cyan-400 text-sm">
                {settings.minConfidence}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              step="5"
              value={settings.minConfidence}
              onChange={e => onUpdateSettings({ minConfidence: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>50% (All signals)</span>
              <span>70% (Balanced)</span>
              <span>85% (High Conviction Only)</span>
            </div>
          </div>

          {/* 3. Audio & Tones */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              Audio Feed
            </h4>
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#070b14] border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-slate-200 block">Sound FX & Audio Beeps</span>
                <span className="text-[11px] text-slate-500">Chime on bullish/bearish 15m advance setups</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>

          {/* 4. Licensed Provider Details */}
          <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <Database className="w-4 h-4 text-cyan-400" />
              NSE Real-Time Data Connection
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Feed connected to licensed NSE data stream via low-latency WebSocket. During closed market hours (weekends/evenings), the platform displays official closing session historical candles.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0d1527] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
