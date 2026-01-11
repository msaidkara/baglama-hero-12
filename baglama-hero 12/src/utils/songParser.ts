import type { NoteData, Song } from '../types';

// --- Format A Interfaces (Mavilim/Zevzek) ---
interface RawNoteA {
    nota: string; // "Re", "Mi", "Es"
    sure: string; // "1/8", "1/4"
    vurus?: string; // "Alt", "Üst"
    ariza?: string; // "Bemol 2", "Naturel"
    aciklama?: string;
    uzatma?: boolean;
    bagli?: boolean;
    bitis?: boolean;
}

interface RawMeasureA {
    olcu?: number;
    olcu_no?: number;
    aciklama?: string;
    sira?: RawNoteA[]; // Mavilim style
    notalar?: RawNoteA[]; // Zevzek style
    tartim?: string;
}

interface RawSectionA {
    bolum?: string; // Mavilim
    bolum_adi?: string; // Zevzek
    olculer: RawMeasureA[];
    tekrar?: boolean;
    sozler?: string;
}

interface FormatASongData {
    eser_bilgisi?: {
        ad: string;
        usul?: string;
        donanim_ve_arizalar?: any[];
        donanim?: any[];
    };
    songMetadata?: any; 
    notalar?: RawSectionA[]; // Mavilim
    bolumler?: RawSectionA[]; // Zevzek
}

// --- Format B Interfaces (Uzun Ince) ---
interface RawNoteB {
    note: string; // "Fa", "Sol"
    octave: number;
    duration: string; // "0.5", "1.0"
    lyrics?: string;
    accidental?: string; // "b2"
}

interface RawMeasureB {
    measure: number;
    section: string;
    notes: RawNoteB[];
}

interface FormatBSongData {
    meta: {
        title: string;
        artist: string;
        tempo: number;
        timeSignature?: string;
        key?: string;
    };
    track: RawMeasureB[];
}

// Union Type
type RawSongData = FormatASongData | FormatBSongData;

const NOTE_NAME_MAP: Record<string, string> = {
    "Do": "C",
    "Si": "B",
    "La": "A",
    "Sol": "G",
    "Fa": "F",
    "Mi": "E",
    "Re": "D",
};

const NOTE_DEFAULTS: Record<string, { name: string, octave: number }> = {
    "Do": { name: "C", octave: 5 },
    "Si": { name: "B", octave: 4 },
    "La": { name: "A", octave: 4 },
    "Sol": { name: "G", octave: 4 },
    "Fa": { name: "F", octave: 4 },
    "Mi": { name: "E", octave: 4 },
    "Re": { name: "D", octave: 4 },
};

export const parseSong = (data: RawSongData, defaultBpm: number = 100): Song => {
    // Detect Format
    const isFormatB = 'meta' in data && 'track' in data;
    
    if (isFormatB) {
        return parseFormatB(data as FormatBSongData);
    } else {
        return parseFormatA(data as FormatASongData, defaultBpm);
    }
};

const parseFormatB = (data: FormatBSongData): Song => {
    const bpm = data.meta.tempo || 100;
    const msPerBeat = 60000 / bpm;
    
    let currentTime = 0;
    const notes: NoteData[] = [];
    let lastPlectrum: 'DOWN' | 'UP' = 'UP';
    let currentMeasure = -1;

    data.track.forEach(measure => {
        // Reset Plectrum on new measure
        if (measure.measure !== currentMeasure) {
            currentMeasure = measure.measure;
            lastPlectrum = 'UP';
        }

        measure.notes.forEach(raw => {
            const beatDuration = parseFloat(raw.duration);
            const duration = beatDuration * msPerBeat;

            const name = NOTE_NAME_MAP[raw.note];
            if (!name) {
                console.warn(`Unknown note in Format B: ${raw.note}`);
                currentTime += duration;
                return;
            }

            // Microtone
            const isQuarterTone = raw.accidental === 'b2';

            // Plectrum Inference
            const plectrum = lastPlectrum === 'DOWN' ? 'UP' : 'DOWN';
            lastPlectrum = plectrum;

            notes.push({
                noteName: name,
                octave: raw.octave,
                duration,
                startTime: currentTime,
                isQuarterTone,
                finger: 1, // Default
                plectrum,
                status: 'PENDING',
                technique: undefined,
                lyric: raw.lyrics || undefined
            });

            currentTime += duration;
        });
    });

    return {
        title: data.meta.title,
        bpm,
        notes
    };
};

const parseFormatA = (data: FormatASongData, defaultBpm: number): Song => {
    // 1. Metadata
    const title = data.eser_bilgisi?.ad || "Unknown Song";
    const bpm = defaultBpm; 
    const msPerBeat = 60000 / bpm; 

    const getDurationMs = (durStr: string): number => {
        const [num, den] = durStr.split('/').map(Number);
        if (!num || !den) return msPerBeat;
        // 1/4 = 1 beat
        return msPerBeat * (4 / den) * num;
    };

    let currentTime = 0;
    const notes: NoteData[] = [];

    const sections = data.notalar || data.bolumler || [];

    sections.forEach(section => {
        const loops = section.tekrar ? 2 : 1;

        for (let l = 0; l < loops; l++) {
            section.olculer.forEach(measure => {
                const rawNotes = measure.sira || measure.notalar || [];
                
                rawNotes.forEach(raw => {
                    const duration = getDurationMs(raw.sure);

                    if (raw.nota === "Es") {
                        currentTime += duration;
                        return;
                    }

                    const mapped = NOTE_DEFAULTS[raw.nota];
                    if (!mapped) {
                        console.warn(`Unknown note: ${raw.nota}`);
                        currentTime += duration;
                        return;
                    }

                    let { name, octave } = mapped;
                    let isQuarterTone = false;

                    if (raw.ariza === "Bemol 2") {
                        isQuarterTone = true;
                    }

                    let plectrum: 'DOWN' | 'UP' | undefined = undefined;
                    if (raw.vurus === "Alt") plectrum = 'DOWN';
                    else if (raw.vurus === "Üst") plectrum = 'UP';

                    notes.push({
                        noteName: name,
                        octave,
                        duration,
                        startTime: currentTime,
                        isQuarterTone,
                        finger: 1, 
                        plectrum,
                        status: 'PENDING',
                        technique: raw.aciklama || undefined, 
                        lyric: undefined
                    });

                    currentTime += duration;
                });
            });
        }
    });

    return {
        title,
        bpm,
        notes
    };
};
