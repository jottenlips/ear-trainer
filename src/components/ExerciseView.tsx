import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import type { Difficulty, ExerciseType, InstrumentName, Question, ScoreState } from '../types';
import { generateQuestion } from '../utils/questions';
import { playInterval, playChord, playRhythmDrum, randomPolyVoices, playProgression, playProgressionWithExtensionNote, playProgressionWithExtensions } from '../utils/audio';
import NotationDisplay from './NotationDisplay';
import RhythmChoiceNotation from './RhythmChoiceNotation';

const EXTENSION_NAMES: Record<number, string> = {
  1: 'b9', 2: '9', 3: '#9', 5: '11', 6: '#11', 8: 'b13', 9: '13',
};
function extensionName(semitones: number): string {
  return EXTENSION_NAMES[semitones] ?? `+${semitones}`;
}

const SOUND_CHOICES = ['Altered', 'Mixolydian', 'Lydian Dominant'];

interface Props {
  instrument: InstrumentName;
}

export default function ExerciseView({ instrument }: Props) {
  const { type, difficulty: diffParam } = useParams<{ type: string; difficulty: string }>();
  const navigate = useNavigate();
  const exerciseType = type as ExerciseType;
  const difficulty = diffParam as Difficulty;
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [score, setScore] = useState<ScoreState>({ correct: 0, total: 0, streak: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [firstTry, setFirstTry] = useState(true);
  const [showExtensions, setShowExtensions] = useState(exerciseType === 'secondary-dominants');
  const [showArpeggio, setShowArpeggio] = useState(exerciseType === 'secondary-dominants');
  const [rhythmBpm, setRhythmBpm] = useState(100);
  const [metronome, setMetronome] = useState(true);
  const [sheetMusic, setSheetMusic] = useState(false);
  const [polyVoices, setPolyVoices] = useState<[number, number]>(randomPolyVoices());

  // Part 2 state (sound / groove identification)
  const [soundSelected, setSoundSelected] = useState<string | null>(null);
  const [soundRevealed, setSoundRevealed] = useState(false);
  const [grooveSelected, setGrooveSelected] = useState<string | null>(null);
  const [grooveRevealed, setGrooveRevealed] = useState(false);

  const newQuestion = useCallback(() => {
    setQuestion(generateQuestion(exerciseType, difficulty));
    setSelected(null);
    setRevealed(false);
    setEliminated(new Set());
    setFirstTry(true);
    setSoundSelected(null);
    setSoundRevealed(false);
    setGrooveSelected(null);
    setGrooveRevealed(false);
    setPolyVoices(randomPolyVoices());
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
        case 'rhythm': {
          // Find the matching rhythm choice to check for layers
          const matchingChoice = question.rhythmChoices?.find(rc => rc.label === question.correctAnswer);
          if (matchingChoice?.layers) {
            await playRhythmDrum(question.noteData!.durations!, matchingChoice.layers, rhythmBpm, metronome, polyVoices);
          } else {
            await playRhythmDrum(question.noteData!.durations!, undefined, rhythmBpm, metronome);
          }
          break;
        }
        case 'secondary-dominants':
          if (question.progressionChords) {
            const hasExt = showExtensions && question.secDomExtensions && question.secDomIndex !== undefined;
            if (hasExt && showArpeggio) {
              await playProgressionWithExtensions(
                question.progressionChords, instrument,
                question.secDomIndex!, question.secDomExtensions!
              );
            } else if (hasExt) {
              await playProgressionWithExtensionNote(
                question.progressionChords, instrument,
                question.secDomIndex!, question.secDomExtensions!
              );
            } else {
              await playProgression(question.progressionChords, instrument);
            }
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

  const handleSoundAnswer = (choice: string) => {
    if (soundRevealed) return;
    setSoundSelected(choice);
    setSoundRevealed(true);
  };

  const handleGrooveAnswer = (choice: string) => {
    if (grooveRevealed) return;
    setGrooveSelected(choice);
    setGrooveRevealed(true);
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

  // Part 2 must be complete before showing Next (sound for sec doms, groove for rhythms)
  const hasGrooveQuestion = isRhythm && question?.grooveName && question?.grooveChoices;
  const isFullyRevealed = revealed
    && (!showExtensions || !isSecDom || soundRevealed)
    && (!hasGrooveQuestion || grooveRevealed);

  return (
    <div className="exercise-view">
      <div className="exercise-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
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

            // Show actual chord name below roman numeral
            // Known chords (not hidden) always show their name; answer chords only after reveal
            const chordName = !isHidden && question.progressionChordNames?.[i]
              ? question.progressionChordNames[i]
              : revealed && isSecDomChord ? question.secDomChordName
              : revealed && isTargetChord ? question.targetChordName
              : undefined;

            // Show sound + extensions under the sec dom chord only after part 2 is revealed
            const showSecDomDetail = showExtensions && isSecDomChord && soundRevealed && question.secDomSound;

            return (
              <span key={i} className={className}>
                {revealed || !isHidden ? label : '?'}
                {chordName && <span className="chord-name">{chordName}</span>}
                {showSecDomDetail && (
                  <span className="chord-sound">{question.secDomSound}</span>
                )}
                {showSecDomDetail && question.secDomExtensions && (
                  <span className="chord-extensions">
                    {question.secDomExtensions.map(e => extensionName(e)).join(' ')}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="play-controls">
        <button
          className="btn btn-play"
          onClick={handlePlay}
          disabled={isPlaying}
        >
          {isPlaying ? '♪ Playing...' : '▶ Play Again'}
        </button>
        {isSecDom && (
          <button
            className={`btn btn-extensions-toggle ${showExtensions ? 'active' : ''}`}
            onClick={() => setShowExtensions(prev => !prev)}
          >
            {showExtensions ? '♫ Extensions On' : '♫ Extensions Off'}
          </button>
        )}
        {isSecDom && showExtensions && (
          <button
            className={`btn btn-extensions-toggle ${showArpeggio ? 'active' : ''}`}
            onClick={() => setShowArpeggio(prev => !prev)}
          >
            {showArpeggio ? '♪ Arpeggio On' : '♪ Arpeggio Off'}
          </button>
        )}
        {isRhythm && (
          <>
            <div className="tempo-slider">
              <label htmlFor="bpm-slider">{rhythmBpm} BPM</label>
              <input
                id="bpm-slider"
                type="range"
                min={60}
                max={180}
                step={5}
                value={rhythmBpm}
                onChange={e => setRhythmBpm(Number(e.target.value))}
              />
            </div>
            <button
              className={`btn btn-extensions-toggle ${metronome ? 'active' : ''}`}
              onClick={() => setMetronome(prev => !prev)}
            >
              {metronome ? 'Count-in On' : 'Count-in Off'}
            </button>
            {question.rhythmChoices?.some(rc => rc.layers) && (
              <button
                className={`btn btn-extensions-toggle ${sheetMusic ? 'active' : ''}`}
                onClick={() => setSheetMusic(prev => !prev)}
              >
                {sheetMusic ? '♩ Notation' : '▦ Grid'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Part 1: Chord identification */}
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
                <RhythmChoiceNotation choice={rc} useNotation={rc.layers ? sheetMusic : true} />
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

      {/* Part 2: Sound identification (when extensions on, directly under Part 1 choices) */}
      {revealed && showExtensions && isSecDom && (
        <>
          <p className="part2-prompt">What sound does this secondary dominant have?</p>
          <div className="choices-grid sound-choices-grid">
            {SOUND_CHOICES.map(sound => {
              let className = 'btn btn-choice';
              if (soundRevealed) {
                if (sound === question.secDomSound) {
                  className += ' correct';
                } else if (sound === soundSelected) {
                  className += ' incorrect';
                }
              }
              return (
                <button
                  key={sound}
                  className={className}
                  onClick={() => handleSoundAnswer(sound)}
                  disabled={soundRevealed}
                >
                  {sound}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Part 2: Groove identification (for rhythm patterns with named grooves) */}
      {revealed && hasGrooveQuestion && (
        <>
          <p className="part2-prompt">What groove or polyrhythm is this?</p>
          <div className="choices-grid sound-choices-grid">
            {question.grooveChoices!.map(groove => {
              let className = 'btn btn-choice';
              if (grooveRevealed) {
                if (groove === question.grooveName) {
                  className += ' correct';
                } else if (groove === grooveSelected) {
                  className += ' incorrect';
                }
              }
              return (
                <button
                  key={groove}
                  className={className}
                  onClick={() => handleGrooveAnswer(groove)}
                  disabled={grooveRevealed}
                >
                  {groove}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Result section */}
      {isFullyRevealed && (
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
          {isSecDom && soundRevealed && question.secDomSound && (
            <p className={`sound-category ${soundSelected === question.secDomSound ? 'correct' : 'incorrect'}`}>
              Sound: {question.secDomSound}
              {soundSelected === question.secDomSound ? ' ✓' : ` (you picked ${soundSelected})`}
            </p>
          )}
          {isRhythm && grooveRevealed && question.grooveName && (
            <p className={`sound-category ${grooveSelected === question.grooveName ? 'correct' : 'incorrect'}`}>
              Groove: {question.grooveName}
              {grooveSelected === question.grooveName ? ' ✓' : ` (you picked ${grooveSelected})`}
            </p>
          )}
          <button className="btn btn-primary" onClick={handleNext}>
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}
