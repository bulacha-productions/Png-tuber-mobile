/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AudioSettings } from '../types.ts';
import { Mic, MicOff, Volume2, Sliders, Info } from 'lucide-react';

interface AudioMeterProps {
  settings: AudioSettings;
  onToggleMic: () => void;
  onThresholdChange: (val: number) => void;
  onGainChange: (val: number) => void;
  onSmoothingChange: (val: number) => void;
  micError: string | null;
}

export const AudioMeter: React.FC<AudioMeterProps> = ({
  settings,
  onToggleMic,
  onThresholdChange,
  onGainChange,
  onSmoothingChange,
  micError,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Detecção de Voz por Microfone</h3>
          </div>
          <p className="text-xs text-slate-400">
            Processamento em tempo real por intensidade (sem envio para nuvem ou IA externa).
          </p>
        </div>

        <button
          onClick={onToggleMic}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto ${
            settings.enabled
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
          }`}
        >
          {settings.enabled ? (
            <>
              <MicOff className="w-4 h-4 text-rose-400" />
              <span>Desativar Microfone</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-white" />
              <span>Ativar Microfone</span>
            </>
          )}
        </button>
      </div>

      {micError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{micError}</span>
        </div>
      )}

      {/* Real-time Meter Display */}
      <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Intensidade do Som</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-300 font-semibold">{settings.currentVolume}%</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                settings.isSpeaking
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.isSpeaking ? 'Falando (Boca Aberta)' : 'Repouso (Boca Fechada)'}
            </span>
          </div>
        </div>

        {/* Progress Bar with Threshold Marker */}
        <div className="relative w-full h-5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          {/* Level Fill */}
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              settings.isSpeaking
                ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 shadow-sm shadow-emerald-400/30'
                : 'bg-slate-700'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, settings.currentVolume))}%` }}
          />

          {/* Threshold marker needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            style={{ left: `${settings.threshold}%` }}
          />
          <div
            className="absolute -top-1 w-2 h-2 -ml-1 bg-amber-400 rotate-45 z-10"
            style={{ left: `${settings.threshold}%` }}
            title={`Limiar de ativação: ${settings.threshold}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>0% Silêncio</span>
          <span className="text-amber-400">Limiar: {settings.threshold}%</span>
          <span>100% Máximo</span>
        </div>
      </div>

      {/* Calibration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Threshold Slider */}
        <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sensibilidade / Limiar</span>
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">{settings.threshold}%</span>
          </div>
          <input
            type="range"
            min={4}
            max={60}
            step={1}
            value={settings.threshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <p className="text-[10px] text-slate-400">
            Valores menores detectam sussurros; valores maiores ignoram ruído ambiente.
          </p>
        </div>

        {/* Gain Boost */}
        <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ganho de Volume</span>
            </label>
            <span className="text-xs font-mono font-bold text-indigo-300">{settings.gain.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={4.0}
            step={0.1}
            value={settings.gain}
            onChange={(e) => onGainChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
          <p className="text-[10px] text-slate-400">
            Amplifica o sinal do microfone se sua voz for baixa no celular.
          </p>
        </div>

        {/* Hold / Smoothing */}
        <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Suavização de Boca</span>
            </label>
            <span className="text-xs font-mono font-bold text-violet-300">{settings.smoothing}ms</span>
          </div>
          <input
            type="range"
            min={60}
            max={350}
            step={10}
            value={settings.smoothing}
            onChange={(e) => onSmoothingChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
          />
          <p className="text-[10px] text-slate-400">
            Tempo que a boca fica aberta para evitar tremores rápidos entre sílabas.
          </p>
        </div>
      </div>
    </div>
  );
};
