/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AvatarImages {
  eyesOpenMouthClosed: string; // Repouso padrão (Olhos A / Boca F)
  eyesOpenMouthOpen: string;   // Falando (Olhos A / Boca A)
  eyesClosedMouthClosed: string; // Piscando em repouso (Olhos F / Boca F)
  eyesClosedMouthOpen: string;   // Piscando enquanto fala (Olhos F / Boca A)
}

export interface CharacterConfig {
  id: string;
  name: string;
  images: AvatarImages;
  scale: number; // 0.5 to 2.5
  positionX: number; // percentage 0 to 100
  positionY: number; // percentage 0 to 100
  flipHorizontal: boolean;
  rotation: number; // -30 to 30 deg
  bounceStrength: number; // 0 to 30 px
  bounceSpeed: number; // ms
  blinkInterval: number; // ms average
  blinkDuration: number; // ms
}

export interface AudioSettings {
  threshold: number; // 0 to 100 sensitivity threshold
  gain: number;      // 1 to 5 microphone boost
  smoothing: number; // ms hold time for mouth open
  enabled: boolean;
  currentVolume: number; // 0 to 100
  isSpeaking: boolean;
  noiseSuppression?: boolean;
}

export interface ProSettings {
  resolution: '720p' | '1080p' | '1440p';
  fps: 30 | 60;
  videoBitrateMbps: number; // e.g. 8 or 12
  audioBitrateKbps: number; // e.g. 128 or 256
  hardwareAcceleration: boolean;
}

export interface SavedRecording {
  id: string;
  title: string;
  url: string;
  blob?: Blob;
  durationMs: number;
  sizeBytes: number;
  timestamp: number;
  thumbnailUrl: string;
}

export type ActiveTab = 'studio' | 'character' | 'audio' | 'recordings' | 'premium';
