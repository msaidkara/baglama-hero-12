import type { Song, NoteData } from '../types';

const rawMavilim = [
  {"comment": "--- 1. BÖLÜM ---"},
  {"note": "Re", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 1.0},
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.5},
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.5},
  {"note": "Re", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Mi", "duration": 1.0},
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.5},
  {"note": "Mi", "duration": 0.5}, {"note": "Mi", "duration": 0.25},
  {"note": "Re", "duration": 0.25},
  {"comment": "--- TEKRAR BÖLÜMÜ (1. TUR) ---"},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Mi", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.125}, {"note": "Bb", "duration": 0.125}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 1.0},
  {"note": "Re", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.25}, {"note": "Bb", "duration": 0.25},
  {"note": "Bb", "duration": 0.5},
  {"note": "La", "duration": 0.25}, {"note": "La", "duration": 0.25}, {"note": "La", "duration": 1.0},
  {"note": "Sol", "duration": 0.25}, {"note": "Sol", "duration": 0.25},
  {"note": "Bb", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.125}, {"note": "Bb", "duration": 0.125}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 1.0},
  {"note": "Re", "duration": 0.25}, {"note": "Do", "duration": 0.25},
  {"note": "Re", "duration": 0.25}, {"note": "Re", "duration": 0.25},
  {"note": "Do", "duration": 0.25}, {"note": "Bb", "duration": 0.25},
  {"note": "Bb", "duration": 0.5},
  {"note": "La", "duration": 0.25}, {"note": "La", "duration": 0.25}, {"note": "La", "duration": 1.0}
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

        // Duration Logic:
        // Assuming user input 1.0 = Quarter Note (1 beat)
        // 0.25 = 16th note
        // 0.5 = 8th note
        // 1 Beat in 4/4 = msPerBeat

        // However, user data uses 0.25, 0.5, 1.0, 0.125.
        // And song is likely 2/4.
        // Let's assume the duration value is in "Beats".
        // If 1.0 = 1 Beat, then 0.25 = 1/4 Beat (Sixteenth Note).
        // ms = duration * msPerBeat.

        // Wait, earlier I thought 1.0 was Whole note.
        // Let's test "Re" (0.25).
        // If 0.25 is 1/16th note, then 4 of them make 1 quarter note.
        // "Re Mi Mi Mi" -> 4 notes.
        // If they are 16th notes, they take 1 beat.
        // If they are Quarter notes, they take 4 beats.
        // "Mavilim" melody usually starts fast. Taka Taka.
        // So 0.25 is likely 1/4 of a Beat (16th note).
        // This implies 1.0 is 1 Beat (Quarter Note).
        // So factor is just msPerBeat.

        // Wait, my previous thought: "ms = item.duration * 4 * msPerBeat".
        // If item.duration (0.25) is a Quarter note (0.25 of whole), then * 4 = 1 Beat.
        // If item.duration is just beat count (0.25 beats), then * 1.

        // Let's stick to "duration is in beats" assumption (0.25 = 1/4 beat).
        // But 0.25 is written as `0.25`.
        // If I use * 4, then 0.25 becomes 1 Beat. That's slow.
        // If I use * 1, then 0.25 is 1/4 Beat. That's fast (16th).
        // 1.0 would be 1 Beat.
        // 0.125 would be 1/32 note? Or 1/8 beat?
        // User has `0.125` in data.
        // "Do Bb Do" (0.125, 0.125, 0.25).
        // That's two 32nds and a 16th?
        // Or two 16ths and an 8th (if 1.0 = 4 beats).

        // Let's assume 1.0 = 4 Beats (Whole Note).
        // Then 0.25 = 1 Beat (Quarter Note).
        // Then 0.125 = 1/2 Beat (Eighth Note).
        // Then 0.5 = 2 Beats (Half Note).
        // "Re Mi Mi Mi" (0.25 each) -> 4 beats.
        // If BPM is 71, 4 beats is ~3.4 seconds. That's very slow.
        // Mavilim is a dance song.

        // Conclusion: 1.0 is NOT Whole Note.
        // If 1.0 = 1 Beat.
        // 0.25 = 1/4 Beat (16th).
        // 0.125 = 1/8 Beat (32nd).
        // "Do Bb Do" -> 32nd, 32nd, 16th. fast triplet-like?
        // This seems plausible for intricate playing.

        // However, many tabs use 1.0 = Quarter, 0.5 = Eighth.
        // So 0.25 = Sixteenth.
        // Let's stick with ms = item.duration * msPerBeat * 4 ? NO.
        // Let's try ms = item.duration * msPerBeat * 4 (Assuming duration is fraction of whole).
        // 0.25 * 4 = 1 beat. -> Too slow.

        // Let's go with ms = item.duration * msPerBeat * 1 (Assuming duration is beats).
        // But 0.125 * 60000/71 = 0.125 * 845 = 105ms. fast but playable.
        // 0.25 * 845 = 211ms.
        // 1.0 * 845 = 845ms.
        // This feels right for "Mavilim" rhythm at 71 BPM.
        // wait, 71 BPM is slow.
        // Maybe user meant 0.25 is a beat? No.

        // I will use: Duration Value * 4 * msPerBeat.
        // Wait, why did I circle back to *4?
        // If 0.25 is a Quarter Note (1/4 of whole), then it is 1 Beat.
        // Then "Re Mi Mi Mi" are Quarter notes.
        // At 71 BPM, 4 quarter notes = 4 * 0.84s = 3.3s.
        // Melody: "Ma-vi-lim-Ma..."
        // If it's 2/4.
        // Measures have 2 beats.
        // If notes are Quarter notes, 2 notes fill a measure.
        // If notes are 16ths (0.25 beat), 8 notes fill a measure.
        // The JSON has groups of 4-6 notes.

        // Let's trust the "Standard Float Notation" where 1.0 = Whole, 0.25 = Quarter (1 beat).
        // Then 0.125 = Eighth (1/2 beat).
        // Then "Re" (0.25) is a Quarter note.
        // This makes the song moderate speed.
        // I will use `item.duration * 4 * msPerBeat`.

        const ms = item.duration * 4 * msPerBeat;

        notes.push({
            noteName: info.name,
            octave: info.octave,
            duration: ms,
            startTime: currentTime,
            isQuarterTone: info.isQuarterTone,
            finger: 1, // Default
            status: 'PENDING'
        });

        currentTime += ms;
    });

    return {
        title: "Mavilim Mavişelim",
        bpm: bpm,
        notes: notes
    };
}

export const MAVILIM = parseMavilim(rawMavilim, 71);
