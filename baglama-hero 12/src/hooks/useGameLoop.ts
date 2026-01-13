import { useState, useEffect, useRef, useCallback } from 'react';

export function useGameLoop(isPlaying: boolean, speedMultiplier: number = 1.0) {
  const [songTime, setSongTime] = useState(0);
  
  // Referanslar (Değerler değişse bile render tetiklemez)
  const requestRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  
  // Hız çarpanını ref içinde tutuyoruz. 
  // Böylece hız değiştiğinde useEffect'i bozup baştan başlatmak zorunda kalmıyoruz.
  const speedRef = useRef(speedMultiplier);

  // Hız değişince sadece ref'i güncelle, döngüyü bozma
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  // Zamanı dışarıdan değiştirmek için (İleride Seek Bar yaparsan lazım olacak)
  const setTimeManually = useCallback((time: number) => {
    accumulatedTimeRef.current = time;
    setSongTime(time);
  }, []);

  useEffect(() => {
    // Eğer çalmıyorsa döngüyü başlatma ama zamanı da SIFIRLAMA (Pause özelliği için)
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

      // DELTA TIME ACCUMULATION (DÜZELTİLDİ)
      // Artık hızı ref'ten okuyoruz, bu sayede akış kesilmiyor.
      // Math.min ile devasa atlamaları (tab değişimi vs) engelliyoruz.
      const safeDelta = Math.min(delta, 100); 
      
      accumulatedTimeRef.current += safeDelta * speedRef.current;
      
      setSongTime(accumulatedTimeRef.current);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]); // DİKKAT: speedMultiplier artık dependency değil!

  // Dışarıya hem zamanı hem de manuel zaman ayarlama fonksiyonunu veriyoruz
  return { songTime, setSongTime: setTimeManually };
}
