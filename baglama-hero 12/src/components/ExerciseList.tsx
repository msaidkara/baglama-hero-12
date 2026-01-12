import styled from 'styled-components';
import { EXERCISES, type Exercise } from '../data/exercises';
import type { Song } from '../types';

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
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #61dafb;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 600px;
`;

const ExerciseCard = styled.button`
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
`;

const BackButton = styled.button`
  margin-top: 30px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.1); }
`;

interface ExerciseListProps {
    onSelect: (song: Song) => void;
    onBack: () => void;
}

export function ExerciseList({ onSelect, onBack }: ExerciseListProps) {

    const handleSelect = (ex: Exercise) => {
        // Convert Exercise to Song format
        const song: Song = {
            title: ex.title,
            bpm: 60, // Default or calculated
            notes: ex.notes
        };
        onSelect(song);
    };

    return (
        <Container>
            <Title>Parmak Egzersizleri</Title>
            <List>
                {EXERCISES.map(ex => (
                    <ExerciseCard key={ex.id} onClick={() => handleSelect(ex)}>
                        <div>
                            <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{ex.title}</div>
                            <div style={{color: '#aaa', fontSize: '0.9rem'}}>
                                Level: {ex.level} • Finger: {ex.targetFinger}
                            </div>
                        </div>
                        <div>▶</div>
                    </ExerciseCard>
                ))}
            </List>
            <BackButton onClick={onBack}>← Ana Menü</BackButton>
        </Container>
    );
}
