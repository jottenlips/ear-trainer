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
    // bV7 (whole tone dominant) — Gb7 in key of C resolves to Bdim
    {
      label: 'bV7 (V7/vii°)',
      dominantIntervals: [6, 10, 13, 16],  // Gb Bb Db Fb → resolves to Bdim
      targetIntervals: [11, 14, 17],         // B D F
      targetLabel: 'vii°',
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
