import { useEffect, useRef, useState } from 'react';
import { autoCorrelate, getNoteFromFrequency, type NoteInfo } from '../utils/pitchUtils';

export function useAudioInput(isListening: boolean, simulatedFrequency: number | null = null) {
  const [pitch, setPitch] = useState<NoteInfo | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const updatePitch = () => {
      if (simulatedFrequency !== null) {
          // Simulation Mode
          if (simulatedFrequency > 0) {
              setPitch(getNoteFromFrequency(simulatedFrequency));
          } else {
              setPitch(null);
          }
          // For static simulation, we might not need a loop, but consistent behavior is good.
          // However, to avoid infinite loops if we just set state, we rely on the parent updating simulatedFrequency.
          // But here, we are inside a loop.
          // Let's just run it once per frame if needed, or rely on dependency change?
          // If we want real-time updates (e.g. noise), we loop.
          // requestRef.current = requestAnimationFrame(updatePitch); 
          return; 
      }
  
      if (!analyserRef.current) return;
  
      const bufferLength = 2048;
      const buffer = new Float32Array(bufferLength);
      analyserRef.current.getFloatTimeDomainData(buffer);
  
      const frequency = autoCorrelate(buffer, audioContextRef.current?.sampleRate || 44100);
  
      if (frequency !== -1) {
        const note = getNoteFromFrequency(frequency);
        setPitch(note);
      } else {
        setPitch(null);
      }
  
      requestRef.current = requestAnimationFrame(updatePitch);
    };

    if (isListening && simulatedFrequency === null) {
      const startAudio = async () => {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
            
            requestRef.current = requestAnimationFrame(updatePitch);
        } catch (err) {
            console.error("Error accessing microphone", err);
        }
      };
      startAudio();
    } else if (simulatedFrequency !== null) {
         // In simulation, we just update once when simulatedFrequency changes.
         // We don't need a loop unless we simulate noise.
         // Effectively, the `updatePitch` logic for simulation is immediate.
         updatePitch();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (sourceRef.current) {
          sourceRef.current.disconnect();
      }
    };
  }, [isListening, simulatedFrequency]);

  return pitch;
}
