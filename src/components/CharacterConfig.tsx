/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { CharacterConfig, AvatarImages } from '../types.ts';
import { PRESET_CHARACTERS } from '../constants/presets.ts';
import { AvatarView } from './AvatarView.tsx';
import {
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  MessageSquare,
  RotateCw,
  FlipHorizontal,
  Maximize2,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface CharacterConfigProps {
  character: CharacterConfig;
  onUpdateCharacter: (updated: CharacterConfig) => void;
  isSpeaking: boolean;
}

type SlotKey = keyof AvatarImages;

interface SlotDefinition {
  key: SlotKey;
  title: string;
  subtitle: string;
  iconEyes: React.ReactNode;
  iconMouth: React.ReactNode;
}

const SLOTS: SlotDefinition[] = [
  {
    key: 'eyesOpenMouthClosed',
    title: 'Repouso Padrão',
    subtitle: 'Olhos Abertos · Boca Fechada',
    iconEyes: <Eye className="w-3.5 h-3.5 text-indigo-400" />,
    iconMouth: <span className="text-[10px] font-mono font-bold text-slate-400">─</span>,
  },
  {
    key: 'eyesOpenMouthOpen',
    title: 'Falando',
    subtitle: 'Olhos Abertos · Boca Aberta',
    iconEyes: <Eye className="w-3.5 h-3.5 text-emerald-400" />,
    iconMouth: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    key: 'eyesClosedMouthClosed',
    title: 'Piscando em Repouso',
    subtitle: 'Olhos Fechados · Boca Fechada',
    iconEyes: <EyeOff className="w-3.5 h-3.5 text-violet-400" />,
    iconMouth: <span className="text-[10px] font-mono font-bold text-slate-400">─</span>,
  },
  {
    key: 'eyesClosedMouthOpen',
    title: 'Piscando Falando',
    subtitle: 'Olhos Fechados · Boca Aberta',
    iconEyes: <EyeOff className="w-3.5 h-3.5 text-amber-400" />,
    iconMouth: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />,
  },
];

export const CharacterConfigSection: React.FC<CharacterConfigProps> = ({
  character,
  onUpdateCharacter,
  isSpeaking,
}) => {
  const [activePresetId, setActivePresetId] = useState(character.id);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [testTalking, setTestTalking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetSlot, setTargetSlot] = useState<SlotKey>('eyesOpenMouthClosed');

  const handleSelectPreset = (preset: CharacterConfig) => {
    setActivePresetId(preset.id);
    onUpdateCharacter({
      ...preset,
      positionX: character.positionX,
      positionY: character.positionY,
      scale: character.scale,
    });
    setUploadMessage(`Personagem pré-definido "${preset.name}" carregado!`);
    setTimeout(() => setUploadMessage(null), 3500);
  };

  const handleOpenSlotUpload = (slot: SlotKey) => {
    setTargetSlot(slot);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('webp')) {
      setUploadMessage('Por favor envie um arquivo de imagem no formato PNG com transparência.');
      setTimeout(() => setUploadMessage(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateCharacter({
          ...character,
          images: {
            ...character.images,
            [targetSlot]: dataUrl,
          },
        });
        setUploadMessage(`Imagem salva com sucesso no slot de animação!`);
        setTimeout(() => setUploadMessage(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preset Characters Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Personagens Prontos para Teste</h3>
          </div>
          <span className="text-xs text-slate-400">Totalmente transparentes e configurados</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_CHARACTERS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
                  <img
                    src={preset.images.eyesOpenMouthClosed}
                    alt={preset.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{preset.name}</p>
                  <p className="text-[11px] text-slate-400">4 sprites prontos</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Banner */}
      {uploadMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Main Grid: 4 Slots + Interactive Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: The 4 Sprite Slots */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">4 Sprites PNG do Avatar</h3>
                <p className="text-xs text-slate-400">
                  Importe imagens PNG com fundo transparente para cada reação do personagem.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SLOTS.map((slot) => {
                const imgUrl = character.images[slot.key];
                return (
                  <div
                    key={slot.key}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-3 relative group hover:border-indigo-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {slot.iconEyes}
                        <span className="text-xs font-bold text-slate-200">{slot.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        {slot.iconMouth}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400">{slot.subtitle}</p>

                    <div className="flex items-center gap-3">
                      {/* Thumbnail Container */}
                      <div className="w-16 h-16 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-center p-1 overflow-hidden shrink-0 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px]">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={slot.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-500">Vazio</span>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex-1 space-y-1.5">
                        <button
                          onClick={() => handleOpenSlotUpload(slot.key)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700/60"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Importar PNG</span>
                        </button>
                        <p className="text-[10px] text-slate-500">Fundo transparente</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Avatar Physics & Sizing Customization */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Ajustes de Animação & Física</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Scale */}
              <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    Tamanho / Escala
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{Math.round(character.scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.2}
                  step={0.05}
                  value={character.scale}
                  onChange={(e) => onUpdateCharacter({ ...character, scale: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              {/* Bounce Strength */}
              <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Salto ao Falar (Pulo)
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{character.bounceStrength}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={28}
                  step={1}
                  value={character.bounceStrength}
                  onChange={(e) => onUpdateCharacter({ ...character, bounceStrength: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              {/* Rotation */}
              <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                    Inclinação / Rotação
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{character.rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-25}
                  max={25}
                  step={1}
                  value={character.rotation}
                  onChange={(e) => onUpdateCharacter({ ...character, rotation: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              {/* Flip Horizontal */}
              <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <FlipHorizontal className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Espelhar Horizontalmente</p>
                    <p className="text-[10px] text-slate-500">Inverter lado que o avatar olha</p>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateCharacter({ ...character, flipHorizontal: !character.flipHorizontal })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    character.flipHorizontal
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {character.flipHorizontal ? 'Ativado' : 'Desativado'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Avatar Preview Arena */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Prévia em Tempo Real</h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              60 FPS
            </span>
          </div>

          <div className="relative w-full h-80 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Grid Coordinates watermark */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-600 select-none">
              Prévia do Personagem 2D
            </div>

            <AvatarView
              character={character}
              isSpeaking={isSpeaking || testTalking}
            />

            {/* Test Talking Trigger Button */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2">
              <button
                onMouseDown={() => setTestTalking(true)}
                onMouseUp={() => setTestTalking(false)}
                onTouchStart={() => setTestTalking(true)}
                onTouchEnd={() => setTestTalking(false)}
                className="px-4 py-2 bg-slate-800/90 hover:bg-indigo-600 border border-slate-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />
                <span>Segure para Simular Fala</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/70 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Como funciona a animação:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-400">
              <li>Ao falar no microfone, a boca abre e o avatar quica suavemente.</li>
              <li>A cada 3 a 5 segundos, os olhos piscam de forma natural.</li>
              <li>O fundo do PNG é preservado com transparência total.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
