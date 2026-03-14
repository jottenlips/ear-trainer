import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { InstrumentName } from './types';
import HomeScreen from './components/HomeScreen';
import ExerciseView from './components/ExerciseView';
import PlayingChanges from './components/PlayingChanges';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [instrument, setInstrument] = useState<InstrumentName>('piano');

  return (
    <div className="app">
      <Settings instrument={instrument} onInstrumentChange={setInstrument} />
      <Routes>
        <Route path="/" element={<HomeScreen instrument={instrument} />} />
        <Route
          path="/exercise/:type/:difficulty"
          element={<ExerciseView instrument={instrument} />}
        />
        <Route
          path="/playing-changes"
          element={<PlayingChanges instrument={instrument} />}
        />
      </Routes>
    </div>
  );
}

export default App;
