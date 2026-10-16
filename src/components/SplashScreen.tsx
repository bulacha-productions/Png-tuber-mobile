/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Elegant intro < 1s: starts fading out at 750ms and dismisses at 950ms
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onDismiss, 200);
    }, 750);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1020] cursor-pointer transition-opacity duration-200 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-pulse">
        {/* Official App Icon */}
        <div className="relative w-24 h-24 mb-4 rounded-3xl overflow-hidden shadow-2xl border-2 border-[#6C63FF]/30 p-1 bg-gradient-to-br from-[#12182B] to-[#0B1020]">
          <img
            src="/icon.svg"
            alt="PNGTuber Recorder"
            className="w-full h-full object-contain"
          />
        </div>

        {/* App Title */}
        <h1 className="text-2xl font-black tracking-tight text-[#F5F5FF] flex items-center gap-1.5">
          <span>PNGTuber</span>
          <span className="text-[#6C63FF]">Recorder</span>
        </h1>
        <p className="text-xs text-[#A9AEC5] mt-1 font-medium">
          Gravação de tela com Avatar animado
        </p>
      </div>

      <div className="absolute bottom-6 text-[10px] text-[#A9AEC5]/60 font-medium">
        Toque em qualquer lugar para pular
      </div>
    </div>
  );
};
