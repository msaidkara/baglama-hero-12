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
    return 12 + (octave * 12) + baseIndex;
}

export function useAudioPlayer(
    song: Song,
    isPlaying: boolean,
    currentTime: number, // Song Time (accumulated ms)
    speedMultiplier: number = 1.0,
    metronomeEnabled: boolean = false
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedNoteIndexRef = useRef<number>(-1);
  const masterGainRef = useRef<GainNode | null>(null);
  const lastBeatRef = useRef<number>(-1);
  const sf2PlayerRef = useRef<SF2PlayerService>(SF2PlayerService.getInstance());
  const [sf2Ready, setSf2Ready] = useState(false);

  // --- METRONOME SESİ (GÜÇLENDİRİLDİ) ---
  const playClick = useCallback(() => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    const time = ctx.currentTime;

    // Daha net duyulan "WOODBLOCK" tarzı ses
    const osc = ctx.createOscillator();
    osc.type = 'square'; // Sine yerine Square (Daha keskin duyulur)
    osc.frequency.setValueAtTime(1000, time);
    osc.frequency.exponentialRampToValueAtTime(600, time + 0.05);

    const gain = ctx.createGain();
    // Ses seviyesini artırdım (0.8 -> 1.0)
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1.0, time + 0.001); 
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(masterGainRef.current);
    
    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  // --- NOTA ÇALMA ---
  const playNote = useCallback((note: NoteData) => {
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    
    // Duration Logic: Hıza göre süreyi kısalt
    // Çakışmayı önlemek için hafif bir tolerans (-0.05) ekleyebiliriz ama şimdilik matematiksel duralım.
    const durationSec = (note.duration / 1000) / speedMultiplier;

    if (sf2PlayerRef.current.isAvailable()) {
        const midi = getMidiNote(note.noteName, note.octave, note.isQuarterTone);
        sf2PlayerRef.current.playNote(midi, 100, durationSec, ctx.currentTime);
        return;
    }

    // Fallback Oscillator (SF2 yoksa çalışır)
    const freq = getFrequencyFromNote(note.noteName, note.octave, note.isQuarterTone);
    const time = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth'; // Bağlama tınısına daha yakın
    osc1.frequency.setValueAtTime(freq, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.01); // Attack
    // Decay süresini kısalttım, notalar birbirine girmesin
    gain.gain.exponentialRampToValueAtTime(0.001, time + durationSec); 

    osc1.connect(gain);
    gain.connect(masterGainRef.current);

    osc1.start(time);
    osc1.stop(time + durationSec + 0.1);
  }, [speedMultiplier, sf2Ready]);

  // --- BAŞLATMA VE CONTEXT ---
  useEffect(() => {
    if (isPlaying && !audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.gain.value = 0.8; // Genel ses seviyesi
        masterGainRef.current.connect(audioContextRef.current.destination);

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        sf2PlayerRef.current.initialize(audioContextRef.current).then(success => {
            setSf2Ready(success);
        });
    }
  }, [isPlaying]);

  // --- OYNATMA DÖNGÜSÜ ---
  useEffect(() => {
    if (!isPlaying) {
        // Durduğunda sayaçları sıfırlama, devam etsin diye olduğu yerde bırakıyoruz
        // Ama şarkı başa sarılırsa bu dışarıdan kontrol edilmeli.
        // Şimdilik sadece durunca çalmayı kesiyoruz.
        return;
    }
    if (!audioContextRef.current) return;

    // 1. Note Playback
    // Eğer currentTime geriye gittiyse (seek yapıldıysa) indexi resetle
    // Basit bir optimizasyon:
    if (lastPlayedNoteIndexRef.current >= 0 && song.notes[lastPlayedNoteIndexRef.current].startTime > currentTime) {
       lastPlayedNoteIndexRef.current = -1;
    }

    let checkIndex = lastPlayedNoteIndexRef.current + 1;
    while (checkIndex < song.notes.length) {
        const note = song.notes[checkIndex];
        
        // Tolerans penceresi: Eğer visual lag varsa notayı kaçırmayalım
        if (currentTime >= note.startTime) {
             // Çok eski notaları çalma (örn: 100ms'den eski)
             if (currentTime - note.startTime < 200) {
                 playNote(note);
             }
             lastPlayedNoteIndexRef.current = checkIndex;
             checkIndex++;
        } else {
             break;
        }
    }

    // 2. Metronome Logic (DÜZELTİLDİ)
    if (metronomeEnabled) {
        // HIZ ÇARPANI ARTIK HESABA KATILIYOR!
        // effectiveBpm = song.bpm * speedMultiplier
        const effectiveBpm = song.bpm * speedMultiplier;
        const msPerBeat = 60000 / effectiveBpm;
        
        const currentBeat = Math.floor(currentTime / msPerBeat);
                
        if (currentBeat > lastBeatRef.current) {
            if (currentBeat >= 0) {
                 playClick();
            }
            lastBeatRef.current = currentBeat;
        }
    }
  }, [currentTime, isPlaying, song, playNote, metronomeEnabled, playClick, speedMultiplier]); // speedMultiplier eklendi!
}
