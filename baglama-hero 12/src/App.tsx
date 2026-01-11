import { useState } from 'react';
import { SongSelection } from './components/SongSelection';
import { Game } from './components/Game';
import type { Song } from './types';

function App() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  if (!selectedSong) {
      return <SongSelection onSelect={setSelectedSong} />;
  }

  return <Game song={selectedSong} onExit={() => setSelectedSong(null)} />;
}

export default App;
