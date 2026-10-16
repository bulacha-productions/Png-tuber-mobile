/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  sectionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  sectionTitle,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#12182B] rounded-3xl border border-[#1E2640] p-6 shadow-2xl relative text-center">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#A9AEC5] hover:text-[#F5F5FF] hover:bg-[#1E2640] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/20 text-[#6C63FF] flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-[#F5F5FF] mb-1">
          Restaurar {sectionTitle}?
        </h3>
        <p className="text-xs text-[#A9AEC5] mb-6 leading-relaxed">
          Tem certeza de que deseja restaurar as opções originais de <strong>{sectionTitle}</strong>? Suas personalizações em outras seções não serão alteradas.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl bg-[#1E2640] hover:bg-[#283254] text-xs font-bold text-[#A9AEC5] hover:text-[#F5F5FF] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-xl bg-[#6C63FF] hover:bg-[#5851E0] text-xs font-bold text-white shadow-lg shadow-[#6C63FF]/25 transition-all"
          >
            Restaurar Padrão
          </button>
        </div>
      </div>
    </div>
  );
};
