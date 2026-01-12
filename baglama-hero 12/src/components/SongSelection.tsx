import styled from 'styled-components';
import { useState } from 'react';
import type { Song } from '../types';
import { AL_YAZMALIM } from '../songs/alYazmalim';
import { MAVILIM } from '../songs/mavilim';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #1e2025 0%, #101113 100%);
  color: white;
  font-family: 'Segoe UI', sans-serif;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
`;

const ModeToggle = styled.div`
  display: flex;
  background: rgba(0,0,0,0.3);
  padding: 5px;
  border-radius: 30px;
  margin-bottom: 2rem;
`;

const ModeButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? '#61dafb' : 'transparent'};
  color: ${props => props.active ? '#000' : '#aaa'};
  border: none;
  padding: 10px 25px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
      color: ${props => props.active ? '#000' : '#fff'};
  }
`;

const SongList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 500px;
`;

const SongCard = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  color: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SongTitle = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;

const SongInfo = styled.div`
  font-size: 0.9rem;
  color: #aaa;
`;

const SecondaryButton = styled.button`
  margin-top: 30px;
  background: transparent;
  border: 1px solid rgba(97, 218, 251, 0.5);
  color: #61dafb;
  padding: 15px 30px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
      background: rgba(97, 218, 251, 0.1);
      transform: translateY(-2px);
  }
`;

interface SongSelectionProps {
    onSelect: (song: Song, mode: 'PLAY' | 'LISTEN') => void;
    onGoToExercises: () => void;
}

export function SongSelection({ onSelect, onGoToExercises }: SongSelectionProps) {
    const [mode, setMode] = useState<'PLAY' | 'LISTEN'>('PLAY');

    return (
        <Container>
            <Title>Bağlama Hero</Title>

            <ModeToggle>
                <ModeButton active={mode === 'PLAY'} onClick={() => setMode('PLAY')}>
                    🎤 Çal (Play)
                </ModeButton>
                <ModeButton active={mode === 'LISTEN'} onClick={() => setMode('LISTEN')}>
                    🎧 Dinle (Listen)
                </ModeButton>
            </ModeToggle>

            <SongList>
                <SongCard onClick={() => onSelect(AL_YAZMALIM, mode)}>
                    <div>
                        <SongTitle>{AL_YAZMALIM.title}</SongTitle>
                        <SongInfo>BPM: {AL_YAZMALIM.bpm}</SongInfo>
                    </div>
                    <div>▶</div>
                </SongCard>
                <SongCard onClick={() => onSelect(MAVILIM, mode)}>
                    <div>
                        <SongTitle>{MAVILIM.title}</SongTitle>
                        <SongInfo>BPM: {MAVILIM.bpm}</SongInfo>
                    </div>
                    <div>▶</div>
                </SongCard>
            </SongList>

            <SecondaryButton onClick={onGoToExercises}>
                Parmak Egzersizleri
            </SecondaryButton>
        </Container>
    );
}
