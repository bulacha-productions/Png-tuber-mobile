/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavedRecording } from '../types.ts';
import {
  Film,
  Download,
  Trash2,
  Play,
  Calendar,
  HardDrive,
  Clock,
  X,
} from 'lucide-react';

interface RecordingsListProps {
  recordings: SavedRecording[];
  onDeleteRecording: (id: string) => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onDeleteRecording,
}) => {
  const [playingVideo, setPlayingVideo] = useState<SavedRecording | null>(null);

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = (rec: SavedRecording) => {
    const a = document.createElement('a');
    a.href = rec.url;
    a.download = `${rec.title.replace(/[\s/:]/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Gravações Salvas no Dispositivo</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Vídeos renderizados em 60 FPS com gameplay e avatar PNGTuber sincronizados.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-800/40">
          <span>Total: {recordings.length} vídeos</span>
        </div>
      </div>

      {/* Empty State */}
      {recordings.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-white">Nenhuma gravação encontrada ainda</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Vá até a aba <strong>"Gravação & Tela"</strong>, inicie a gravação e ao finalizar seu vídeo aparecerá aqui para download ou reprodução.
          </p>
        </div>
      )}

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg group hover:border-slate-700 transition-all flex flex-col"
          >
            {/* Thumbnail and Play Overlay */}
            <div
              onClick={() => setPlayingVideo(rec)}
              className="relative aspect-video bg-slate-950 cursor-pointer overflow-hidden flex items-center justify-center group"
            >
              {rec.thumbnailUrl ? (
                <img
                  src={rec.thumbnailUrl}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Film className="w-10 h-10 text-slate-700" />
              )}

              {/* Play Badge */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>{formatDuration(rec.durationMs)}</span>
              </div>
            </div>

            {/* Info and Actions */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{rec.title}</h4>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(rec.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    {formatFileSize(rec.sizeBytes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleDownload(rec)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Vídeo</span>
                </button>
                <button
                  onClick={() => onDeleteRecording(rec.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Excluir gravação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Playback Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white truncate">{playingVideo.title}</h4>
              <button
                onClick={() => setPlayingVideo(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={playingVideo.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 flex items-center justify-between bg-slate-950">
              <div className="text-xs text-slate-400 font-mono">
                Duração: {formatDuration(playingVideo.durationMs)} · Tamanho: {formatFileSize(playingVideo.sizeBytes)}
              </div>
              <button
                onClick={() => handleDownload(playingVideo)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar no Celular / PC</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
