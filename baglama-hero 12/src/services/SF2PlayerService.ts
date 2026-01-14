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
      console.log("Loading SF2 Engine (Spessasynth)...");

      // 0. Add Audio Worklet Module
      // Ensure spessasynth_processor.min.js is available in public/ or dist/
      // We assume it's copied to public/spessasynth_processor.min.js
      await audioContext.audioWorklet.addModule('/spessasynth_processor.min.js');

      // 1. Fetch the SF2 file
      const response = await fetch('/soundfonts/baglama.sf2');
      if (!response.ok) throw new Error(`SF2 Load Error: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();

      // 2. Initialize the Synthesizer
      this.synth = new WorkletSynthesizer(audioContext.destination.context as AudioContext);

      // 3. Load the SoundFont data
      // API v4 uses soundBankManager.addSoundBank(buffer, id)
      await this.synth.soundBankManager.addSoundBank(arrayBuffer, "baglama");

      await this.synth.isReady;

      this.isInitialized = true;
      console.log("SF2 Engine Ready & Loaded.");
      return true;

    } catch (error) {
      console.error("SF2 Init Failed, falling back to simple synth:", error);
      // Fallback is handled by playNote check
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  playNote(midi: number, velocity: number, duration: number, startTime: number) {
    if (!this.audioContext) return;

    if (this.isInitialized && this.synth) {
      // Spessasynth handles noteOn/Off directly

      // Calculate delay until startTime
      const now = this.audioContext.currentTime;
      const delay = Math.max(0, startTime - now);

      setTimeout(() => {
          if (this.synth) {
              this.synth.noteOn(0, midi, velocity);

              // Schedule Note Off
              setTimeout(() => {
                  if (this.synth) {
                      this.synth.noteOff(0, midi);
                  }
              }, duration * 1000);
          }
      }, delay * 1000);

    } else {
      // FALLBACK (The Sawtooth Synth we made earlier)
      this.playFallbackSynth(midi, duration, startTime);
    }
  }

  private playFallbackSynth(midi: number, duration: number, startTime: number) {
      if (!this.audioContext) return;
      const t = startTime || this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = 'sawtooth';
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, t);
      filter.frequency.exponentialRampToValueAtTime(freq, t + 0.15);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(0.4, t + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      osc.start(t);
      osc.stop(t + duration + 0.2);
  }
}
