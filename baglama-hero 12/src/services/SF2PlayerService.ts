import { WorkletSynthesizer } from 'spessasynth_lib';

export default class SF2PlayerService {
  private static instance: SF2PlayerService;
  private audioContext: AudioContext | null = null;
  private synth: WorkletSynthesizer | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SF2PlayerService {
    if (!SF2PlayerService.instance) {
      SF2PlayerService.instance = new SF2PlayerService();
    }
    return SF2PlayerService.instance;
  }

  async initialize(audioContext: AudioContext): Promise<boolean> {
    if (this.isInitialized) return true;
    this.audioContext = audioContext;

    try {
      console.log("Loading SF2 Engine...");

      // Ensure spessasynth_processor.min.js is available
      await audioContext.audioWorklet.addModule('/spessasynth_processor.min.js');

      const response = await fetch('/soundfonts/baglama.sf2');
      if (!response.ok) throw new Error(`SF2 Load Error: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();

      this.synth = new WorkletSynthesizer(audioContext.destination.context as AudioContext);
      await this.synth.soundBankManager.addSoundBank(arrayBuffer, "baglama");
      await this.synth.isReady;

      this.isInitialized = true;
      console.log("✅ SF2 Loaded & Ready.");
      return true;

    } catch (error) {
      console.error("❌ SF2 Init Failed:", error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  playNote(midi: number, velocity: number, duration: number, startTime: number) {
    if (!this.audioContext) return;

    // Use SF2 if available, otherwise Fallback
    if (this.isInitialized && this.synth) {
      const now = this.audioContext.currentTime;
      const delay = Math.max(0, startTime - now);

      // SHOTGUN STRATEGY: Fire 4 different octaves to find the sample
      setTimeout(() => {
          // Log to console to verify it's trying to play
          console.log(`🔫 Firing Multi-Octave Note: ${midi}`);

          const layers = [0, -12, -24, 12]; // Original, Low, Very Low, High

          layers.forEach(offset => {
             const targetNote = midi + offset;
             if (targetNote > 0 && targetNote < 127) {
                 this.synth?.noteOn(0, targetNote, velocity);
                 // Note Off
                 setTimeout(() => {
                     this.synth?.noteOff(0, targetNote);
                 }, duration * 1000);
             }
          });
      }, delay * 1000);

    } else {
      this.playFallbackSynth(midi, duration, startTime);
    }
  }

  private playFallbackSynth(midi: number, duration: number, startTime: number) {
      if (!this.audioContext) return;
      const t = startTime || this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(t);
      osc.stop(t + duration + 0.1);
  }
}
