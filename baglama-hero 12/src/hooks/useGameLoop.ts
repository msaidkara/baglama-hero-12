import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameLoop(isPlaying: boolean, speedMultiplier: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  
  const requestRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  // Store speed in ref to access inside loop without restarting it
  const speedRef = useRef(speedMultiplier);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const setTimeManually = useCallback((time: number) => {
    accumulatedTimeRef.current = time;
    setSongTime(time);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = undefined;
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }
      
      const delta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Protection against tab switching jumps (max 100ms)
      const safeDelta = Math.min(delta, 100); 

      // THE FIX: Add (Delta * Speed) to the pile.
      // This prevents time from jumping back when speed decreases.
      accumulatedTimeRef.current += safeDelta * speedRef.current;
      
      setSongTime(accumulatedTimeRef.current);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  return { songTime, setSongTime: setTimeManually };
}
