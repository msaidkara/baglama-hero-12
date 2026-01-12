import styled from 'styled-components';
import type { Song } from '../types';
import { AL_YAZMALIM } from '../songs/alYazmalim';
import { MAVILIM } from '../songs/mavilim';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #1e2025 0%, #101113 100%);
  color: white;
  font-family: 'Segoe UI', sans-serif;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
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

interface SongSelectionProps {
    onSelect: (song: Song) => void;
}

export function SongSelection({ onSelect }: SongSelectionProps) {
    return (
        <Container>
            <Title>Bağlama Hero</Title>
            <SongList>
                <SongCard onClick={() => onSelect(AL_YAZMALIM)}>
                    <div>
                        <SongTitle>{AL_YAZMALIM.title}</SongTitle>
                        <SongInfo>BPM: {AL_YAZMALIM.bpm}</SongInfo>
                    </div>
                    <div>▶</div>
                </SongCard>
                <SongCard onClick={() => onSelect(MAVILIM)}>
                    <div>
                        <SongTitle>{MAVILIM.title}</SongTitle>
                        <SongInfo>BPM: {MAVILIM.bpm}</SongInfo>
                    </div>
                    <div>▶</div>
                </SongCard>
            </SongList>
        </Container>
    );
}
