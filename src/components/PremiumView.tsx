/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterConfig, ProSettings } from '../types.ts';
import {
  Sparkles,
  Sliders,
  Cpu,
  Tv,
  Gauge,
  RotateCcw,
  Download,
  Smartphone,
  CheckCircle,
  ShieldCheck,
  Zap,
  PackageCheck,
  ExternalLink,
} from 'lucide-react';

interface PremiumViewProps {
  character: CharacterConfig;
  onUpdateCharacter: (c: CharacterConfig) => void;
  proSettings: ProSettings;
  onUpdateProSettings: React.Dispatch<React.SetStateAction<ProSettings>>;
  onResetProSettings: () => void;
  onOpenGitHubExport: () => void;
  onOpenInstallPhone: () => void;
}

export const PremiumView: React.FC<PremiumViewProps> = ({
  proSettings,
  onUpdateProSettings,
  onResetProSettings,
  onOpenGitHubExport,
  onOpenInstallPhone,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E2640] via-[#161D33] to-[#0B1020] border border-[#6C63FF]/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#6C63FF] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Recursos Pro & Studio
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F5F5FF] tracking-tight">
              Configurações Avançadas de Gravação
            </h2>
            <p className="text-sm text-[#A9AEC5] mt-1 max-w-xl">
              Ajuste resolução, bitrate e aceleração de hardware para obter a melhor fidelidade e desempenho ao vivo no Android ou Web.
            </p>
          </div>

          <button
            onClick={onResetProSettings}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1020]/80 hover:bg-[#1E2640] border border-[#1E2640] text-xs font-semibold text-[#A9AEC5] hover:text-[#F5F5FF] transition-all"
            title="Restaurar padrão desta seção"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar padrão</span>
          </button>
        </div>
      </div>

      {/* Grid of Pro Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Resolução de Saída */}
        <div className="p-6 rounded-2xl bg-[#12182B] border border-[#1E2640] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#6C63FF]/15 text-[#6C63FF]">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5FF]">Resolução de Vídeo</h3>
                <p className="text-xs text-[#A9AEC5]">Qualidade nativa do canvas de gravação</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['720p', '1080p', '1440p'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => onUpdateProSettings((prev) => ({ ...prev, resolution: res }))}
                  className={`py-3 px-2 rounded-xl text-center text-xs font-bold transition-all border ${
                    proSettings.resolution === res
                      ? 'bg-[#6C63FF] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25'
                      : 'bg-[#0B1020] border-[#1E2640] text-[#A9AEC5] hover:text-[#F5F5FF]'
                  }`}
                >
                  <div className="text-sm font-black">{res}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {res === '720p' ? 'HD Rápido' : res === '1080p' ? 'Full HD' : '2K Ultra'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-[#A9AEC5] mt-4 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
            1080p é o padrão recomendado para taxa de quadros e áudio equilibrados.
          </p>
        </div>

        {/* Card 2: Taxa de Quadros (FPS) */}
        <div className="p-6 rounded-2xl bg-[#12182B] border border-[#1E2640] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#6C63FF]/15 text-[#6C63FF]">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5FF]">Taxa de Quadros (FPS)</h3>
                <p className="text-xs text-[#A9AEC5]">Fluidez da animação e da gravação</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([30, 60] as const).map((fps) => (
                <button
                  key={fps}
                  onClick={() => onUpdateProSettings((prev) => ({ ...prev, fps }))}
                  className={`py-3 px-3 rounded-xl text-center text-xs font-bold transition-all border ${
                    proSettings.fps === fps
                      ? 'bg-[#6C63FF] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25'
                      : 'bg-[#0B1020] border-[#1E2640] text-[#A9AEC5] hover:text-[#F5F5FF]'
                  }`}
                >
                  <div className="text-sm font-black">{fps} FPS</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {fps === 30 ? 'Padrão estável' : 'Ultra-fluido'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-[#A9AEC5] mt-4 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FACC15]" />
            60 FPS proporciona movimentos de boca e olhos ultra responsivos.
          </p>
        </div>

        {/* Card 3: Taxas de Bits (Bitrates) */}
        <div className="p-6 rounded-2xl bg-[#12182B] border border-[#1E2640] shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-[#6C63FF]/15 text-[#6C63FF]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5FF]">Bitrates de Áudio & Vídeo</h3>
              <p className="text-xs text-[#A9AEC5]">Fidelidade de compressão do stream</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#F5F5FF]">Bitrate de Vídeo:</span>
                <span className="text-[#6C63FF] font-bold">{proSettings.videoBitrateMbps} Mbps</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="2"
                value={proSettings.videoBitrateMbps}
                onChange={(e) =>
                  onUpdateProSettings((prev) => ({
                    ...prev,
                    videoBitrateMbps: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#6C63FF] bg-[#0B1020] h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#F5F5FF]">Bitrate de Áudio (AAC):</span>
                <span className="text-[#6C63FF] font-bold">{proSettings.audioBitrateKbps} kbps</span>
              </div>
              <input
                type="range"
                min="96"
                max="320"
                step="32"
                value={proSettings.audioBitrateKbps}
                onChange={(e) =>
                  onUpdateProSettings((prev) => ({
                    ...prev,
                    audioBitrateKbps: Number(e.target.value),
                  }))
                }
                className="w-full accent-[#6C63FF] bg-[#0B1020] h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Aceleração por Hardware */}
        <div className="p-6 rounded-2xl bg-[#12182B] border border-[#1E2640] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#6C63FF]/15 text-[#6C63FF]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5FF]">Aceleração por Hardware</h3>
                <p className="text-xs text-[#A9AEC5]">Usa a GPU para renderização e codificação</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0B1020] border border-[#1E2640]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                <span className="text-xs font-bold text-[#F5F5FF]">Codificador GPU H.264</span>
              </div>
              <button
                onClick={() =>
                  onUpdateProSettings((prev) => ({
                    ...prev,
                    hardwareAcceleration: !prev.hardwareAcceleration,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  proSettings.hardwareAcceleration ? 'bg-[#6C63FF]' : 'bg-[#1E2640]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    proSettings.hardwareAcceleration ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[#A9AEC5] mt-4">
            Mantém o uso de CPU baixo durante transmissões longas e jogos pesados.
          </p>
        </div>
      </div>

      {/* Android & Export Integration Center */}
      <div className="p-6 rounded-3xl bg-[#12182B] border border-[#1E2640] shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#F5F5FF] flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#6C63FF]" />
              Instalação Nativa & Exportação do Projeto
            </h3>
            <p className="text-xs text-[#A9AEC5] mt-1">
              Baixe o APK oficial já assinado, acesse o código-fonte compilável para Android Studio ou instale como PWA.
            </p>
          </div>
        </div>

        {/* APK Ready Callout */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#6C63FF]/20 via-[#1E2640] to-[#12182B] border border-[#6C63FF]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/30 shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F5F5FF]">APK Oficial Android (v1.0.0)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Compilado
                </span>
              </div>
              <p className="text-xs text-[#A9AEC5] mt-0.5">
                16.7 MB • Gravação nativa em segundo plano, microfone seguro e overlay flutuante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="/PNGTuber-Recorder.apk"
              download="PNGTuber-Recorder.apk"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5851E0] text-white text-xs font-bold shadow-lg shadow-[#6C63FF]/30 transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Baixar APK</span>
            </a>
            <a
              href="https://github.com/bulacha-productions/Png-tuber-mobile/releases/tag/v1.0.0"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-[#0B1020] hover:bg-[#1E2640] border border-[#1E2640] text-[#A9AEC5] hover:text-[#F5F5FF] transition-colors"
              title="Ver Release Oficial v1.0.0 no GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onOpenInstallPhone}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#1E2640] hover:bg-[#283254] border border-[#6C63FF]/30 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
          >
            <Smartphone className="w-5 h-5 text-[#6C63FF]" />
            <span>Instalar no Celular (PWA)</span>
          </button>
          <button
            onClick={onOpenGitHubExport}
            className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#161D33] hover:bg-[#1E2640] border border-[#1E2640] text-white font-bold text-sm shadow transition-all hover:scale-[1.01]"
          >
            <Download className="w-5 h-5 text-[#6C63FF]" />
            <span>Exportar Projeto Android (ZIP / GitHub)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
