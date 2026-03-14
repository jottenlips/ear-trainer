export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExerciseType = 'intervals' | 'chords' | 'rhythm' | 'secondary-dominants';
export type InstrumentName = 'piano' | 'guitar' | 'strings' | 'brass' | 'organ' | 'saxophone' | 'flute' | 'violin' | 'cello' | 'marimba';

export interface Note {
  name: string; // e.g. "C4"
  midi: number;
}

export interface Interval {
  name: string;
  semitones: number;
  abbreviation: string;
}

export interface ChordQuality {
  name: string;
  intervals: number[]; // semitones from root
  abbreviation: string;
}

export interface PolyLayer {
  hits: number[];       // beat positions (0-indexed)
  totalBeats: number;
}

export interface RhythmPattern {
  durations: string[]; // VexFlow duration strings: 'q', 'h', '8', 'w', '8t' (triplet eighth), 'qt' (triplet quarter)
  label: string;
  tripletGroups?: [number, number][]; // [startIndex, count] pairs for triplet groups
  grooveName?: string;     // named groove/polyrhythm (e.g. "Bossa Nova", "3:4 Polyrhythm")
  layers?: PolyLayer[];    // multi-voice playback for polyrhythms/grooves
}

export interface RhythmChoice {
  label: string;
  durations: string[];
  keys: string[][];
  vexDurations: string[];
  tripletGroups?: [number, number][];
  grooveName?: string;
  layers?: PolyLayer[];
}

export interface Question {
  type: ExerciseType;
  prompt: string;
  correctAnswer: string;
  choices: string[];
  noteData?: NoteData;
  rhythmChoices?: RhythmChoice[];
  progressionChords?: number[][];  // midi note arrays for chord progression
  progressionLabels?: string[];    // chord symbol labels
  progressionChordNames?: string[];  // actual chord names for all chords in progression
  secDomIndex?: number;            // index of the secondary dominant in the progression
  secDomChordName?: string;        // actual chord name e.g. "D7"
  targetChordName?: string;        // actual target chord name e.g. "G"
  secDomExtensions?: number[];     // extension intervals for the sec dom chord
  secDomSound?: string;            // sound category e.g. "Altered", "Lydian Dominant"
  choiceChordNames?: Record<string, string>;  // maps roman numeral label to chord name
  grooveName?: string;             // for rhythm: named groove/polyrhythm
  grooveChoices?: string[];        // choices for groove identification question
}

export interface NoteData {
  notes: string[];       // note names for playback
  durations?: string[];  // for rhythm display
  keys?: string[][];     // for VexFlow rendering (array of note groups)
  vexDurations?: string[];
  timeSignature?: string;
  tripletGroups?: [number, number][];
}

export interface ScoreState {
  correct: number;
  total: number;
  streak: number;
}
