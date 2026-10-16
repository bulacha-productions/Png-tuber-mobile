/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SavedRecording } from '../types.ts';
import { X, Edit3, Check } from 'lucide-react';

interface RenameRecordingModalProps {
  recording: SavedRecording | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newTitle: string) => void;
}

export const RenameRecordingModal: React.FC<RenameRecordingModalProps> = ({
  recording,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (recording) {
      setTitle(recording.title);
    }
  }, [recording]);

  if (!isOpen || !recording) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(recording.id, title.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#12182B] rounded-3xl border border-[#1E2640] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#A9AEC5] hover:text-[#F5F5FF] hover:bg-[#1E2640] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#6C63FF]/20 text-[#6C63FF]">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F5FF]">Renomear Vídeo</h3>
            <p className="text-xs text-[#A9AEC5]">Altere o título da gravação</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A9AEC5] mb-1.5">
              Nome do Arquivo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Gameplay com PNGTuber #1"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-[#0B1020] border border-[#1E2640] focus:border-[#6C63FF] text-[#F5F5FF] text-sm outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#1E2640] text-xs font-bold text-[#A9AEC5] hover:text-[#F5F5FF] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5851E0] text-white text-xs font-bold shadow-lg shadow-[#6C63FF]/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Check className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
