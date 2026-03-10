import type { Interval, ChordQuality, Difficulty, RhythmPattern } from '../types';

export const ALL_INTERVALS: Interval[] = [
  { name: 'Unison', semitones: 0, abbreviation: 'P1' },
  { name: 'Minor 2nd', semitones: 1, abbreviation: 'm2' },
  { name: 'Major 2nd', semitones: 2, abbreviation: 'M2' },
  { name: 'Minor 3rd', semitones: 3, abbreviation: 'm3' },
  { name: 'Major 3rd', semitones: 4, abbreviation: 'M3' },
  { name: 'Perfect 4th', semitones: 5, abbreviation: 'P4' },
  { name: 'Tritone', semitones: 6, abbreviation: 'TT' },
  { name: 'Perfect 5th', semitones: 7, abbreviation: 'P5' },
  { name: 'Minor 6th', semitones: 8, abbreviation: 'm6' },
  { name: 'Major 6th', semitones: 9, abbreviation: 'M6' },
  { name: 'Minor 7th', semitones: 10, abbreviation: 'm7' },
  { name: 'Major 7th', semitones: 11, abbreviation: 'M7' },
  { name: 'Octave', semitones: 12, abbreviation: 'P8' },
  { name: 'Minor 9th', semitones: 13, abbreviation: 'm9' },
  { name: 'Major 9th', semitones: 14, abbreviation: 'M9' },
  { name: 'Minor 10th', semitones: 15, abbreviation: 'm10' },
  { name: 'Major 10th', semitones: 16, abbreviation: 'M10' },
  { name: 'Perfect 11th', semitones: 17, abbreviation: 'P11' },
  { name: 'Augmented 11th', semitones: 18, abbreviation: 'A11' },
  { name: 'Perfect 12th', semitones: 19, abbreviation: 'P12' },
  { name: 'Minor 13th', semitones: 20, abbreviation: 'm13' },
  { name: 'Major 13th', semitones: 21, abbreviation: 'M13' },
  { name: 'Minor 14th', semitones: 22, abbreviation: 'm14' },
  { name: 'Major 14th', semitones: 23, abbreviation: 'M14' },
  { name: '2 Octaves', semitones: 24, abbreviation: 'P15' },
];

export const ALL_CHORD_QUALITIES: ChordQuality[] = [
  { name: 'Major', intervals: [0, 4, 7], abbreviation: 'maj' },
  { name: 'Minor', intervals: [0, 3, 7], abbreviation: 'min' },
  { name: 'Diminished', intervals: [0, 3, 6], abbreviation: 'dim' },
  { name: 'Augmented', intervals: [0, 4, 8], abbreviation: 'aug' },
  { name: 'Dominant 7th', intervals: [0, 4, 7, 10], abbreviation: 'dom7' },
  { name: 'Major 7th', intervals: [0, 4, 7, 11], abbreviation: 'maj7' },
  { name: 'Minor 7th', intervals: [0, 3, 7, 10], abbreviation: 'min7' },
  { name: 'Diminished 7th', intervals: [0, 3, 6, 9], abbreviation: 'dim7' },
  { name: 'Half-Diminished 7th', intervals: [0, 3, 6, 10], abbreviation: 'ø7' },
  { name: 'Augmented 7th', intervals: [0, 4, 8, 10], abbreviation: 'aug7' },
  { name: 'Sus2', intervals: [0, 2, 7], abbreviation: 'sus2' },
  { name: 'Sus4', intervals: [0, 5, 7], abbreviation: 'sus4' },
];

export function getIntervalsForDifficulty(difficulty: Difficulty): Interval[] {
  switch (difficulty) {
    case 'easy':
      // Within one octave, common intervals only
      return ALL_INTERVALS.filter(i =>
        [0, 3, 4, 5, 7, 12].includes(i.semitones)
      );
    case 'medium':
      // All intervals within one octave
      return ALL_INTERVALS.filter(i => i.semitones <= 12);
    case 'hard':
      // Full two octaves
      return ALL_INTERVALS;
  }
}

export function getChordsForDifficulty(difficulty: Difficulty): ChordQuality[] {
  switch (difficulty) {
    case 'easy':
      return ALL_CHORD_QUALITIES.filter(c =>
        ['maj', 'min', 'dim', 'aug'].includes(c.abbreviation)
      );
    case 'medium':
      return ALL_CHORD_QUALITIES.filter(c =>
        ['maj', 'min', 'dim', 'aug', 'dom7', 'maj7', 'min7'].includes(c.abbreviation)
      );
    case 'hard':
      return ALL_CHORD_QUALITIES;
  }
}

// Note names and MIDI mapping
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const [, note, octStr] = match;
  const octave = parseInt(octStr);
  const noteIndex = NOTE_NAMES.indexOf(note);
  return (octave + 1) * 12 + noteIndex;
}

// Convert note name to VexFlow key format: "c/4", "c#/4"
export function noteToVexKey(noteName: string): string {
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 'c/4';
  const [, note, octave] = match;
  return `${note.toLowerCase()}/${octave}`;
}

// Get a random root note within a reasonable range
export function getRandomRoot(difficulty: Difficulty): number {
  // Easy: C3-C5, Medium: A2-E5, Hard: F2-G5
  const ranges: Record<Difficulty, [number, number]> = {
    easy: [48, 72],   // C3-C5
    medium: [45, 76], // A2-E5
    hard: [41, 79],   // F2-G5
  };
  const [min, max] = ranges[difficulty];
  // For intervals spanning 2 octaves, ensure the top note fits
  const adjustedMax = difficulty === 'hard' ? max - 24 : max - 12;
  return Math.floor(Math.random() * (adjustedMax - min + 1)) + min;
}

// Shuffle array
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick N random unique items from an array
export function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

// Rhythm patterns by difficulty
export function getRhythmPatterns(difficulty: Difficulty): RhythmPattern[] {
  const easy: RhythmPattern[] = [
    { durations: ['q', 'q', 'q', 'q'], label: '4 Quarter Notes' },
    { durations: ['h', 'h'], label: '2 Half Notes' },
    { durations: ['w'], label: 'Whole Note' },
    { durations: ['h', 'q', 'q'], label: 'Half + 2 Quarters' },
    { durations: ['q', 'q', 'h'], label: '2 Quarters + Half' },
    { durations: ['q', 'h', 'q'], label: 'Quarter Half Quarter' },
  ];

  const medium: RhythmPattern[] = [
    ...easy,
    { durations: ['8', '8', 'q', 'q', 'q'], label: '2 Eighths + 3 Quarters' },
    { durations: ['q', '8', '8', 'q', 'q'], label: 'Quarter 2 Eighths 2 Quarters' },
    { durations: ['q', 'q', '8', '8', 'q'], label: '2 Quarters 2 Eighths Quarter' },
    { durations: ['8', '8', '8', '8', 'q', 'q'], label: '4 Eighths + 2 Quarters' },
    { durations: ['q', 'q', 'q', '8', '8'], label: '3 Quarters + 2 Eighths' },
    { durations: ['hd', 'q'], label: 'Dotted Half + Quarter' },
  ];

  const hard: RhythmPattern[] = [
    ...medium,
    { durations: ['8', '8', '8', '8', '8', '8', '8', '8'], label: '8 Eighth Notes' },
    { durations: ['qd', '8', 'q', 'q'], label: 'Dotted Quarter Eighth 2 Quarters' },
    { durations: ['8', '8', '8', '8', 'h'], label: '4 Eighths + Half' },
    { durations: ['16', '16', '16', '16', 'q', 'q', 'q'], label: '4 Sixteenths + 3 Quarters' },
    { durations: ['q', '16', '16', '16', '16', 'h'], label: 'Quarter 4 Sixteenths Half' },
    { durations: ['8', '16', '16', '8', '8', 'q', 'q'], label: 'Eighth 2 16ths 2 Eighths 2 Quarters' },
  ];

  switch (difficulty) {
    case 'easy': return easy;
    case 'medium': return medium;
    case 'hard': return hard;
  }
}

// Convert VexFlow duration to beat count for Tone.js playback
export function durationToBeats(dur: string): number {
  switch (dur) {
    case 'w': return 4;
    case 'hd': return 3;
    case 'h': return 2;
    case 'qd': return 1.5;
    case 'q': return 1;
    case '8d': return 0.75;
    case '8': return 0.5;
    case '16': return 0.25;
    default: return 1;
  }
}

// Convert our duration shorthand to VexFlow duration strings
export function toVexDuration(dur: string): string {
  switch (dur) {
    case 'w': return 'w';
    case 'hd': return 'hd';
    case 'h': return 'h';
    case 'qd': return 'qd';
    case 'q': return 'q';
    case '8d': return '8d';
    case '8': return '8';
    case '16': return '16';
    default: return 'q';
  }
}

// === Secondary Dominants ===

// A secondary dominant is a dominant 7th chord that resolves to a
// diatonic chord other than the tonic. E.g. V7/V resolves to V.

export interface SecondaryDominantInfo {
  label: string;           // e.g. "V7/ii"
  dominantIntervals: number[]; // semitones from key root for the dom7 chord
  targetIntervals: number[];   // semitones from key root for the resolution chord
  targetLabel: string;     // e.g. "ii" or "IV"
}

// All secondary dominants in a major key (semitones relative to root)
// V7/X means build a dom7 chord a P5 above X's root
export function getSecondaryDominants(difficulty: Difficulty): SecondaryDominantInfo[] {
  const easy: SecondaryDominantInfo[] = [
    {
      label: 'V7/V',
      dominantIntervals: [2, 6, 9, 12],   // D F# A C in key of C → resolves to G
      targetIntervals: [7, 11, 14],         // G B D
      targetLabel: 'V',
    },
    {
      label: 'V7/IV',
      dominantIntervals: [0, 4, 7, 10],   // C E G Bb → resolves to F
      targetIntervals: [5, 9, 12],          // F A C
      targetLabel: 'IV',
    },
    {
      label: 'V7/ii',
      dominantIntervals: [9, 13, 16, 19],  // A C# E G → resolves to Dm
      targetIntervals: [2, 5, 9],           // D F A
      targetLabel: 'ii',
    },
  ];

  const medium: SecondaryDominantInfo[] = [
    ...easy,
    {
      label: 'V7/vi',
      dominantIntervals: [4, 8, 11, 14],   // E G# B D → resolves to Am
      targetIntervals: [9, 12, 16],          // A C E
      targetLabel: 'vi',
    },
    {
      label: 'V7/iii',
      dominantIntervals: [11, 15, 18, 21], // B D# F# A → resolves to Em
      targetIntervals: [4, 7, 11],           // E G B
      targetLabel: 'iii',
    },
  ];

  const hard: SecondaryDominantInfo[] = [
    ...medium,
    // bII7 (tritone sub / Lydian dominant)
    {
      label: 'SubV7/I (bII7)',
      dominantIntervals: [1, 5, 8, 11],    // Db F Ab Cb → tritone sub resolves to C
      targetIntervals: [0, 4, 7],            // C E G
      targetLabel: 'I',
    },
    // V7/bVII (mixolydian area)
    {
      label: 'V7/bVII',
      dominantIntervals: [7, 11, 14, 17],   // G B D F → resolves to Bb
      targetIntervals: [10, 14, 17],         // Bb D F
      targetLabel: 'bVII',
    },
  ];

  switch (difficulty) {
    case 'easy': return easy;
    case 'medium': return medium;
    case 'hard': return hard;
  }
}

// Build a ii-V-I in the key, then the secondary dominant + resolution
export interface SecDomProgression {
  chords: number[][];   // each chord as midi note array
  labels: string[];     // chord symbols for display
  secDomIndex: number;  // which chord is the secondary dominant
  secDomChordName: string;  // e.g. "D7"
  targetChordName: string;  // e.g. "G"
}

const ROOT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Get the actual chord name for a secondary dominant in a given key */
export function getSecDomChordName(secDom: SecondaryDominantInfo, rootMidi: number): string {
  const chordRoot = ROOT_NOTES[(rootMidi + secDom.dominantIntervals[0]) % 12];
  return `${chordRoot}7`;
}

export function buildSecDomProgression(
  _difficulty: Difficulty,
  secDom: SecondaryDominantInfo,
  rootMidi: number
): SecDomProgression {
  const rootName = ROOT_NOTES[rootMidi % 12];

  // I maj7 chord
  const Imaj7 = [rootMidi, rootMidi + 4, rootMidi + 7, rootMidi + 11];
  // ii-V-I setup
  const ii7 = [rootMidi + 2, rootMidi + 5, rootMidi + 9, rootMidi + 12];
  const V7 = [rootMidi + 7, rootMidi + 11, rootMidi + 14, rootMidi + 17];

  // Secondary dominant chord
  const secDomChord = secDom.dominantIntervals.map(i => rootMidi + i);
  // Resolution chord
  const targetChord = secDom.targetIntervals.map(i => rootMidi + i);

  // Compute actual chord names from the MIDI notes
  const secDomRootName = ROOT_NOTES[secDomChord[0] % 12];
  const targetRootName = ROOT_NOTES[targetChord[0] % 12];
  // Determine target chord quality from intervals
  const targetIntervalSet = targetChord.map(n => (n - targetChord[0]) % 12);
  const isTargetMinor = targetIntervalSet.includes(3);
  const targetChordName = `${targetRootName}${isTargetMinor ? 'm' : ''}`;

  // Progression: Imaj7 → ii7 → V7 → Imaj7 → [SecDom] → [Target]
  return {
    chords: [Imaj7, ii7, V7, Imaj7, secDomChord, targetChord],
    labels: [
      `${rootName}maj7`, `ii7`, `V7`, `${rootName}maj7`,
      secDom.label, secDom.targetLabel,
    ],
    secDomIndex: 4,
    secDomChordName: `${secDomRootName}7`,
    targetChordName,
  };
}

// Human-readable duration name
export function durationDisplayName(dur: string): string {
  switch (dur) {
    case 'w': return 'Whole';
    case 'hd': return 'Dotted Half';
    case 'h': return 'Half';
    case 'qd': return 'Dotted Quarter';
    case 'q': return 'Quarter';
    case '8d': return 'Dotted Eighth';
    case '8': return 'Eighth';
    case '16': return 'Sixteenth';
    default: return dur;
  }
}
