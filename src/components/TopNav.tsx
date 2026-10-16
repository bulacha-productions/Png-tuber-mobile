/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTab } from '../types.ts';
import {
  Video,
  User,
  Mic,
  Film,
  Sparkles,
  Layers,
  CircleDot,
  Square,
  Smartphone,
  Github,
} from 'lucide-react';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  onToggleOverlay: () => void;
  onOpenInstallPhone: () => void;
  onOpenGitHubExport: () => void;
  isOverlayActive: boolean;
  recordingDurationFormatted: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  isRecording,
  onToggleRecord,
  onToggleOverlay,
  onOpenInstallPhone,
  onOpenGitHubExport,
  isOverlayActive,
  recordingDurationFormatted,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Video className="w-4 h-4 text-white" />
        </div>
        <span className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap">
          PNGTuber Recorder
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'studio'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Gravação & Tela</span>
        </button>

        <button
          onClick={() => setActiveTab('character')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'character'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Avatar & Sprites</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'audio'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voz & Sensibilidade</span>
        </button>

        <button
          onClick={() => setActiveTab('recordings')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'recordings'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Gravações Salvas</span>
        </button>

        <button
          onClick={() => setActiveTab('premium')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'premium'
              ? 'bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/50 shadow-sm'
              : 'text-[#A9AEC5] hover:text-[#6C63FF] hover:bg-[#1E2640]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Premium</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Overlay Trigger */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          onClick={onOpenGitHubExport}
          title="Exportar Repositório para o GitHub com Workflow de APK"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar GitHub</span>
        </button>

        <button
          onClick={onOpenInstallPhone}
          title="Instalar no Celular (Android)"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 shadow-sm transition-all"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Instalar no Celular</span>
        </button>

        <button
          onClick={onToggleOverlay}
          title={isOverlayActive ? "Ocultar sobreposição flutuante" : "Ativar sobreposição flutuante"}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
            isOverlayActive
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sobreposição Flutuante</span>
        </button>

        <button
          onClick={onToggleRecord}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-md ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Parar ({recordingDurationFormatted})</span>
            </>
          ) : (
            <>
              <CircleDot className="w-3.5 h-3.5" />
              <span>Gravar Tela</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
