import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Difficulty, ExerciseType, InstrumentName } from '../types';
import { ensureAudioContext, isIOSDevice } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';
import type { TranslationKey } from '../i18n/translations';

interface Props {
  instrument: InstrumentName;
}

const EXERCISES: { type: ExerciseType; titleKey: TranslationKey; descKey: TranslationKey; icon: string }[] = [
  {
    type: 'intervals',
    titleKey: 'exercise.intervals',
    descKey: 'exercise.intervals.desc',
    icon: '↕',
  },
  {
    type: 'chords',
    titleKey: 'exercise.chords',
    descKey: 'exercise.chords.desc',
    icon: '♫',
  },
  {
    type: 'inversions',
    titleKey: 'exercise.inversions',
    descKey: 'exercise.inversions.desc',
    icon: '🔄',
  },
  {
    type: 'rhythm',
    titleKey: 'exercise.rhythm',
    descKey: 'exercise.rhythm.desc',
    icon: '🥁',
  },
  {
    type: 'secondary-dominants',
    titleKey: 'exercise.secondaryDominants',
    descKey: 'exercise.secondaryDominants.desc',
    icon: 'V7/',
  },
  {
    type: 'sight-reading',
    titleKey: 'exercise.sightReading',
    descKey: 'exercise.sightReading.desc',
    icon: '🎼',
  },
];

const DIFFICULTIES: { value: Difficulty; labelKey: TranslationKey; color: string }[] = [
  { value: 'easy', labelKey: 'difficulty.easy', color: '#4caf50' },
  { value: 'medium', labelKey: 'difficulty.medium', color: '#ff9800' },
  { value: 'hard', labelKey: 'difficulty.hard', color: '#f44336' },
];

export default function HomeScreen({ instrument }: Props) {
  const [selectedType, setSelectedType] = useState<ExerciseType | null>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const handleStart = async (difficulty: Difficulty) => {
    await ensureAudioContext();
    if (selectedType) {
      if (selectedType === 'sight-reading') {
        navigate(`/sight-reading/${difficulty}`);
      } else {
        navigate(`/exercise/${selectedType}/${difficulty}`);
      }
    }
  };

  return (
    <div className="home-screen">
      <div className="hero">
        <h1>{t('app.title', lang)}</h1>
        <p className="subtitle">{t('app.subtitle', lang)}</p>
        {isIOSDevice() && (
          <p className="silent-mode-hint">🔊 {t('app.silentModeHint', lang)}</p>
        )}
        <p className="instrument-note">{t('app.currentInstrument', lang)} <strong>{t(`instrument.${instrument}` as TranslationKey, lang)}</strong></p>
      </div>

      <div className="exercise-cards">
        {EXERCISES.map(ex => (
          <button
            key={ex.type}
            className={`exercise-card ${selectedType === ex.type ? 'selected' : ''}`}
            onClick={() => setSelectedType(ex.type)}
          >
            <span className="card-icon">{ex.icon}</span>
            <h3>{t(ex.titleKey, lang)}</h3>
            <p>{t(ex.descKey, lang)}</p>
          </button>
        ))}
      </div>

      <div className="playing-changes-link">
        <Link to="/playing-changes" className="btn btn-playing-changes">
          {t('playingChanges', lang)}
        </Link>
      </div>

      {selectedType && (
        <div className="difficulty-section">
          <button
            className="difficulty-close-btn"
            onClick={() => setSelectedType(null)}
            aria-label="Close"
          >
            ✕
          </button>
          <h2>{t('difficulty.select', lang)}</h2>
          <div className="difficulty-buttons">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                className="btn btn-difficulty"
                style={{ '--diff-color': d.color } as React.CSSProperties}
                onClick={() => handleStart(d.value)}
              >
                {t(d.labelKey, lang)}
              </button>
            ))}
          </div>
          <div className="difficulty-info">
            {selectedType === 'intervals' && (
              <>
                <p><strong>{t('difficulty.easy', lang)}:</strong> {t('difficulty.intervals.easy', lang)}</p>
                <p><strong>{t('difficulty.medium', lang)}:</strong> {t('difficulty.intervals.medium', lang)}</p>
                <p><strong>{t('difficulty.hard', lang)}:</strong> {t('difficulty.intervals.hard', lang)}</p>
              </>
            )}
            {selectedType === 'chords' && (
              <>
                <p><strong>{t('difficulty.easy', lang)}:</strong> {t('difficulty.chords.easy', lang)}</p>
                <p><strong>{t('difficulty.medium', lang)}:</strong> {t('difficulty.chords.medium', lang)}</p>
                <p><strong>{t('difficulty.hard', lang)}:</strong> {t('difficulty.chords.hard', lang)}</p>
              </>
            )}
            {selectedType === 'inversions' && (
              <>
                <p><strong>{t('difficulty.easy', lang)}:</strong> {t('difficulty.inversions.easy', lang)}</p>
                <p><strong>{t('difficulty.medium', lang)}:</strong> {t('difficulty.inversions.medium', lang)}</p>
                <p><strong>{t('difficulty.hard', lang)}:</strong> {t('difficulty.inversions.hard', lang)}</p>
              </>
            )}
            {selectedType === 'rhythm' && (
              <>
                <p><strong>{t('difficulty.easy', lang)}:</strong> {t('difficulty.rhythm.easy', lang)}</p>
                <p><strong>{t('difficulty.medium', lang)}:</strong> {t('difficulty.rhythm.medium', lang)}</p>
                <p><strong>{t('difficulty.hard', lang)}:</strong> {t('difficulty.rhythm.hard', lang)}</p>
              </>
            )}
            {selectedType === 'secondary-dominants' && (
              <>
                <p><strong>{t('difficulty.easy', lang)}:</strong> {t('difficulty.secdom.easy', lang)}</p>
                <p><strong>{t('difficulty.medium', lang)}:</strong> {t('difficulty.secdom.medium', lang)}</p>
                <p><strong>{t('difficulty.hard', lang)}:</strong> {t('difficulty.secdom.hard', lang)}</p>
              </>
            )}
            {selectedType === 'sight-reading' && (
              <>
                <p><strong>{t('difficulty.easy', lang)}:</strong> {t('difficulty.sightReading.easy' as TranslationKey, lang)}</p>
                <p><strong>{t('difficulty.medium', lang)}:</strong> {t('difficulty.sightReading.medium' as TranslationKey, lang)}</p>
                <p><strong>{t('difficulty.hard', lang)}:</strong> {t('difficulty.sightReading.hard' as TranslationKey, lang)}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
