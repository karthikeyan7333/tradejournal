import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E676] text-black text-xs font-semibold hover:bg-[#2bfb8d] transition shadow-md active:scale-95"
        title="Install TradeJournal App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#262b32] bg-[#12151a] text-gray-300 text-xs font-medium hover:border-[#00E676] hover:text-white transition"
          title="Install on iPhone"
        >
          <Share2 className="w-3.5 h-3.5 text-[#00E676]" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-[#12151a] border border-[#262b32] p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.svg" alt="TradeJournal" className="w-10 h-10 rounded-xl" />
                <div>
                  <h3 className="text-base font-bold text-white">Install TradeJournal</h3>
                  <p className="text-xs text-gray-400">Install on iPhone / iPad</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-300 mb-6 bg-[#0a0c0f] p-4 rounded-xl border border-[#1e232a]">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1b2129] border border-[#2b333e] text-xs font-bold flex items-center justify-center text-[#00E676]">1</span>
                  <span>Tap the <strong className="text-white">Share</strong> button in Safari's bottom bar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1b2129] border border-[#2b333e] text-xs font-bold flex items-center justify-center text-[#00E676]">2</span>
                  <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1b2129] border border-[#2b333e] text-xs font-bold flex items-center justify-center text-[#00E676]">3</span>
                  <span>Tap <strong className="text-white">Add</strong> in top right.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#00E676] py-2.5 text-sm font-semibold text-black hover:bg-[#2bfb8d] transition active:scale-95"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
