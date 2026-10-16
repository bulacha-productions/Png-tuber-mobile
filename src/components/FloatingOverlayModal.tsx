/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { CharacterConfig } from '../types.ts';
import { AvatarView } from './AvatarView.tsx';
import {
  Layers,
  X,
  Minimize2,
  Maximize2,
  Move,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface FloatingOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterConfig;
  isSpeaking: boolean;
}

export const FloatingOverlayModal: React.FC<FloatingOverlayModalProps> = ({
  isOpen,
  onClose,
  character,
  isSpeaking,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const newX = Math.max(10, Math.min(window.innerWidth - 180, dragRef.current.initialX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 180, dragRef.current.initialY + deltaY));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // safely ignored
      }
    }
  };

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        touchAction: 'none',
      }}
      className="fixed z-50 select-none transition-shadow"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 rounded-2xl shadow-2xl shadow-indigo-950/60 overflow-hidden flex flex-col w-56 sm:w-64">
        {/* Header Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex items-center justify-between px-3 py-2 bg-indigo-950/60 border-b border-indigo-900/40 cursor-grab active:cursor-grabbing text-xs"
        >
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>Sobreposição Ativa</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
              title="Fechar sobreposição"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="p-3 flex flex-col items-center justify-center space-y-2">
            <div className="h-44 w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 relative">
              <AvatarView
                character={{ ...character, scale: 0.85 }}
                isSpeaking={isSpeaking}
              />

              <div className="absolute bottom-1 right-1">
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  isSpeaking ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isSpeaking ? 'Fala' : 'Idle'}
                </span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                SYSTEM_ALERT_WINDOW
              </span>
              <span className="text-indigo-400 font-semibold">Arraste para mover</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
