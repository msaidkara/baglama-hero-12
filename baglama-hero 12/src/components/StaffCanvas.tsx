import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { type Song } from '../types';
import { toSolfege } from '../utils/pitchUtils';

const CanvasContainer = styled.div`
  width: 100%; height: 100%; background: transparent; position: relative; overflow: hidden;
`;

const PlayLine = styled.div`
  position: absolute; left: 200px; top: 0; bottom: 0; width: 4px;
  background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.8), transparent);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5); z-index: 10;
  &.vibrating { animation: vibrate 0.1s infinite; }
  @keyframes vibrate { 0% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } 100% { transform: translateX(0); } }
`;

interface StaffCanvasProps {
  song: Song;
  currentTime: number;
  detectedNote: string | null;
  noteStatuses?: Map<number, 'HIT' | 'MISS' | 'PENDING'>;
  speedMultiplier?: number;
}

const BASE_NOTE_MIDI = 60;
const NOTE_HEIGHT = 10;
const CENTER_Y = 200;

function getNoteY(noteName: string, octave: number, isQuarterTone?: boolean) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const semitoneIndex = notes.indexOf(noteName);
  if (semitoneIndex === -1) return CENTER_Y;
  const midi = octave * 12 + semitoneIndex;
  const diff = midi - BASE_NOTE_MIDI;
  let y = CENTER_Y - (diff * NOTE_HEIGHT);
  if (isQuarterTone) y -= (NOTE_HEIGHT / 2);
  return y;
}

export const StaffCanvas: React.FC<StaffCanvasProps> = ({ song, currentTime, detectedNote, noteStatuses }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     const resize = () => {
         if (canvasRef.current && containerRef.current) {
             canvasRef.current.width = containerRef.current.clientWidth;
             canvasRef.current.height = containerRef.current.clientHeight;
         }
     };
     window.addEventListener('resize', resize);
     resize();
     return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Staff Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    for (let i = -8; i <= 8; i++) {
        const y = CENTER_Y + (i * 12 * NOTE_HEIGHT);
        if (y > 0 && y < canvas.height) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }
    
    // Draw Notes
    const PX_PER_MS = 0.3; // Speed of scroll
    const HIT_X = 200;

    song.notes.forEach((note, index) => {
        // FIX IS HERE: Do NOT divide by speedMultiplier.
        // currentTime is already slowed down by the engine.
        // We just draw the note where it belongs on the timeline.
        const targetStartTime = note.startTime;
        const targetDuration = note.duration;

        // Calculate position relative to current time
        const x = HIT_X + (targetStartTime - currentTime) * PX_PER_MS;

        // Visual width setup
        const fullWidth = targetDuration * PX_PER_MS;
        const width = Math.max(fullWidth * 0.8, 5);
        const y = getNoteY(note.noteName, note.octave, note.isQuarterTone);

        if (x + width < 0 || x > canvas.width) return;

        const isActive = (currentTime >= targetStartTime && currentTime <= targetStartTime + targetDuration);
        
        let noteColor = '#cccccc';
        const fingerColors = ['#cccccc', '#4db8ff', '#ffd700', '#ff8c00', '#da70d6', '#32cd32']; 
        const status = noteStatuses?.get(index);

        if (status === 'HIT') noteColor = '#00ff00';
        else if (status === 'MISS') noteColor = '#ff0000';
        else noteColor = note.finger !== undefined && note.finger >= 0 && note.finger <= 5 ? fingerColors[note.finger] : (note.isQuarterTone ? '#ff9900' : '#00ccff');

        if (isActive && status !== 'MISS') {
             ctx.shadowBlur = 15; ctx.shadowColor = noteColor; ctx.fillStyle = 'white';
        } else {
             ctx.fillStyle = noteColor; ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.roundRect(x, y - 8, width, 16, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Note Label
        ctx.fillStyle = 'black';
        ctx.font = 'bold 10px Arial';
        const label = `${toSolfege(note.noteName)}${note.isQuarterTone ? '+' : ''}`;
        if (width > 20) ctx.fillText(label, x + 5, y + 4);

        // Finger Number
        if (note.finger !== undefined) {
             ctx.beginPath(); ctx.arc(x - 12, y, 8, 0, 2 * Math.PI);
             ctx.fillStyle = noteColor; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke();
             ctx.fillStyle = 'black'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
             ctx.fillText(note.finger.toString(), x - 12, y);
             ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
        }
    });

  }, [song, currentTime, detectedNote, noteStatuses]); // Removed speedMultiplier dependency for rendering logic

  const isVibrating = detectedNote !== null && detectedNote !== undefined;

  return (
    <CanvasContainer ref={containerRef}>
      <PlayLine className={isVibrating ? "vibrating" : ""} />
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </CanvasContainer>
  );
};
