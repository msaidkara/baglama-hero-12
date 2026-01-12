
import { WorkletSynthesizer } from 'spessasynth_lib';

class SF2PlayerService {
    private static instance: SF2PlayerService;
    private synth: WorkletSynthesizer | null = null;
    private isLoading = false;
    private isReady = false;

    private constructor() {}

    public static getInstance(): SF2PlayerService {
        if (!SF2PlayerService.instance) {
            SF2PlayerService.instance = new SF2PlayerService();
        }
        return SF2PlayerService.instance;
    }

    public async initialize(audioContext: AudioContext): Promise<boolean> {
        if (this.isReady) return true;
        if (this.isLoading) return false; // Already loading

        this.isLoading = true;

        try {
            console.log("Loading SoundFont...");
            const response = await fetch('/baglama.sf2');
            if (!response.ok) {
                throw new Error(`Failed to load SoundFont: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();

            console.log("Initializing Synthesizer...");
            // Create synth
            this.synth = new WorkletSynthesizer(audioContext);

            // Connect to destination (AudioContext destination)
            this.synth.connect(audioContext.destination);

            console.log("Loading SoundFont into Synth...");
            // Load SoundFont
            await this.synth.soundBankManager.addSoundBank(arrayBuffer, "baglama.sf2");

            this.isReady = true;
            console.log("SF2 Player Ready.");
            return true;

        } catch (error) {
            console.error("SF2 Initialization failed:", error);
            // Fallback will be handled by caller checking isReady
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    public playNote(midiNote: number, velocity: number, durationSec: number, _startTime: number) {
        if (!this.synth || !this.isReady) return;

        // spessasynth expects midi note on/off
        // Channel 0
        this.synth.noteOn(0, midiNote, velocity);

        // Note Off scheduling
        // We use setTimeout for now as direct scheduling via synth might be tricky if it doesn't support future events directly in this API call.
        // But WorkletSynthesizer runs in Worklet, so timing is handled there.
        // `noteOn` is immediate.

        setTimeout(() => {
             if (this.synth) {
                 this.synth.noteOff(0, midiNote);
             }
        }, durationSec * 1000);
    }

    public isAvailable(): boolean {
        return this.isReady;
    }
}

export default SF2PlayerService;
