import type { Song, NoteData } from '../types';

const rawMavilim = [
  {"comment": "--- 1. BÖLÜM ---"},
  {"note": "Re", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 1.0}, // Trill candidate
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.5},
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.5},
  {"note": "Re", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 1.0}, // Trill candidate
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.5},
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.25},
  {"note": "Re", "duration": 0.25},
  {"comment": "--- TEKRAR BÖLÜMÜ (1. TUR) ---"},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.125}, {"note": "Bb", "duration": 0.125}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 1.0}, // Trill candidate
  {"note": "Re", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.25}, {"note": "Bb", "duration": 0.25},
  {"note": "Bb", "duration": 0.5},
  {"note": "La", "duration": 0.25}, {"note": "La", "duration": 0.25}, {"note": "La", "duration": 1.0}, // Trill candidate
  {"note": "Sol", "duration": 0.25}, {"note": "Sol", "duration": 0.25},
  {"note": "Bb", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.125}, {"note": "Bb", "duration": 0.125}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 1.0}, // Trill candidate
  {"note": "Re", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.25}, {"note": "Bb", "duration": 0.25},
  {"note": "Bb", "duration": 0.5},
  {"note": "La", "duration": 0.25}, {"note": "La", "duration": 0.25}, {"note": "La", "duration": 1.0} // Trill candidate
];

interface SimpleNote {
    comment?: string;
    note?: string;
    duration?: number;
}

// Helper to convert the simplified JSON to NoteData
function parseMavilim(data: SimpleNote[], bpm: number): Song {
    const msPerBeat = 60000 / bpm;
    // Note Mappings
    const map: Record<string, {name: string, octave: number, isQuarterTone?: boolean}> = {
        "Re": { name: "D", octave: 4 },
        "Mi": { name: "E", octave: 4 },
        "Do": { name: "C", octave: 5 },
        "Bb": { name: "A#", octave: 4 },
        "La": { name: "A", octave: 4 },
        "Sol": { name: "G", octave: 4 },
    };

    const notes: NoteData[] = [];
    let currentTime = 0;

    data.forEach(item => {
        if (item.comment || !item.note || !item.duration) return;

        const info = map[item.note];
        if (!info) {
             console.warn("Unknown note:", item.note);
             return;
        }

        // FIXED: Using standard float mapping where 0.25 = Quarter note (1 beat) -> msPerBeat * 4 * 0.25 = msPerBeat
        const ms = item.duration * 4 * msPerBeat;

        // FIXED: Mark long notes with 'trill'
        let technique = 'normal';
        if (item.duration >= 1.0) {
            technique = 'trill';
        }

        notes.push({
            noteName: info.name,
            octave: info.octave,
            duration: ms,
            startTime: currentTime,
            isQuarterTone: info.isQuarterTone,
            finger: 1, // Default
            status: 'PENDING',
            technique: technique
        });

        currentTime += ms;
    });

    return {
        title: "Mavilim Mavişelim",
        bpm: bpm,
        notes: notes
    };
}

export const MAVILIM = parseMavilim(rawMavilim, 90);
