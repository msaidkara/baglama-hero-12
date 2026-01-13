import { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAudioInput } from '../hooks/useAudioInput';
import { useGameLoop } from '../hooks/useGameLoop';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { StaffCanvas } from '../components/StaffCanvas';
import { SummaryScreen } from '../components/SummaryScreen';
import { TeacherFeedback } from '../components/TeacherFeedback';
import { PerformanceEvaluator } from '../services/PerformanceEvaluator';
import type { Song } from '../types';
import { getFrequencyFromNote, toSolfege } from '../utils/pitchUtils';

// ... (Keep all your existing Styled Components exactly as they are) ...
// Ensure FeedbackText is the mobile-responsive version we added earlier.
const Container = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #1e2025 0%, #101113 100%); display: flex; flex-direction: column; color: white; font-family: 'Segoe UI', sans-serif; overflow: hidden; touch-action: none; `;
const TopBar = styled.div` height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 50; overflow-x: auto; white-space: nowrap; `;
const MainContent = styled.div` flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; width: 100%; `;
const PitchDisplay = styled.div` font-size: 1.2rem; font-weight: 600; color: #ccc; `;
const ScoreContainer = styled.div` display: flex; flex-direction: column; align-items: flex-end; `;
const ScoreDisplay = styled.div` font-size: 2.2rem; font-weight: 900; color: #61dafb; text-shadow: 0 0 15px rgba(97, 218, 251, 0.6); font-family: 'Courier New', monospace; letter-spacing: -1px; `;
const pulse = keyframes` 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } `;
const fireAnim = keyframes` 0% { text-shadow: 0 0 10px #ff0000; color: #ffcc00; } 50% { text-shadow: 0 0 20px #ff6600; color: #ffff00; } 100% { text-shadow: 0 0 10px #ff0000; color: #ffcc00; } `;
const ComboDisplay = styled.div<{ $isFire: boolean }>` font-size: 1.5rem; font-weight: 800; color: ${props => props.$isFire ? '#ffcc00' : '#aaa'}; animation: ${props => props.$isFire ? css`${pulse} 0.5s infinite, ${fireAnim} 1s infinite` : 'none'}; transition: all 0.2s; `;
const Button = styled.button<{ secondary?: boolean }>` padding: 15px 30px; font-size: 1.2rem; background: ${props => props.secondary ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #61dafb 0%, #21a1f1 100%)'}; border: ${props => props.secondary ? '1px solid rgba(255,255,255,0.3)' : 'none'}; border-radius: 30px; cursor: pointer; color: white; font-weight: bold; box-shadow: ${props => props.secondary ? 'none' : '0 4px 15px rgba(33, 161, 241, 0.4)'}; transition: transform 0.2s; margin: 5px; &:active { transform: scale(0.95); } &:hover { background: ${props => props.secondary ? 'rgba(255,255,255,0.2)' : 'linear-gradient(90deg, #61dafb 0%, #21a1f1 100%)'}; } `;
const IconButton = styled.button` background: none; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; &:hover { background: rgba(255,255,255,0.1); } `;
const ControlGroup = styled.div` display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.3); padding: 5px 15px; border-radius: 20px; @media (max-width: 600px) { padding: 2px 8px; gap: 5px; transform: scale(0.8); } `;
const FeedbackText = styled.div<{ type: string | null }>` position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%) ${props => props.type ? 'scale(1.2)' : 'scale(1)'}; font-size: 4rem; font-weight: 900; text-shadow: 0 0 10px black; color: ${props => { switch(props.type) { case 'PERFECT': return '#00ff00'; case 'GOOD': return '#ccff00'; case 'EARLY': return '#ffff00'; case 'LATE': return '#ff9900'; case 'MISS': return '#ff0000'; default: return 'white'; } }}; opacity: ${props => props.type ? 1 : 0}; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none; z-index: 100; @media (max-width: 768px) { font-size: 2rem; top: 40%; } `;

interface GameProps {
    song: Song;
    initialMode: 'PLAY' | 'LISTEN';
    onExit: () => void;
}

export function Game({ song, initialMode, onExit }: GameProps) {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [isListening, setIsListening] = useState(false);
  const [isListenOnlyMode, setIsListenOnlyMode] = useState(initialMode === 'LISTEN');
  const [simFreq] = useState<number | null>(null);

  const [targetBpm, setTargetBpm] = useState(song.bpm);
  const speedMultiplier = targetBpm / song.bpm;
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);

  useEffect(() => {
    setTargetBpm(song.bpm);
    setIsListenOnlyMode(initialMode === 'LISTEN');
  }, [song, initialMode]);

  const evaluatorRef = useRef(new PerformanceEvaluator());
  const [stats, setStats] = useState({ hits: 0, misses: 0, early: 0, late: 0, perfect: 0, maxCombo: 0, missedNotesMap: new Map<string, number>() });
  const [combo, setCombo] = useState(0);
  const [noteStatuses, setNoteStatuses] = useState<Map<number, 'HIT' | 'MISS' | 'PENDING'>>(new Map());
  const [teacherState, setTeacherState] = useState<{ message: string | null, mood: 'happy' | 'neutral' | 'concerned' }>({ message: null, mood: 'neutral' });
  const recentHistoryRef = useRef<Array<{type: 'HIT' | 'MISS', timing?: 'EARLY' | 'LATE' | 'PERFECT' | 'GOOD'}>>([]);

  const isPlaying = gameState === 'PLAYING';

  // 1. EXTRACT setSongTime from useGameLoop
  const { songTime, setSongTime } = useGameLoop(isPlaying, speedMultiplier);

  // Audio Player
  useAudioPlayer(song, isPlaying, songTime, speedMultiplier, metronomeEnabled);
  
  const pitch = useAudioInput(isListening && !isListenOnlyMode, simFreq);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'PERFECT' | 'GOOD' | 'EARLY' | 'LATE' | 'MISS' | null>(null);
  
  useEffect(() => {
      if (gameState === 'PLAYING') {
          const lastNote = song.notes[song.notes.length - 1];
          const endTime = lastNote.startTime + lastNote.duration + 1000;
          if (songTime > endTime) {
              setGameState('FINISHED');
              setIsListening(false);
          }
      }
  }, [songTime, gameState, song]);

  const updateTeacher = () => {
      if (isListenOnlyMode) return;
      const history = recentHistoryRef.current;
      if (history.length < 5) return;
      const last5 = history.slice(-5);
      const misses = last5.filter(h => h.type === 'MISS').length;
      const lates = last5.filter(h => h.timing === 'LATE').length;
      const earlies = last5.filter(h => h.timing === 'EARLY').length;
      const hits = last5.filter(h => h.type === 'HIT').length;

      let msg = null;
      let mood: 'happy' | 'neutral' | 'concerned' = 'neutral';

      if (misses >= 3) { msg = "Focus!"; mood = 'concerned'; }
      else if (lates >= 2) { msg = "Get fast!"; mood = 'concerned'; }
      else if (earlies >= 2) { msg = "Slow down!"; mood = 'concerned'; }
      else if (hits === 5) { msg = "That's good!"; mood = 'happy'; }

      if (msg) {
          setTeacherState({ message: msg, mood });
          recentHistoryRef.current = [];
      }
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    if (isListenOnlyMode) return;

    const HIT_WINDOW = 200; 
    const EVAL_WINDOW = 500; 
    
    const newStatuses = new Map(noteStatuses);
    let changed = false;
    let eventOccurred = false;

    song.notes.forEach((note, index) => {
        if (newStatuses.has(index)) return;

        const targetStartTime = note.startTime;
        const targetEndTime = note.startTime + note.duration;

        // Miss Check
        if (songTime > targetEndTime + HIT_WINDOW) {
            newStatuses.set(index, 'MISS');
            changed = true;
            eventOccurred = true;
            recentHistoryRef.current.push({ type: 'MISS' });
            setFeedback('MISS');
            setCombo(0);
            setStats(s => {
                const newMap = new Map(s.missedNotesMap);
                newMap.set(note.noteName, (newMap.get(note.noteName) || 0) + 1);
                return { ...s, misses: s.misses + 1, missedNotesMap: newMap };
            });
            setTimeout(() => setFeedback(null), 500);
            return;
        }

        // Hit Check
        if (songTime >= targetStartTime - EVAL_WINDOW && songTime <= targetEndTime) {
            const targetFreq = getFrequencyFromNote(note.noteName, note.octave, note.isQuarterTone);
            const detectedFreq = pitch ? pitch.frequency : null;

            const result = evaluatorRef.current.evaluate(
                targetFreq,
                detectedFreq,
                targetStartTime,
                songTime
            );

            if (['PERFECT', 'GOOD', 'EARLY', 'LATE'].includes(result.status)) {
                newStatuses.set(index, 'HIT');
                changed = true;
                eventOccurred = true;
                const timing = result.status as 'PERFECT' | 'GOOD' | 'EARLY' | 'LATE';
                recentHistoryRef.current.push({ type: 'HIT', timing });

                const currentCombo = combo + 1;
                setCombo(currentCombo);
                setStats(s => ({...s, maxCombo: Math.max(s.maxCombo, currentCombo)}));
                const multiplier = 1 + (currentCombo / 10);
                const points = Math.round(result.scoreDelta * multiplier);
                setScore(s => s + points);
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

    if (changed) setNoteStatuses(newStatuses);
    if (eventOccurred) updateTeacher();
  }, [songTime, pitch, gameState, noteStatuses, song, isListenOnlyMode, combo]);

  const startGame = () => {
    setGameState('PLAYING');
    setIsListening(true);
    recentHistoryRef.current = [];
    setTeacherState({ message: null, mood: 'neutral' });
  };

  const stopGame = () => {
    setGameState('IDLE');
    setIsListening(false);
    setTeacherState({ message: null, mood: 'neutral' });
  };

  // FIX: Explicitly Reset Song Time to 0
  const restartGame = () => {
      stopGame();
      setSongTime(0); // <--- THIS IS THE CRITICAL FIX
      setNoteStatuses(new Map());
      setScore(0);
      setCombo(0);
      setStats({ hits: 0, misses: 0, early: 0, late: 0, perfect: 0, maxCombo: 0, missedNotesMap: new Map() });
      setTimeout(() => {
          startGame();
      }, 50);
  };

  return (
    <Container>
      <TopBar>
         <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
             <IconButton onClick={onExit}>← Menu</IconButton>
             <div style={{display: 'flex', flexDirection: 'column'}}>
                <div style={{fontWeight: 'bold'}}>
                    {song.title} {isListenOnlyMode && <span style={{color: '#61dafb', fontSize: '0.8rem'}}>(Listen Mode)</span>}
                </div>
                <div style={{fontSize: '0.8rem', color: '#aaa'}}>{song.bpm} BPM</div>
             </div>
         </div>
         <ControlGroup>
             <span style={{fontSize: '0.8rem', color: '#ccc'}}>Speed:</span>
             <IconButton onClick={() => setTargetBpm(Math.max(20, targetBpm - 5))}>-</IconButton>
             <span style={{minWidth: '60px', textAlign: 'center', fontWeight: 'bold'}}>{targetBpm} BPM</span>
             <IconButton onClick={() => setTargetBpm(Math.min(300, targetBpm + 5))}>+</IconButton>
         </ControlGroup>
         <div style={{flex: 1}} />
         {!isListenOnlyMode && (
             <ScoreContainer>
                 <ScoreDisplay>{score.toLocaleString()}</ScoreDisplay>
                 {combo > 1 && (<ComboDisplay $isFire={combo > 10}>{combo}x COMBO! {combo > 10 && '🔥'}</ComboDisplay>)}
             </ScoreContainer>
         )}
         <div style={{width: '20px'}} />
         <div style={{display: 'flex', gap: '10px'}}>
             <IconButton onClick={() => setMetronomeEnabled(!metronomeEnabled)} style={{
                 background: metronomeEnabled ? 'rgba(33, 161, 241, 0.3)' : 'transparent',
                 border: metronomeEnabled ? '1px solid #21a1f1' : '1px solid rgba(255,255,255,0.2)'
             }}>Metronome</IconButton>
         </div>
      </TopBar>
      <MainContent>
        <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <StaffCanvas 
                song={song} 
                currentTime={songTime}
                detectedNote={pitch ? pitch.noteName : null}
                noteStatuses={noteStatuses}
            />
            <FeedbackText type={feedback}>{feedback}</FeedbackText>
            <TeacherFeedback message={teacherState.message} mood={teacherState.mood} onComplete={() => setTeacherState(prev => ({ ...prev, message: null }))} />

            {!isPlaying && gameState !== 'FINISHED' && (
                <div style={{position: 'absolute', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '20px'}}>
                        <Button onClick={startGame}>{score > 0 ? "Resume" : (isListenOnlyMode ? "Start Listening" : "Start Game")}</Button>
                        <Button secondary onClick={restartGame}>Restart</Button>
                    </div>
                    {!isListenOnlyMode && (<div style={{background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '10px', fontSize: '0.9rem'}}>Tip: Use headphones for best results</div>)}
                </div>
            )}

            {isPlaying && (
                <div style={{position: 'absolute', top: 20, right: 20, zIndex: 20, display: 'flex', gap: '10px'}}>
                    <IconButton onClick={restartGame} style={{background: 'rgba(255, 200, 0, 0.3)'}}>Restart</IconButton>
                    <IconButton onClick={stopGame} style={{background: 'rgba(255,0,0,0.3)'}}>Stop</IconButton>
                </div>
            )}

            {gameState === 'FINISHED' && (<SummaryScreen score={score} totalNotes={stats.hits + stats.misses} hits={stats.hits} misses={stats.misses} early={stats.early} late={stats.late} perfect={stats.perfect} missedNotesMap={stats.missedNotesMap} onRestart={restartGame} />)}
        </div>
        <div style={{height: '60px', width: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <PitchDisplay>
            {isListenOnlyMode ? (
                 <span style={{opacity: 0.7, fontStyle: 'italic'}}>Listen Mode Active ({speedMultiplier.toFixed(2)}x)</span>
            ) : pitch ? (
                <span>{toSolfege(pitch.noteName)}{pitch.isQuarterTone ? '+' : ''} <span style={{fontSize: '0.8rem', color: '#666', marginLeft: '5px'}}>({pitch.frequency.toFixed(0)} Hz)</span></span>
            ) : (
                <span style={{opacity: 0.5}}>Ready... {speedMultiplier !== 1.0 && `(${speedMultiplier.toFixed(2)}x)`}</span>
            )}
            </PitchDisplay>
        </div>
      </MainContent>
    </Container>
  );
}
