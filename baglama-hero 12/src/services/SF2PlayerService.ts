export default class SF2PlayerService {
  private static instance: SF2PlayerService;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SF2PlayerService {
    if (!SF2PlayerService.instance) {
      SF2PlayerService.instance = new SF2PlayerService();
    }
    return SF2PlayerService.instance;
  }

  async initialize(audioContext: AudioContext): Promise<boolean> {
    this.audioContext = audioContext;
    this.isInitialized = true;
    console.log("Synthesizer Ready (No SF2 required).");
    return true;
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  playNote(midi: number, _velocity: number, duration: number, startTime: number) {
    if (!this.audioContext) return;

    const t = startTime || this.audioContext.currentTime;

    // 1. Create Oscillator (The Source)
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    // Sawtooth sounds richer, like a string instrument
    osc.type = 'sawtooth';

    // Convert MIDI to Frequency
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    osc.frequency.setValueAtTime(freq, t);

    // 2. Filter (Wah effect for "Pluck" sound)
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(freq * 3, t); // Start open
    filterNode.frequency.exponentialRampToValueAtTime(freq, t + 0.1); // Close down quickly

    // 3. Envelope (ADSR - Pluck shape)
    // Instant attack, slow decay
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.4, t + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration); // Decay

    // 4. Connect
    osc.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 5. Play
    osc.start(t);
    osc.stop(t + duration + 0.1);
  }
}
