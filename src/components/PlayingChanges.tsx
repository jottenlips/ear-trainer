import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InstrumentName } from '../types';
import {
  getSecondaryDominants,
  buildSecDomProgression,
  type SecondaryDominantInfo,
  type SecDomSound,
} from '../utils/music';
import {
  ensureAudioContext,
  isIOSDevice,
  playProgression,
  playProgressionWithExtensions,
} from '../utils/audio';
import CircleOfFifths from './CircleOfFifths';
import { useLanguage } from '../i18n/LanguageContext';
import { t, tSound } from '../i18n/translations';

interface Props {
  instrument: InstrumentName;
}

// Extension name lookup
const EXT_NAMES: Record<number, string> = {
  1: 'b9', 2: '9', 3: '#9', 5: '11', 6: '#11', 8: 'b13', 9: '13',
};

// All secondary dominants (hard = all of them)
const ALL_SEC_DOMS = getSecondaryDominants('hard');

// Group by sound category
interface SoundGroup {
  sound: SecDomSound;
  color: string;
  descKey: string;
  vibeKey: string;
  extensions: string;
  whyKeys: string[];
  refKeys: { titleKey: string; descKey: string }[];
  secDoms: SecondaryDominantInfo[];
}

const SOUND_GROUPS: SoundGroup[] = [
  {
    sound: 'Mixolydian',
    color: '#4db6ac',
    descKey: 'soundGroup.mixo.desc',
    vibeKey: 'soundGroup.mixo.vibe',
    extensions: '9, 11, 13',
    whyKeys: ['soundGroup.mixo.why1', 'soundGroup.mixo.why2', 'soundGroup.mixo.why3'],
    refKeys: [
      { titleKey: 'soundGroup.mixo.ref1.title', descKey: 'soundGroup.mixo.ref1.desc' },
      { titleKey: 'soundGroup.mixo.ref2.title', descKey: 'soundGroup.mixo.ref2.desc' },
      { titleKey: 'soundGroup.mixo.ref3.title', descKey: 'soundGroup.mixo.ref3.desc' },
    ],
    secDoms: ALL_SEC_DOMS.filter(sd => sd.sound === 'Mixolydian'),
  },
  {
    sound: 'Lydian Dominant',
    color: '#ffb74d',
    descKey: 'soundGroup.lyddom.desc',
    vibeKey: 'soundGroup.lyddom.vibe',
    extensions: '9, #11, 13',
    whyKeys: ['soundGroup.lyddom.why1', 'soundGroup.lyddom.why2', 'soundGroup.lyddom.why3'],
    refKeys: [
      { titleKey: 'soundGroup.lyddom.ref1.title', descKey: 'soundGroup.lyddom.ref1.desc' },
      { titleKey: 'soundGroup.lyddom.ref2.title', descKey: 'soundGroup.lyddom.ref2.desc' },
      { titleKey: 'soundGroup.lyddom.ref3.title', descKey: 'soundGroup.lyddom.ref3.desc' },
    ],
    secDoms: ALL_SEC_DOMS.filter(sd => sd.sound === 'Lydian Dominant'),
  },
  {
    sound: 'Altered',
    color: '#e57373',
    descKey: 'soundGroup.altered.desc',
    vibeKey: 'soundGroup.altered.vibe',
    extensions: 'b9, #9, #11, b13',
    whyKeys: ['soundGroup.altered.why1', 'soundGroup.altered.why2', 'soundGroup.altered.why3'],
    refKeys: [
      { titleKey: 'soundGroup.altered.ref1.title', descKey: 'soundGroup.altered.ref1.desc' },
      { titleKey: 'soundGroup.altered.ref2.title', descKey: 'soundGroup.altered.ref2.desc' },
      { titleKey: 'soundGroup.altered.ref3.title', descKey: 'soundGroup.altered.ref3.desc' },
    ],
    secDoms: ALL_SEC_DOMS.filter(sd => sd.sound === 'Altered'),
  },
  {
    sound: 'Whole Tone',
    color: '#9575cd',
    descKey: 'soundGroup.wholetone.desc',
    vibeKey: 'soundGroup.wholetone.vibe',
    extensions: '9, #11, b13',
    whyKeys: ['soundGroup.wholetone.why1', 'soundGroup.wholetone.why2', 'soundGroup.wholetone.why3'],
    refKeys: [
      { titleKey: 'soundGroup.wholetone.ref1.title', descKey: 'soundGroup.wholetone.ref1.desc' },
      { titleKey: 'soundGroup.wholetone.ref2.title', descKey: 'soundGroup.wholetone.ref2.desc' },
      { titleKey: 'soundGroup.wholetone.ref3.title', descKey: 'soundGroup.wholetone.ref3.desc' },
    ],
    secDoms: ALL_SEC_DOMS.filter(sd => sd.sound === 'Whole Tone'),
  },
];

// Also include the "dual personality" chords (V7/V and V7/IV have altSound)
const DUAL_CHORDS = ALL_SEC_DOMS.filter(sd => sd.altSound);

// Fixed key of C for all examples
const ROOT_MIDI = 48; // C3

function PlayButton({ label, onClick, playing }: { label: string; onClick: () => void; playing: boolean }) {
  return (
    <button
      className="btn btn-play-example"
      onClick={onClick}
      disabled={playing}
    >
      {playing ? '...' : '▶'} {label}
    </button>
  );
}

export default function PlayingChanges({ instrument }: Props) {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState<string | null>(null);
  const { lang } = useLanguage();

  const playExample = useCallback(async (
    id: string,
    secDom: SecondaryDominantInfo,
    useAlt: boolean = false,
  ) => {
    if (playing) return;
    setPlaying(id);
    await ensureAudioContext();

    const prog = buildSecDomProgression('hard', secDom, ROOT_MIDI);
    // Override with specific sound/extensions if requested
    const extensions = useAlt && secDom.altExtensions ? secDom.altExtensions : secDom.extensions;

    await playProgressionWithExtensions(
      prog.chords,
      instrument,
      prog.secDomIndex,
      extensions,
      75,
    );

    // Wait for playback to finish (6 chords × 2 beats × 60/75 = ~9.6s)
    setTimeout(() => setPlaying(null), 9800);
  }, [instrument, playing]);

  const playBlockChords = useCallback(async (
    id: string,
    secDom: SecondaryDominantInfo,
  ) => {
    if (playing) return;
    setPlaying(id);
    await ensureAudioContext();

    const prog = buildSecDomProgression('hard', secDom, ROOT_MIDI);
    await playProgression(prog.chords, instrument, 75);

    setTimeout(() => setPlaying(null), 9800);
  }, [instrument, playing]);

  const playJustChord = useCallback(async (
    id: string,
    secDom: SecondaryDominantInfo,
    useAlt: boolean = false,
  ) => {
    if (playing) return;
    setPlaying(id);
    await ensureAudioContext();

    // Build the chord + extensions as a quick arpeggio
    const chordMidi = secDom.dominantIntervals.map(i => ROOT_MIDI + i);
    const extensions = useAlt && secDom.altExtensions ? secDom.altExtensions : secDom.extensions;

    // Use playProgressionWithExtensions with just the one chord
    const allChords = [chordMidi];
    await playProgressionWithExtensions(allChords, instrument, 0, extensions, 55);

    setTimeout(() => setPlaying(null), 4000);
  }, [instrument, playing]);

  // Build chord name helper
  const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const chordName = (secDom: SecondaryDominantInfo) => {
    const root = NOTE_NAMES[(ROOT_MIDI + secDom.dominantIntervals[0]) % 12];
    return `${root}7`;
  };
  const targetName = (secDom: SecondaryDominantInfo) => {
    const root = NOTE_NAMES[(ROOT_MIDI + secDom.targetIntervals[0]) % 12];
    const intervals = secDom.targetIntervals.map(i => ((ROOT_MIDI + i) - (ROOT_MIDI + secDom.targetIntervals[0])) % 12);
    return `${root}${intervals.includes(3) ? 'm' : ''}`;
  };

  return (
    <div className="playing-changes">
      <div className="pc-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>{t('pc.back', lang)}</button>
        <h1>{t('pc.title', lang)}</h1>
        <blockquote className="pc-quote">
          "There is no wrong note, it has to do with how you resolve it" — Thelonious Monk
        </blockquote>
        <p className="pc-subtitle">
          {t('pc.subtitle', lang)}
        </p>
        {isIOSDevice() && (
          <p className="silent-mode-hint">🔊 {t('app.silentModeHint', lang)}</p>
        )}
      </div>

      {/* What is a secondary dominant */}
      <section className="pc-section">
        <h2>{t('pc.whatIsSecDom', lang)}</h2>
        <p>
          {t('pc.whatIsSecDom.p1', lang)}
        </p>
        <p className="pc-muted" style={{ marginTop: '0.5rem' }}>
          {t('pc.whatIsSecDom.p2', lang)}
        </p>
      </section>

      {/* Color → Destination */}
      <section className="pc-section">
        <h2>{t('pc.colorDest', lang)}</h2>
        <p>
          {t('pc.colorDest.intro', lang)}
        </p>
        <div className="pc-color-summary">
          <div className="pc-color-item" style={{ borderColor: '#4db6ac' }}>
            <strong style={{ color: '#4db6ac' }}>{tSound('Mixolydian', lang)}</strong> — {t('pc.colorDest.mixo', lang).split(' — ')[1]}
          </div>
          <div className="pc-color-item" style={{ borderColor: '#ffb74d' }}>
            <strong style={{ color: '#ffb74d' }}>{tSound('Lydian Dominant', lang)}</strong> — {t('pc.colorDest.lyddom', lang).split(' — ')[1]}
          </div>
          <div className="pc-color-item" style={{ borderColor: '#e57373' }}>
            <strong style={{ color: '#e57373' }}>{tSound('Altered', lang)}</strong> — {t('pc.colorDest.altered', lang).split(' — ')[1]}
          </div>
          <div className="pc-color-item" style={{ borderColor: '#9575cd' }}>
            <strong style={{ color: '#9575cd' }}>{tSound('Whole Tone', lang)}</strong> — {t('pc.colorDest.wholetone', lang).split(' — ')[1]}
          </div>
        </div>
        <p className="pc-muted" style={{ marginTop: '1rem' }}>
          {t('pc.colorDest.outro', lang)}
        </p>
      </section>

      {/* The Chart */}
      <section className="pc-section">
        <h2>{t('pc.chart', lang)}</h2>
        <div className="pc-chart">
          <div className="pc-chart-header">
            <span>{t('pc.chart.chord', lang)}</span>
            <span>{t('pc.chart.label', lang)}</span>
            <span>{t('pc.chart.example', lang)}</span>
            <span>{t('pc.chart.sound', lang)}</span>
            <span>{t('pc.chart.extensions', lang)}</span>
          </div>
          {ALL_SEC_DOMS.map(secDom => {
            const soundColor = secDom.sound === 'Altered' ? '#e57373'
              : secDom.sound === 'Lydian Dominant' ? '#ffb74d'
              : secDom.sound === 'Whole Tone' ? '#9575cd'
              : '#4db6ac';
            return (
              <div key={secDom.label} className="pc-chart-row">
                <span className="pc-chart-cell">
                  {NOTE_NAMES[(ROOT_MIDI + secDom.dominantIntervals[0]) % 12]}7
                </span>
                <span className="pc-chart-cell">{secDom.label}</span>
                <span className="pc-chart-cell">
                  {chordName(secDom)} → {targetName(secDom)}
                </span>
                <span className="pc-chart-cell" style={{ color: soundColor }}>
                  {tSound(secDom.sound, lang)}
                  {secDom.altSound && <span className="pc-chart-alt"> / {tSound(secDom.altSound, lang)}</span>}
                </span>
                <span className="pc-chart-cell pc-chart-exts">
                  {secDom.extensions.map(e => EXT_NAMES[e]).join(', ')}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* The Setup */}
      <section className="pc-section">
        <h2>{t('pc.setup', lang)}</h2>
        <p>
          <strong>{t('pc.setup.p1', lang)}</strong>
        </p>
        <p className="pc-muted">
          {t('pc.setup.p2', lang)}
        </p>
      </section>

      {/* Extension Reference */}
      <section className="pc-section">
        <h2>{t('pc.extIntervals', lang)}</h2>
        <div className="pc-ext-table">
          {Object.entries(EXT_NAMES).map(([semi, name]) => (
            <div key={semi} className="pc-ext-cell">
              <span className="pc-ext-name">{name}</span>
              <span className="pc-ext-semi">{semi} {t('pc.semitones', lang)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sound Categories */}
      {SOUND_GROUPS.map(group => (
        <section key={group.sound} className="pc-section pc-sound-section">
          <h2 style={{ color: group.color }}>{tSound(group.sound, lang)}</h2>
          <p className="pc-extensions-label" style={{ color: group.color }}>
            {t('pc.extensions', lang)} {group.extensions}
          </p>
          <p className="pc-description">{t(group.descKey as any, lang)}</p>
          <p className="pc-vibe">{t(group.vibeKey as any, lang)}</p>

          {/* Why these extensions */}
          <div className="pc-why">
            <h3>{t('pc.whyExtensions', lang)}</h3>
            {group.whyKeys.map((key, i) => (
              <p key={i}>{t(key as any, lang)}</p>
            ))}
          </div>

          {/* Playable examples */}
          <div className="pc-examples">
            <h3>{t('pc.hearIt', lang)}</h3>
            {group.secDoms.map(secDom => (
              <div key={secDom.label} className="pc-example-card" style={{ borderColor: group.color }}>
                <div className="pc-example-header">
                  <span className="pc-example-label">{secDom.label}</span>
                  <span className="pc-example-chord">
                    {chordName(secDom)} → {targetName(secDom)}
                  </span>
                </div>
                <div className="pc-example-buttons">
                  <PlayButton
                    label={t('pc.fullProgression', lang)}
                    onClick={() => playExample(`${secDom.label}-full`, secDom)}
                    playing={playing === `${secDom.label}-full`}
                  />
                  <PlayButton
                    label={t('pc.justChord', lang)}
                    onClick={() => playJustChord(`${secDom.label}-chord`, secDom)}
                    playing={playing === `${secDom.label}-chord`}
                  />
                  <PlayButton
                    label={t('pc.noExtensions', lang)}
                    onClick={() => playBlockChords(`${secDom.label}-block`, secDom)}
                    playing={playing === `${secDom.label}-block`}
                  />
                </div>
                <div className="pc-example-ext-list">
                  {secDom.extensions.map(e => (
                    <span key={e} className="pc-ext-badge" style={{ background: group.color }}>
                      {EXT_NAMES[e]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Real progressions */}
          <div className="pc-real">
            <h3>{t('pc.whereHeard', lang)}</h3>
            {group.refKeys.map((ref, i) => (
              <div key={i} className="pc-real-item">
                <strong>{t(ref.titleKey as any, lang)}</strong> — {t(ref.descKey as any, lang)}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Dual Personality Section */}
      <section className="pc-section pc-sound-section">
        <h2 style={{ color: '#4a8525' }}>{t('pc.dualPersonality', lang)}</h2>
        <p className="pc-description">
          {t('pc.dualPersonality.desc', lang)}
        </p>

        <div className="pc-examples">
          {DUAL_CHORDS.map(secDom => (
            <div key={secDom.label} className="pc-example-card pc-dual-card">
              <div className="pc-example-header">
                <span className="pc-example-label">{secDom.label}</span>
                <span className="pc-example-chord">
                  {chordName(secDom)} → {targetName(secDom)}
                </span>
              </div>
              <div className="pc-dual-compare">
                <div className="pc-dual-side" style={{ borderColor: '#4db6ac' }}>
                  <h4 style={{ color: '#4db6ac' }}>{tSound('Mixolydian', lang)}</h4>
                  <div className="pc-example-ext-list">
                    {secDom.extensions.map(e => (
                      <span key={e} className="pc-ext-badge" style={{ background: '#4db6ac' }}>
                        {EXT_NAMES[e]}
                      </span>
                    ))}
                  </div>
                  <PlayButton
                    label={t('pc.playMixo', lang)}
                    onClick={() => playExample(`${secDom.label}-mixo`, secDom, false)}
                    playing={playing === `${secDom.label}-mixo`}
                  />
                </div>
                <div className="pc-dual-side" style={{ borderColor: '#ffb74d' }}>
                  <h4 style={{ color: '#ffb74d' }}>{tSound('Lydian Dominant', lang)}</h4>
                  <div className="pc-example-ext-list">
                    {secDom.altExtensions!.map(e => (
                      <span key={e} className="pc-ext-badge" style={{ background: '#ffb74d' }}>
                        {EXT_NAMES[e]}
                      </span>
                    ))}
                  </div>
                  <PlayButton
                    label={t('pc.playLydDom', lang)}
                    onClick={() => playExample(`${secDom.label}-lyddom`, secDom, true)}
                    playing={playing === `${secDom.label}-lyddom`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Circle of Fifths */}
      <section className="pc-section">
        <h2>{t('pc.circle', lang)}</h2>
        <p className="pc-muted">
          {t('pc.circle.desc', lang)}
        </p>
        <CircleOfFifths instrument={instrument} />
      </section>

    </div>
  );
}
