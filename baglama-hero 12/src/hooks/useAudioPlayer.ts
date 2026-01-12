import { useEffect, useRef, useCallback, useState } from 'react';
import { type Song, type NoteData } from '../types';
import { getFrequencyFromNote } from '../utils/pitchUtils';
import SF2PlayerService from '../services/SF2PlayerService';

// MIDI mapping helper
function getMidiNote(noteName: string, octave: number, _isQuarterTone?: boolean): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseIndex = notes.indexOf(noteName);
    if (baseIndex === -1) return 0;

    // MIDI Note: C4 = 60
    // C0 = 12
    let midi = 12 + (octave * 12) + baseIndex;

    // Quarter tones logic:
    // In standard MIDI, we can't do quarter tones easily without pitch bend or tuning.
    // For now, we map quarter tones to the nearest semitone or keep it natural?
    // User requested SF2 support. Baglama SF2s usually have specific mapping or we pitch bend.
    // Or maybe the SF2 has samples for quarter tones?
    // If the note is "quarter tone" (e.g. E half flat), usually it is between E and Eb.
    // For this implementation, we will ignore quarter tone pitch bending unless we want to implement pitch bend messages.
    // Given the constraints and "complete overhaul", let's try to do it right if possible, but basic mapping first.

    return midi;
}

export function useAudioPlayer(
    song: Song,
    isPlaying: boolean,
    currentTime: number, // Song Time (accumulated)
    speedMultiplier: number = 1.0,
    metronomeEnabled: boolean = false
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedNoteIndexRef = useRef<number>(-1);
  const masterGainRef = useRef<GainNode | null>(null);
  const lastBeatRef = useRef<number>(-1);
  const sf2PlayerRef = useRef<SF2PlayerService>(SF2PlayerService.getInstance());
  const [sf2Ready, setSf2Ready] = useState(false);

  const playClick = useCallback(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    const time = ctx.currentTime;

    // Metronome: Louder Woodblock
    // Woodblock synthesis: High pitch sine/triangle with very short decay
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(1200, time + 0.01); // Chirp

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.8, time + 0.005); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1); // Decay

    osc.connect(gain);
    gain.connect(masterGainRef.current);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const playNote = useCallback((note: NoteData) => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    
    // Duration Logic
    // note.duration is in ms.
    // If speed is 2x, duration should be half in real time?
    // Yes. Playback duration = note.duration / speedMultiplier.
    // However, for SF2, we play the sample.
    const durationSec = (note.duration / 1000) / speedMultiplier;

    if (sf2PlayerRef.current.isAvailable()) {
        const midi = getMidiNote(note.noteName, note.octave, note.isQuarterTone);
        // Play via SF2
        sf2PlayerRef.current.playNote(midi, 100, durationSec, ctx.currentTime);
        return;
    }

    // Fallback Oscillator
    const freq = getFrequencyFromNote(note.noteName, note.octave, note.isQuarterTone);
    const time = ctx.currentTime;

    // Baglama Synthesis (Old Logic)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.value = 3;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 3;
    filter.frequency.setValueAtTime(4000, time);
    filter.frequency.exponentialRampToValueAtTime(freq, time + 0.15);

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
    osc1.stop(time + durationSec + 1.0);
    osc2.stop(time + durationSec + 1.0);

  }, [speedMultiplier, sf2Ready]);

  // Initialization
  useEffect(() => {
    if (isPlaying && !audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = 0.5; // Slightly louder
        masterGainRef.current.connect(audioContextRef.current.destination);

        // Resume context if needed (browsers block autoplay)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Init SF2
        sf2PlayerRef.current.initialize(audioContextRef.current).then(success => {
            setSf2Ready(success);
        });
    }
  }, [isPlaying]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
        lastPlayedNoteIndexRef.current = -1;
        lastBeatRef.current = -1;
        return;
    }

    if (!audioContextRef.current) return;

    // 1. Note Playback
    let checkIndex = lastPlayedNoteIndexRef.current + 1;
    while (checkIndex < song.notes.length) {
        const note = song.notes[checkIndex];

        // Note: note.startTime is in SONG TIME (ms)
        // currentTime is current SONG TIME (ms)

        // With delta time accumulation, currentTime is accurate to song position.
        // We trigger if we are at or past the note time.
        // To avoid double triggering or missing, we track index.

        if (currentTime >= note.startTime) {
             playNote(note);
             lastPlayedNoteIndexRef.current = checkIndex;
             checkIndex++;
        } else {
             break;
        }
    }

    // 2. Metronome
    if (metronomeEnabled) {
        // Beats based on song time
        // Song Bpm is constant.
        // We just track beats based on currentTime (Song Time).

        const msPerBeat = 60000 / song.bpm;
        const currentBeat = Math.floor(currentTime / msPerBeat);
        
        if (currentBeat > lastBeatRef.current) {
            // Only play if we are moving forward and it's a new beat
            if (currentBeat >= 0) {
                 playClick();
            }
            lastBeatRef.current = currentBeat;
        }
    }
  }, [currentTime, isPlaying, song, playNote, metronomeEnabled, playClick]);
}
