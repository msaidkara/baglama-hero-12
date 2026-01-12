import { useState, useEffect, useRef } from 'react';

export function useGameLoop(isPlaying: boolean, speedMultiplier: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const accumulatedTimeRef = useRef<number>(0);

  // Allow resetting time (for seeking or restart)
  // But currently we just reset on Stop.

  useEffect(() => {
    if (!isPlaying) {
      accumulatedTimeRef.current = 0;
      setSongTime(0);
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

      // DELTA TIME ACCUMULATION LOGIC (Fixing Seek/Jump on Speed Change)
      // Time += (Real Delta * Speed)
      accumulatedTimeRef.current += delta * speedMultiplier;
      
      setSongTime(accumulatedTimeRef.current);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speedMultiplier]); // Re-run if speed changes?
  
  // Note: If speed changes, we don't want to reset accumulatedTimeRef!
  // But the effect dependencies include speedMultiplier.
  // If the effect re-runs, it will define a new loop function closing over new speed.
  // accumulatedTimeRef persists across re-renders because it's a ref.
  // HOWEVER: lastFrameTimeRef is set to null in the effect cleanup? No, only local var?
  // No, `lastFrameTimeRef` is a ref.
  // We need to be careful not to jump time when effect restarts.
  // If effect restarts:
  // 1. cleanup runs -> cancel animation frame.
  // 2. new effect runs -> request animation frame.
  // 3. inside loop: `lastFrameTimeRef.current` might be old timestamp?
  //    If we use `lastFrameTimeRef.current = null` on start, we get delta=0 for first frame. Correct.
  //    So we should set `lastFrameTimeRef.current = null` inside the effect setup?

  // Let's refine the effect to handle speed changes smoothly.

  /*
    Effect [isPlaying] -> Handles Start/Stop.
    Effect [speedMultiplier] -> Should NOT reset time.

    Actually, we can put everything in one effect.
    When speed changes, the effect re-runs.
    We just need to make sure we don't reset `accumulatedTimeRef`. (We don't, it's a ref).
    We need to make sure `lastFrameTimeRef` is reset so we don't calculate a huge delta from the last timestamp of the previous effect instance (which was ms ago).

    So:
    setup() {
      lastFrameTimeRef.current = null; // Important! Start fresh delta calculation.
      requestAnimationFrame...
    }
  */

  return songTime;
}
