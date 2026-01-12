import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAudioInput } from '../hooks/useAudioInput';
import { useGameLoop } from '../hooks/useGameLoop';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { StaffCanvas } from '../components/StaffCanvas';
import { SummaryScreen } from '../components/SummaryScreen';
import { TeacherFeedback } from '../components/TeacherFeedback';
import { PerformanceEvaluator } from '../services/PerformanceEvaluator';
import type { Song } from '../types';
import { getFrequencyFromNote, toSolfege } from '../utils/pitchUtils';

const Container = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, #1e2025 0%, #101113 100%);
  display: flex;
  flex-direction: column;
  color: white;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  touch-action: none;
`;

const TopBar = styled.div`
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  z-index: 50;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
`;

const PitchDisplay = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #ccc;
`;

const ScoreDisplay = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #61dafb;
  text-shadow: 0 0 10px rgba(97, 218, 251, 0.5);
`;

const Button = styled.button<{ secondary?: boolean }>`
  padding: 15px 40px;
  font-size: 1.4rem;
  background: ${props => props.secondary ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #61dafb 0%, #21a1f1 100%)'};
  border: ${props => props.secondary ? '1px solid rgba(255,255,255,0.3)' : 'none'};
  border-radius: 30px;
  cursor: pointer;
  color: white;
  font-weight: bold;
  box-shadow: ${props => props.secondary ? 'none' : '0 4px 15px rgba(33, 161, 241, 0.4)'};
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }
  &:hover {
      background: ${props => props.secondary ? 'rgba(255,255,255,0.2)' : 'linear-gradient(90deg, #61dafb 0%, #21a1f1 100%)'};
  }
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.1); }
`;

const DebugPanel = styled.div`
  position: absolute;
  bottom: 80px;
  left: 20px; right: 20px;
  padding: 15px;
  background: rgba(0,0,0,0.8);
  border-radius: 12px;
  border: 1px solid #444;
  z-index: 100;
`;

const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0,0,0,0.3);
  padding: 5px 15px;
  border-radius: 20px;
`;

const FeedbackText = styled.div<{ type: string | null }>`
  position: absolute;
  top: 150px;
  font-size: 4rem;
  font-weight: 900;
  text-shadow: 0 0 10px black;
  color: ${props => {
      switch(props.type) {
          case 'PERFECT': return '#00ff00'; // Green
          case 'GOOD': return '#ccff00'; // Yellow-Green
          case 'EARLY': return '#ffff00'; // Yellow
          case 'LATE': return '#ff9900'; // Orange
          case 'MISS': return '#ff0000'; // Red
          default: return 'white';
      }
  }};
  opacity: ${props => props.type ? 1 : 0};
  transform: ${props => props.type ? 'scale(1.2)' : 'scale(1)'};
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
  z-index: 100;
`;

interface GameProps {
    song: Song;
    onExit: () => void;
}

export function Game({ song, onExit }: GameProps) {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const [isListenOnlyMode, setIsListenOnlyMode] = useState(false);
  const [simFreq, setSimFreq] = useState<number | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [targetBpm, setTargetBpm] = useState(song.bpm);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);

  // Evaluator Instance
  const evaluatorRef = useRef(new PerformanceEvaluator());

  useEffect(() => {
    setTargetBpm(song.bpm);
  }, [song]);

  const speed = targetBpm / song.bpm;
  
  // Stats
  const [stats, setStats] = useState({
      hits: 0,
      misses: 0,
      early: 0,
      late: 0,
      perfect: 0,
      missedNotesMap: new Map<string, number>()
  });

  // Note Status Tracking for Visualization
  const [noteStatuses, setNoteStatuses] = useState<Map<number, 'HIT' | 'MISS' | 'PENDING'>>(new Map());

  // Teacher Logic State
  const [teacherState, setTeacherState] = useState<{ message: string | null, mood: 'happy' | 'neutral' | 'concerned' }>({ message: null, mood: 'neutral' });
  const recentHistoryRef = useRef<Array<{type: 'HIT' | 'MISS', timing?: 'EARLY' | 'LATE' | 'PERFECT' | 'GOOD'}>>([]);

  // Game Loop
  const isPlaying = gameState === 'PLAYING';
  const currentTime = useGameLoop(isPlaying, speed);

  // Audio Player (Synthesizer)
  useAudioPlayer(song, isPlaying, currentTime, speed, metronomeEnabled);
  
  // Audio Input
  // If ListenOnly Mode is active, we do NOT want to listen to microphone.
  // However, `useAudioInput` hook handles mic stream.
  // We pass `isListening && !isListenOnlyMode`.
  const pitch = useAudioInput(isListening && !isListenOnlyMode, simFreq);

  // Scoring
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'PERFECT' | 'GOOD' | 'EARLY' | 'LATE' | 'MISS' | null>(null);
  
  // Check for Song End
  useEffect(() => {
      if (gameState === 'PLAYING') {
          const lastNote = song.notes[song.notes.length - 1];
          const endTime = lastNote.startTime + lastNote.duration + 1000;
          if (currentTime > endTime) {
              // eslint-disable-next-line react-hooks/set-state-in-effect
              setGameState('FINISHED');
              setIsListening(false);
          }
      }
  }, [currentTime, gameState, song]);

  const updateTeacher = () => {
      if (isListenOnlyMode) return; // No teacher in Listen Mode

      const history = recentHistoryRef.current;
      if (history.length < 5) return;

      // Analyze last 5
      const last5 = history.slice(-5);
      
      const misses = last5.filter(h => h.type === 'MISS').length;
      const lates = last5.filter(h => h.timing === 'LATE').length;
      const earlies = last5.filter(h => h.timing === 'EARLY').length;
      const hits = last5.filter(h => h.type === 'HIT').length;

      let msg = null;
      let mood: 'happy' | 'neutral' | 'concerned' = 'neutral';

      if (misses >= 3) {
          msg = "Focus!";
          mood = 'concerned';
      } else if (lates >= 2) {
          msg = "Get fast!";
          mood = 'concerned';
      } else if (earlies >= 2) {
          msg = "Slow down!";
          mood = 'concerned';
      } else if (hits === 5) {
          msg = "That's good!";
          mood = 'happy';
      }

      if (msg) {
          setTeacherState({ message: msg, mood });
          recentHistoryRef.current = [];
      }
  };

  // Gameplay Logic using PerformanceEvaluator
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // IF Listen Only Mode, we don't score or miss.
    if (isListenOnlyMode) return;

    const HIT_WINDOW = 200; // Legacy window for Timeout check
    const EVAL_WINDOW = 500; // Broad window to start evaluating
    
    // We iterate to find unprocessed notes that should be handled
    const newStatuses = new Map(noteStatuses);
    let changed = false;
    let eventOccurred = false;

    song.notes.forEach((note, index) => {
        if (newStatuses.has(index)) return; // Already processed

        // 1. Check if Missed (Time passed beyond recovery)
        if (currentTime > note.startTime + note.duration + HIT_WINDOW) {
            newStatuses.set(index, 'MISS');
            changed = true;
            eventOccurred = true;
            
            recentHistoryRef.current.push({ type: 'MISS' });

            setFeedback('MISS');
            setStats(s => {
                const newMap = new Map(s.missedNotesMap);
                newMap.set(note.noteName, (newMap.get(note.noteName) || 0) + 1);
                return { ...s, misses: s.misses + 1, missedNotesMap: newMap };
            });
            setTimeout(() => setFeedback(null), 500);
            return;
        }

        // 2. Check for Hit using Evaluator
        // We only check if we are within a reasonable range of the note
        if (currentTime >= note.startTime - EVAL_WINDOW && currentTime <= note.startTime + note.duration) {

            const targetFreq = getFrequencyFromNote(note.noteName, note.octave, note.isQuarterTone);
            const detectedFreq = pitch ? pitch.frequency : null;

            const result = evaluatorRef.current.evaluate(
                targetFreq,
                detectedFreq,
                note.startTime,
                currentTime
            );

            // We only act if the result is a successful hit (PERFECT, GOOD, EARLY, LATE)
            // We ignore WRONG_NOTE or MISS (due to timing/silence) to allow user to correct themselves
            // until the timeout logic above kicks in.
            if (['PERFECT', 'GOOD', 'EARLY', 'LATE'].includes(result.status)) {
                newStatuses.set(index, 'HIT');
                changed = true;
                eventOccurred = true;

                const timing = result.status as 'PERFECT' | 'GOOD' | 'EARLY' | 'LATE';
                
                recentHistoryRef.current.push({ type: 'HIT', timing });

                setScore(s => s + result.scoreDelta);
                setFeedback(timing);
                
                setStats(s => ({
                    ...s,
                    hits: s.hits + 1,
                    perfect: timing === 'PERFECT' ? s.perfect + 1 : s.perfect,
                    early: timing === 'EARLY' ? s.early + 1 : s.early,
                    late: timing === 'LATE' ? s.late + 1 : s.late
                }));

                setTimeout(() => setFeedback(null), 800);
            }
        }
    });

    if (changed) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNoteStatuses(newStatuses);
    }

    if (eventOccurred) {
        updateTeacher();
    }

  }, [currentTime, pitch, gameState, noteStatuses, song, isListenOnlyMode]);

  const startGame = () => {
    setGameState('PLAYING');
    setIsListening(true);
    setIsListenOnlyMode(false);
    recentHistoryRef.current = [];
    setTeacherState({ message: null, mood: 'neutral' });
  };

  const startListenMode = () => {
    setGameState('PLAYING');
    setIsListening(true); // "Listening" in context of Game Loop running, but...
    // Actually, useAudioInput needs to know if it should use Mic.
    setIsListenOnlyMode(true);
    // Logic: `useAudioInput(isListening && !isListenOnlyMode)` -> `true && false` -> `false` (No Mic).

    recentHistoryRef.current = [];
    setTeacherState({ message: null, mood: 'neutral' });
  };

  const stopGame = () => {
    setGameState('IDLE');
    setIsListening(false);
    setIsListenOnlyMode(false);
    setNoteStatuses(new Map());
    setScore(0);
    setStats({ hits: 0, misses: 0, early: 0, late: 0, perfect: 0, missedNotesMap: new Map() });
    setTeacherState({ message: null, mood: 'neutral' });
  };

  const handleSimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (val === 0) setSimFreq(null);
    else setSimFreq(val);
  };

  return (
    <Container>
      <TopBar>
         <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
             <IconButton onClick={onExit}>← Menu</IconButton>
             <div style={{fontWeight: 'bold'}}>
                 {song.title} {isListenOnlyMode && <span style={{color: '#61dafb', fontSize: '0.8rem'}}>(Listen Mode)</span>}
             </div>
         </div>
         
         <SpeedControl>
             <span style={{fontSize: '0.9rem', color: '#ccc'}}>BPM:</span>
             <input 
                type="number" 
                min="40" 
                max="300" 
                value={Math.round(targetBpm)} 
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setTargetBpm(val);
                }}
                style={{
                    width: '60px', 
                    background: 'rgba(255,255,255,0.1)', 
                    border: '1px solid #555', 
                    color: 'white', 
                    textAlign: 'center', 
                    borderRadius: '4px',
                    padding: '4px'
                }}
             />
         </SpeedControl>

         <div style={{flex: 1}} />

         {!isListenOnlyMode && <ScoreDisplay>{score}</ScoreDisplay>}
         
         <div style={{width: '20px'}} />
         
         <div style={{display: 'flex', gap: '10px'}}>
             <IconButton onClick={() => setMetronomeEnabled(!metronomeEnabled)} style={{
                 background: metronomeEnabled ? 'rgba(33, 161, 241, 0.3)' : 'transparent',
                 border: metronomeEnabled ? '1px solid #21a1f1' : '1px solid rgba(255,255,255,0.2)'
             }}>
                 Metronome
             </IconButton>
             <IconButton onClick={() => setShowDebug(!showDebug)}>
                 {showDebug ? "Hide Debug" : "Config"}
             </IconButton>
         </div>
      </TopBar>
      
      <MainContent>
        {/* Visualizer Area */}
        <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <StaffCanvas 
                song={song} 
                currentTime={currentTime} 
                detectedNote={pitch ? pitch.noteName : null}
                noteStatuses={noteStatuses}
            />
            <FeedbackText type={feedback}>{feedback}</FeedbackText>
            
            <TeacherFeedback 
                message={teacherState.message} 
                mood={teacherState.mood} 
                onComplete={() => setTeacherState(prev => ({ ...prev, message: null }))}
            />

            {/* Start Button Overlay */}
            {!isPlaying && gameState !== 'FINISHED' && (
                <div style={{position: 'absolute', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '20px'}}>
                        <Button onClick={startGame}>Start Song</Button>
                        <Button secondary onClick={startListenMode}>Dinle</Button>
                    </div>
                    <div style={{background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '10px', fontSize: '0.9rem'}}>
                        Tip: Use headphones for best results
                    </div>
                </div>
            )}

            {/* Stop Button (Top Right Absolute) */}
            {isPlaying && (
                <div style={{position: 'absolute', top: 20, right: 20, zIndex: 20}}>
                   <IconButton onClick={stopGame} style={{background: 'rgba(255,0,0,0.3)'}}>Stop</IconButton>
                </div>
            )}

            {gameState === 'FINISHED' && (
                <SummaryScreen 
                    score={score}
                    totalNotes={stats.hits + stats.misses}
                    hits={stats.hits}
                    misses={stats.misses}
                    early={stats.early}
                    late={stats.late}
                    perfect={stats.perfect}
                    missedNotesMap={stats.missedNotesMap}
                    onRestart={stopGame}
                />
            )}
        </div>

        {/* Bottom Status Bar */}
        <div style={{height: '60px', width: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <PitchDisplay>
            {isListenOnlyMode ? (
                 <span style={{opacity: 0.7, fontStyle: 'italic'}}>Listen Mode Active - Audio Only</span>
            ) : pitch ? (
                <span>
                    {toSolfege(pitch.noteName)}{pitch.isQuarterTone ? '+' : ''}
                    <span style={{fontSize: '0.8rem', color: '#666', marginLeft: '5px'}}>
                        ({pitch.frequency.toFixed(0)} Hz)
                    </span>
                </span>
            ) : (
                <span style={{opacity: 0.5}}>Ready...</span>
            )}
            </PitchDisplay>
        </div>
      </MainContent>

      {showDebug && (
      <DebugPanel>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
             <h3>Simulation</h3>
             <IconButton onClick={() => setShowDebug(false)}>X</IconButton>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1000" 
          step="1" 
          defaultValue="0" 
          onChange={handleSimChange} 
          style={{width: '100%', height: '40px'}} 
        />
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '15px'}}>
          <button onClick={() => setSimFreq(440)} style={{padding: '10px'}}>La (A4)</button>
          <button onClick={() => setSimFreq(480)} style={{padding: '10px'}}>Si+ (Segah)</button>
          <button onClick={() => setSimFreq(523)} style={{padding: '10px'}}>Do (C5)</button>
        </div>
      </DebugPanel>
      )}
    </Container>
  );
}
