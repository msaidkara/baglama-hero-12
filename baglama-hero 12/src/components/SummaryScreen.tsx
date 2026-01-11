import React from 'react';
import styled from 'styled-components';
import { toSolfege } from '../utils/pitchUtils';

const Overlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
  color: white;
`;

const Title = styled.h2`
  font-size: 3rem;
  margin-bottom: 20px;
  color: #61dafb;
`;

const Score = styled.div`
  font-size: 2rem;
  margin-bottom: 30px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 600px;
  width: 100%;
  margin-bottom: 30px;
`;

const StatBox = styled.div`
  background: #333;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
`;

const FeedbackSection = styled.div`
  background: #222;
  padding: 20px;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  border-left: 5px solid #ffcc00;
  margin-bottom: 30px;
`;

const Button = styled.button`
  padding: 15px 30px;
  font-size: 1.5rem;
  background-color: #61dafb;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #282c34;
  font-weight: bold;

  &:hover {
    background-color: #21a1f1;
  }
`;

interface SummaryProps {
    score: number;
    totalNotes: number;
    hits: number;
    misses: number;
    early: number;
    late: number;
    perfect: number;
    missedNotesMap: Map<string, number>; // Note Name -> Count
    onRestart: () => void;
}

export const SummaryScreen: React.FC<SummaryProps> = (props) => {
    // Generate feedback
    const feedbackLines: string[] = [];
    
    // Accuracy
    const accuracy = Math.round((props.hits / props.totalNotes) * 100) || 0;
    if (accuracy < 50) feedbackLines.push("Try to listen to the melody first before playing.");
    else if (accuracy > 90) feedbackLines.push("Excellent rhythm and pitch!");
    
    // Timing
    if (props.early > props.late + 5) {
        feedbackLines.push("You tend to play too EARLY. Relax and wait for the note.");
    } else if (props.late > props.early + 5) {
        feedbackLines.push("You are playing a bit LATE. Try to anticipate the note.");
    }

    // Missed Notes Analysis
    let mostMissed = "";
    let maxMiss = 0;
    props.missedNotesMap.forEach((count, note) => {
        if (count > maxMiss) {
            maxMiss = count;
            mostMissed = note;
        }
    });

    if (maxMiss > 2) {
        const solfege = toSolfege(mostMissed);
        feedbackLines.push(`You missed '${solfege}' ${maxMiss} times. Practice that finger position.`);
    }

    if (feedbackLines.length === 0) feedbackLines.push("Keep practicing to improve!");

    return (
        <Overlay>
            <Title>Song Finished!</Title>
            <Score>Final Score: {props.score}</Score>
            
            <StatsGrid>
                <StatBox>
                    <h3>Accuracy</h3>
                    <div style={{fontSize: '2rem', color: accuracy > 70 ? '#4caf50' : '#f44336'}}>
                        {accuracy}%
                    </div>
                </StatBox>
                <StatBox>
                    <h3>Timing</h3>
                    <div>Perfect: {props.perfect}</div>
                    <div>Good: {props.hits - props.perfect}</div>
                    <div>Early: {props.early}</div>
                    <div>Late: {props.late}</div>
                </StatBox>
            </StatsGrid>

            <FeedbackSection>
                <h3>Feedback Report</h3>
                <ul>
                    {feedbackLines.map((line, i) => <li key={i} style={{margin: '10px 0', fontSize: '1.1rem'}}>{line}</li>)}
                </ul>
            </FeedbackSection>

            <Button onClick={props.onRestart}>Play Again</Button>
        </Overlay>
    );
};
