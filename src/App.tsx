import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { InstrumentName } from './types';
import { isIOSDevice, detectIOSSilentMode } from './utils/audio';
import HomeScreen from './components/HomeScreen';
import ExerciseView from './components/ExerciseView';
import PlayingChanges from './components/PlayingChanges';
import SightReadingView from './components/SightReadingView';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [instrument, setInstrument] = useState<InstrumentName>('piano');
  const [autoMode, setAutoMode] = useState(false);
  const [silentModeWarning, setSilentModeWarning] = useState(false);

  // Detect iOS silent mode on first user interaction (global, runs once)
  useEffect(() => {
    if (!isIOSDevice()) return;
    let ran = false;
    const check = async () => {
      if (ran) return;
      ran = true;
      document.removeEventListener('touchstart', check, true);
      document.removeEventListener('click', check, true);
      const isSilent = await detectIOSSilentMode();
      setSilentModeWarning(isSilent);
    };
    document.addEventListener('touchstart', check, { capture: true, once: true });
    document.addEventListener('click', check, { capture: true, once: true });
    return () => {
      document.removeEventListener('touchstart', check, true);
      document.removeEventListener('click', check, true);
    };
  }, []);

  return (
    <div className="app">
      {silentModeWarning && (
        <div className="silent-mode-warning" onClick={() => setSilentModeWarning(false)}>
          <span>🔇 Your phone is on silent. Flip the mute switch on the side of your device to hear audio.</span>
          <button className="dismiss-btn" aria-label="Dismiss">✕</button>
        </div>
      )}
      <Settings instrument={instrument} onInstrumentChange={setInstrument} />
      <Routes>
        <Route path="/" element={<HomeScreen instrument={instrument} />} />
        <Route
          path="/exercise/:type/:difficulty"
          element={<ExerciseView instrument={instrument} autoMode={autoMode} setAutoMode={setAutoMode} />}
        />
        <Route
          path="/sight-reading/:difficulty"
          element={<SightReadingView instrument={instrument} />}
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
