import type { NoteData } from '../types';

export interface Exercise {
    id: string;
    title: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    targetFinger: number; // 1=Index, 2=Middle, 3=Ring, 4=Pinky
    duration: number; // Seconds (approx)
    notes: NoteData[];
}

const createExerciseNotes = (notes: Array<{name: string, octave: number, duration: number}>, bpm: number): NoteData[] => {
    const msPerBeat = 60000 / bpm;
    let currentTime = 0;

    return notes.map(n => {
        const ms = n.duration * msPerBeat;
        const note: NoteData = {
            noteName: n.name,
            octave: n.octave,
            duration: ms,
            startTime: currentTime,
            finger: 1, // Placeholder
            status: 'PENDING'
        };
        currentTime += ms;
        return note;
    });
};

export const EXERCISES: Exercise[] = [
    {
        id: 'ex_beg_1',
        title: 'Index Finger Warmup',
        level: 'beginner',
        targetFinger: 1,
        duration: 60,
        notes: createExerciseNotes([
            // Simple Re-Mi alternation
            {name: 'D', octave: 4, duration: 1}, {name: 'E', octave: 4, duration: 1},
            {name: 'D', octave: 4, duration: 1}, {name: 'E', octave: 4, duration: 1},
            {name: 'D', octave: 4, duration: 1}, {name: 'E', octave: 4, duration: 1},
            {name: 'D', octave: 4, duration: 1}, {name: 'E', octave: 4, duration: 1},
             // Repeat a few times...
            {name: 'D', octave: 4, duration: 1}, {name: 'E', octave: 4, duration: 1},
            {name: 'D', octave: 4, duration: 1}, {name: 'E', octave: 4, duration: 1},
        ], 80)
    },
    {
        id: 'ex_int_1',
        title: 'Scale Run (Do-Re-Mi-Fa)',
        level: 'intermediate',
        targetFinger: 2,
        duration: 60,
        notes: createExerciseNotes([
            {name: 'C', octave: 4, duration: 0.5}, {name: 'D', octave: 4, duration: 0.5},
            {name: 'E', octave: 4, duration: 0.5}, {name: 'F', octave: 4, duration: 0.5},
            {name: 'G', octave: 4, duration: 1},
            {name: 'F', octave: 4, duration: 0.5}, {name: 'E', octave: 4, duration: 0.5},
            {name: 'D', octave: 4, duration: 0.5}, {name: 'C', octave: 4, duration: 0.5},
        ], 90)
    },
    {
        id: 'ex_adv_1',
        title: 'Fast Trills',
        level: 'advanced',
        targetFinger: 3,
        duration: 60,
        notes: createExerciseNotes([
            {name: 'A', octave: 4, duration: 0.25}, {name: 'B', octave: 4, duration: 0.25},
            {name: 'A', octave: 4, duration: 0.25}, {name: 'B', octave: 4, duration: 0.25},
            {name: 'A', octave: 4, duration: 0.25}, {name: 'B', octave: 4, duration: 0.25},
            {name: 'A', octave: 4, duration: 0.25}, {name: 'B', octave: 4, duration: 0.25},
        ], 120)
    }
];
