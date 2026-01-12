import { useEffect, useRef, useCallback } from 'react';
import { type Song, type NoteData } from '../types';
import { getFrequencyFromNote } from '../utils/pitchUtils';

export function useAudioPlayer(
    song: Song,
    isPlaying: boolean,
    currentTime: number, // Real Time
    speedMultiplier: number = 1.0,
    metronomeEnabled: boolean = false
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedNoteIndexRef = useRef<number>(-1);
  const masterGainRef = useRef<GainNode | null>(null);
  const lastBeatRef = useRef<number>(-1);

  const playClick = useCallback(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, time);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(masterGainRef.current);
    
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const playNote = useCallback((note: NoteData) => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    
    const freq = getFrequencyFromNote(note.noteName, note.octave, note.isQuarterTone);
    const time = ctx.currentTime;
    // FIXED: Duration should be shorter if speed is higher
    const duration = Math.max((note.duration / 1000) / speedMultiplier, 0.5);

    // Bağlama Synthesis
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, time); // Fundamental
    osc2.detune.value = 3; // Slight Chorus

    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 3;
    filter.frequency.setValueAtTime(4000, time);
    filter.frequency.exponentialRampToValueAtTime(freq, time + 0.15);

    // Amp Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 1.0);
    osc2.stop(time + duration + 1.0);

  }, [speedMultiplier]);

  useEffect(() => {
    // Init Audio Context on first play attempt
    if (isPlaying && !audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = 0.4;
        masterGainRef.current.connect(audioContextRef.current.destination);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
        lastPlayedNoteIndexRef.current = -1;
        lastBeatRef.current = -1;
        return;
    }

    if (!audioContextRef.current || !masterGainRef.current) return;

    // 1. Note Playback Logic
    // Scan ahead a bit? No, precise trigger.
    // Loop through upcoming notes.
    // Note: This linear search assumes notes are sorted (they are) and efficiency.
    // Since we reset index on stop, we can just check from last index.

    let checkIndex = lastPlayedNoteIndexRef.current + 1;
    while (checkIndex < song.notes.length) {
        const note = song.notes[checkIndex];
        // FIXED: Check against scaled start time
        const targetTime = note.startTime / speedMultiplier;

        // If it's time to play (or slightly passed due to frame delay)
        if (currentTime >= targetTime) {
             playNote(note);
             lastPlayedNoteIndexRef.current = checkIndex;
             checkIndex++;
        } else {
             // Not time yet, and since sorted, stop checking
             break;
        }
    }

    // 2. Metronome Logic
    if (metronomeEnabled) {
        // Beat Duration in Song Time (ms)
        // const msPerBeat = 60000 / song.bpm; // Unused

        // Adjusted for speed?
        // We need beats per real ms.
        // Beats per minute = bpm * speedMultiplier.
        // msPerBeatReal = 60000 / (bpm * speedMultiplier).
        const msPerBeatReal = 60000 / (song.bpm * speedMultiplier);

        // Current Beat Index based on Real Time
        const currentBeat = Math.floor(currentTime / msPerBeatReal);
        
        if (currentBeat > lastBeatRef.current) {
            if (currentBeat >= 0) {
                 playClick();
            }
            lastBeatRef.current = currentBeat;
        }
    }

  }, [currentTime, isPlaying, song, playNote, metronomeEnabled, playClick, speedMultiplier]);
}
