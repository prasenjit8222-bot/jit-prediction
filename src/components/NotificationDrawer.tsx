import React from 'react';
import { 
  X, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCheck, 
  Clock,
  Sparkles
} from 'lucide-react';
import type { AppNotification } from '../types.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkAsRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-[#0b1120] border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0d1527] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Market Intelligence Alerts</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {notifications.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer mr-2"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              No active alerts yet. JIT PREDICTION will alert when a high-probability 15-minute setup triggers.
            </div>
          ) : (
            notifications.map((alert) => {
              const time = new Date(alert.timestamp);
              const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
              const isBullish = alert.type === 'BULLISH_SIGNAL';
              const isBearish = alert.type === 'BEARISH_SIGNAL';

              return (
                <div
                  key={alert.id}
                  onClick={() => onMarkAsRead(alert.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    alert.read
                      ? 'bg-[#070b14]/70 border-slate-800/60 opacity-70'
                      : 'bg-[#090e1c] border-slate-700/80 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      {isBullish ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : isBearish ? (
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                      )}
                      <span className={isBullish ? 'text-emerald-300' : isBearish ? 'text-rose-300' : 'text-cyan-300'}>
                        {alert.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{timeStr}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="uppercase">{alert.symbol}</span>
                    {!alert.read && <span className="text-cyan-400 font-bold">• New</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
