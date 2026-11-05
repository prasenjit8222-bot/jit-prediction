import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Check, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowDownCircle
} from 'lucide-react';

interface FriendlyApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallPwa: () => void;
  deferredPrompt: any;
}

export const FriendlyApkModal: React.FC<FriendlyApkModalProps> = ({
  isOpen,
  onClose,
  onInstallPwa,
  deferredPrompt
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloadStarted(true);
    setActiveStep(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#0b1120] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with JIT Logo */}
        <div className="px-6 py-4 bg-[#0d1629] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 ring-2 ring-emerald-500/50 flex items-center justify-center shrink-0">
              <img 
                src="/jit-logo.png" 
                alt="JIT Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Download JIT PREDICTION App
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono font-bold">
                  All Android 8 - 15+
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Official Jharna Institute of Technology Mobile Terminal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Big Download Button */}
          <div className="space-y-2">
            <a
              href="/downloads/JIT_PREDICTION_Universal.apk"
              download="JIT_PREDICTION_Universal.apk"
              onClick={handleDownload}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>DOWNLOAD JIT_PREDICTION_Universal.apk</span>
              <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded-lg font-mono">1.2 MB Standalone</span>
            </a>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified & Signed (v2 + v3 Scheme)
              </span>
              <span>Works on All Android Brands</span>
            </div>
          </div>

          {/* Quick 1-Tap Chrome WebAPK Option */}
          {deferredPrompt && (
            <div className="p-4 rounded-2xl bg-[#070b14] border border-cyan-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Prefer Instant 1-Tap Install?</span>
                <span className="text-[11px] text-slate-400">Install directly via Chrome without downloading APK file</span>
              </div>
              <button
                onClick={() => { onInstallPwa(); onClose(); }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md"
              >
                1-Tap Install
              </button>
            </div>
          )}

          {/* Easy 3-Step Visual Installation Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Easy 3-Step Installation on Your Phone
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="font-bold text-xs text-white">Download</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Tap the green download button above. The APK file will save to your downloads.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-black font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="font-bold text-xs text-white">Tap Open</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Pull down your notification bar and tap <strong className="text-slate-200">Open</strong> on the downloaded file.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center">
                    3
                  </span>
                  <span className="font-bold text-xs text-white">Allow & Install</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  If prompted, toggle <strong className="text-cyan-400">Allow from this source</strong>, then tap <strong className="text-emerald-400">Install</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Compatibility Details */}
          <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">Universal Android Compatibility:</span>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">Android 15 (API 35)</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">Android 14 (API 34)</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">Android 13 (API 33)</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">Android 12/11/10/9/8</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">All Phone Brands</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0d1629] border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Jharna Institute of Technology</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
