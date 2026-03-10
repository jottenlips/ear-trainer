import type { Difficulty, Question, ExerciseType } from '../types';
import {
  getIntervalsForDifficulty,
  getChordsForDifficulty,
  getRhythmPatterns,
  getRandomRoot,
  midiToNoteName,
  noteToVexKey,
  shuffle,
  pickRandom,
  toVexDuration,
  getSecondaryDominants,
  buildSecDomProgression,
  getSecDomChordName,
} from './music';

export function generateIntervalQuestion(difficulty: Difficulty): Question {
  const intervals = getIntervalsForDifficulty(difficulty);
  const correct = intervals[Math.floor(Math.random() * intervals.length)];
  const rootMidi = getRandomRoot(difficulty);
  const rootName = midiToNoteName(rootMidi);
  const topMidi = rootMidi + correct.semitones;
  const topName = midiToNoteName(topMidi);

  const distractors = pickRandom(
    intervals.filter(i => i.semitones !== correct.semitones),
    3
  );
  const choices = shuffle([correct, ...distractors].map(i => i.name));

  return {
    type: 'intervals',
    prompt: `What interval is this?`,
    correctAnswer: correct.name,
    choices,
    noteData: {
      notes: [rootName, topName],
      keys: [[noteToVexKey(rootName)], [noteToVexKey(topName)]],
      vexDurations: ['h', 'h'],
    },
  };
}

export function generateChordQuestion(difficulty: Difficulty): Question {
  const chords = getChordsForDifficulty(difficulty);
  const correct = chords[Math.floor(Math.random() * chords.length)];

  const rootMidi = getRandomRoot(difficulty);
  const rootName = midiToNoteName(rootMidi);

  const chordNotes = correct.intervals.map(i => midiToNoteName(rootMidi + i));
  const chordKeys = correct.intervals.map(i => noteToVexKey(midiToNoteName(rootMidi + i)));

  const distractors = pickRandom(
    chords.filter(c => c.abbreviation !== correct.abbreviation),
    3
  );
  const choices = shuffle([correct, ...distractors].map(c => c.name));

  const rootLetter = rootName.replace(/\d+$/, '');

  return {
    type: 'chords',
    prompt: `What chord quality is this? (Root: ${rootLetter})`,
    correctAnswer: correct.name,
    choices,
    noteData: {
      notes: chordNotes,
      keys: [chordKeys],
      vexDurations: ['w'],
    },
  };
}

export function generateRhythmQuestion(difficulty: Difficulty): Question {
  const patterns = getRhythmPatterns(difficulty);
  const correct = patterns[Math.floor(Math.random() * patterns.length)];

  const distractors = pickRandom(
    patterns.filter(p => p.label !== correct.label),
    3
  );
  const allChoices = shuffle([correct, ...distractors]);

  const rhythmChoices = allChoices.map(p => ({
    label: p.label,
    durations: p.durations,
    keys: p.durations.map(() => ['c/4']),
    vexDurations: p.durations.map(d => toVexDuration(d)),
  }));

  return {
    type: 'rhythm',
    prompt: 'What rhythm pattern do you hear?',
    correctAnswer: correct.label,
    choices: allChoices.map(p => p.label),
    rhythmChoices,
    noteData: {
      notes: correct.durations.map(() => 'C4'),
      durations: correct.durations,
      keys: correct.durations.map(() => ['c/4']),
      vexDurations: correct.durations.map(d => toVexDuration(d)),
      timeSignature: '4/4',
    },
  };
}

export function generateSecondaryDominantQuestion(difficulty: Difficulty): Question {
  const secDoms = getSecondaryDominants(difficulty);
  const correct = secDoms[Math.floor(Math.random() * secDoms.length)];

  // Pick a random key root (C3 to B3 range for good voicing)
  const rootMidi = 48 + Math.floor(Math.random() * 12); // C3 to B3
  const rootNote = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][rootMidi % 12];

  const progression = buildSecDomProgression(difficulty, correct, rootMidi);

  // Build choices
  const distractors = pickRandom(
    secDoms.filter(s => s.label !== correct.label),
    3
  );
  const allChoices = [correct, ...distractors];
  const choices = shuffle(allChoices.map(s => s.label));

  // Map each choice label to its actual chord name in this key
  const choiceChordNames: Record<string, string> = {};
  for (const s of allChoices) {
    choiceChordNames[s.label] = getSecDomChordName(s, rootMidi);
  }

  return {
    type: 'secondary-dominants',
    prompt: `Key of ${rootNote} major — which secondary dominant do you hear?`,
    correctAnswer: correct.label,
    choices,
    noteData: {
      notes: [], // playback handled via progressionChords
    },
    progressionChords: progression.chords,
    progressionLabels: progression.labels,
    secDomIndex: progression.secDomIndex,
    secDomChordName: progression.secDomChordName,
    targetChordName: progression.targetChordName,
    choiceChordNames,
  };
}

export function generateQuestion(type: ExerciseType, difficulty: Difficulty): Question {
  switch (type) {
    case 'intervals': return generateIntervalQuestion(difficulty);
    case 'chords': return generateChordQuestion(difficulty);
    case 'rhythm': return generateRhythmQuestion(difficulty);
    case 'secondary-dominants': return generateSecondaryDominantQuestion(difficulty);
  }
}
