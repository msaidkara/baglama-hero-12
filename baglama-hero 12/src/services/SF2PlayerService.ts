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
    
    if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }
    
    console.log("✅ Ses Motoru: Warm E-Piano Modu");
    return true;
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  playNote(midi: number, velocity: number, duration: number, startTime: number) {
    if (!this.audioContext) return;

    const t = startTime || this.audioContext.currentTime;

    // --- 1. OKTAV AYARI (Tizliği Alıyoruz) ---
    // midi - 12 yaparak sesi 1 oktav kalınlaştırıyoruz.
    const freq = 440 * Math.pow(2, (midi - 12 - 69) / 12);

    // --- 2. SES ŞEKLİ (Boğukluğu Alıyoruz) ---
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle'; 
    osc.frequency.value = freq;

    // --- 3. FİLTRE (Tırnak Sürtmesini Engelliyoruz) ---
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500; 

    // --- 4. SES ZARFI (Vuruş Hissi) ---
    const gain = this.audioContext.createGain();
    const volume = Math.min(velocity / 127, 1.0) * 0.4; 

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02); 
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration + 0.5); 

    // --- BAĞLANTILAR ---
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(t);
    osc.stop(t + duration + 0.6);
  }
}
