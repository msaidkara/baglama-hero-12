import { useEffect, useRef, useCallback, useState } from 'react';
import { type Song, type NoteData } from '../types';
import { getFrequencyFromNote } from '../utils/pitchUtils';
import SF2PlayerService from '../services/SF2PlayerService';

function getMidiNote(noteName: string, octave: number, _isQuarterTone?: boolean): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseIndex = notes.indexOf(noteName);
    if (baseIndex === -1) return 0;
    return 12 + (octave * 12) + baseIndex;
}

export function useAudioPlayer(
    song: Song,
    isPlaying: boolean,
    currentTime: number,
    speedMultiplier: number = 1.0,
    metronomeEnabled: boolean = false
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedNoteIndexRef = useRef<number>(-1);
  const masterGainRef = useRef<GainNode | null>(null);
  const lastBeatRef = useRef<number>(-1);
  const sf2PlayerRef = useRef<SF2PlayerService>(SF2PlayerService.getInstance());
  const [sf2Ready, setSf2Ready] = useState(false);

  // --- NEW SOFT METRONOME ---
  const playClick = useCallback(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    const time = ctx.currentTime;

    // Woodblock sound (High sine wave with instant decay)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.5, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(masterGainRef.current);
    
    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  const playNote = useCallback((note: NoteData) => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    
    // Scale duration by speed
    const durationSec = (note.duration / 1000) / speedMultiplier;

    if (sf2PlayerRef.current.isAvailable()) {
        const midi = getMidiNote(note.noteName, note.octave, note.isQuarterTone);
        sf2PlayerRef.current.playNote(midi, 100, durationSec, ctx.currentTime);
        return;
    }

    // Fallback (The Robotic Sound - only plays if SF2 fails)
    const freq = getFrequencyFromNote(note.noteName, note.octave, note.isQuarterTone);
    const time = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle'; // Softer than sawtooth
    osc1.frequency.setValueAtTime(freq, time);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + durationSec); 
    osc1.connect(gain);
    gain.connect(masterGainRef.current);
    osc1.start(time);
    osc1.stop(time + durationSec + 0.1);
  }, [speedMultiplier, sf2Ready]);

  useEffect(() => {
    if (isPlaying && !audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = 0.8;
        masterGainRef.current.connect(audioContextRef.current.destination);
        if (audioContextRef.current.state === 'suspended') { audioContextRef.current.resume(); }

        // ATTEMPT TO LOAD SF2 - Check your console for logs!
        console.log("Initializing SF2 Player...");
        sf2PlayerRef.current.initialize(audioContextRef.current).then(success => {
            console.log("SF2 Init Result:", success ? "SUCCESS" : "FAILED");
            setSf2Ready(success);
        });
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !audioContextRef.current) return;

    // Reset index on seek backward
    if (lastPlayedNoteIndexRef.current >= 0 && song.notes[lastPlayedNoteIndexRef.current].startTime > currentTime) {
       lastPlayedNoteIndexRef.current = -1;
    }

    let checkIndex = lastPlayedNoteIndexRef.current + 1;
    while (checkIndex < song.notes.length) {
        const note = song.notes[checkIndex];
        if (currentTime >= note.startTime) {
             // Play if within 250ms window
             if (currentTime - note.startTime < 250) {
                 playNote(note);
             }
             lastPlayedNoteIndexRef.current = checkIndex;
             checkIndex++;
        } else {
             break;
        }
    }

    if (metronomeEnabled) {
        // Since currentTime is already accelerated (Song Time), we use standard BPM
        const msPerBeat = 60000 / song.bpm;
        const currentBeat = Math.floor(currentTime / msPerBeat);
        if (currentBeat > lastBeatRef.current) {
            if (currentBeat >= 0) playClick();
            lastBeatRef.current = currentBeat;
        }
    }
  }, [currentTime, isPlaying, song, playNote, metronomeEnabled, playClick, speedMultiplier]);
}
