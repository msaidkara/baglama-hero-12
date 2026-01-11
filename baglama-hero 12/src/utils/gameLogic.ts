import { type NoteInfo } from '../utils/pitchUtils';
import { type NoteData } from '../types';

export interface ScoreState {
  hits: number;
  misses: number;
  score: number;
  lastFeedback: 'PERFECT' | 'GOOD' | 'EARLY' | 'LATE' | 'MISS' | null;
}

/**
 * Checks if the current input pitch matches the target note.
 * Tolerance is loose for MVP.
 */
export function checkPitch(input: NoteInfo, target: NoteData): boolean {
  // Check Octave
  if (input.octave !== target.octave) return false;

  // Check Note Name
  if (input.noteName !== target.noteName) return false;

  // Check Quarter Tone
  // If target expects quarter tone, input must be quarter tone.
  // If target does NOT expect quarter tone, input must NOT be quarter tone.
  if (!!target.isQuarterTone !== input.isQuarterTone) return false;

  return true;
}

export function checkTiming(hitTime: number, noteStartTime: number): 'PERFECT' | 'GOOD' | 'EARLY' | 'LATE' {
    const diff = hitTime - noteStartTime;
    // Note starts at noteStartTime.
    // If diff is negative, we are early.
    // If diff is positive, we are late (into the note).
    
    // Actually, "Early" usually means hitting BEFORE the note starts.
    // "Late" means hitting way after it started.
    
    if (diff < -150) return 'EARLY';
    if (diff > 300) return 'LATE'; // Allow some time into the note
    
    if (Math.abs(diff) < 100) return 'PERFECT';
    return 'GOOD';
}
