import { type Song } from '../types';

export const DEMO_SONG: Song = {
  title: "Bağlama Scale Demo",
  bpm: 60,
  notes: [
    // A simple scale-like pattern
    // 0ms
    { noteName: "A", octave: 4, startTime: 0, duration: 1000 },
    // 1000ms
    { noteName: "B", octave: 4, startTime: 1000, duration: 1000, isQuarterTone: true }, // Segah (approx)
    // 2000ms
    { noteName: "C", octave: 5, startTime: 2000, duration: 1000 },
    // 3000ms
    { noteName: "D", octave: 5, startTime: 3000, duration: 1000 },
    // 4000ms - Rest or end
  ]
};
