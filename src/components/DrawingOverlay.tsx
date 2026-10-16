/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Trash2,
  Undo2,
  Check,
  Circle,
  PenTool,
  Eraser,
} from 'lucide-react';

interface DrawingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PathItem {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isEraser: boolean;
}

const PALETTE = [
  { label: 'Vermelho', color: '#F04444' },
  { label: 'Roxo', color: '#6C63FF' },
  { label: 'Amarelo', color: '#FACC15' },
  { label: 'Verde', color: '#22C55E' },
  { label: 'Azul', color: '#38BDF8' },
  { label: 'Branco', color: '#FFFFFF' },
];

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#F04444');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<PathItem[]>([]);
  const currentPathRef = useRef<PathItem | null>(null);

  // Redraw canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const item of history) {
      if (item.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        ctx.lineTo(item.points[i].x, item.points[i].y);
      }
      if (item.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = item.color;
      }
      ctx.lineWidth = item.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
  }, [history]);

  // Handle Resize and Canvas setup
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Hardware back button / Esc key interceptor
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Push history state to catch Android system back button
    window.history.pushState({ drawingMode: true }, '');
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, redraw, onClose]);

  useEffect(() => {
    redraw();
  }, [history, redraw]);

  if (!isOpen) return null;

  // Pointer drawing events
  const startDrawing = (clientX: number, clientY: number) => {
    setIsDrawing(true);
    const newPath: PathItem = {
      points: [{ x: clientX, y: clientY }],
      color: currentColor,
      width: strokeWidth,
      isEraser,
    };
    currentPathRef.current = newPath;
  };

  const drawMove = (clientX: number, clientY: number) => {
    if (!isDrawing || !currentPathRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    currentPathRef.current.points.push({ x: clientX, y: clientY });
    const pts = currentPathRef.current.points;
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    }
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPathRef.current && currentPathRef.current.points.length > 0) {
      setHistory((prev) => [...prev, currentPathRef.current!]);
    }
    currentPathRef.current = null;
  };

  const handleClear = () => {
    setHistory([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleUndo = () => {
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none touch-none">
      {/* Interactive Transparent Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
        onMouseMove={(e) => drawMove(e.clientX, e.clientY)}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          const t = e.touches[0];
          startDrawing(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          drawMove(t.clientX, t.clientY);
        }}
        onTouchEnd={stopDrawing}
      />

      {/* Floating Toolbar with Clear, Close, Undo & Colors */}
      <div className="absolute top-4 inset-x-0 mx-auto max-w-fit px-4 z-10 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#12182B]/95 backdrop-blur-md border border-[#1E2640] shadow-2xl">
          {/* Tool switch: Pen vs Eraser */}
          <div className="flex items-center bg-[#0B1020] rounded-xl p-0.5 border border-[#1E2640]">
            <button
              onClick={() => setIsEraser(false)}
              className={`p-2 rounded-lg transition-colors ${
                !isEraser
                  ? 'bg-[#6C63FF] text-white shadow'
                  : 'text-[#A9AEC5] hover:text-[#F5F5FF]'
              }`}
              title="Pincel"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`p-2 rounded-lg transition-colors ${
                isEraser
                  ? 'bg-[#6C63FF] text-white shadow'
                  : 'text-[#A9AEC5] hover:text-[#F5F5FF]'
              }`}
              title="Borracha"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette */}
          {!isEraser && (
            <div className="flex items-center gap-1.5 px-1 border-x border-[#1E2640]">
              {PALETTE.map((item) => (
                <button
                  key={item.color}
                  onClick={() => setCurrentColor(item.color)}
                  className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                    currentColor === item.color
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#12182B]'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: item.color }}
                  title={item.label}
                >
                  {currentColor === item.color && (
                    <Circle className="w-2.5 h-2.5 text-black/50 fill-black/50" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Stroke Width Toggle */}
          <div className="flex items-center gap-1">
            {[4, 8, 14].map((size) => (
              <button
                key={size}
                onClick={() => setStrokeWidth(size)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  strokeWidth === size
                    ? 'bg-[#1E2640] text-[#6C63FF]'
                    : 'text-[#A9AEC5] hover:bg-[#1E2640]/50'
                }`}
                title={`Espessura ${size}px`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: `${size}px`, height: `${size}px` }}
                />
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-[#1E2640]" />

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 rounded-xl text-[#A9AEC5] hover:text-[#F5F5FF] hover:bg-[#1E2640] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Desfazer traço"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Clear Canvas */}
          <button
            onClick={handleClear}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#A9AEC5] hover:text-[#F04444] hover:bg-[#1E2640] transition-colors disabled:opacity-30 disabled:pointer-events-none"
            title="Limpar tudo"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar</span>
          </button>

          {/* Finish & Exit Drawing Mode */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#5851E0] text-white text-xs font-bold shadow-lg shadow-[#6C63FF]/25 transition-all"
            title="Concluir desenho"
          >
            <Check className="w-4 h-4" />
            <span>Concluir</span>
          </button>

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A9AEC5] hover:text-[#F5F5FF] hover:bg-[#1E2640] transition-colors"
            title="Fechar pincel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
