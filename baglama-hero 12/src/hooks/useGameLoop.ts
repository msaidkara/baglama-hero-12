import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameLoop(isPlaying: boolean, speedMultiplier: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  const accumulatedTimeRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  const speedRef = useRef(speedMultiplier);

  useEffect(() => { speedRef.current = speedMultiplier; }, [speedMultiplier]);

  const setTimeManually = useCallback((time: number) => {
    accumulatedTimeRef.current = time;
    setSongTime(time);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const loop = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) lastFrameTimeRef.current = timestamp;
      const delta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      // CRITICAL: Accumulate time scaled by speed
      // This ensures smooth transitions even if speed changes mid-song
      const safeDelta = Math.min(delta, 100);
      accumulatedTimeRef.current += safeDelta * speedRef.current;
      
      setSongTime(accumulatedTimeRef.current);
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying]);

  return { songTime, setSongTime: setTimeManually };
}
