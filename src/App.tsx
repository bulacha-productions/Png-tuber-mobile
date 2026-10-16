/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CharacterConfig, AudioSettings, SavedRecording, ActiveTab, ProSettings } from './types.ts';
import { PRESET_CHARACTERS } from './constants/presets.ts';
import { AudioVolumeDetector } from './utils/audioDetector.ts';
import { ScreenRecordingEngine } from './utils/recorder.ts';
import { AvatarViewRef } from './components/AvatarView.tsx';
import { TopNav } from './components/TopNav.tsx';
import { RecordingStudio } from './components/RecordingStudio.tsx';
import { CharacterConfigSection } from './components/CharacterConfig.tsx';
import { AudioMeter } from './components/AudioMeter.tsx';
import { RecordingsList } from './components/RecordingsList.tsx';
import { PremiumView } from './components/PremiumView.tsx';
import { FloatingOverlayModal } from './components/FloatingOverlayModal.tsx';
import { InstallPhoneModal } from './components/InstallPhoneModal.tsx';
import { GitHubExportModal } from './components/GitHubExportModal.tsx';
import { downloadAndroidZip } from './utils/zipExporter.ts';
import {
  Video,
  User,
  Mic,
  Film,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';

const DEFAULT_PRO_SETTINGS: ProSettings = {
  resolution: '1080p',
  fps: 30,
  videoBitrateMbps: 8,
  audioBitrateKbps: 128,
  hardwareAcceleration: true,
};

export default function App() {
  const [character, setCharacter] = useState<CharacterConfig>(PRESET_CHARACTERS[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [proSettings, setProSettings] = useState<ProSettings>(() => {
    try {
      const saved = localStorage.getItem('pngtuber_pro_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PRO_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('pngtuber_pro_settings', JSON.stringify(proSettings));
  }, [proSettings]);

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    threshold: 18,
    gain: 2.0,
    smoothing: 140,
    enabled: false,
    currentVolume: 0,
    isSpeaking: false,
  });

  const [micError, setMicError] = useState<string | null>(null);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isInstallPhoneOpen, setIsInstallPhoneOpen] = useState(false);
  const [isGitHubExportOpen, setIsGitHubExportOpen] = useState(false);

  const audioDetectorRef = useRef<AudioVolumeDetector | null>(null);
  const recorderEngineRef = useRef<ScreenRecordingEngine | null>(null);
  const avatarViewRef = useRef<AvatarViewRef | null>(null);
  const canvasSourceRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize Audio & Recording Engines
  useEffect(() => {
    const detector = new AudioVolumeDetector(
      audioSettings.threshold,
      audioSettings.gain,
      audioSettings.smoothing
    );

    detector.subscribe({
      onVolumeUpdate: (volume, isSpeaking) => {
        setAudioSettings((prev) => ({
          ...prev,
          currentVolume: volume,
          isSpeaking,
        }));
      },
      onError: (err) => {
        setMicError(`Erro no microfone: ${err.message}. Verifique as permissões de áudio.`);
        setAudioSettings((prev) => ({ ...prev, enabled: false }));
      },
    });

    audioDetectorRef.current = detector;

    const recorder = new ScreenRecordingEngine();
    recorder.setCallbacks({
      onTick: (elapsedMs) => {
        setRecordingDurationMs(elapsedMs);
      },
      onFinished: (rec) => {
        setIsRecording(false);
        setSavedRecordings((prev) => [rec, ...prev]);
        setSuccessToast('Gravação salva com sucesso na galeria!');
        setTimeout(() => setSuccessToast(null), 4000);
      },
      onError: (err) => {
        setIsRecording(false);
        setStudioError(`Erro na gravação: ${err.message}`);
        setTimeout(() => setStudioError(null), 6000);
      },
    });

    recorderEngineRef.current = recorder;

    return () => {
      detector.stop();
      recorder.stopRecording();
    };
  }, []);

  // Update detector parameters when user changes sliders
  useEffect(() => {
    if (audioDetectorRef.current) {
      audioDetectorRef.current.setThreshold(audioSettings.threshold);
      audioDetectorRef.current.setGain(audioSettings.gain);
      audioDetectorRef.current.setSmoothing(audioSettings.smoothing);
    }
  }, [audioSettings.threshold, audioSettings.gain, audioSettings.smoothing]);

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (!audioDetectorRef.current) return;

    if (audioSettings.enabled) {
      audioDetectorRef.current.stop();
      setAudioSettings((prev) => ({
        ...prev,
        enabled: false,
        currentVolume: 0,
        isSpeaking: false,
      }));
      setMicError(null);
    } else {
      setMicError(null);
      const ok = await audioDetectorRef.current.start();
      if (ok) {
        setAudioSettings((prev) => ({ ...prev, enabled: true }));
      }
    }
  };

  // Toggle Screen Recording
  const handleToggleRecord = async (useSimulatedGame: boolean) => {
    if (!recorderEngineRef.current) return;

    if (isRecording) {
      recorderEngineRef.current.stopRecording();
    } else {
      setStudioError(null);

      // Automatically enable mic if not already running
      if (!audioSettings.enabled && audioDetectorRef.current) {
        await audioDetectorRef.current.start();
        setAudioSettings((prev) => ({ ...prev, enabled: true }));
      }

      const micStream = audioDetectorRef.current?.getAudioStream() || null;

      const started = await recorderEngineRef.current.startRecording({
        micStream,
        customCanvasStreamSource: useSimulatedGame ? canvasSourceRef.current : null,
        character,
        getLiveAvatarState: () => {
          if (avatarViewRef.current) {
            const state = avatarViewRef.current.getCurrentState();
            return {
              imgSrc: state.imgSrc,
              bounceOffset: state.bounceOffset,
            };
          }
          return {
            imgSrc: character.images.eyesOpenMouthClosed,
            bounceOffset: 0,
          };
        },
      });

      if (started) {
        setIsRecording(true);
        setRecordingDurationMs(0);
      }
    }
  };

  // Delete Recording
  const handleDeleteRecording = (id: string) => {
    setSavedRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 lg:pb-8 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar Header */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRecording={isRecording}
        onToggleRecord={() => handleToggleRecord(false)}
        onToggleOverlay={() => setIsOverlayActive(!isOverlayActive)}
        onOpenInstallPhone={() => setIsInstallPhoneOpen(true)}
        onOpenGitHubExport={() => setIsGitHubExportOpen(true)}
        isOverlayActive={isOverlayActive}
        recordingDurationFormatted={formatDuration(recordingDurationMs)}
      />

      {/* Floating Overlay Simulator */}
      <FloatingOverlayModal
        isOpen={isOverlayActive}
        onClose={() => setIsOverlayActive(false)}
        character={character}
        isSpeaking={audioSettings.isSpeaking}
      />

      {/* Install Phone PWA Modal */}
      <InstallPhoneModal
        isOpen={isInstallPhoneOpen}
        onClose={() => setIsInstallPhoneOpen(false)}
      />

      {/* GitHub Export Modal */}
      <GitHubExportModal
        isOpen={isGitHubExportOpen}
        onClose={() => setIsGitHubExportOpen(false)}
        onDownloadZip={downloadAndroidZip}
      />

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'studio' && (
          <RecordingStudio
            character={character}
            onUpdateCharacter={setCharacter}
            isSpeaking={audioSettings.isSpeaking}
            audioSettings={audioSettings}
            isRecording={isRecording}
            recordingDurationFormatted={formatDuration(recordingDurationMs)}
            onToggleRecord={handleToggleRecord}
            avatarRef={avatarViewRef}
            canvasSourceRef={canvasSourceRef}
            studioError={studioError}
          />
        )}

        {activeTab === 'character' && (
          <CharacterConfigSection
            character={character}
            onUpdateCharacter={setCharacter}
            isSpeaking={audioSettings.isSpeaking}
          />
        )}

        {activeTab === 'audio' && (
          <AudioMeter
            settings={audioSettings}
            onToggleMic={handleToggleMic}
            onThresholdChange={(val) => setAudioSettings((s) => ({ ...s, threshold: val }))}
            onGainChange={(val) => setAudioSettings((s) => ({ ...s, gain: val }))}
            onSmoothingChange={(val) => setAudioSettings((s) => ({ ...s, smoothing: val }))}
            micError={micError}
          />
        )}

        {activeTab === 'recordings' && (
          <RecordingsList
            recordings={savedRecordings}
            onDeleteRecording={handleDeleteRecording}
          />
        )}

        {activeTab === 'premium' && (
          <PremiumView
            character={character}
            onUpdateCharacter={setCharacter}
            proSettings={proSettings}
            onUpdateProSettings={setProSettings}
            onResetProSettings={() => setProSettings(DEFAULT_PRO_SETTINGS)}
            onOpenGitHubExport={() => setIsGitHubExportOpen(true)}
            onOpenInstallPhone={() => setIsInstallPhoneOpen(true)}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1 from Mobile Design Reference) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 lg:hidden">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
              activeTab === 'studio' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Estúdio</span>
          </button>

          <button
            onClick={() => setActiveTab('character')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
              activeTab === 'character' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Avatar</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
              activeTab === 'audio' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Voz</span>
          </button>

          <button
            onClick={() => setActiveTab('recordings')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-lg transition-colors ${
              activeTab === 'recordings' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Vídeos</span>
          </button>

          <button
            onClick={() => setActiveTab('premium')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-all ${
              activeTab === 'premium' ? 'text-[#6C63FF] font-bold' : 'text-[#A9AEC5] hover:text-[#F5F5FF]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Premium</span>
          </button>
        </div>
      </div>
    </div>
  );
}
