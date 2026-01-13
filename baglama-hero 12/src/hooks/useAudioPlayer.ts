import { useEffect, useRef, useCallback, useState } from 'react';
import { type Song, type NoteData } from '../types';
import SF2PlayerService from '../services/SF2PlayerService';
import { getFrequencyFromNote } from '../utils/pitchUtils';

function getMidiNote(noteName: string, octave: number): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const idx = notes.indexOf(noteName);
    return idx === -1 ? 0 : 12 + (octave * 12) + idx;
}

export function useAudioPlayer(song: Song, isPlaying: boolean, currentTime: number, speedMultiplier: number, metronomeEnabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const sf2Ref = useRef(SF2PlayerService.getInstance());
  const lastNoteIdx = useRef(-1);
  const lastBeat = useRef(-1);

  // Initialize Audio
  useEffect(() => {
    if (isPlaying && !ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AudioCtx();
      sf2Ref.current.initialize(ctxRef.current).catch(err => console.warn("SF2 Load Failed", err));
    }
  }, [isPlaying]);

  // Metronome (Woodblock Sound)
  const playClick = useCallback(() => {
    if (!ctxRef.current) return;
    const t = ctxRef.current.currentTime;
    const osc = ctxRef.current.createOscillator();
    const gain = ctxRef.current.createGain();
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.connect(gain);
    gain.connect(ctxRef.current.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }, []);

  const playNote = useCallback((note: NoteData) => {
    if (!ctxRef.current) return;
    const duration = (note.duration / 1000) / speedMultiplier;
    
    if (sf2Ref.current.isAvailable()) {
      sf2Ref.current.playNote(getMidiNote(note.noteName, note.octave), 100, duration, ctxRef.current.currentTime);
    } else {
      // Fallback
      const osc = ctxRef.current.createOscillator();
      const gain = ctxRef.current.createGain();
      osc.type = 'triangle';
      osc.frequency.value = getFrequencyFromNote(note.noteName, note.octave, false);
      gain.gain.setValueAtTime(0.5, ctxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctxRef.current.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctxRef.current.destination);
      osc.start();
      osc.stop(ctxRef.current.currentTime + duration);
    }
  }, [speedMultiplier]);

  // Main Loop
  useEffect(() => {
    if (!isPlaying) return;

    // Notes
    let idx = lastNoteIdx.current + 1;
    // Reset if seeked back
    if (idx < song.notes.length && song.notes[idx].startTime > currentTime + 100) {
        lastNoteIdx.current = -1;
        idx = 0;
    }

    while (idx < song.notes.length) {
      const note = song.notes[idx];
      if (currentTime >= note.startTime) {
        if (currentTime - note.startTime < 150) playNote(note); // Only play if fresh
        lastNoteIdx.current = idx;
        idx++;
      } else {
        break;
      }
    }

    // Metronome
    if (metronomeEnabled) {
      const effectiveBpm = song.bpm; // Time is already accelerated, so beats are standard relative to songTime
      const msPerBeat = 60000 / effectiveBpm;
      const beat = Math.floor(currentTime / msPerBeat);

      // Reset logic for seek back
      if (beat < lastBeat.current) {
          lastBeat.current = beat - 1;
      }

      if (beat > lastBeat.current) {
        playClick();
        lastBeat.current = beat;
      }
    }
  }, [currentTime, isPlaying, metronomeEnabled, song, playNote, playClick]);
}
