import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { type Song } from '../types';
import { toSolfege } from '../utils/pitchUtils';

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  background: transparent;
  position: relative;
  overflow: hidden;
`;

const PlayLine = styled.div`
  position: absolute;
  left: 200px; /* The "Hit" zone */
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.8), transparent);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  z-index: 10;
  
  &.vibrating {
     animation: vibrate 0.1s infinite;
  }

  @keyframes vibrate {
     0% { transform: translateX(0); }
     25% { transform: translateX(-2px); }
     75% { transform: translateX(2px); }
     100% { transform: translateX(0); }
  }
`;

interface StaffCanvasProps {
  song: Song;
  currentTime: number; // in ms (Real Time)
  detectedNote: string | null;
  noteStatuses?: Map<number, 'HIT' | 'MISS' | 'PENDING'>;
  speedMultiplier?: number;
}

// Map notes to Y positions.
const BASE_NOTE_MIDI = 60; // C4
const NOTE_HEIGHT = 10; // Pixels per semitone step
const CENTER_Y = 200;

function getNoteY(noteName: string, octave: number, isQuarterTone?: boolean) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const semitoneIndex = notes.indexOf(noteName);
  if (semitoneIndex === -1) return CENTER_Y;

  const midi = octave * 12 + semitoneIndex;
  const diff = midi - BASE_NOTE_MIDI;
  
  let y = CENTER_Y - (diff * NOTE_HEIGHT);
  
  if (isQuarterTone) {
     y -= (NOTE_HEIGHT / 2); 
  }

  return y;
}

export const StaffCanvas: React.FC<StaffCanvasProps> = ({ song, currentTime, detectedNote, noteStatuses, speedMultiplier = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize canvas
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

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Staff Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    for (let i = -8; i <= 8; i++) {
        const y = CENTER_Y + (i * 12 * NOTE_HEIGHT);
        if (y > 0 && y < canvas.height) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Draw Notes
    const PX_PER_MS = 0.3;
    const HIT_X = 200;

    song.notes.forEach((note, index) => {
        // FIXED: Scale time logic
        const targetStartTime = note.startTime / speedMultiplier;
        const targetDuration = note.duration / speedMultiplier;

        const x = HIT_X + (targetStartTime - currentTime) * PX_PER_MS;

        // VISUALS: Staccato Feel
        // Cap note width to 80% of duration to make them look distinct.
        // Also ensure a minimum width for visibility.
        const fullWidth = targetDuration * PX_PER_MS;
        const width = Math.max(fullWidth * 0.8, 5);

        const y = getNoteY(note.noteName, note.octave, note.isQuarterTone);

        // Optimization
        if (x + width < 0 || x > canvas.width) return;

        // Visual Active Check uses Real Time vs Scaled Time
        // Note: targetDuration is the full duration, even if we draw it smaller.
        const isActive = (currentTime >= targetStartTime && currentTime <= targetStartTime + targetDuration);
        
        // Determine Color based on Status
        let noteColor = '#cccccc';
        const fingerColors = ['#cccccc', '#4db8ff', '#ffd700', '#ff8c00', '#da70d6', '#32cd32']; 

        const status = noteStatuses?.get(index);

        if (status === 'HIT') {
             noteColor = '#00ff00'; // Green
        } else if (status === 'MISS') {
             noteColor = '#ff0000'; // Red
        } else {
            // Pending
            noteColor = note.finger !== undefined && note.finger >= 0 && note.finger <= 5 
                ? fingerColors[note.finger] 
                : (note.isQuarterTone ? '#ff9900' : '#00ccff');
        }

        // Highlight Active
        if (isActive && status !== 'MISS') {
             ctx.shadowBlur = 15;
             ctx.shadowColor = noteColor;
             ctx.fillStyle = 'white'; // Flash white on active
        } else {
             ctx.fillStyle = noteColor;
             ctx.shadowBlur = 0;
        }
        
        // Draw Note Bar
        ctx.beginPath();
        // Use standard rect or rounded
        ctx.roundRect(x, y - 8, width, 16, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label (Note Name)
        ctx.fillStyle = 'black';
        ctx.font = 'bold 10px Arial';
        const label = `${toSolfege(note.noteName)}${note.isQuarterTone ? '+' : ''}`;

        // Only draw text if width permits
        if (width > 20) {
            ctx.fillText(label, x + 5, y + 4);
        }

        // Finger Number
        if (note.finger !== undefined) {
             ctx.beginPath();
             ctx.arc(x - 12, y, 8, 0, 2 * Math.PI);
             ctx.fillStyle = noteColor; 
             ctx.fill();
             ctx.strokeStyle = '#fff';
             ctx.stroke();
             
             ctx.fillStyle = 'black';
             ctx.font = 'bold 11px Arial';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(note.finger.toString(), x - 12, y);
             
             // Reset Align
             ctx.textAlign = 'start';
             ctx.textBaseline = 'alphabetic';
        }

        // Plectrum Direction
        if (note.plectrum) {
            const plectrumX = x + width + 10;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const symbol = note.plectrum === 'DOWN' ? 'V' : '^';
            ctx.fillText(symbol, plectrumX, y);
            
             // Reset Align
             ctx.textAlign = 'start';
             ctx.textBaseline = 'alphabetic';
        }
        
        // Technique (e.g., Trill)
        if (note.technique) {
             if (note.technique === 'trill') {
                 // FIXED: Draw Wavy Line
                 ctx.strokeStyle = '#fff';
                 ctx.lineWidth = 2;
                 ctx.beginPath();
                 const waveY = y - 14;
                 const waveWidth = Math.min(width, 40); // Cap width for icon
                 const startX = x + (width - waveWidth) / 2;

                 for (let i = 0; i <= waveWidth; i+=4) {
                     const wy = waveY + Math.sin(i * 0.8) * 3;
                     if (i===0) ctx.moveTo(startX + i, wy);
                     else ctx.lineTo(startX + i, wy);
                 }
                 ctx.stroke();
             } else if (note.technique !== 'normal') {
                 ctx.fillStyle = '#aaaaaa';
                 ctx.font = 'italic 10px Arial';
                 ctx.textAlign = 'center';
                 // Center relative to visible width
                 ctx.fillText(note.technique, x + width / 2, y - 12);
                 ctx.textAlign = 'start';
             }
        }

        // Lyric
        if (note.lyric) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            // Center relative to visible width
            ctx.fillText(note.lyric, x + width / 2, y + 25);
            ctx.textAlign = 'start';
        }
    });

  }, [song, currentTime, detectedNote, noteStatuses, speedMultiplier]);

  const isVibrating = detectedNote !== null && detectedNote !== undefined;

  return (
    <CanvasContainer ref={containerRef}>
      <PlayLine className={isVibrating ? "vibrating" : ""} />
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%' }}
      />
    </CanvasContainer>
  );
};
