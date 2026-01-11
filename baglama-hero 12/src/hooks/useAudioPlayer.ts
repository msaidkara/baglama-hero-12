import { useEffect, useRef, useCallback } from 'react';
import { type Song, type NoteData } from '../types';
import { getFrequencyFromNote } from '../utils/pitchUtils';

export function useAudioPlayer(song: Song, isPlaying: boolean, currentTime: number, speed: number = 1.0, metronomeEnabled: boolean = false) {
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
    // We let the note ring naturally like a plucked string, but ensure it doesn't play forever.
    // Minimum ring time for character.
    const duration = Math.max((note.duration / 1000) / speed, 0.5); 

    // Bağlama Synthesis
    // 1. Sawtooth for the "twang" (Harmonics)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    // 2. Pulse/Square for body (optional, but Square adds "hollow" sound)
    // Let's stick to Saw + Sine sub
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, time); // Fundamental
    osc2.detune.value = 3; // Slight Chorus

    // Filter: The most important part for Pluck sound.
    // Lowpass that starts OPEN and closes RAPIDLY.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 3; // Resonance creates the "metallic" ping
    filter.frequency.setValueAtTime(4000, time); // Start bright
    filter.frequency.exponentialRampToValueAtTime(freq, time + 0.15); // Snap down to fundamental

    // Amp Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.005); // Instant attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0); // Long exponential decay

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);

    osc1.start(time);
    osc2.start(time);
    // Stop oscillators after decay is done
    osc1.stop(time + duration + 1.0);
    osc2.stop(time + duration + 1.0);

  }, [speed]);

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
    const nextIndex = lastPlayedNoteIndexRef.current + 1;
    if (nextIndex < song.notes.length) {
        const note = song.notes[nextIndex];
        // Trigger slightly early? No, precision.
        if (currentTime >= note.startTime) {
            playNote(note);
            lastPlayedNoteIndexRef.current = nextIndex;
        }
    }

    // 2. Metronome Logic
    if (metronomeEnabled) {
        // Beat Duration in Song Time (ms)
        const msPerBeat = 60000 / song.bpm;
        // Current Beat Index
        const currentBeat = Math.floor(currentTime / msPerBeat);
        
        if (currentBeat > lastBeatRef.current) {
            // Don't play click at t=0 if it conflicts with start? 
            // Usually clicks on 1, 2, 3, 4.
            // t=0 is beat 0.
            if (currentBeat >= 0) {
                 playClick();
            }
            lastBeatRef.current = currentBeat;
        }
    }

  }, [currentTime, isPlaying, song, playNote, metronomeEnabled, playClick]);
}
