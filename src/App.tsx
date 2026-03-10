import { useState } from 'react';
import type { Difficulty, ExerciseType, InstrumentName } from './types';
import HomeScreen from './components/HomeScreen';
import ExerciseView from './components/ExerciseView';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [instrument, setInstrument] = useState<InstrumentName>('piano');
  const [activeExercise, setActiveExercise] = useState<{
    type: ExerciseType;
    difficulty: Difficulty;
  } | null>(null);

  const handleStart = (type: ExerciseType, difficulty: Difficulty) => {
    setActiveExercise({ type, difficulty });
  };

  const handleBack = () => {
    setActiveExercise(null);
  };

  return (
    <div className="app">
      <Settings instrument={instrument} onInstrumentChange={setInstrument} />
      {activeExercise ? (
        <ExerciseView
          exerciseType={activeExercise.type}
          difficulty={activeExercise.difficulty}
          instrument={instrument}
          onBack={handleBack}
        />
      ) : (
        <HomeScreen instrument={instrument} onStart={handleStart} />
      )}
    </div>
  );
}

export default App;
