import { useState, useEffect, useRef } from 'react';

export function useGameLoop(isPlaying: boolean, speed: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) {
          lastFrameTimeRef.current = timestamp;
      }
      
      const delta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Accumulate time based on speed
      accumulatedTimeRef.current += delta * speed;
      
      setSongTime(accumulatedTimeRef.current);

      requestRef.current = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      lastFrameTimeRef.current = null; // Reset delta tracking on start/resume
      requestRef.current = requestAnimationFrame(loop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      // Reset logic: If we want to support PAUSE, we keep accumulatedTimeRef.
      // If we want STOP (reset), we rely on the parent to unmount or signal reset.
      // Current App logic uses STOP -> IDLE. 
      // If isPlaying becomes false, we just stop the loop. 
      // We do NOT reset songTime here because we might want to display the final frame.
      // However, App.tsx handles resets explicitly by unmounting or ignoring.
      // Let's explicitly check if we should reset.
      // Actually, standard behavior: Stop loop. 
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speed]);

  // If we need to reset explicitly from outside (e.g. Stop button),
  // we can use a separate effect or just remount.
  // In App.tsx, when IDLE, we can force reset by keying the hook or passing a reset signal?
  // Or simpler: We watch a "reset" prop?
  // For now, if !isPlaying, we don't zero it out, allowing "Pause".
  // But App.tsx sets time to 0 manually or assumes 0 on start.
  // Let's add an effect to reset when isPlaying goes true from 0? 
  // No, easiest is to expose a reset function or just use a key.
  // Actually, App.tsx currently expects `useGameLoop` to return 0 when not playing?
  // Previous implementation:
  // if (!isPlaying) setTime(0).
  // I should preserve that behavior for "Stop".
  
  useEffect(() => {
      if (!isPlaying) {
          accumulatedTimeRef.current = 0;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSongTime(0);
      }
  }, [isPlaying]);

  return songTime;
}
