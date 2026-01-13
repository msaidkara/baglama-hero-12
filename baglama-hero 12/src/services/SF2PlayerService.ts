
import { WorkletSynthesizer } from 'spessasynth_lib';

// We need to get the URL of the processor.
// In Vite, we can usually import it as a URL if configured, or refer to it in node_modules if exposed.
// However, direct access to node_modules in browser is tricky without a bundler plugin handling it.
// Assuming Vite handles the import or we can pass a URL.
// Since I see `spessasynth_processor.min.js` in `dist`, I'll try to import it to get its path.
// But Typescript might complain.
// Let's try to construct the path or usage that `spessasynth_lib` expects.
// If I check `spessasynth_lib` docs (simulated), they usually say:
// `await audioContext.audioWorklet.addModule(new URL('spessasynth_lib/dist/spessasynth_processor.min.js', import.meta.url))`

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
        if (this.isLoading) return false;

        this.isLoading = true;

        try {
            console.log("Loading SoundFont...");
            const response = await fetch('/baglama.sf2');
            if (!response.ok) {
                throw new Error(`Failed to load SoundFont: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();

            console.log("Adding Audio Worklet Module...");
            try {
                // Attempt to load the worklet module.
                // We use a relative path that Vite might resolve, or a known path.
                // Since I cannot be 100% sure of the resolution strategy without trying,
                // I will try the most standard Vite/ESM approach.
                // Note: The file is in `node_modules/spessasynth_lib/dist/spessasynth_processor.min.js`

                // In production build, this file needs to be available.
                // A common trick is to copy it to public or import it.
                // I will try to use the `import.meta.url` resolution.

                // If this fails, the catch block will trigger.
                await audioContext.audioWorklet.addModule(
                    new URL('../../node_modules/spessasynth_lib/dist/spessasynth_processor.min.js', import.meta.url).href
                );
            } catch (moduleError) {
                console.warn("Direct module load failed, trying alternative path or proceeding if already loaded...", moduleError);
                // Fallback: maybe it's already loaded or available at root?
                // If it fails here, `new WorkletSynthesizer` will likely fail too, which we catch below.
            }

            console.log("Initializing Synthesizer...");
            // Create synth - this requires the Worklet to be registered!
            this.synth = new WorkletSynthesizer(audioContext);

            // Connect to destination
            this.synth.connect(audioContext.destination);

            console.log("Loading SoundFont into Synth...");
            await this.synth.soundBankManager.addSoundBank(arrayBuffer, "baglama.sf2");

            this.isReady = true;
            console.log("SF2 Player Ready.");
            return true;

        } catch (error) {
            console.error("SF2 Initialization failed:", error);
            // Graceful failure - caller should use fallback
            this.synth = null;
            this.isReady = false;
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    public playNote(midiNote: number, velocity: number, durationSec: number, _startTime: number) {
        if (!this.synth || !this.isReady) return;

        try {
            this.synth.noteOn(0, midiNote, velocity);
            setTimeout(() => {
                 if (this.synth) {
                     this.synth.noteOff(0, midiNote);
                 }
            }, durationSec * 1000);
        } catch (e) {
            console.warn("SF2 Play Error:", e);
        }
    }

    public isAvailable(): boolean {
        return this.isReady;
    }
}

export default SF2PlayerService;
