/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AudioDetectorCallback {
  onVolumeUpdate: (volume: number, isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
}

export class AudioVolumeDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private threshold = 18; // default sensitivity threshold (0 to 100)
  private gain = 2.0;
  private smoothing = 140; // ms hold time for mouth open
  private lastSpokeTime = 0;
  private isSpeaking = false;
  private callbacks: AudioDetectorCallback[] = [];

  constructor(threshold = 18, gain = 2.0, smoothing = 140) {
    this.threshold = threshold;
    this.gain = gain;
    this.smoothing = smoothing;
  }

  public setThreshold(val: number) {
    this.threshold = Math.max(1, Math.min(100, val));
  }

  public setGain(val: number) {
    this.gain = Math.max(0.5, Math.min(10, val));
  }

  public setSmoothing(val: number) {
    this.smoothing = Math.max(50, Math.min(500, val));
  }

  public subscribe(callback: AudioDetectorCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  public async start(): Promise<boolean> {
    try {
      if (this.audioContext && this.audioContext.state === 'running') {
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.microphoneStream = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);

      this.processAudioLoop();
      return true;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.callbacks.forEach((cb) => cb.onError?.(error));
      this.stop();
      return false;
    }
  }

  private processAudioLoop = () => {
    if (!this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    // Calculate Root Mean Square (RMS) volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128; // -1.0 to 1.0
      sum += normalized * normalized;
    }

    const rms = Math.sqrt(sum / bufferLength);
    // Scale RMS with gain, normalized to 0-100 range
    const rawVolume = Math.min(100, Math.round(rms * 100 * this.gain));
    const now = Date.now();

    if (rawVolume >= this.threshold) {
      this.lastSpokeTime = now;
      this.isSpeaking = true;
    } else {
      // Hold mouth open for `smoothing` ms to prevent chaotic chatter
      if (now - this.lastSpokeTime > this.smoothing) {
        this.isSpeaking = false;
      }
    }

    this.callbacks.forEach((cb) => cb.onVolumeUpdate(rawVolume, this.isSpeaking));
    this.animationFrameId = requestAnimationFrame(this.processAudioLoop);
  };

  public getAudioStream(): MediaStream | null {
    return this.microphoneStream;
  }

  public isRunning(): boolean {
    return !!(this.audioContext && this.audioContext.state === 'running');
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.analyser = null;
    this.isSpeaking = false;
    this.callbacks.forEach((cb) => cb.onVolumeUpdate(0, false));
  }
}
