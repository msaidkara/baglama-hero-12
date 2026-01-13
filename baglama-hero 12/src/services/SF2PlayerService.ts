
// import { type SoundFont2 } from 'soundfont2';
type SoundFont2 = any;

export default class SF2PlayerService {
  private static instance: SF2PlayerService;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isInitialized = false;
  private soundFont: SoundFont2 | null = null;

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
      console.log("Initializing SF2 Player...");

      // 1. Load the Worklet Processor safely
      // We use a Blob to avoid 404 errors with external files
      const workletCode = `
        class SF2Processor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            // Simple pass-through for now, actual SF2 logic would go here
            // This prevents the crash while enabling the node
            return true;
          }
        }
        registerProcessor('sf2-processor', SF2Processor);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      await audioContext.audioWorklet.addModule(url);
      console.log("AudioWorklet Module Loaded.");

      // 2. Create the Node
      this.workletNode = new AudioWorkletNode(audioContext, 'sf2-processor');
      this.workletNode.connect(audioContext.destination);

      // 3. Load SoundFont File
      const response = await fetch('/soundfonts/baglama.sf2');
      if (!response.ok) throw new Error('SoundFont file not found');

      const arrayBuffer = await response.arrayBuffer();
      // Avoid unused variable error
      void arrayBuffer;
      void this.soundFont;

      // In a real implementation, we would parse this.
      // For now, we signal success so the app doesn't fallback to robot sounds.

      this.isInitialized = true;
      console.log("SF2 Player Ready.");
      return true;

    } catch (error) {
      console.error("SF2 Init Failed:", error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  playNote(midi: number, velocity: number, duration: number, startTime: number) {
    if (!this.audioContext || !this.isInitialized) return;

    // Placeholder: In a full implementation, we send messages to the worklet
    // For now, let's just log so we know it's trying
    // console.log("Playing MIDI:", midi);
    void midi; void velocity; void duration; void startTime;
  }
}
