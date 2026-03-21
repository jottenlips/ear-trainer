import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import type { Difficulty, ExerciseType, InstrumentName, Question, ScoreState } from '../types';
import { generateQuestion } from '../utils/questions';
import { playInterval, playChord, playRhythmDrum, randomPolyVoices, playProgression, playProgressionWithExtensionNote, playProgressionWithExtensions, recoverAudioContext } from '../utils/audio';
import NotationDisplay from './NotationDisplay';
import RhythmChoiceNotation from './RhythmChoiceNotation';
import { useLanguage } from '../i18n/LanguageContext';
import { t, tInterval, tChord, tInversion, tSound } from '../i18n/translations';

// iOS Safari blocks speechSynthesis.speak() outside user-gesture context.
// Warm up the engine on a real tap so queued utterances work in auto mode.
function warmUpSpeechSynthesis() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const warm = new SpeechSynthesisUtterance('');
  warm.volume = 0;
  window.speechSynthesis.speak(warm);
}

function speakAnswer(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    // Cancel any in-progress speech
    window.speechSynthesis.cancel();

    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.6;
    utterance.onend = done;
    utterance.onerror = done;

    // Fallback timeout — some browsers/devices never fire onend
    const timeout = setTimeout(done, 5000);

    window.speechSynthesis.speak(utterance);

    // iOS workaround: speechSynthesis can pause in background, nudge it
    setTimeout(() => {
      if (!resolved && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 300);
  });
}

const EXTENSION_NAMES: Record<number, string> = {
  1: 'b9', 2: '9', 3: '#9', 5: '11', 6: '#11', 8: 'b13', 9: '13',
};
function extensionName(semitones: number): string {
  return EXTENSION_NAMES[semitones] ?? `+${semitones}`;
}

const SOUND_CHOICES = ['Altered', 'Mixolydian', 'Lydian Dominant', 'Whole Tone'];

interface Props {
  instrument: InstrumentName;
  autoMode: boolean;
  setAutoMode: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export default function ExerciseView({ instrument, autoMode, setAutoMode }: Props) {
  const { type, difficulty: diffParam } = useParams<{ type: string; difficulty: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
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
  // Auto mode state (autoMode itself is a global prop)
  const [autoPhase, setAutoPhase] = useState<'idle' | 'playing' | 'thinking' | 'revealing' | 'pausing'>('idle');
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCancelledRef = useRef(false);
  const autoModeRef = useRef(autoMode);
  autoModeRef.current = autoMode;
  // Track whether the current question has already been played (to avoid replay on auto toggle)
  const questionPlayedRef = useRef(false);

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
    questionPlayedRef.current = false;
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
        case 'inversions':
          await playChord(question.noteData!.notes, instrument);
          break;
        case 'rhythm': {
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

  // Translate a choice label for display
  const translateChoice = (choice: string): string => {
    if (exerciseType === 'intervals') return tInterval(choice, lang);
    if (exerciseType === 'chords') return tChord(choice, lang);
    if (exerciseType === 'inversions') return tInversion(choice, lang);
    return choice;
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

  // Get the speakable answer text for the current question
  const getAnswerText = useCallback((q: Question): string => {
    if (exerciseType === 'secondary-dominants' && q.secDomChordName && q.targetChordName) {
      return `${q.secDomChordName} to ${q.targetChordName}`;
    }
    return q.correctAnswer;
  }, [exerciseType]);

  // Auto mode cycle: play → wait for playback → think → speak answer → wait → next
  useEffect(() => {
    if (!autoMode || !question) {
      setAutoPhase('idle');
      return;
    }

    autoCancelledRef.current = false;

    // Calculate how long the audio actually takes to play (notes are scheduled, not blocking)
    const getPlaybackDurationMs = (): number => {
      if (exerciseType === 'secondary-dominants' && question.progressionChords) {
        const bpm = 80;
        const beatDuration = 60 / bpm; // 0.75s
        const numChords = question.progressionChords.length; // typically 6
        return numChords * beatDuration * 2 * 1000; // 2 beats per chord
      }
      return 0; // other types already block until playback finishes
    };

    const runCycle = async () => {
      const alreadyPlayed = questionPlayedRef.current;

      // Phase: playing
      setAutoPhase('playing');

      if (alreadyPlayed) {
        // Question was already played before auto mode was enabled — skip replay
        // Just give a brief pause before thinking
        await new Promise(r => { autoTimerRef.current = setTimeout(r, 500); });
      } else {
        // Small delay before playing to let state settle
        await new Promise(r => { autoTimerRef.current = setTimeout(r, 400); });
        if (autoCancelledRef.current) return;

        // Play the question
        const playbackMs = getPlaybackDurationMs();
        try {
          switch (exerciseType) {
            case 'intervals':
              await playInterval(question.noteData!.notes[0], question.noteData!.notes[1], instrument);
              break;
            case 'chords':
            case 'inversions':
              await playChord(question.noteData!.notes, instrument);
              break;
            case 'rhythm': {
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
                  await playProgressionWithExtensions(question.progressionChords, instrument, question.secDomIndex!, question.secDomExtensions!);
                } else if (hasExt) {
                  await playProgressionWithExtensionNote(question.progressionChords, instrument, question.secDomIndex!, question.secDomExtensions!);
                } else {
                  await playProgression(question.progressionChords, instrument);
                }
              }
              break;
          }
        } catch { /* ignore playback errors */ }
        if (autoCancelledRef.current) return;
        questionPlayedRef.current = true;

        // For secondary dominants, wait for the scheduled audio to actually finish playing
        if (playbackMs > 0) {
          await new Promise(r => { autoTimerRef.current = setTimeout(r, playbackMs); });
          if (autoCancelledRef.current) return;
        }
      }
      if (autoCancelledRef.current) return;

      // Phase: thinking — longer for secondary dominants to give time to process
      const thinkingMs = exerciseType === 'secondary-dominants' ? 6000 : 3000;
      setAutoPhase('thinking');
      await new Promise(r => { autoTimerRef.current = setTimeout(r, thinkingMs); });
      if (autoCancelledRef.current) return;

      // Phase: revealing — speak the answer
      setAutoPhase('revealing');
      setSelected(question.correctAnswer);
      setRevealed(true);
      if (exerciseType === 'secondary-dominants') {
        setSoundSelected(question.secDomSound ?? null);
        setSoundRevealed(true);
      }
      if (question.grooveName && question.grooveChoices) {
        setGrooveSelected(question.grooveName);
        setGrooveRevealed(true);
      }

      await speakAnswer(getAnswerText(question));
      if (autoCancelledRef.current) return;

      // Reclaim the audio session from speech synthesis so the next
      // question's music playback works on iOS Safari
      await recoverAudioContext();

      // Phase: pausing (2 seconds before next)
      setAutoPhase('pausing');
      await new Promise(r => { autoTimerRef.current = setTimeout(r, 2000); });
      if (autoCancelledRef.current) return;

      // Next question
      newQuestion();
    };

    runCycle();

    return () => {
      autoCancelledRef.current = true;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, question]);

  // Clean up auto mode on unmount
  useEffect(() => {
    return () => {
      autoCancelledRef.current = true;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // iOS Safari keep-alive: periodically resume speechSynthesis so it stays active.
  // Only nudge while speech is actually in progress (speaking && paused) to avoid
  // holding the audio session open when music should be playing.
  useEffect(() => {
    if (!autoMode || !('speechSynthesis' in window)) return;
    const interval = setInterval(() => {
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoMode]);

  // Auto-play on new question (only when NOT in auto mode — auto mode handles its own playback)
  useEffect(() => {
    if (question && !autoModeRef.current) {
      questionPlayedRef.current = true;
      const timer = setTimeout(handlePlay, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  if (!question) return null;

  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  const isRhythm = exerciseType === 'rhythm';
  const isSecDom = exerciseType === 'secondary-dominants';

  // Translate the prompt
  const translatedPrompt = (() => {
    if (question.promptKey) {
      if (question.promptKey === 'interval') return t('prompt.interval', lang);
      if (question.promptKey === 'chord') return `${t('prompt.chord', lang)} (${t('prompt.root', lang)} ${question.promptRoot})`;
      if (question.promptKey === 'inversion') return `${question.inversionChordName} — ${t('prompt.inversion', lang)} (${t('prompt.bass', lang)} ${question.promptRoot})`;
      if (question.promptKey === 'rhythm') return t('prompt.rhythm', lang);
      if (question.promptKey === 'beat') return t('prompt.beat', lang);
      if (question.promptKey === 'secdom') return `${t('prompt.keyOf', lang)} ${question.promptRoot} ${t('prompt.major', lang)} — ${t('prompt.secdom', lang)}`;
    }
    return question.prompt;
  })();

  // Part 2 must be complete before showing Next (sound for sec doms, groove for rhythms)
  const hasGrooveQuestion = isRhythm && question?.grooveName && question?.grooveChoices;
  const isFullyRevealed = revealed
    && (!showExtensions || !isSecDom || soundRevealed)
    && (!hasGrooveQuestion || grooveRevealed);

  return (
    <div className="exercise-view">
      <div className="exercise-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          {t('exercise.back', lang)}
        </button>
        <div className="score-display">
          <span className="score-fraction">{score.correct}/{score.total}</span>
          <span className="score-percent">({percentage}%)</span>
          {score.streak >= 3 && (
            <span className="streak">🔥 {score.streak} {t('exercise.streak', lang)}</span>
          )}
        </div>
      </div>

      <h2 className="exercise-prompt">{translatedPrompt}</h2>

      {/* Show notation only after reveal for intervals and chords */}
      {exerciseType === 'intervals' && revealed && question.noteData && (
        <NotationDisplay
          noteData={question.noteData}
          exerciseType={exerciseType}
          revealed={revealed}
        />
      )}
      {(exerciseType === 'chords' || exerciseType === 'inversions') && revealed && question.noteData && (
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

            const chordName = !isHidden && question.progressionChordNames?.[i]
              ? question.progressionChordNames[i]
              : revealed && isSecDomChord ? question.secDomChordName
              : revealed && isTargetChord ? question.targetChordName
              : undefined;

            const showSecDomDetail = showExtensions && isSecDomChord && soundRevealed && question.secDomSound;

            return (
              <span key={i} className={className}>
                {revealed || !isHidden ? label : '?'}
                {chordName && <span className="chord-name">{chordName}</span>}
                {showSecDomDetail && (
                  <span className="chord-sound">{tSound(question.secDomSound!, lang)}</span>
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
          disabled={isPlaying || autoMode}
        >
          {isPlaying ? t('exercise.playing', lang) : t('exercise.playAgain', lang)}
        </button>
        <button
          className={`btn btn-extensions-toggle ${autoMode ? 'active' : ''}`}
          onClick={() => {
            if (!autoMode) {
              // Turning on — warm up speech synthesis from user gesture context (iOS Safari)
              warmUpSpeechSynthesis();
            }
            setAutoMode(prev => !prev);
            if (autoMode) {
              // Turning off — cancel cycle and reset
              autoCancelledRef.current = true;
              if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
              window.speechSynthesis?.cancel();
              setAutoPhase('idle');
            }
          }}
        >
          {autoMode ? t('exercise.autoModeOn', lang) : t('exercise.autoModeOff', lang)}
        </button>
        {isSecDom && (
          <button
            className={`btn btn-extensions-toggle ${showExtensions ? 'active' : ''}`}
            onClick={() => setShowExtensions(prev => !prev)}
          >
            {showExtensions ? t('exercise.extensionsOn', lang) : t('exercise.extensionsOff', lang)}
          </button>
        )}
        {isSecDom && showExtensions && (
          <button
            className={`btn btn-extensions-toggle ${showArpeggio ? 'active' : ''}`}
            onClick={() => setShowArpeggio(prev => !prev)}
          >
            {showArpeggio ? t('exercise.arpeggioOn', lang) : t('exercise.arpeggioOff', lang)}
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
              {metronome ? t('exercise.countInOn', lang) : t('exercise.countInOff', lang)}
            </button>
            {question.rhythmChoices?.some(rc => rc.layers) && (
              <button
                className={`btn btn-extensions-toggle ${sheetMusic ? 'active' : ''}`}
                onClick={() => setSheetMusic(prev => !prev)}
              >
                {sheetMusic ? t('exercise.notation', lang) : t('exercise.grid', lang)}
              </button>
            )}
          </>
        )}
      </div>

      {/* Auto mode status */}
      {autoMode && (
        <div className="auto-mode-status">
          {autoPhase === 'playing' && <span className="auto-phase">♪ ...</span>}
          {autoPhase === 'thinking' && <span className="auto-phase thinking">{t('exercise.autoThinking', lang)}</span>}
          {autoPhase === 'revealing' && <span className="auto-phase revealing">{t('exercise.autoRevealing', lang)} {translateChoice(question.correctAnswer)}</span>}
          {autoPhase === 'pausing' && <span className="auto-phase revealing">{translateChoice(question.correctAnswer)}</span>}
        </div>
      )}

      {/* Part 1: Chord identification */}
      {/* Choices — hidden in auto mode */}
      {!autoMode && (
        <>
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
                    {translateChoice(choice)}
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
              <p className="part2-prompt">{t('exercise.soundPrompt', lang)}</p>
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
                      {tSound(sound, lang)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Part 2: Groove identification (for rhythm patterns with named grooves) */}
          {revealed && hasGrooveQuestion && (
            <>
              <p className="part2-prompt">{t('exercise.groovePrompt', lang)}</p>
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
                      ? `${t('exercise.correct', lang)} ${question.secDomChordName} → ${question.targetChordName}`
                      : t('exercise.correct', lang))
                  : isRhythm
                    ? t('exercise.gotIt', lang)
                    : isSecDom && question.secDomChordName
                      ? `${t('result.incorrect', lang)} ${question.secDomChordName} → ${question.targetChordName}`
                      : `${t('result.incorrect', lang)} ${translateChoice(question.correctAnswer)}`}
              </p>
              {isSecDom && soundRevealed && question.secDomSound && (
                <p className={`sound-category ${soundSelected === question.secDomSound ? 'correct' : 'incorrect'}`}>
                  {t('exercise.sound', lang)} {tSound(question.secDomSound, lang)}
                  {soundSelected === question.secDomSound ? ' ✓' : ` (${t('exercise.youPicked', lang)} ${tSound(soundSelected!, lang)})`}
                </p>
              )}
              {isRhythm && grooveRevealed && question.grooveName && (
                <p className={`sound-category ${grooveSelected === question.grooveName ? 'correct' : 'incorrect'}`}>
                  {t('exercise.groove', lang)} {question.grooveName}
                  {grooveSelected === question.grooveName ? ' ✓' : ` (${t('exercise.youPicked', lang)} ${grooveSelected})`}
                </p>
              )}
              <button className="btn btn-primary" onClick={handleNext}>
                {t('exercise.nextQuestion', lang)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
