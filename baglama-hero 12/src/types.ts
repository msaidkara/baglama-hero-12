export interface NoteData {
  noteName: string; // "A", "G#", etc.
  octave: number;
  duration: number; // in milliseconds
  startTime: number; // in milliseconds from start of song
  isQuarterTone?: boolean;
  finger?: number; // 0=Open, 1=Index, 2=Middle, 3=Ring, 4=Pinky, 5=Thumb
  plectrum?: 'DOWN' | 'UP'; // 'V' or '^'
  status?: 'PENDING' | 'HIT' | 'MISS'; // Game state
  technique?: string;
  lyric?: string;
}

export interface Song {
  title: string;
  bpm: number;
  notes: NoteData[];
}
