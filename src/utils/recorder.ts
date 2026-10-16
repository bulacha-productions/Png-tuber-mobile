/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterConfig, SavedRecording } from '../types.ts';

export interface RecorderOptions {
  character: CharacterConfig;
  currentAvatarImageSrc: string;
  isSpeaking: boolean;
  bounceOffset: number;
}

export class ScreenRecordingEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime = 0;
  private timerInterval: number | null = null;
  private animFrameId: number | null = null;
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private compositeCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private currentAvatarImg: HTMLImageElement | null = null;
  private currentImgSrc = '';

  private onTickCallback?: (elapsedMs: number) => void;
  private onFinishedCallback?: (recording: SavedRecording) => void;
  private onErrorCallback?: (err: Error) => void;

  constructor() {
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = 1280;
    this.compositeCanvas.height = 720;
    this.ctx = this.compositeCanvas.getContext('2d', { alpha: false });
  }

  public setCallbacks(callbacks: {
    onTick: (elapsedMs: number) => void;
    onFinished: (recording: SavedRecording) => void;
    onError: (err: Error) => void;
  }) {
    this.onTickCallback = callbacks.onTick;
    this.onFinishedCallback = callbacks.onFinished;
    this.onErrorCallback = callbacks.onError;
  }

  public updateAvatarImage(src: string) {
    if (this.currentImgSrc !== src) {
      this.currentImgSrc = src;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      this.currentAvatarImg = img;
    }
  }

  public async startRecording(options: {
    micStream: MediaStream | null;
    customCanvasStreamSource?: HTMLCanvasElement | null;
    character: CharacterConfig;
    getLiveAvatarState: () => { imgSrc: string; bounceOffset: number };
  }): Promise<boolean> {
    try {
      this.recordedChunks = [];
      this.micStream = options.micStream;

      let screenVideoTrack: MediaStreamTrack | null = null;

      if (options.customCanvasStreamSource) {
        // Source is the in-app gameplay simulator canvas
        const canvasStream = options.customCanvasStreamSource.captureStream(60);
        screenVideoTrack = canvasStream.getVideoTracks()[0];
      } else {
        // Request actual device screen sharing
        try {
          this.displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              frameRate: { ideal: 60, max: 60 },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: true, // system audio if available
          });
          screenVideoTrack = this.displayStream.getVideoTracks()[0];

          // Handle if user clicks "Stop sharing" in browser native bar
          screenVideoTrack.onended = () => {
            this.stopRecording();
          };
        } catch (captureErr) {
          throw new Error('Permissão de gravação de tela cancelada ou não suportada: ' + (captureErr as Error).message);
        }
      }

      if (!screenVideoTrack) {
        throw new Error('Nenhuma faixa de vídeo de tela encontrada.');
      }

      // Setup video element to read frames from screen
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.srcObject = new MediaStream([screenVideoTrack]);
      await this.videoElement.play();

      // Setup composite canvas resolution matching source
      const vw = this.videoElement.videoWidth || 1280;
      const vh = this.videoElement.videoHeight || 720;
      if (this.compositeCanvas) {
        this.compositeCanvas.width = vw;
        this.compositeCanvas.height = vh;
      }

      // Start 60fps render loop
      const renderLoop = () => {
        if (!this.ctx || !this.compositeCanvas || !this.videoElement) return;

        const cw = this.compositeCanvas.width;
        const ch = this.compositeCanvas.height;

        // Draw screen video frame
        this.ctx.drawImage(this.videoElement, 0, 0, cw, ch);

        // Get latest avatar state and render overlay
        const { imgSrc, bounceOffset } = options.getLiveAvatarState();
        this.updateAvatarImage(imgSrc);

        if (this.currentAvatarImg && this.currentAvatarImg.complete) {
          const char = options.character;
          // Calculate character pixel size and position
          const baseSize = Math.min(cw, ch) * 0.42 * char.scale;
          const imgAspect = (this.currentAvatarImg.naturalWidth || 300) / (this.currentAvatarImg.naturalHeight || 340);
          const drawW = baseSize * imgAspect;
          const drawH = baseSize;

          const posX = (cw * char.positionX) / 100 - drawW / 2;
          const posY = (ch * char.positionY) / 100 - drawH / 2 - bounceOffset;

          this.ctx.save();
          // Position transform & flip
          const centerX = posX + drawW / 2;
          const centerY = posY + drawH / 2;
          this.ctx.translate(centerX, centerY);

          if (char.rotation !== 0) {
            this.ctx.rotate((char.rotation * Math.PI) / 180);
          }

          if (char.flipHorizontal) {
            this.ctx.scale(-1, 1);
          }

          this.ctx.drawImage(
            this.currentAvatarImg,
            -drawW / 2,
            -drawH / 2,
            drawW,
            drawH
          );
          this.ctx.restore();
        }

        this.animFrameId = requestAnimationFrame(renderLoop);
      };

      renderLoop();

      // Mixed audio destination (display audio + microphone)
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const mixedDest = audioCtx.createMediaStreamDestination();

      if (this.micStream && this.micStream.getAudioTracks().length > 0) {
        const micSource = audioCtx.createMediaStreamSource(this.micStream);
        micSource.connect(mixedDest);
      }

      if (this.displayStream && this.displayStream.getAudioTracks().length > 0) {
        const displayAudioSource = audioCtx.createMediaStreamSource(this.displayStream);
        displayAudioSource.connect(mixedDest);
      }

      // Stream from composite canvas
      const canvasStream = this.compositeCanvas!.captureStream(60);
      const combinedTracks = [...canvasStream.getVideoTracks()];

      if (mixedDest.stream.getAudioTracks().length > 0) {
        combinedTracks.push(mixedDest.stream.getAudioTracks()[0]);
      }

      const finalStream = new MediaStream(combinedTracks);

      // Determine best supported MIME type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      this.mediaRecorder = selectedMime
        ? new MediaRecorder(finalStream, { mimeType: selectedMime, videoBitsPerSecond: 4_500_000 })
        : new MediaRecorder(finalStream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finalizeRecording();
      };

      this.startTime = Date.now();
      this.mediaRecorder.start(500); // 500ms chunks

      this.timerInterval = window.setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        this.onTickCallback?.(elapsed);
      }, 200);

      return true;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.onErrorCallback?.(error);
      this.cleanup();
      return false;
    }
  }

  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  public stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this.cleanup();
    }
  }

  private async finalizeRecording() {
    const elapsed = Date.now() - this.startTime;
    const blobType = this.mediaRecorder?.mimeType || 'video/webm';
    const finalBlob = new Blob(this.recordedChunks, { type: blobType });
    const videoUrl = URL.createObjectURL(finalBlob);

    // Generate quick thumbnail from composite canvas
    let thumb = '';
    if (this.compositeCanvas) {
      thumb = this.compositeCanvas.toDataURL('image/jpeg', 0.6);
    }

    const rec: SavedRecording = {
      id: 'rec_' + Date.now(),
      title: `Gameplay PNGTuber ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      url: videoUrl,
      blob: finalBlob,
      durationMs: elapsed,
      sizeBytes: finalBlob.size,
      timestamp: Date.now(),
      thumbnailUrl: thumb,
    };

    this.onFinishedCallback?.(rec);
    this.cleanup();
  }

  private cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((t) => t.stop());
      this.displayStream = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    this.mediaRecorder = null;
  }
}
