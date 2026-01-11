import { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const popIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  80% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const Container = styled.div`
  position: absolute;
  top: 100px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 50;
  animation: ${float} 3s ease-in-out infinite;
`;

const Avatar = styled.div<{ mood: 'happy' | 'neutral' | 'concerned' }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => {
      switch(props.mood) {
          case 'happy': return 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
          case 'concerned': return 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
          default: return 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
      }
  }};
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  margin-bottom: 10px;
`;

const Bubble = styled.div`
  background: white;
  color: #333;
  padding: 10px 20px;
  border-radius: 20px;
  border-bottom-right-radius: 0;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  animation: ${popIn} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  max-width: 150px;
  text-align: center;
`;

interface TeacherFeedbackProps {
    message: string | null;
    mood: 'happy' | 'neutral' | 'concerned';
    onComplete: () => void;
}

export function TeacherFeedback({ message, mood, onComplete }: TeacherFeedbackProps) {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [message, onComplete]);

    if (!message) return null;

    return (
        <Container>
            <Bubble>{message}</Bubble>
            <Avatar mood={mood}>
                {mood === 'happy' ? '^_^' : mood === 'concerned' ? 'o_O' : '-_-'}
            </Avatar>
        </Container>
    );
}
