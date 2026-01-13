import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameLoop(isPlaying: boolean, speedMultiplier: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  
  const requestRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
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

      // Cap delta to prevent huge jumps if tab is inactive
      const safeDelta = Math.min(delta, 100); 

      // CRITICAL: Accumulate time based on current speed.
      // If speed is 2.0, 10ms real time becomes 20ms song time.
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
