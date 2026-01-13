import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameLoop(isPlaying: boolean, speedMultiplier: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  
  // Referanslar (Render tetiklemeyen hafıza)
  const requestRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  
  // Hız değerini ref içinde tutuyoruz ki useEffect'i resetlemesin
  const speedRef = useRef(speedMultiplier);

  // Hız değiştiğinde SADECE ref'i güncelle, motoru durdurma
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const setTimeManually = useCallback((time: number) => {
    accumulatedTimeRef.current = time;
    setSongTime(time);
  }, []);

  useEffect(() => {
    // Eğer çalmıyorsa döngüyü durdur ama zamanı sıfırlama
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

      // Tarayıcı sekmesi değişirse devasa atlamaları önlemek için güvenlik (max 100ms)
      const safeDelta = Math.min(delta, 100); 
      
      // İŞTE ÇÖZÜM BURASI:
      // Geçen süreyi o anki hızla çarpıp KUMBARAYA ekliyoruz.
      // Hız düşerse kumbara küçülmez, sadece daha yavaş dolar.
      accumulatedTimeRef.current += safeDelta * speedRef.current;
      
      setSongTime(accumulatedTimeRef.current);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]); // DİKKAT: speedMultiplier buraya eklenmemeli!

  return { songTime, setSongTime: setTimeManually };
}
