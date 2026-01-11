import { type Song, type NoteData } from '../types';

// Helper to create notes more compactly
const createNote = (
  noteName: string, 
  octave: number, 
  startOffset: number, 
  duration: number, 
  finger: number,
  isQuarterTone: boolean = false,
  plectrum: 'DOWN' | 'UP' = 'DOWN'
): NoteData => ({
  noteName,
  octave,
  startTime: startOffset,
  duration,
  finger,
  isQuarterTone,
  plectrum,
  status: 'PENDING'
});

// Song: Al Yazmalım
// BPM: 120 (Reduced from 150 per request)
// Quarter Note = 60000 / 120 = 500ms
const Q = 500; 
const E = 250; 
const H = 1000; 
const DH = 1500; 

// Fingering Map (Short Neck)
// Re (D): 0 (Bot)
// Mi (E): 1 (Bot)
// Fa# (F#): 2 (Bot)
// Sol (G): 4 (Bot) or 0 (Mid)? Let's use 4.
// La (A): 1 (Mid)
// Si (B Segah): 2 (Mid)
// Si (B Normal): 2 (Mid)
// Si (Bb): 3 (Mid)
// Do (C): 5 (Thumb)

const generateNotes = (startT: number): { notes: NoteData[], duration: number } => {
    const sectionNotes: NoteData[] = [];
    let t = startT;

    // Measure 1: La (Dotted Half)
    // "la" -> A4
    sectionNotes.push(createNote("A", 4, t, DH, 1, false, 'DOWN'));
    t += DH;

    // Measure 2: Sol(E) Fa#(E) Sol(E) Mi(E) -> D U D U
    sectionNotes.push(createNote("G", 4, t, E, 4, false, 'DOWN')); t += E;
    sectionNotes.push(createNote("F#", 4, t, E, 2, false, 'UP')); t += E;
    sectionNotes.push(createNote("G", 4, t, E, 4, false, 'DOWN')); t += E;
    sectionNotes.push(createNote("E", 5, t, E, 1, false, 'UP')); t += E;
    t += Q; // Gap

    // Measure 3: Mi Do Mi Re -> D D U D (Syncopated feel? Or just D D D D if slow? At 120BPM, 8ths are fast. Alternate.)
    // Mi (Half) -> D
    // Do (E) -> D
    // Mi (E) -> U
    sectionNotes.push(createNote("E", 5, t, H, 1, false, 'DOWN')); t += H; // "miii"
    sectionNotes.push(createNote("C", 5, t, E, 5, false, 'DOWN')); t += E; // "do"
    sectionNotes.push(createNote("E", 5, t, E, 1, false, 'UP')); t += E; // "mi"

    // Measure 4: Re Si(Segah) Do -> D D U (Re is Half)
    sectionNotes.push(createNote("D", 5, t, H, 0, false, 'DOWN')); t += H; // "re"
    sectionNotes.push(createNote("B", 4, t, E, 2, true, 'DOWN')); t += E; // "si"
    sectionNotes.push(createNote("C", 5, t, E, 5, false, 'UP')); t += E; // "do"

    // Measure 5: Si Do Re Si La -> D U D U D
    // B4(S) C5 D5 B4(S) A4
    sectionNotes.push(createNote("B", 4, t, E, 2, true, 'DOWN')); t += E; // "si"
    sectionNotes.push(createNote("C", 5, t, E, 5, false, 'UP')); t += E; // "do"
    sectionNotes.push(createNote("D", 5, t, E, 0, false, 'DOWN')); t += E; // "re"
    sectionNotes.push(createNote("B", 4, t, E, 2, true, 'UP')); t += E; // "si"
    sectionNotes.push(createNote("A", 4, t, Q, 1, false, 'DOWN')); t += Q; // "la"
    
    t += Q; // Gap

    // SECOND PART (Si Do Re...)
    // Measure 9: Si Do Re -> D D D (All Q)
    sectionNotes.push(createNote("B", 4, t, Q, 2, true, 'DOWN')); t += Q; // "si"
    sectionNotes.push(createNote("C", 5, t, Q, 5, false, 'DOWN')); t += Q; // "do"
    sectionNotes.push(createNote("D", 5, t, Q, 0, false, 'DOWN')); t += Q; // "re"

    // Measure 10: Mi Re Si Do -> D U D U
    sectionNotes.push(createNote("E", 5, t, E, 1, false, 'DOWN')); t += E; // "mi"
    sectionNotes.push(createNote("D", 5, t, E, 0, false, 'UP')); t += E; // "re"
    sectionNotes.push(createNote("B", 4, t, E, 2, true, 'DOWN')); t += E; // "si"
    sectionNotes.push(createNote("C", 5, t, E, 5, false, 'UP')); t += E; // "do"
    t += Q;

    // Measure 11: Si Do Re Si La -> D U D U D
    sectionNotes.push(createNote("B", 4, t, E, 2, true, 'DOWN')); t += E; // "si"
    sectionNotes.push(createNote("C", 5, t, E, 5, false, 'UP')); t += E; // "do"
    sectionNotes.push(createNote("D", 5, t, E, 0, false, 'DOWN')); t += E; // "re"
    sectionNotes.push(createNote("B", 4, t, E, 2, true, 'UP')); t += E; // "si"
    sectionNotes.push(createNote("A", 4, t, Q, 1, false, 'DOWN')); t += Q; // "la"

    // Measure 12: Sol Do Si -> D D D
    sectionNotes.push(createNote("G", 4, t, Q, 4, false, 'DOWN')); t += Q; // "sol"
    sectionNotes.push(createNote("C", 5, t, Q, 5, false, 'DOWN')); t += Q; // "do"
    sectionNotes.push(createNote("B", 4, t, Q, 2, true, 'DOWN')); t += Q; // "si"

    // Measure 13: Do Re Si La -> D U D U
    sectionNotes.push(createNote("C", 5, t, E, 5, false, 'DOWN')); t += E; // "do"
    sectionNotes.push(createNote("D", 5, t, E, 0, false, 'UP')); t += E; // "re"
    sectionNotes.push(createNote("B", 4, t, E, 2, true, 'DOWN')); t += E; // "si"
    sectionNotes.push(createNote("A", 4, t, E, 1, false, 'UP')); t += E; // "la"
    t += Q;

    // Measure 14: La Mi Re -> D D D
    sectionNotes.push(createNote("A", 4, t, Q, 1, false, 'DOWN')); t += Q; // "la"
    sectionNotes.push(createNote("E", 5, t, Q, 1, false, 'DOWN')); t += Q; // "mi"
    sectionNotes.push(createNote("D", 5, t, Q, 0, false, 'DOWN')); t += Q; // "re"

    return { notes: sectionNotes, duration: t - startT };
};

// Generate Main Part
const part1 = generateNotes(0);
// REPEAT (Duplicate Part 1 logic, offset by its duration + small buffer)
const buffer = 1000;
const part2 = generateNotes(part1.duration + buffer);

export const AL_YAZMALIM: Song = {
  title: "Selvi Boylum Al Yazmalım",
  bpm: 120, 
  notes: [...part1.notes, ...part2.notes]
};
