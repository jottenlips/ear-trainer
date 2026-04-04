import type { Difficulty, Question, ExerciseType } from '../types';
import {
  getIntervalsForDifficulty,
  getChordsForDifficulty,
  getInversionsForDifficulty,
  getInversionNames,
  getRhythmPatterns,
  getGrooveNames,
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
    promptKey: 'interval',
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
    promptKey: 'chord',
    promptRoot: rootLetter,
    correctAnswer: correct.name,
    choices,
    noteData: {
      notes: chordNotes,
      keys: [chordKeys],
      vexDurations: ['w'],
    },
    chordRootPc: rootMidi % 12,
  };
}

export function generateRhythmQuestion(difficulty: Difficulty): Question {
  const patterns = getRhythmPatterns(difficulty);
  const groovePatterns = patterns.filter(p => p.layers);
  const regularPatterns = patterns.filter(p => !p.layers);

  // Pick from groove or regular pool (if grooves exist, 50/50 chance)
  const useGroove = groovePatterns.length >= 4 && Math.random() < 0.5;
  const pool = useGroove ? groovePatterns : regularPatterns;

  const correct = pool[Math.floor(Math.random() * pool.length)];

  // Only use patterns from the same pool as distractors
  const distractors = pickRandom(
    pool.filter(p => p.label !== correct.label),
    3
  );
  const allChoices = shuffle([correct, ...distractors]);

  const rhythmChoices = allChoices.map(p => ({
    label: p.label,
    durations: p.durations,
    keys: p.durations.map(() => ['c/4']),
    vexDurations: p.durations.map(d => toVexDuration(d)),
    tripletGroups: p.tripletGroups,
    grooveName: p.grooveName,
    layers: p.layers,
  }));

  // Build groove choices for secondary question if correct pattern is a groove
  let grooveChoices: string[] | undefined;
  if (correct.grooveName) {
    const allGrooves = getGrooveNames('hard');
    const otherGrooves = allGrooves.filter(g => g !== correct.grooveName);
    const distractorGrooves = pickRandom(otherGrooves, Math.min(3, otherGrooves.length));
    grooveChoices = shuffle([correct.grooveName, ...distractorGrooves]);
  }

  return {
    type: 'rhythm',
    prompt: useGroove ? 'What beat do you hear?' : 'What rhythm pattern do you hear?',
    promptKey: useGroove ? 'beat' : 'rhythm',
    correctAnswer: correct.label,
    choices: allChoices.map(p => p.label),
    rhythmChoices,
    grooveName: correct.grooveName,
    grooveChoices,
    noteData: {
      notes: correct.durations.map(() => 'C4'),
      durations: correct.durations,
      keys: correct.durations.map(() => ['c/4']),
      vexDurations: correct.durations.map(d => toVexDuration(d)),
      timeSignature: '4/4',
      tripletGroups: correct.tripletGroups,
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
    promptKey: 'secdom',
    promptRoot: rootNote,
    correctAnswer: correct.label,
    choices,
    noteData: {
      notes: [], // playback handled via progressionChords
    },
    progressionChords: progression.chords,
    progressionLabels: progression.labels,
    progressionChordNames: progression.chordNames,
    secDomIndex: progression.secDomIndex,
    secDomExtensions: progression.secDomExtensions,
    secDomSound: progression.secDomSound,
    secDomChordName: progression.secDomChordName,
    targetChordName: progression.targetChordName,
    choiceChordNames,
  };
}

export function generateInversionQuestion(difficulty: Difficulty): Question {
  const inversions = getInversionsForDifficulty(difficulty);
  const correct = inversions[Math.floor(Math.random() * inversions.length)];

  // Random bass note in a comfortable range
  const bassMidi = 48 + Math.floor(Math.random() * 12); // C3 to B3
  const chordNotes = correct.buildNotes(bassMidi);
  const noteNames = chordNotes.map(m => midiToNoteName(m));
  const vexKeys = chordNotes.map(m => noteToVexKey(midiToNoteName(m)));

  // The answer is the inversion name (Root Position, 1st Inversion, etc.)
  const correctAnswer = correct.inversionName;

  // Distractors: other inversion names available at this difficulty
  const allInversionNames = getInversionNames(difficulty);
  const distractorNames = allInversionNames.filter(n => n !== correctAnswer);
  const choices = shuffle([correctAnswer, ...distractorNames]);

  const bassNote = midiToNoteName(Math.min(...chordNotes));
  const bassLetter = bassNote.replace(/\d+$/, '');

  // Root PC: bass note + rootInterval gives the chord root
  const chordRootPc = (bassMidi + correct.rootInterval) % 12;

  return {
    type: 'inversions',
    prompt: `${correct.chordName} chord — what inversion? (Bass: ${bassLetter})`,
    promptKey: 'inversion',
    promptRoot: bassLetter,
    correctAnswer,
    choices,
    noteData: {
      notes: noteNames,
      keys: [vexKeys],
      vexDurations: ['w'],
    },
    inversionChordName: correct.chordName,
    chordRootPc,
  };
}

export function generateQuestion(type: ExerciseType, difficulty: Difficulty): Question {
  switch (type) {
    case 'intervals': return generateIntervalQuestion(difficulty);
    case 'chords': return generateChordQuestion(difficulty);
    case 'inversions': return generateInversionQuestion(difficulty);
    case 'rhythm': return generateRhythmQuestion(difficulty);
    case 'secondary-dominants': return generateSecondaryDominantQuestion(difficulty);
    case 'sight-reading': return generateIntervalQuestion(difficulty); // sight-reading uses its own view
  }
}
