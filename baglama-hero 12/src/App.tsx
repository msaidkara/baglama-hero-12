import { useState } from 'react';
import { SongSelection } from './components/SongSelection';
import { ExerciseList } from './components/ExerciseList';
import { Game } from './components/Game';
import type { Song } from './types';

type View = 'SONGS' | 'EXERCISES' | 'GAME';

function App() {
  const [view, setView] = useState<View>('SONGS');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [gameMode, setGameMode] = useState<'PLAY' | 'LISTEN'>('PLAY');

  const handleSelectSong = (song: Song, mode: 'PLAY' | 'LISTEN' = 'PLAY') => {
      setSelectedSong(song);
      setGameMode(mode);
      setView('GAME');
  };

  const handleExitGame = () => {
      setSelectedSong(null);
      setView('SONGS');
  };

  if (view === 'GAME' && selectedSong) {
      return (
        <Game
            song={selectedSong}
            initialMode={gameMode}
            onExit={handleExitGame}
        />
      );
  }

  if (view === 'EXERCISES') {
      return (
          <ExerciseList
            onSelect={(song) => handleSelectSong(song, 'PLAY')}
            onBack={() => setView('SONGS')}
          />
      );
  }

  return (
    <SongSelection
        onSelect={handleSelectSong}
        onGoToExercises={() => setView('EXERCISES')}
    />
  );
}

export default App;
