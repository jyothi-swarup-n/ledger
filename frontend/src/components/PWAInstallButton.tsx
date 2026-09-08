import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone, X } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA app, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'full') {
      return (
        <button
          onClick={install}
          className={`w-full py-2.5 px-3 rounded-xl bg-[#c3f400] text-[#0b0e14] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-brutal-sm hover:brightness-105 active:scale-95 transition-all ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Install App to Phone Home Screen</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#c3f400] text-[#0b0e14] text-[11px] font-bold shadow-brutal-sm hover:brightness-105 active:scale-95 transition-all ${className}`}
        title="Install Kinetic Ledger App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'full' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`w-full py-2.5 px-3 rounded-xl bg-[#141824] border border-[#2a334a] text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:border-[#c3f400] transition-all ${className}`}
          >
            <Smartphone className="w-4 h-4 text-[#c3f400]" />
            <span>Install on iPhone (Home Screen)</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#141824] border border-[#2a334a] text-zinc-300 hover:text-white text-[10px] font-bold ${className}`}
            title="Install on iPhone"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#c3f400]" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#141824] border-2 border-[#c3f400] p-5 shadow-brutal-lg space-y-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#c3f400]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed bg-[#0b0e14] p-3 rounded-xl border border-[#2a334a]">
                <p>
                  1. In Safari, tap the <strong className="text-white">Share</strong> button (box with upward arrow at bottom).
                </p>
                <p>
                  2. Scroll down and tap <strong className="text-[#c3f400]">Add to Home Screen</strong>.
                </p>
                <p>
                  3. Tap <strong className="text-white">Add</strong> in top-right.
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold uppercase"
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
