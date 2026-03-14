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
  playProgression,
  playProgressionWithExtensions,
} from '../utils/audio';

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
  description: string;
  vibe: string;
  extensions: string;
  whyText: string[];
  realProgressions: { title: string; description: string }[];
  secDoms: SecondaryDominantInfo[];
}

const SOUND_GROUPS: SoundGroup[] = [
  {
    sound: 'Mixolydian',
    color: '#4db6ac',
    description: 'Bright, bluesy, uncomplicated. The extensions all come from the mixolydian mode — no surprise notes.',
    vibe: 'Think Jerry Garcia on Fire on the Mountain, or any classic rock dominant vamp.',
    extensions: '9, 11, 13',
    whyText: [
      'These are all diatonic — they sit inside the parent major scale without alteration.',
      'The natural 11 works here because in a mixolydian context the chord functions more as a modal sound than a hard V-I resolution.',
      'This is the most "inside" a secondary dominant can sound.',
    ],
    realProgressions: [
      { title: 'Fire on the Mountain', description: 'Grateful Dead — B7 vamp with a mixolydian feel' },
      { title: 'Blues turnarounds', description: 'I7 → IV7 → V7, all mixolydian dominant sounds' },
      { title: 'Everyday', description: 'Buddy Holly — D → A7 → D, pure mixolydian color' },
    ],
    secDoms: ALL_SEC_DOMS.filter(sd => sd.sound === 'Mixolydian'),
  },
  {
    sound: 'Lydian Dominant',
    color: '#ffb74d',
    description: 'Floating, bright but sophisticated. The #11 gives it a lifted quality — not as dark as altered, not as plain as mixolydian.',
    vibe: 'The definitive tritone substitute color. The #11 signals "I\'m a sub, not a regular dominant."',
    extensions: '9, #11, 13',
    whyText: [
      'The lydian dominant scale (4th mode of melodic minor) raises the 11th to avoid the clash with the major 3rd.',
      'For SubV7/I: the #11 of the tritone sub is the root of the V7 it\'s substituting for.',
      'The extensions of a lydian dominant tritone sub mirror the altered dominant they replace.',
    ],
    realProgressions: [
      { title: 'Girl From Ipanema', description: 'The Db7 in the bridge — pure lydian dominant color' },
      { title: 'Lady Bird', description: 'Tadd Dameron — tritone subs with lydian dominant extensions' },
      { title: 'Steely Dan', description: 'Frequently uses II7 with #11 for that polished, lifted sound' },
    ],
    secDoms: ALL_SEC_DOMS.filter(sd => sd.sound === 'Lydian Dominant'),
  },
  {
    sound: 'Altered',
    color: '#e57373',
    description: 'Dark, tense, unstable. Maximum chromaticism against the parent key. Every extension is altered from its natural position.',
    vibe: 'The sound of bebop and modern jazz tension. These resolve to minor chords (ii, vi, iii).',
    extensions: 'b9, #9, #11, b13',
    whyText: [
      'The altered extensions reflect the harmonic minor scale of the target key.',
      'Natural 11 is NOT used — it\'s a half step above the major 3rd, which sounds wrong rather than tense.',
      'The b9 is the telltale: it creates a diminished sound against the root that your ear immediately codes as "altered."',
    ],
    realProgressions: [
      { title: 'Autumn Leaves', description: 'E7 → Am (V7/vi) — the defining altered sound' },
      { title: 'Stella by Starlight', description: 'Loaded with altered dominants resolving to minor chords' },
      { title: 'Blue Bossa', description: 'A7(b9) → Dm — textbook altered secondary dominant' },
    ],
    secDoms: ALL_SEC_DOMS.filter(sd => sd.sound === 'Altered'),
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
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Back</button>
        <h1>Playing Changes</h1>
        <p className="pc-subtitle">
          Secondary dominant extensions — what they are, why they work, and how they sound.
          All examples in the key of C major.
        </p>
      </div>

      {/* What is a secondary dominant */}
      <section className="pc-section">
        <h2>What's a Secondary Dominant?</h2>
        <p>
          In any major key, the V7 chord naturally wants to resolve to I. A <strong>secondary dominant</strong> borrows
          that same pull and points it at a different chord in the key. V7/V is a dominant 7th built to resolve
          to the V chord; V7/ii resolves to ii; and so on. They're "temporary key changes" — your ear briefly
          hears a new tonal center before snapping back.
        </p>
        <p className="pc-muted" style={{ marginTop: '0.5rem' }}>
          What makes each one sound different isn't the dom7 shell (they all have root, 3, 5, b7) —
          it's the <em>extensions</em> on top. Those color tones come from the scale that fits the chord's
          resolution, and they fall into three categories.
        </p>
      </section>

      {/* Color → Destination */}
      <section className="pc-section">
        <h2>Color → Destination</h2>
        <p>
          The goal isn't to memorize which extensions go where — it's to hear the <em>color</em>:
        </p>
        <div className="pc-color-summary">
          <div className="pc-color-item" style={{ borderColor: '#4db6ac' }}>
            <strong style={{ color: '#4db6ac' }}>Mixolydian</strong> — sounds like home turned dominant. It's the blues.
          </div>
          <div className="pc-color-item" style={{ borderColor: '#ffb74d' }}>
            <strong style={{ color: '#ffb74d' }}>Lydian Dominant</strong> — sounds like it's floating above the key. Bright but not inside.
          </div>
          <div className="pc-color-item" style={{ borderColor: '#e57373' }}>
            <strong style={{ color: '#e57373' }}>Altered</strong> — sounds like maximum tension. Dark, chromatic, pulling hard toward resolution.
          </div>
        </div>
        <p className="pc-muted" style={{ marginTop: '1rem' }}>
          The chord structure (dom7) is the same for all secondary dominants — the <em>color on top</em> tells
          your ear where it wants to go.
        </p>
      </section>

      {/* The Chart */}
      <section className="pc-section">
        <h2>The Chart</h2>
        <div className="pc-chart">
          <div className="pc-chart-header">
            <span>Chord</span>
            <span>Label</span>
            <span>Example</span>
            <span>Sound</span>
            <span>Extensions</span>
          </div>
          {ALL_SEC_DOMS.map(secDom => {
            const soundColor = secDom.sound === 'Altered' ? '#e57373'
              : secDom.sound === 'Lydian Dominant' ? '#ffb74d'
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
                  {secDom.sound}
                  {secDom.altSound && <span className="pc-chart-alt"> / {secDom.altSound}</span>}
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
        <h2>The Setup</h2>
        <p>
          Every example plays: <strong>Imaj7 → ii7 → V7 → Imaj7 → [SecDom] → [Target]</strong>
        </p>
        <p className="pc-muted">
          The first four chords establish the key. Then the secondary dominant arrives with its
          extension color tones, and your ear hears the sound category — mixolydian, lydian dominant,
          or altered — which tells you where it wants to resolve.
        </p>
      </section>

      {/* Extension Reference */}
      <section className="pc-section">
        <h2>Extension Intervals</h2>
        <div className="pc-ext-table">
          {Object.entries(EXT_NAMES).map(([semi, name]) => (
            <div key={semi} className="pc-ext-cell">
              <span className="pc-ext-name">{name}</span>
              <span className="pc-ext-semi">{semi} semitones</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sound Categories */}
      {SOUND_GROUPS.map(group => (
        <section key={group.sound} className="pc-section pc-sound-section">
          <h2 style={{ color: group.color }}>{group.sound}</h2>
          <p className="pc-extensions-label" style={{ color: group.color }}>
            Extensions: {group.extensions}
          </p>
          <p className="pc-description">{group.description}</p>
          <p className="pc-vibe">{group.vibe}</p>

          {/* Why these extensions */}
          <div className="pc-why">
            <h3>Why these extensions?</h3>
            {group.whyText.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>

          {/* Playable examples */}
          <div className="pc-examples">
            <h3>Hear it</h3>
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
                    label="Full Progression"
                    onClick={() => playExample(`${secDom.label}-full`, secDom)}
                    playing={playing === `${secDom.label}-full`}
                  />
                  <PlayButton
                    label="Just the Chord"
                    onClick={() => playJustChord(`${secDom.label}-chord`, secDom)}
                    playing={playing === `${secDom.label}-chord`}
                  />
                  <PlayButton
                    label="No Extensions"
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
            <h3>Where you've heard it</h3>
            {group.realProgressions.map((rp, i) => (
              <div key={i} className="pc-real-item">
                <strong>{rp.title}</strong> — {rp.description}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Dual Personality Section */}
      <section className="pc-section pc-sound-section">
        <h2 style={{ color: '#ab9df5' }}>The Dual Personality Chords</h2>
        <p className="pc-description">
          V7/V and V7/IV can sound either Mixolydian or Lydian Dominant — both work.
          Mixolydian is bluesy and inside; Lydian Dominant is polished and lifted.
          Compare them side by side.
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
                  <h4 style={{ color: '#4db6ac' }}>Mixolydian</h4>
                  <div className="pc-example-ext-list">
                    {secDom.extensions.map(e => (
                      <span key={e} className="pc-ext-badge" style={{ background: '#4db6ac' }}>
                        {EXT_NAMES[e]}
                      </span>
                    ))}
                  </div>
                  <PlayButton
                    label="Play Mixolydian"
                    onClick={() => playExample(`${secDom.label}-mixo`, secDom, false)}
                    playing={playing === `${secDom.label}-mixo`}
                  />
                </div>
                <div className="pc-dual-side" style={{ borderColor: '#ffb74d' }}>
                  <h4 style={{ color: '#ffb74d' }}>Lydian Dominant</h4>
                  <div className="pc-example-ext-list">
                    {secDom.altExtensions!.map(e => (
                      <span key={e} className="pc-ext-badge" style={{ background: '#ffb74d' }}>
                        {EXT_NAMES[e]}
                      </span>
                    ))}
                  </div>
                  <PlayButton
                    label="Play Lydian Dom"
                    onClick={() => playExample(`${secDom.label}-lyddom`, secDom, true)}
                    playing={playing === `${secDom.label}-lyddom`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
