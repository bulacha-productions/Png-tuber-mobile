/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CharacterConfig, AudioSettings } from '../types.ts';
import { AvatarView, AvatarViewRef } from './AvatarView.tsx';
import {
  CircleDot,
  Square,
  Move,
  Check,
  Monitor,
  Gamepad2,
  Volume2,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

interface RecordingStudioProps {
  character: CharacterConfig;
  onUpdateCharacter: (updated: CharacterConfig) => void;
  isSpeaking: boolean;
  audioSettings: AudioSettings;
  isRecording: boolean;
  recordingDurationFormatted: string;
  onToggleRecord: (useSimulatedGame: boolean) => void;
  avatarRef: React.RefObject<AvatarViewRef | null>;
  canvasSourceRef: React.RefObject<HTMLCanvasElement | null>;
  studioError: string | null;
}

export const RecordingStudio: React.FC<RecordingStudioProps> = ({
  character,
  onUpdateCharacter,
  isSpeaking,
  audioSettings,
  isRecording,
  recordingDurationFormatted,
  onToggleRecord,
  avatarRef,
  canvasSourceRef,
  studioError,
}) => {
  const [sourceMode, setSourceMode] = useState<'screen' | 'game'>('game');
  const [isPositioningMode, setIsPositioningMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulated Game Engine State
  const gameScoreRef = useRef(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [gameRunning, setGameRunning] = useState(true);

  // Simulated 2D Game Loop on Canvas
  useEffect(() => {
    const canvas = canvasSourceRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let playerY = 280;
    let playerVy = 0;
    let isJumping = false;
    let obstacles: { x: number; w: number; h: number; color: string }[] = [];
    let clouds: { x: number; y: number; speed: number }[] = [
      { x: 100, y: 60, speed: 0.5 },
      { x: 450, y: 100, speed: 0.8 },
      { x: 800, y: 50, speed: 0.4 },
    ];
    let stars: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 50; i++) {
      stars.push({ x: Math.random() * 960, y: Math.random() * 320, r: Math.random() * 1.5 });
    }

    let lastTime = performance.now();
    let nextObstacleTime = 0;

    const jump = () => {
      if (!isJumping) {
        playerVy = -11;
        isJumping = true;
      }
    };

    const handleCanvasClick = () => {
      jump();
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick);

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Update game physics
      playerVy += 28 * dt; // gravity
      playerY += playerVy;
      if (playerY >= 280) {
        playerY = 280;
        playerVy = 0;
        isJumping = false;
      }

      // Spawn obstacles
      if (now > nextObstacleTime) {
        obstacles.push({
          x: 960,
          w: 28,
          h: 40 + Math.random() * 30,
          color: '#f43f5e',
        });
        nextObstacleTime = now + 1600 + Math.random() * 1400;
      }

      // Move obstacles
      obstacles.forEach((obs) => {
        obs.x -= 260 * dt;
      });
      obstacles = obstacles.filter((obs) => obs.x > -50);

      // Clouds
      clouds.forEach((cloud) => {
        cloud.x -= cloud.speed * 60 * dt;
        if (cloud.x < -100) cloud.x = 980;
      });

      // Score
      gameScoreRef.current += Math.round(dt * 15);
      setDisplayScore(gameScoreRef.current);

      // Draw background sky
      const grad = ctx.createLinearGradient(0, 0, 0, 540);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.7, '#1e1b4b');
      grad.addColorStop(1, '#312e81');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 540);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(840, 80, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(855, 75, 30, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      clouds.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 24, 0, Math.PI * 2);
        ctx.arc(c.x + 25, c.y - 10, 30, 0, Math.PI * 2);
        ctx.arc(c.x + 55, c.y, 22, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 340, 960, 200);
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(0, 340, 960, 4);

      // Draw obstacles (Cactus / Lasers)
      obstacles.forEach((obs) => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, 340 - obs.h, obs.w, obs.h);
        // glowing tip
        ctx.fillStyle = '#fda4af';
        ctx.fillRect(obs.x + 4, 340 - obs.h, obs.w - 8, 4);
      });

      // Draw player runner (Cyber Ship / Bot)
      ctx.save();
      ctx.translate(140, playerY);
      // Jetpack flame
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-15, 25);
      ctx.lineTo(-25 - Math.random() * 8, 30);
      ctx.lineTo(-15, 35);
      ctx.fill();

      // Bot body
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(-10, 10, 40, 45, 10);
      ctx.fill();
      // Eye visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 18, 16, 12);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(12, 20, 12, 8);
      ctx.restore();

      // In-Game UI HUD
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.roundRect(20, 20, 160, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`SCORE: ${gameScoreRef.current}`, 35, 46);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('touchstart', handleCanvasClick);
    };
  }, [canvasSourceRef]);

  const handlePositionChange = (x: number, y: number) => {
    onUpdateCharacter({
      ...character,
      positionX: Math.round(x),
      positionY: Math.round(y),
    });
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Estúdio de Gravação</h2>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              60 FPS Canvas Composite
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Grave a gameplay com o personagem PNGTuber sobreposto reagindo à sua voz em tempo real.
          </p>
        </div>

        {/* Source Mode Switcher & Positioning Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Positioning Button */}
          <button
            onClick={() => setIsPositioningMode(!isPositioningMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isPositioningMode
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
            }`}
          >
            {isPositioningMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar Posição</span>
              </>
            ) : (
              <>
                <Move className="w-3.5 h-3.5" />
                <span>Mover / Posicionar Avatar</span>
              </>
            )}
          </button>

          {/* Source Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSourceMode('game')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceMode === 'game'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Simulador de Jogo</span>
            </button>
            <button
              onClick={() => setSourceMode('screen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                sourceMode === 'screen'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Tela do Celular / PC</span>
            </button>
          </div>
        </div>
      </div>

      {studioError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{studioError}</span>
        </div>
      )}

      {/* Main Viewport Screen */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden aspect-video max-h-[580px] w-full flex items-center justify-center">
        {/* Source 1: Interactive HTML5 Canvas Game */}
        <canvas
          ref={canvasSourceRef}
          width={960}
          height={540}
          className={`w-full h-full object-cover select-none ${
            sourceMode === 'game' ? 'block cursor-pointer' : 'hidden'
          }`}
        />

        {/* Source 2: Screen share placeholder / helper */}
        {sourceMode === 'screen' && !isRecording && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center z-0">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-3">
              <Monitor className="w-7 h-7 text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Pronto para Capturar a Tela</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Ao clicar em <strong>"Gravar Tela"</strong>, selecione a aba, janela do jogo ou a tela inteira do dispositivo.
            </p>
          </div>
        )}

        {/* Live Positioning Guidance Bar */}
        {isPositioningMode && (
          <div className="absolute top-4 inset-x-4 bg-slate-900/90 backdrop-blur-md border border-amber-500/40 p-3 rounded-xl flex items-center justify-between z-20 shadow-lg text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <Move className="w-4 h-4 animate-bounce" />
              <span>Arraste o personagem pela tela para definir onde ele ficará na gravação.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-400">
                X: {character.positionX}% · Y: {character.positionY}%
              </span>
              <button
                onClick={() => setIsPositioningMode(false)}
                className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                Pronto
              </button>
            </div>
          </div>
        )}

        {/* The Live PNGTuber Avatar Overlaid */}
        <div
          ref={containerRef}
          className="absolute inset-0 pointer-events-none z-10"
        >
          <div
            className="absolute transition-[left,top] duration-75"
            style={{
              left: `${character.positionX}%`,
              top: `${character.positionY}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: isPositioningMode ? 'auto' : 'none',
            }}
          >
            <AvatarView
              ref={avatarRef}
              character={character}
              isSpeaking={isSpeaking}
              isInteractiveDragging={isPositioningMode}
              onPositionChange={handlePositionChange}
            />
          </div>
        </div>

        {/* Top-Right HUD Badge: Mic Volume & Status */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg">
          <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-400' : 'text-slate-400'}`} />
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                isSpeaking ? 'bg-emerald-400' : 'bg-indigo-500'
              }`}
              style={{ width: `${audioSettings.currentVolume}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-300 font-semibold">
            {audioSettings.currentVolume}%
          </span>
        </div>

        {/* Bottom Recording Control Bar */}
        <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl">
          <div className="flex items-center gap-3">
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-rose-400">
                  GRAVANDO {recordingDurationFormatted}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 hidden sm:inline">
                {sourceMode === 'game' ? 'Toque na tela do jogo para pular' : 'Tela pronta'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleRecord(sourceMode === 'game')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Finalizar & Salvar Vídeo</span>
                </>
              ) : (
                <>
                  <CircleDot className="w-4 h-4" />
                  <span>Iniciar Gravação</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
