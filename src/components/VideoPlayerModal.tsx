/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavedRecording } from '../types.ts';
import {
  X,
  Play,
  Download,
  Share2,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';

interface VideoPlayerModalProps {
  recording: SavedRecording | null;
  onClose: () => void;
  onRename: (rec: SavedRecording) => void;
  onDelete: (id: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  recording,
  onClose,
  onRename,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!recording) return null;

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
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleShare = async () => {
    if (navigator.share && recording.blob) {
      try {
        const file = new File([recording.blob], `${recording.title}.mp4`, {
          type: 'video/mp4',
        });
        await navigator.share({
          title: recording.title,
          text: 'Vídeo gravado com PNGTuber Recorder',
          files: [file],
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleDownload();
        }
      }
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `${recording.title || 'gravacao'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = () => {
    onDelete(recording.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#12182B] rounded-3xl border border-[#1E2640] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2640] bg-[#0B1020]/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF]">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5FF] truncate max-w-sm">
                {recording.title}
              </h3>
              <p className="text-xs text-[#A9AEC5]">Reprodução de Gravação</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A9AEC5] hover:text-[#F5F5FF] hover:bg-[#1E2640] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          <video
            src={recording.url}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Metadata & Actions Bar */}
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[#0B1020] border border-[#1E2640] text-xs">
            <div className="flex items-center gap-2 text-[#A9AEC5]">
              <Clock className="w-4 h-4 text-[#6C63FF]" />
              <span>Duração: <strong className="text-[#F5F5FF]">{formatDuration(recording.durationMs)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-[#A9AEC5]">
              <Calendar className="w-4 h-4 text-[#6C63FF]" />
              <span>{new Date(recording.timestamp).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2 text-[#A9AEC5]">
              <HardDrive className="w-4 h-4 text-[#6C63FF]" />
              <span>{formatFileSize(recording.sizeBytes)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5851E0] text-white text-xs font-bold transition-all shadow-md shadow-[#6C63FF]/20"
              >
                <Download className="w-4 h-4" />
                <span>Salvar / Baixar MP4</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1E2640] hover:bg-[#283254] text-[#F5F5FF] text-xs font-semibold transition-all"
                title="Compartilhar vídeo"
              >
                <Share2 className="w-4 h-4 text-[#6C63FF]" />
                <span>Compartilhar</span>
              </button>

              <button
                onClick={() => {
                  onRename(recording);
                  onClose();
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1E2640] hover:bg-[#283254] text-[#F5F5FF] text-xs font-semibold transition-all"
                title="Renomear vídeo"
              >
                <Edit3 className="w-4 h-4 text-[#A9AEC5]" />
                <span>Renomear</span>
              </button>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#A9AEC5] hover:text-[#F04444] hover:bg-[#F04444]/10 transition-colors"
              title="Excluir vídeo"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-20 flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-[#12182B] border border-[#F04444]/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-[#F04444]/20 text-[#F04444] flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#F5F5FF] mb-1">
                Excluir vídeo?
              </h4>
              <p className="text-xs text-[#A9AEC5] mb-5">
                Esta ação removerá "{recording.title}" permanentemente da galeria local.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-2.5 px-4 rounded-xl bg-[#1E2640] text-xs font-bold text-[#A9AEC5] hover:text-[#F5F5FF]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="py-2.5 px-4 rounded-xl bg-[#F04444] hover:bg-[#D93838] text-xs font-bold text-white shadow-lg shadow-[#F04444]/20"
                >
                  Sim, excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
