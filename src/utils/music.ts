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

// === Inversions ===

export interface InversionChord {
  name: string;           // e.g. "Major"
  intervals: number[];    // semitones from root in root position
  abbreviation: string;
}

export interface Inversion {
  label: string;          // e.g. "Major - 1st Inversion"
  chordName: string;      // e.g. "Major"
  inversionName: string;  // e.g. "1st Inversion"
  rootInterval: number;   // semitones from bass to root (0 for root pos, intervals[1] for 1st inv, etc.)
  // Returns MIDI notes for a given bass note MIDI value
  buildNotes: (bassMidi: number) => number[];
}

// Build inversions from a chord's interval set
function makeInversions(name: string, intervals: number[]): Inversion[] {
  const result: Inversion[] = [];
  const n = intervals.length;
  // Root position
  result.push({
    label: `${name} - Root Position`,
    chordName: name,
    inversionName: 'Root Position',
    rootInterval: 0,
    buildNotes: (bass) => intervals.map(i => bass + i),
  });
  // 1st inversion: move root up an octave
  result.push({
    label: `${name} - 1st Inversion`,
    chordName: name,
    inversionName: '1st Inversion',
    rootInterval: 12 - intervals[1],
    buildNotes: (bass) => {
      // bass is the 2nd note of the chord (the 3rd), root goes up
      const notes = intervals.map(i => bass - intervals[1] + i);
      notes[0] += 12; // move root up
      return notes.sort((a, b) => a - b);
    },
  });
  // 2nd inversion: move root and 3rd up an octave
  result.push({
    label: `${name} - 2nd Inversion`,
    chordName: name,
    inversionName: '2nd Inversion',
    rootInterval: 12 - intervals[2],
    buildNotes: (bass) => {
      // bass is the 3rd note of the chord (the 5th)
      const notes = intervals.map(i => bass - intervals[2] + i);
      notes[0] += 12;
      notes[1] += 12;
      return notes.sort((a, b) => a - b);
    },
  });
  // 3rd inversion (only for 7th chords and above — 4+ notes)
  if (n >= 4) {
    result.push({
      label: `${name} - 3rd Inversion`,
      chordName: name,
      inversionName: '3rd Inversion',
      rootInterval: 12 - intervals[3],
      buildNotes: (bass) => {
        // bass is the 4th note (the 7th)
        const notes = intervals.map(i => bass - intervals[3] + i);
        notes[0] += 12;
        notes[1] += 12;
        notes[2] += 12;
        return notes.sort((a, b) => a - b);
      },
    });
  }
  return result;
}

const TRIAD_TYPES: { name: string; intervals: number[] }[] = [
  { name: 'Major', intervals: [0, 4, 7] },
  { name: 'Minor', intervals: [0, 3, 7] },
  { name: 'Augmented', intervals: [0, 4, 8] },
  { name: 'Diminished', intervals: [0, 3, 6] },
];

const SEVENTH_TYPES: { name: string; intervals: number[] }[] = [
  { name: 'Major 7th', intervals: [0, 4, 7, 11] },
  { name: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { name: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { name: 'Diminished 7th', intervals: [0, 3, 6, 9] },
  { name: 'Half-Diminished 7th', intervals: [0, 3, 6, 10] },
];

// Extensions to add on top of 7th chords for hard mode
const EXTENSION_INTERVALS = [
  { name: '9', semitones: 14 },
  { name: 'b9', semitones: 13 },
  { name: '#9', semitones: 15 },
  { name: '#11', semitones: 18 },
  { name: '13', semitones: 21 },
  { name: 'b13', semitones: 20 },
];

function makeExtendedInversions(name: string, baseIntervals: number[], extSemitones: number): Inversion[] {
  // Extended chords: root, 1st, 2nd, 3rd inversions (same as 7th chords — extension stays on top)
  return makeInversions(name, baseIntervals).map(inv => ({
    ...inv,
    label: inv.label.replace(name, name), // keep the name
    buildNotes: (bass) => {
      const baseNotes = inv.buildNotes(bass);
      // Add the extension above the highest note
      const root = Math.min(...baseNotes);
      const extNote = root + extSemitones;
      // Ensure extension is above the bass
      const adjusted = extNote <= bass ? extNote + 12 : extNote;
      return [...baseNotes, adjusted].sort((a, b) => a - b);
    },
  }));
}

export function getInversionsForDifficulty(difficulty: Difficulty): Inversion[] {
  switch (difficulty) {
    case 'easy': {
      // Triads: root position, 1st, 2nd inversions for maj, min, aug, dim
      return TRIAD_TYPES.flatMap(ct => makeInversions(ct.name, ct.intervals));
    }
    case 'medium': {
      // 7th chords: root, 1st, 2nd, 3rd inversions
      return SEVENTH_TYPES.flatMap(ct => makeInversions(ct.name, ct.intervals));
    }
    case 'hard': {
      // 7th chords with one extension on top
      const result: Inversion[] = [];
      for (const ct of SEVENTH_TYPES) {
        // All extensions: 9, b9, #9, #11, 13, b13
        const exts = ct.name === 'Diminished 7th'
          ? EXTENSION_INTERVALS.filter(e => ['9', 'b9'].includes(e.name))
          : EXTENSION_INTERVALS; // all six: 9, b9, #9, #11, 13, b13
        for (const ext of exts) {
          const extName = `${ct.name}(${ext.name})`;
          result.push(...makeExtendedInversions(extName, ct.intervals, ext.semitones));
        }
      }
      return result;
    }
  }
}

/** Get all unique inversion names (Root Position, 1st, 2nd, 3rd) for a difficulty */
export function getInversionNames(difficulty: Difficulty): string[] {
  if (difficulty === 'easy') return ['Root Position', '1st Inversion', '2nd Inversion'];
  return ['Root Position', '1st Inversion', '2nd Inversion', '3rd Inversion'];
}

// Note names and MIDI mapping
const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that use flats in their spelling
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']);

// Current key context for note spelling — set by generateMelody()
let _currentKey = 'C';

export function setNoteSpellingKey(key: string): void {
  _currentKey = key;
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const names = FLAT_KEYS.has(_currentKey) ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return `${names[noteIndex]}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return 60;
  const [, note, octStr] = match;
  const octave = parseInt(octStr);
  let noteIndex = NOTE_NAMES_SHARP.indexOf(note);
  if (noteIndex === -1) noteIndex = NOTE_NAMES_FLAT.indexOf(note);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

// Convert note name to VexFlow key format: "c/4", "c#/4"
export function noteToVexKey(noteName: string): string {
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
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

// Generate polyrhythm patterns from [A, B] pairs: A notes against B notes
function makePolyrhythms(pairs: [number, number][]): RhythmPattern[] {
  return pairs.map(([a, b]) => {
    // A against B: play over B beats; A = top row, B = bottom row
    const totalBeats = b;
    const aHits = Array.from({ length: a }, (_, i) => i * b / a);     // the A (top)
    const bHits = Array.from({ length: b }, (_, i) => i);             // the B (bottom)
    return {
      durations: ['q', 'q', 'q', 'q'],
      label: `groove-${a}:${b}`,
      grooveName: `${a}:${b} Polyrhythm`,
      layers: [
        { hits: aHits, totalBeats },
        { hits: bHits, totalBeats },
      ],
    };
  });
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
    // 1 bar with eighths
    { durations: ['8', '8', 'q', 'q', 'q'], label: '2 Eighths + 3 Quarters' },
    { durations: ['8', '8', '8', '8', 'q', 'q'], label: '4 Eighths + 2 Quarters' },
    { durations: ['hd', 'q'], label: 'Dotted Half + Quarter' },
    { durations: ['qd', '8', 'q', 'q'], label: 'Dotted Quarter Eighth 2 Quarters' },
    { durations: ['8', '8', '8', '8', '8', '8', '8', '8'], label: '8 Eighth Notes' },
    // 1 bar with triplets
    { durations: ['8t', '8t', '8t', 'q', 'q', 'q'], label: 'Triplet + 3 Quarters', tripletGroups: [[0, 3]] },
    { durations: ['q', '8t', '8t', '8t', 'q', 'q'], label: 'Quarter Triplet 2 Quarters', tripletGroups: [[1, 3]] },
    { durations: ['8t', '8t', '8t', '8t', '8t', '8t', 'h'], label: '2 Triplets + Half', tripletGroups: [[0, 3], [3, 3]] },
    // Grooves & polyrhythms (3 voices: kick/low, snare/mid, hi-hat/high)
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-rock',
      grooveName: 'Rock Beat',
      layers: [
        { hits: [0, 2], totalBeats: 4 },                                           // kick
        { hits: [1, 3], totalBeats: 4 },                                           // snare
        { hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], totalBeats: 4 },               // hi-hat 8ths
      ],
    },
    ...makePolyrhythms([
      [3, 2], [2, 3], [3, 4], [4, 3],
    ]),
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-shuffle',
      grooveName: 'Shuffle',
      layers: [
        { hits: [0, 2], totalBeats: 4 },                                           // kick
        { hits: [1, 3], totalBeats: 4 },                                           // snare
        { hits: [0, 2/3, 1, 1+2/3, 2, 2+2/3, 3, 3+2/3], totalBeats: 4 },        // shuffle ride
      ],
    },
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-bossa',
      grooveName: 'Bossa Nova',
      layers: [
        { hits: [0, 3, 4, 6], totalBeats: 8 },                                    // bass
        { hits: [0, 1.5, 3, 4.5, 6], totalBeats: 8 },                            // cross-stick
        { hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5], totalBeats: 8 }, // hi-hat
      ],
    },
  ];

  const hard: RhythmPattern[] = [
    // 1 bar syncopation
    { durations: ['16', '16', '16', '16', 'q', 'h'], label: '4 16ths Quarter Half' },
    { durations: ['qd', '8', '16', '16', '16', '16', 'q'], label: 'Dotted-Q Eighth 4 16ths Quarter' },
    { durations: ['8', '16', '16', '8', '8', 'q', 'q'], label: 'Eighth 2-16ths 2 Eighths 2 Quarters' },
    // 1 bar with triplets + sixteenths
    { durations: ['8t', '8t', '8t', '16', '16', '16', '16', 'h'], label: 'Triplet 4 16ths Half', tripletGroups: [[0, 3]] },
    { durations: ['qt', 'qt', 'qt', 'h'], label: 'Quarter Triplet + Half', tripletGroups: [[0, 3]] },
    // Polyrhythms (2 voices — all common combinations up to 9)
    ...makePolyrhythms([
      // x against 2
      [3, 2], [5, 2], [7, 2], [9, 2],
      // x against 3
      [2, 3], [4, 3], [5, 3], [7, 3], [8, 3], [9, 3],
      // x against 4
      [3, 4], [5, 4], [6, 4], [7, 4], [9, 4],
      // x against 5
      [2, 5], [3, 5], [4, 5], [6, 5], [7, 5], [8, 5], [9, 5],
      // x against 6
      [5, 6], [7, 6],
      // x against 7
      [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [8, 7], [9, 7],
      // x against 8
      [3, 8], [5, 8], [7, 8], [9, 8],
      // x against 9
      [2, 9], [4, 9], [5, 9], [7, 9], [8, 9],
    ]),
    // Clave patterns (3 voices: clave, bass, hi-hat)
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-son32',
      grooveName: 'Son Clave 3-2',
      layers: [
        { hits: [0, 3, 4, 6], totalBeats: 8 },                                    // bass (tumbao)
        { hits: [0, 1.5, 3, 5, 6], totalBeats: 8 },                              // clave
        { hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5], totalBeats: 8 }, // hi-hat
      ],
    },
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-son23',
      grooveName: 'Son Clave 2-3',
      layers: [
        { hits: [0, 3, 4, 6], totalBeats: 8 },                                    // bass
        { hits: [1, 2, 4, 5.5, 7], totalBeats: 8 },                              // clave
        { hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5], totalBeats: 8 }, // hi-hat
      ],
    },
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-rumba',
      grooveName: 'Rumba Clave',
      layers: [
        { hits: [0, 3, 4, 6], totalBeats: 8 },                                    // bass
        { hits: [0, 1.5, 3.5, 5, 6], totalBeats: 8 },                            // clave
        { hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5], totalBeats: 8 }, // hi-hat
      ],
    },
    // Grooves (3 voices)
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-samba',
      grooveName: 'Samba',
      layers: [
        { hits: [0, 1.5, 3, 4, 5.5, 7], totalBeats: 8 },                         // surdo
        { hits: [0, 1, 2, 2.5, 3, 4, 5, 6, 6.5, 7], totalBeats: 8 },            // agogo
        { hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5], totalBeats: 8 }, // tamborim
      ],
    },
    {
      durations: ['q', 'q', 'q', 'q'], label: 'groove-afrocuban',
      grooveName: 'Afro-Cuban 6/8',
      layers: [
        { hits: [0, 1.5, 3], totalBeats: 4 },                                     // low bell
        { hits: [0, 1, 1.5, 2.5, 3], totalBeats: 4 },                            // mid bell
        { hits: [0, 0.67, 1, 1.5, 2.17, 2.67, 3, 3.5], totalBeats: 4 },         // high bell
      ],
    },
  ];

  switch (difficulty) {
    case 'easy': return easy;
    case 'medium': return medium;
    case 'hard': return hard;
  }
}

// Get all groove names available at a difficulty (includes lower difficulties)
export function getGrooveNames(difficulty: Difficulty): string[] {
  const all = getRhythmPatterns(difficulty);
  return all.filter(p => p.grooveName).map(p => p.grooveName!);
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
    case 'qt': return 2 / 3;   // quarter-note triplet (3 in 2 beats)
    case '8t': return 1 / 3;   // eighth-note triplet (3 in 1 beat)
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
    case 'qt': return 'q';  // rendered as quarter, grouped as triplet
    case '8t': return '8';  // rendered as eighth, grouped as triplet
    default: return 'q';
  }
}

// === Secondary Dominants ===

// A secondary dominant is a dominant 7th chord that resolves to a
// diatonic chord other than the tonic. E.g. V7/V resolves to V.

export type SecDomSound = 'Altered' | 'Lydian Dominant' | 'Mixolydian' | 'Whole Tone' | 'Rainbow';

export interface SecondaryDominantInfo {
  label: string;           // e.g. "V7/ii"
  dominantIntervals: number[]; // semitones from key root for the dom7 chord
  targetIntervals: number[];   // semitones from key root for the resolution chord
  targetLabel: string;     // e.g. "ii" or "IV"
  sound: SecDomSound;
  extensions: number[];    // semitones above chord root for color tones (e.g. b9=1, 9=2, #9=3, 11=5, #11=6, b13=8, 13=9)
  altSound?: SecDomSound;  // optional alternate sound (randomly chosen at question time)
  altExtensions?: number[];
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
      sound: 'Mixolydian',
      extensions: [2, 5, 9],               // 9, 11, 13
      altSound: 'Lydian Dominant',
      altExtensions: [2, 6, 9],            // 9, #11, 13
    },
    {
      label: 'V7/IV',
      dominantIntervals: [0, 4, 7, 10],   // C E G Bb → resolves to F
      targetIntervals: [5, 9, 12],          // F A C
      targetLabel: 'IV',
      sound: 'Mixolydian',
      extensions: [2, 5, 9],               // 9, 11, 13
      altSound: 'Lydian Dominant',
      altExtensions: [2, 6, 9],            // 9, #11, 13
    },
    {
      label: 'V7/ii',
      dominantIntervals: [9, 13, 16, 19],  // A C# E G → resolves to Dm
      targetIntervals: [2, 5, 9],           // D F A
      targetLabel: 'ii',
      sound: 'Altered',
      extensions: [1, 3, 6, 8],            // b9, #9, #11, b13
    },
  ];

  const medium: SecondaryDominantInfo[] = [
    ...easy,
    {
      label: 'V7/vi',
      dominantIntervals: [4, 8, 11, 14],   // E G# B D → resolves to Am
      targetIntervals: [9, 12, 16],          // A C E
      targetLabel: 'vi',
      sound: 'Altered',
      extensions: [1, 3, 6, 8],            // b9, #9, #11, b13
    },
    {
      label: 'V7/iii',
      dominantIntervals: [11, 15, 18, 21], // B D# F# A → resolves to Em
      targetIntervals: [4, 7, 11],           // E G B
      targetLabel: 'iii',
      sound: 'Altered',
      extensions: [1, 3, 6, 8],            // b9, #9, #11, b13
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
      sound: 'Lydian Dominant',
      extensions: [2, 6, 9],               // 9, #11, 13
    },
    // V7/bVII — F7 in key of C resolves to Bb
    {
      label: 'V7/bVII',
      dominantIntervals: [5, 9, 12, 15],   // F A C Eb → resolves to Bb
      targetIntervals: [10, 14, 17],         // Bb D F
      targetLabel: 'bVII',
      sound: 'Mixolydian',
      extensions: [2, 5, 9],               // 9, 11, 13
    },
    // bV7 (whole tone dominant) — Gb7 in key of C, tritone sub resolves to F
    {
      label: 'SubV7/IV (bV7)',
      dominantIntervals: [6, 10, 13, 16],  // Gb Bb Db Fb → tritone sub of C7 → F
      targetIntervals: [5, 9, 12],           // F A C
      targetLabel: 'IV',
      sound: 'Whole Tone',
      extensions: [2, 6, 8],               // 9, #11, b13
    },
    // Tritone sub secondary dominants — all Lydian Dominant, resolve down a half step
    // SubV7/ii (bIII7) — Eb7 in key of C resolves to Dm
    {
      label: 'SubV7/ii (bIII7)',
      dominantIntervals: [3, 7, 10, 13],   // Eb G Bb Db → tritone sub of A7 → Dm
      targetIntervals: [2, 5, 9],            // D F A
      targetLabel: 'ii',
      sound: 'Lydian Dominant',
      extensions: [2, 6, 9],               // 9, #11, 13
    },
    // SubV7/V (bVI7) — Ab7 in key of C resolves to G
    {
      label: 'SubV7/V (bVI7)',
      dominantIntervals: [8, 12, 15, 18],  // Ab C Eb Gb → tritone sub of D7 → G
      targetIntervals: [7, 11, 14],          // G B D
      targetLabel: 'V',
      sound: 'Lydian Dominant',
      extensions: [2, 6, 9],               // 9, #11, 13
    },
    // SubV7/vi (bVII7) — Bb7 in key of C resolves to Am
    {
      label: 'SubV7/vi (bVII7)',
      dominantIntervals: [10, 14, 17, 20], // Bb D F Ab → tritone sub of E7 → Am
      targetIntervals: [9, 12, 16],          // A C E
      targetLabel: 'vi',
      sound: 'Lydian Dominant',
      extensions: [2, 6, 9],               // 9, #11, 13
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
  chordNames: string[]; // actual chord names for all chords
  secDomIndex: number;  // which chord is the secondary dominant
  secDomChordName: string;  // e.g. "D7"
  targetChordName: string;  // e.g. "G"
  secDomExtensions: number[];  // extension intervals (semitones above chord root)
  secDomSound: SecDomSound;
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
  const isTargetDim = targetIntervalSet.includes(3) && targetIntervalSet.includes(6);
  const isTargetMinor = !isTargetDim && targetIntervalSet.includes(3);
  const targetChordName = `${targetRootName}${isTargetDim ? '°' : isTargetMinor ? 'm' : ''}`;

  // Compute chord names for ii7 and V7
  const iiRootName = ROOT_NOTES[(rootMidi + 2) % 12];
  const VRootName = ROOT_NOTES[(rootMidi + 7) % 12];

  // Randomly pick between primary and alternate sound/extensions if available
  const useAlt = secDom.altSound && secDom.altExtensions && Math.random() < 0.5;
  const chosenSound = useAlt ? secDom.altSound! : secDom.sound;
  const chosenExtensions = useAlt ? secDom.altExtensions! : secDom.extensions;

  // Progression: Imaj7 → ii7 → V7 → Imaj7 → [SecDom] → [Target]
  return {
    chords: [Imaj7, ii7, V7, Imaj7, secDomChord, targetChord],
    labels: [
      `Imaj7`, `ii7`, `V7`, `Imaj7`,
      secDom.label, secDom.targetLabel,
    ],
    chordNames: [
      `${rootName}maj7`, `${iiRootName}m7`, `${VRootName}7`, `${rootName}maj7`,
      `${secDomRootName}7`, targetChordName,
    ],
    secDomIndex: 4,
    secDomChordName: `${secDomRootName}7`,
    targetChordName,
    secDomExtensions: chosenExtensions,
    secDomSound: chosenSound,
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

// === Sight-Reading Melody Generation ===

export interface TimeSignature {
  beats: number;
  beatValue: number;
  label: string;
}

export const TIME_SIGNATURES: Record<string, TimeSignature> = {
  '4/4': { beats: 4, beatValue: 4, label: '4/4' },
  '3/4': { beats: 3, beatValue: 4, label: '3/4' },
  '6/8': { beats: 6, beatValue: 8, label: '6/8' },
  '7/8': { beats: 7, beatValue: 8, label: '7/8' },
  '5/4': { beats: 5, beatValue: 4, label: '5/4' },
};

export interface MelodyNote {
  midi: number;
  duration: string;       // our internal duration code: 'q', '8', '16', etc.
  isTriplet?: boolean;     // part of a triplet group
  extensionLabel?: string; // e.g. 'b9', '#11', '13' — set for notes in the sec dom section
  countLabel?: string;     // rhythmic counting: '1', 'e', '+', 'a', 'trip', 'let', etc.
}

export interface GeneratedMelody {
  notes: MelodyNote[];
  key: string;
  timeSignature: string;
  measures: number;
  secDomLabel?: string;    // which secondary dominant the melody uses
  secDomColorName?: string; // jazz scale color name (e.g. "Lydian Dominant")
  bpm: number;
  chordSymbols: string[];  // one chord symbol per measure (e.g. "Cmaj7", "D7", "G")
}

// Scales for melody generation based on secondary dominant sounds
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B

// Secondary dominant target scales — the notes the melody moves through
// when approaching the secondary dominant's target chord
// Jazz scale color associated with each secondary dominant (matches Playing Changes)
const SEC_DOM_COLOR_NAMES: Record<string, string> = {
  'V7/V':   'Mixolydian / Lydian Dominant',
  'V7/IV':  'Mixolydian / Lydian Dominant',
  'V7/ii':  'Altered',
  'V7/vi':  'Altered',
  'V7/iii': 'Altered',
};

const SEC_DOM_APPROACH_NOTES: Record<string, number[]> = {
  // V7/V: D7 → G — D Mixolydian: D E F# G A B C
  'V7/V': [2, 4, 6, 7, 9, 11, 0],
  // V7/IV: C7 → F — C Mixolydian: C D E F G A Bb
  'V7/IV': [0, 2, 4, 5, 7, 9, 10],
  // V7/ii: A7 → Dm — A Altered: A Bb C Db Eb F G
  'V7/ii': [9, 10, 0, 1, 3, 5, 7],
  // V7/vi: E7 → Am — E Altered: E F G Ab Bb C D
  'V7/vi': [4, 5, 7, 8, 10, 0, 2],
  // V7/iii: B7 → Em — B Altered: B C D Eb F G A
  'V7/iii': [11, 0, 2, 3, 5, 7, 9],
};

// Target scales — the scale to use over the resolution chord
// Major targets use the major scale of that degree; minor targets use Dorian
const SEC_DOM_TARGET_SCALES: Record<string, number[]> = {
  // V7/V → V major: e.g. in C, G major = G A B C D E F#
  'V7/V': [7, 9, 11, 0, 2, 4, 6],
  // V7/IV → IV major: e.g. in C, F major = F G A Bb C D E
  'V7/IV': [5, 7, 9, 10, 0, 2, 4],
  // V7/ii → ii Dorian: e.g. in C, D Dorian = D E F G A B C (= C major)
  'V7/ii': [2, 4, 5, 7, 9, 11, 0],
  // V7/vi → vi Dorian: e.g. in C, A Dorian = A B C D E F# G
  'V7/vi': [9, 11, 0, 2, 4, 6, 7],
  // V7/iii → iii Dorian: e.g. in C, E Dorian = E F# G A B C# D
  'V7/iii': [4, 6, 7, 9, 11, 1, 2],
};

// Secondary dominant chord info: maps sec dom label to
// [sec dom root interval from key, target root interval, target quality]
const SEC_DOM_CHORD_INFO: Record<string, { secRoot: number; secSuffix: string; targetRoot: number; targetSuffix: string }> = {
  'V7/V':   { secRoot: 2,  secSuffix: '7',  targetRoot: 7,  targetSuffix: '' },      // D7 → G
  'V7/IV':  { secRoot: 0,  secSuffix: '7',  targetRoot: 5,  targetSuffix: '' },      // C7 → F
  'V7/ii':  { secRoot: 9,  secSuffix: '7',  targetRoot: 2,  targetSuffix: 'm' },     // A7 → Dm
  'V7/vi':  { secRoot: 4,  secSuffix: '7',  targetRoot: 9,  targetSuffix: 'm' },     // E7 → Am
  'V7/iii': { secRoot: 11, secSuffix: '7',  targetRoot: 4,  targetSuffix: 'm' },     // B7 → Em
};

function buildChordSymbols(measures: number, secDomLabel: string, keyIndex: number): string[] {
  const keyName = ROOT_NOTES[keyIndex];
  const info = SEC_DOM_CHORD_INFO[secDomLabel];
  if (!info) return Array(measures).fill(keyName);

  const secDomNoteName = ROOT_NOTES[(keyIndex + info.secRoot) % 12];
  const targetNoteName = ROOT_NOTES[(keyIndex + info.targetRoot) % 12];
  const secDomChord = secDomNoteName + info.secSuffix;
  const targetChord = targetNoteName + info.targetSuffix;

  // Assign chords to measures based on harmonic structure:
  // Start on I, move to sec dom in the middle, resolve through target back to I
  const symbols: string[] = [];
  for (let m = 0; m < measures; m++) {
    const pos = m / measures;
    if (pos < 0.3) {
      symbols.push(keyName);              // I (tonic)
    } else if (pos < 0.55) {
      symbols.push(secDomChord);          // V7/x (secondary dominant)
    } else if (pos < 0.8) {
      symbols.push(targetChord);          // target chord
    } else {
      symbols.push(keyName);              // I (resolution)
    }
  }
  return symbols;
}

// Build MIDI chord voicings from chord symbols and key root
export function chordSymbolToMidi(symbol: string, keyRoot: number): number[] {
  // Parse the chord symbol to get root + quality
  // symbol is like "C", "D7", "Am", "Ebm", "F#7"
  const match = symbol.match(/^([A-G][b#]?)(m?)(7?)$/);
  if (!match) return [keyRoot, keyRoot + 4, keyRoot + 7]; // fallback major triad

  const [, rootName, minor, seventh] = match;
  const rootIndex = ROOT_NOTES.indexOf(rootName);
  if (rootIndex === -1) return [keyRoot, keyRoot + 4, keyRoot + 7];

  // Voice the chord around C3-C4 range (48-60) for a comping sound
  const chordRoot = 48 + rootIndex;
  const third = minor ? 3 : 4;
  const fifth = 7;
  const notes = [chordRoot, chordRoot + third, chordRoot + fifth];
  if (seventh) notes.push(chordRoot + 10); // dominant 7th
  return notes;
}

// Duration pools per difficulty
function getEasyDurations(): string[] {
  return ['h', 'q', 'qd'];
}

function getMediumDurations(): string[] {
  return ['h', 'q', 'qd', '8', 'hd'];
}

function getHardDurations(): string[] {
  return ['q', 'qd', '8', '8d', '16'];
}

// Get time signatures for difficulty
export function getTimeSignaturesForDifficulty(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case 'easy':
      return ['4/4', '3/4'];
    case 'medium':
      return ['4/4', '3/4', '6/8'];
    case 'hard':
      return ['4/4', '3/4', '6/8', '7/8', '5/4'];
  }
}

// Melody direction state — persists across notes for flowing phrases
let melodyDirection = 1; // 1 = ascending, -1 = descending
let directionMomentum = 0; // how many steps in current direction

// Pick a note that creates flowing, traveling melodies
function pickNextNote(currentMidi: number, scaleDegrees: number[], keyRoot: number, minMidi: number, maxMidi: number): number {
  // Build all available notes in range from the scale, sorted ascending
  const available: number[] = [];
  for (let octave = -1; octave <= 8; octave++) {
    for (const degree of scaleDegrees) {
      const midi = keyRoot + (octave * 12) + (degree % 12);
      if (midi >= minMidi && midi <= maxMidi && midi !== currentMidi) {
        available.push(midi);
      }
    }
  }
  available.sort((a, b) => a - b);
  if (available.length === 0) return currentMidi;

  // Split into notes above and below current pitch
  const above = available.filter(n => n > currentMidi).sort((a, b) => a - b);
  const below = available.filter(n => n < currentMidi).sort((a, b) => b - a); // closest first

  // Reverse direction when nearing range edges or after sustained run
  if (currentMidi >= maxMidi - 3 || above.length < 2) {
    melodyDirection = -1;
    directionMomentum = 0;
  } else if (currentMidi <= minMidi + 3 || below.length < 2) {
    melodyDirection = 1;
    directionMomentum = 0;
  } else if (directionMomentum >= 3 + Math.floor(Math.random() * 3)) {
    // Change direction after 3-5 steps for natural phrasing
    melodyDirection *= -1;
    directionMomentum = 0;
  }

  // Pick from the preferred direction most of the time
  const preferred = melodyDirection === 1 ? above : below;
  const other = melodyDirection === 1 ? below : above;
  const pool = preferred.length > 0 ? preferred : other;

  const rand = Math.random();
  let pick: number;

  if (rand < 0.50 && pool.length >= 1) {
    // Step: nearest note in direction (scale step)
    pick = pool[0];
  } else if (rand < 0.75 && pool.length >= 2) {
    // Skip: 2nd or 3rd nearest (a third or fourth)
    pick = pool[Math.min(1 + Math.floor(Math.random() * 2), pool.length - 1)];
  } else if (rand < 0.88 && pool.length >= 3) {
    // Leap: 3rd-5th nearest (a fourth, fifth, or sixth)
    pick = pool[Math.min(2 + Math.floor(Math.random() * 3), pool.length - 1)];
  } else {
    // Occasional direction change for variety
    const anyPool = other.length > 0 ? other : pool;
    pick = anyPool[Math.min(Math.floor(Math.random() * 2), anyPool.length - 1)];
    if (other.length > 0) {
      melodyDirection *= -1;
      directionMomentum = 0;
    }
  }

  directionMomentum++;
  return pick;
}

// Fill exactly one measure with durations that sum to beatsPerMeasure
function fillOneMeasure(
  beatsPerMeasure: number,
  durationPool: string[],
  difficulty: Difficulty,
  isCompound: boolean = false,
): { durations: string[]; tripletGroups: [number, number][] } {
  const durations: string[] = [];
  const tripletGroups: [number, number][] = [];
  let remaining = beatsPerMeasure;
  let beatPos = 0; // track position within the measure

  // Safety: max iterations to prevent infinite loop
  let safety = 100;
  while (remaining > 0.01 && safety-- > 0) {
    // Only allow triplets on beat boundaries (not on the "+" of a beat)
    const onBeat = Math.abs(beatPos - Math.round(beatPos)) < 0.01;

    // Triplets don't make sense in compound meters (6/8, 7/8) —
    // the natural subdivision is already triple
    if (!isCompound && onBeat && difficulty !== 'easy' && remaining >= 1 && Math.random() < (difficulty === 'hard' ? 0.2 : 0.1)) {
      // Eighth-note triplet: 3 notes in 1 beat
      tripletGroups.push([durations.length, 3]);
      durations.push('8t', '8t', '8t');
      remaining -= 1;
      beatPos += 1;
      continue;
    }
    if (!isCompound && onBeat && difficulty === 'hard' && remaining >= 2 && Math.random() < 0.06) {
      // Quarter-note triplet: 3 notes in 2 beats
      tripletGroups.push([durations.length, 3]);
      durations.push('qt', 'qt', 'qt');
      remaining -= 2;
      beatPos += 2;
      continue;
    }

    // Hard mode: occasionally insert 16th note group (4 sixteenths = 1 beat)
    if (difficulty === 'hard' && remaining >= 1 && Math.random() < 0.15) {
      for (let i = 0; i < 4; i++) durations.push('16');
      remaining -= 1;
      beatPos += 1;
      continue;
    }

    // Filter to durations that fit exactly in the remaining space
    const candidates = durationPool.filter(d => durationToBeats(d) <= remaining + 0.001);

    if (candidates.length === 0) {
      // Fill remainder with the largest fitting standard duration
      if (remaining >= 0.5 - 0.001) { durations.push('8'); remaining -= 0.5; beatPos += 0.5; }
      else if (remaining >= 0.25 - 0.001) { durations.push('16'); remaining -= 0.25; beatPos += 0.25; }
      else break;
      continue;
    }

    const dur = candidates[Math.floor(Math.random() * candidates.length)];
    durations.push(dur);
    const beats = durationToBeats(dur);
    remaining -= beats;
    beatPos += beats;
  }

  // If floating point left a tiny remainder, ignore it
  return { durations, tripletGroups };
}

// Fill multiple measures, each summing to exactly beatsPerMeasure
function fillMeasures(
  numMeasures: number,
  beatsPerMeasure: number,
  durationPool: string[],
  difficulty: Difficulty,
  isCompound: boolean = false,
): { durations: string[]; tripletGroups: [number, number][] } {
  const allDurations: string[] = [];
  const allTripletGroups: [number, number][] = [];

  for (let m = 0; m < numMeasures; m++) {
    const offset = allDurations.length;
    const measure = fillOneMeasure(beatsPerMeasure, durationPool, difficulty, isCompound);
    allDurations.push(...measure.durations);
    for (const [start, count] of measure.tripletGroups) {
      allTripletGroups.push([start + offset, count]);
    }
  }

  return { durations: allDurations, tripletGroups: allTripletGroups };
}

// Generate a unique melody for sight-reading
export function generateMelody(difficulty: Difficulty): GeneratedMelody {
  // Pick random key — easier difficulties use simpler key signatures
  // ROOT_NOTES: C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B (indices 0-11)
  const easyKeys = [0, 2, 5, 7, 9];          // C, D, F, G, A (0-1 accidentals)
  const mediumKeys = [0, 2, 3, 4, 5, 7, 9, 10]; // + Eb, E, Bb
  const keyPool = difficulty === 'easy' ? easyKeys
    : difficulty === 'medium' ? mediumKeys
    : Array.from({ length: 12 }, (_, i) => i); // hard: all keys
  const keyIndex = keyPool[Math.floor(Math.random() * keyPool.length)];
  const keyRoot = 60 + keyIndex; // C4 range — sits well on treble clef
  const keyName = ROOT_NOTES[keyIndex];

  // Set the spelling context so midiToNoteName uses flats/sharps correctly for this key
  setNoteSpellingKey(keyName);

  // Pick time signature
  const availableTimeSigs = getTimeSignaturesForDifficulty(difficulty);
  const timeSig = availableTimeSigs[Math.floor(Math.random() * availableTimeSigs.length)];
  const ts = TIME_SIGNATURES[timeSig];

  // Decide measures
  const measures = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

  // Pick a secondary dominant to use as harmonic color
  const secDomKeys = Object.keys(SEC_DOM_APPROACH_NOTES);
  const secDomOptions = difficulty === 'easy'
    ? secDomKeys.slice(0, 3) // V7/V, V7/IV, V7/ii
    : difficulty === 'medium'
    ? secDomKeys.slice(0, 4)
    : secDomKeys;
  const secDomLabel = secDomOptions[Math.floor(Math.random() * secDomOptions.length)];
  const secDomNotes = SEC_DOM_APPROACH_NOTES[secDomLabel];

  // Duration pool
  const durationPool = difficulty === 'easy'
    ? getEasyDurations()
    : difficulty === 'medium'
    ? getMediumDurations()
    : getHardDurations();

  // Beats per measure in quarter-note units
  // 4/4 = 4, 3/4 = 3, 6/8 = 3, 7/8 = 3.5, 5/4 = 5
  const beatsPerMeasure = ts.beatValue === 8 ? ts.beats * 0.5 : ts.beats;

  // Generate rhythm — one measure at a time so each measure sums correctly
  const isCompound = ts.beatValue === 8;
  const { durations, tripletGroups } = fillMeasures(measures, beatsPerMeasure, durationPool, difficulty, isCompound);

  // Generate pitches — E3 (52) to D6 (86), full treble clef range
  const minMidi = 52;  // E3 — low E (one ledger line below staff)
  const maxMidi = 86;  // D6 — high D (two ledger lines above staff)
  let currentMidi = Math.max(minMidi, Math.min(maxMidi, keyRoot + MAJOR_SCALE[Math.floor(Math.random() * 5)])); // start on scale degree 1-5

  // Reset melody direction state for each new melody
  melodyDirection = Math.random() < 0.5 ? 1 : -1;
  directionMomentum = 0;

  // The melody structure:
  //   0-30%:  I (tonic) — original major scale
  //   30-55%: sec dom — approach notes (mixolydian/altered)
  //   55-80%: target — target key scale (tonicized)
  //   80-100%: I (resolution) — original major scale
  const secDomStartIdx = Math.floor(durations.length * 0.3);
  const secDomEndIdx = Math.floor(durations.length * 0.55);
  const targetStartIdx = secDomEndIdx;
  const targetEndIdx = Math.floor(durations.length * 0.8);
  const targetScale = SEC_DOM_TARGET_SCALES[secDomLabel] || MAJOR_SCALE;

  // Interval-from-chord-root → extension/chord-tone label
  const INTERVAL_LABELS: Record<number, string> = {
    0: 'R', 1: 'b9', 2: '9', 3: '#9', 4: '3', 5: '11', 6: '#11',
    7: '5', 8: 'b13', 9: '13', 10: 'b7', 11: '7',
  };

  // Sec dom chord root (absolute pitch class)
  const secDomChordInfo = SEC_DOM_CHORD_INFO[secDomLabel];
  const secDomRootPc = secDomChordInfo ? (keyIndex + secDomChordInfo.secRoot) % 12 : 0;
  // Target chord root (for extension labels on target section)
  const targetRootPc = secDomChordInfo ? (keyIndex + secDomChordInfo.targetRoot) % 12 : 0;

  const notes: MelodyNote[] = durations.map((dur, i) => {
    // Choose scale context based on position in the phrase
    let scale: number[];
    if (i >= secDomStartIdx && i < secDomEndIdx) {
      scale = secDomNotes;            // sec dom approach notes
    } else if (i >= targetStartIdx && i < targetEndIdx) {
      scale = targetScale;            // target key (tonicized)
    } else {
      scale = MAJOR_SCALE;            // home key
    }

    currentMidi = pickNextNote(currentMidi, scale, keyRoot, minMidi, maxMidi);

    // Determine if this note is part of a triplet
    const isTriplet = tripletGroups.some(([start, count]) => i >= start && i < start + count);

    // Label extension for notes in the sec dom and target sections
    let extensionLabel: string | undefined;
    const inSecDom = i >= secDomStartIdx && i < secDomEndIdx;
    const inTarget = i >= targetStartIdx && i < targetEndIdx;
    if (inSecDom) {
      const interval = ((currentMidi % 12) - secDomRootPc + 12) % 12;
      extensionLabel = INTERVAL_LABELS[interval];
    } else if (inTarget) {
      const interval = ((currentMidi % 12) - targetRootPc + 12) % 12;
      extensionLabel = INTERVAL_LABELS[interval];
    }

    return {
      midi: currentMidi,
      duration: dur,
      isTriplet,
      extensionLabel,
    };
  });

  // Compute counting labels ("1 e + a" for simple, "1 2 3 4 5 6" for compound)
  {
    let beatPos = 0;
    for (const note of notes) {
      if (isCompound) {
        // Compound meters: count each eighth note (1, 2, 3, 4, 5, 6...)
        const eighthPos = Math.round(beatPos * 2);
        const eighthInMeasure = eighthPos % ts.beats;
        note.countLabel = String(eighthInMeasure + 1);
      } else {
        // Simple meters: "1 e + a" 16th-note grid
        const beatInMeasure = beatPos % beatsPerMeasure;
        const wholeBeat = Math.floor(beatInMeasure + 0.001);
        const fraction = beatInMeasure - wholeBeat;

        if (note.isTriplet) {
          // Triplet subdivisions within a beat
          const tripSlot = Math.round(fraction * 3);
          if (tripSlot === 0) note.countLabel = String(wholeBeat + 1);
          else if (tripSlot === 1) note.countLabel = 'trip';
          else note.countLabel = 'let';
        } else {
          const slot = Math.round(fraction * 4);
          if (slot === 0) note.countLabel = String(wholeBeat + 1);
          else if (slot === 1) note.countLabel = 'e';
          else if (slot === 2) note.countLabel = '+';
          else note.countLabel = 'a';
        }
      }

      beatPos += durationToBeats(note.duration);
      // Reset at measure boundary
      if (beatPos >= beatsPerMeasure - 0.01) {
        beatPos = beatPos % beatsPerMeasure;
        if (beatPos < 0.01) beatPos = 0;
      }
    }
  }

  // End on tonic or 5th for resolution, clamped to range
  if (notes.length > 0) {
    const lastNote = notes[notes.length - 1];
    // Find all tonic and fifth options within range
    const candidates: number[] = [];
    for (let oct = 2; oct <= 6; oct++) {
      const tonic = (keyRoot % 12) + oct * 12;
      const fifth = tonic + 7;
      if (tonic >= minMidi && tonic <= maxMidi) candidates.push(tonic);
      if (fifth >= minMidi && fifth <= maxMidi) candidates.push(fifth);
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => Math.abs(a - lastNote.midi) - Math.abs(b - lastNote.midi));
      lastNote.midi = candidates[0];
    }
  }

  // BPM based on difficulty
  const bpm = difficulty === 'easy' ? 72 : difficulty === 'medium' ? 90 : 108;

  // Build chord symbols for each measure
  const chordSymbols = buildChordSymbols(measures, secDomLabel, keyIndex);

  return {
    notes,
    key: keyName,
    timeSignature: timeSig,
    measures,
    secDomLabel,
    secDomColorName: SEC_DOM_COLOR_NAMES[secDomLabel],
    bpm,
    chordSymbols,
  };
}
