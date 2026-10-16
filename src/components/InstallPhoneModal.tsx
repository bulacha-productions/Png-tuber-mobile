/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface InstallPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPhoneModal: React.FC<InstallPhoneModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  // App URL accessible on mobile
  const appUrl = 'https://ais-pre-zt73vkt7uxott4jx4a6qdn-126566924651.us-east1.run.app';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Instalar no Celular (Android)</h3>
              <p className="text-[11px] text-slate-400">PWA WebAPK nativo na tela inicial</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* If visited directly on mobile and can install directly */}
          {isInstallable && (
            <div className="bg-indigo-950/60 border border-indigo-700/50 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Navegador Móvel Detectado</span>
              </div>
              <p className="text-xs text-slate-300">
                Você pode instalar o PNGTuber Recorder diretamente agora no seu Android:
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Aplicativo no Android</span>
              </button>
            </div>
          )}

          {/* QR Code & Link Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
            {/* QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-md shrink-0 flex items-center justify-center">
              <QRCodeSVG
                value={appUrl}
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
              <p className="text-xs font-bold text-white">Escaneie com a câmera do celular</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Abra no Google Chrome do Android para ter a experiência completa em tela cheia com microfone e gravação.
              </p>

              {/* Link copy */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 px-3 py-2 rounded-xl flex-1 select-all truncate"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step by Step instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200">Como funciona a instalação no Android:</h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Acesse o link no navegador <strong>Chrome</strong> no seu celular.</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Toque na notificação <strong>"Instalar aplicativo"</strong> ou clique no menu de 3 pontinhos (⋮) no topo e escolha <strong>"Adicionar à tela inicial / Instalar app"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  O Android cria um <strong>aplicativo nativo independente (WebAPK)</strong> com ícone próprio na gaveta de apps, rodando sem barra de endereços.
                </span>
              </div>
            </div>
          </div>

          {/* Android Studio note */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compilar o APK Nativo no Android Studio</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Para compilar o arquivo <code>.apk</code> nativo tradicional do Android com Kotlin e Jetpack Compose, acesse a aba <strong>"Código Android Nativo"</strong> e baixe o projeto zipado. No Android Studio, basta abrir a pasta e clicar em <code>Build &gt; Build APK(s)</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
