import { useState, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Difficulty, ExerciseType, InstrumentName, Question, ScoreState } from '../types';
import { generateQuestion } from '../utils/questions';
import { playInterval, playChord, playRhythmWithCountIn, playProgression } from '../utils/audio';
import NotationDisplay from './NotationDisplay';
import RhythmChoiceNotation from './RhythmChoiceNotation';

interface Props {
  exerciseType: ExerciseType;
  difficulty: Difficulty;
  instrument: InstrumentName;
  onBack: () => void;
}

export default function ExerciseView({ exerciseType, difficulty, instrument, onBack }: Props) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [score, setScore] = useState<ScoreState>({ correct: 0, total: 0, streak: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [firstTry, setFirstTry] = useState(true);

  const newQuestion = useCallback(() => {
    setQuestion(generateQuestion(exerciseType, difficulty));
    setSelected(null);
    setRevealed(false);
    setEliminated(new Set());
    setFirstTry(true);
  }, [exerciseType, difficulty]);

  useEffect(() => {
    newQuestion();
  }, [newQuestion]);

  const handlePlay = async () => {
    if (!question || isPlaying) return;
    setIsPlaying(true);
    try {
      switch (exerciseType) {
        case 'intervals':
          await playInterval(question.noteData!.notes[0], question.noteData!.notes[1], instrument);
          break;
        case 'chords':
          await playChord(question.noteData!.notes, instrument);
          break;
        case 'rhythm':
          await playRhythmWithCountIn(question.noteData!.durations!, instrument);
          break;
        case 'secondary-dominants':
          if (question.progressionChords) {
            await playProgression(question.progressionChords, instrument);
          }
          break;
      }
    } finally {
      setTimeout(() => setIsPlaying(false), 500);
    }
  };

  const handleAnswer = (choice: string) => {
    if (revealed || eliminated.has(choice)) return;

    const isCorrect = choice === question?.correctAnswer;

    if (exerciseType === 'rhythm') {
      if (isCorrect) {
        setSelected(choice);
        setRevealed(true);
        if (firstTry) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setScore(prev => ({
          correct: prev.correct + (firstTry ? 1 : 0),
          total: prev.total + (firstTry ? 1 : 0),
          streak: firstTry ? prev.streak + 1 : 0,
        }));
      } else {
        setEliminated(prev => new Set(prev).add(choice));
        if (firstTry) {
          setFirstTry(false);
          setScore(prev => ({
            ...prev,
            total: prev.total + 1,
            streak: 0,
          }));
        }
      }
    } else {
      setSelected(choice);
      setRevealed(true);
      if (isCorrect) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: isCorrect ? prev.streak + 1 : 0,
      }));
    }
  };

  const handleNext = () => {
    newQuestion();
  };

  // Auto-play on new question
  useEffect(() => {
    if (question) {
      const timer = setTimeout(handlePlay, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  if (!question) return null;

  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const isRhythm = exerciseType === 'rhythm';
  const isSecDom = exerciseType === 'secondary-dominants';

  return (
    <div className="exercise-view">
      <div className="exercise-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <div className="score-display">
          <span className="score-fraction">{score.correct}/{score.total}</span>
          <span className="score-percent">({percentage}%)</span>
          {score.streak >= 3 && (
            <span className="streak">🔥 {score.streak} streak</span>
          )}
        </div>
      </div>

      <h2 className="exercise-prompt">{question.prompt}</h2>

      {/* Show notation only after reveal for intervals and chords */}
      {exerciseType === 'intervals' && revealed && question.noteData && (
        <NotationDisplay
          noteData={question.noteData}
          exerciseType={exerciseType}
          revealed={revealed}
        />
      )}
      {exerciseType === 'chords' && revealed && question.noteData && (
        <NotationDisplay
          noteData={question.noteData}
          exerciseType={exerciseType}
          revealed={revealed}
        />
      )}

      {/* Secondary dominants: hide the sec dom and target until revealed */}
      {isSecDom && question.progressionLabels && (
        <div className="progression-display">
          {question.progressionLabels.map((label, i) => {
            const isHidden = i === question.secDomIndex || i === question.secDomIndex! + 1;
            const isSecDomChord = i === question.secDomIndex;
            const isTargetChord = i === question.secDomIndex! + 1;
            let className = 'progression-chord';
            if (revealed && isSecDomChord) className += ' highlight-secdom';
            if (revealed && isTargetChord) className += ' highlight-target';
            if (!revealed && isHidden) className += ' hidden-chord';

            // Show actual chord name below roman numeral after reveal
            const chordName = revealed && isSecDomChord ? question.secDomChordName
              : revealed && isTargetChord ? question.targetChordName
              : undefined;

            return (
              <span key={i} className={className}>
                {revealed || !isHidden ? label : '?'}
                {chordName && <span className="chord-name">{chordName}</span>}
              </span>
            );
          })}
        </div>
      )}

      <button
        className="btn btn-play"
        onClick={handlePlay}
        disabled={isPlaying}
      >
        {isPlaying ? '♪ Playing...' : '▶ Play Again'}
      </button>

      {isRhythm && question.rhythmChoices ? (
        <div className="rhythm-choices-grid">
          {question.rhythmChoices.map((rc, idx) => {
            let className = 'rhythm-choice-card';
            if (revealed && rc.label === question.correctAnswer) {
              className += ' correct';
            } else if (eliminated.has(rc.label)) {
              className += ' eliminated';
            }

            return (
              <button
                key={idx}
                className={className}
                onClick={() => handleAnswer(rc.label)}
                disabled={revealed || eliminated.has(rc.label)}
              >
                <RhythmChoiceNotation choice={rc} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="choices-grid">
          {question.choices.map(choice => {
            let className = 'btn btn-choice';
            if (revealed) {
              if (choice === question.correctAnswer) {
                className += ' correct';
              } else if (choice === selected) {
                className += ' incorrect';
              }
            } else if (choice === selected) {
              className += ' selected';
            }

            return (
              <button
                key={choice}
                className={className}
                onClick={() => handleAnswer(choice)}
                disabled={revealed}
              >
                {choice}
                {isSecDom && question.choiceChordNames?.[choice] && (
                  <span className="choice-chord-name"> ({question.choiceChordNames[choice]})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {revealed && (
        <div className="result-section">
          <p className={`result-text ${(isRhythm ? firstTry : selected === question.correctAnswer) ? 'correct' : 'incorrect'}`}>
            {(isRhythm ? firstTry : selected === question.correctAnswer)
              ? (isSecDom && question.secDomChordName
                  ? `Correct! ${question.secDomChordName} → ${question.targetChordName}`
                  : 'Correct!')
              : isRhythm
                ? 'Got it! (not on the first try)'
                : isSecDom && question.secDomChordName
                  ? `Incorrect — the answer was ${question.secDomChordName} → ${question.targetChordName}`
                  : `Incorrect — the answer was ${question.correctAnswer}`}
          </p>
          <button className="btn btn-primary" onClick={handleNext}>
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}
