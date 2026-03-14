import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Difficulty, ExerciseType, InstrumentName } from '../types';
import { ensureAudioContext } from '../utils/audio';

interface Props {
  instrument: InstrumentName;
}

const EXERCISES: { type: ExerciseType; title: string; description: string; icon: string }[] = [
  {
    type: 'intervals',
    title: 'Intervals',
    description: 'Identify intervals up to 2 octaves',
    icon: '↕',
  },
  {
    type: 'chords',
    title: 'Chord Quality',
    description: 'Identify chord types by ear',
    icon: '♫',
  },
  {
    type: 'rhythm',
    title: 'Rhythm',
    description: 'Identify rhythm patterns',
    icon: '🥁',
  },
  {
    type: 'secondary-dominants',
    title: 'Secondary Dominants',
    description: 'Identify secondary dominants in progressions',
    icon: 'V7/',
  },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: '#4caf50' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'hard', label: 'Hard', color: '#f44336' },
];

export default function HomeScreen({ instrument }: Props) {
  const [selectedType, setSelectedType] = useState<ExerciseType | null>(null);
  const navigate = useNavigate();

  const handleStart = async (difficulty: Difficulty) => {
    await ensureAudioContext();
    if (selectedType) {
      navigate(`/exercise/${selectedType}/${difficulty}`);
    }
  };

  return (
    <div className="home-screen">
      <div className="hero">
        <h1>Ear Trainer</h1>
        <p className="subtitle">Train your musical ear with intervals, chords, rhythms, and progressions</p>
        <p className="instrument-note">Current instrument: <strong>{instrument}</strong></p>
      </div>

      <div className="exercise-cards">
        {EXERCISES.map(ex => (
          <button
            key={ex.type}
            className={`exercise-card ${selectedType === ex.type ? 'selected' : ''}`}
            onClick={() => setSelectedType(ex.type)}
          >
            <span className="card-icon">{ex.icon}</span>
            <h3>{ex.title}</h3>
            <p>{ex.description}</p>
          </button>
        ))}
      </div>

      <div className="playing-changes-link">
        <Link to="/playing-changes" className="btn btn-playing-changes">
          Playing Changes
        </Link>
      </div>

      {selectedType && (
        <div className="difficulty-section">
          <h2>Select Difficulty</h2>
          <div className="difficulty-buttons">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                className="btn btn-difficulty"
                style={{ '--diff-color': d.color } as React.CSSProperties}
                onClick={() => handleStart(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="difficulty-info">
            {selectedType === 'intervals' && (
              <>
                <p><strong>Easy:</strong> Common intervals within 1 octave (m3, M3, P4, P5, P8)</p>
                <p><strong>Medium:</strong> All intervals within 1 octave</p>
                <p><strong>Hard:</strong> All intervals up to 2 octaves</p>
              </>
            )}
            {selectedType === 'chords' && (
              <>
                <p><strong>Easy:</strong> Major, Minor, Diminished, Augmented</p>
                <p><strong>Medium:</strong> + Dominant 7th, Major 7th, Minor 7th</p>
                <p><strong>Hard:</strong> + Dim7, Half-Dim7, Aug7, Sus2, Sus4</p>
              </>
            )}
            {selectedType === 'rhythm' && (
              <>
                <p><strong>Easy:</strong> Whole, half, and quarter notes</p>
                <p><strong>Medium:</strong> Eighths, triplets, dotted rhythms + grooves (Rock, Shuffle, Bossa Nova, 3:2)</p>
                <p><strong>Hard:</strong> 16ths, syncopation + polyrhythms (3:4, 4:3) and claves (Son, Rumba, Samba, Afro-Cuban)</p>
              </>
            )}
            {selectedType === 'secondary-dominants' && (
              <>
                <p><strong>Easy:</strong> V7/V, V7/IV, V7/ii</p>
                <p><strong>Medium:</strong> + V7/vi, V7/iii</p>
                <p><strong>Hard:</strong> + Tritone subs (SubV7/I), V7/bVII</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
