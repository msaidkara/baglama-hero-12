import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameLoop(isPlaying: boolean, speedMultiplier: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  
  const requestRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  
  // Hız değişimini anında yakalamak için ref kullanıyoruz
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

      // Sekme değişimi vs. gibi durumlarda devasa atlamaları önle
      const safeDelta = Math.min(delta, 100); 
      
      // KRİTİK NOKTA: Geçen süreyi o anki hızla çarpıp topluyoruz.
      // Matematiksel formül değil, fiziksel birikim yapıyoruz.
      // Bu sayede hızı düşürsen bile "toplanmış zaman" azalmıyor.
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
