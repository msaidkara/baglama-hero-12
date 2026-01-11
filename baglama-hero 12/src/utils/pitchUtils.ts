export interface NoteInfo {
  noteName: string; // e.g., "A", "C#"
  octave: number;   // e.g., 4
  cents: number;    // Deviation from the exact semitone
  frequency: number;
  isQuarterTone: boolean; // True if it's approx 50 cents sharp/flat relative to the closest semitone
  midi: number;
}

export const A4 = 440;
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const SOLFEGE = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

export function toSolfege(noteName: string): string {
    const index = NOTES.indexOf(noteName);
    if (index === -1) return noteName;
    return SOLFEGE[index];
}

/**
 * Calculates the frequency of a note.
 * Useful for synthesis or target checking.
 */
export function getFrequencyFromNote(noteName: string, octave: number, isQuarterTone?: boolean): number {
    const semitoneIndex = NOTES.indexOf(noteName);
    if (semitoneIndex === -1) return 0;

    const midi = octave * 12 + semitoneIndex;
    const baseMidi = 69; // A4
    const semitoneDiff = midi - baseMidi;
    
    // Base frequency for the semitone
    let freq = A4 * Math.pow(2, semitoneDiff / 12);
    
    if (isQuarterTone) {
        // Option A: Approx 50 cents sharp?
        // Wait, "Segah" (Si Quarter Flat) is usually Bd (B-flat-half-sharp or B-half-flat).
        // My logic in getNoteFromFrequency detected +/- 50 cents deviation.
        // If I want to synthesize it, I should shift it by 50 cents.
        // Direction depends. Usually "Quarter Tone" implies "Half Sharp" or "Half Flat".
        // In the song `alYazmalim`, I used B with `isQuarterTone`.
        // Standard B is ~493Hz. Bb is ~466Hz. Segah is ~480Hz.
        // So B isQuarterTone -> B Half Flat.
        // My previous logic: `isQuarterTone` flags if input is +/- 35 cents off.
        // For synthesis, let's assume it's -50 cents (quarter flat) if it's B, E, A (standard Turkish alterations).
        // Or simpler: +50 cents from the note below?
        // Let's stick to: If QuarterTone, shift by -50 cents (multiply by 2^(-0.5/12)).
        // Wait, 50 cents is half a semitone. 1 semitone is 100 cents.
        // So factor is 2^( -0.5 / 12 ) for Quarter Flat.
        // Or 2^( 0.5 / 12 ) for Quarter Sharp.
        
        // Let's assume Quarter Flat for now as it's most common (Segah).
        freq = freq * Math.pow(2, -0.5 / 12); 
    }
    
    return freq;
}

/**
 * Converts a frequency to the closest note information, including quarter tone detection.
 */
export function getNoteFromFrequency(frequency: number): NoteInfo | null {
  if (frequency <= 0) return null;

  // MIDI Note formula: n = 12 * log2(f / 440) + 69
  // We use round to get the closest semitone
  const midiFloat = 12 * Math.log2(frequency / A4) + 69;
  const midi = Math.round(midiFloat);
  
  // Calculate cents deviation
  // Deviation = (Measured - Target) in semitones * 100
  const deviationInSemitones = midiFloat - midi;
  const cents = deviationInSemitones * 100;

  // Determine note name and octave
  const noteIndex = midi % 12;
  const noteName = NOTES[noteIndex];
  const octave = Math.floor(midi / 12) - 1; 

  let isQuarterTone = false;
  
  // Logic: if > 35 cents deviation, flag it.
  if (Math.abs(cents) > 35) {
    isQuarterTone = true;
  }

  return {
    noteName,
    octave,
    cents,
    frequency,
    isQuarterTone,
    midi
  };
}

/**
 * Simple autocorrelation algorithm to detect pitch.
 * Returns the fundamental frequency in Hz or -1 if no pitch is found.
 */
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let size = buffer.length;
  let rms = 0;

  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);

  // Noise Gate: Increased threshold to filter out background noise
  if (rms < 0.03) {
    // Not enough signal
    return -1;
  }

  let r1 = 0, r2 = size - 1;
  const thres = 0.2;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) < thres) { r2 = size - i; break; }
  }

  buffer = buffer.slice(r1, r2);
  size = buffer.length;

  const c = new Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] = c[i] + buffer[j] * buffer[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  // Parabolic interpolation for better precision
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}
