import Soundfont from 'soundfont-player';
import type { InstrumentName } from '../types';
import { durationToBeats, midiToNoteName } from './music';

// Map our instrument names to soundfont instrument names
// https://github.com/gleitz/midi-js-soundfonts (FatBoy soundfont)
const SOUNDFONT_MAP: Record<InstrumentName, string> = {
  piano: 'acoustic_grand_piano',
  guitar: 'acoustic_guitar_nylon',
  strings: 'string_ensemble_1',
  brass: 'trumpet',
  organ: 'church_organ',
  saxophone: 'tenor_sax',
  flute: 'flute',
  violin: 'violin',
  cello: 'cello',
  marimba: 'marimba',
};

const SOUNDFONT_BASE = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FatBoy';

let audioContext: AudioContext | null = null;

// Cache loaded instruments so we don't re-fetch
const instrumentCache: Map<string, Soundfont.Player> = new Map();

// A simple click instrument for metronome count-in
let clickInstrument: Soundfont.Player | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function ensureAudioContext(): Promise<void> {
  const ac = getAudioContext();
  if (ac.state === 'suspended') {
    await ac.resume();
  }
}

function soundfontUrl(name: string): string {
  return `${SOUNDFONT_BASE}/${name}-mp3.js`;
}

async function loadInstrument(instrumentName: InstrumentName): Promise<Soundfont.Player> {
  const sfName = SOUNDFONT_MAP[instrumentName];
  const cached = instrumentCache.get(sfName);
  if (cached) return cached;

  const ac = getAudioContext();
  const player = await Soundfont.instrument(ac, soundfontUrl(sfName) as Soundfont.InstrumentName);

  instrumentCache.set(sfName, player);
  return player;
}

async function getClickInstrument(): Promise<Soundfont.Player> {
  if (clickInstrument) return clickInstrument;
  const ac = getAudioContext();
  clickInstrument = await Soundfont.instrument(ac, soundfontUrl('woodblock') as Soundfont.InstrumentName);
  return clickInstrument;
}

// Play two notes sequentially (for intervals)
export async function playInterval(
  note1: string,
  note2: string,
  instrument: InstrumentName
): Promise<void> {
  await ensureAudioContext();
  const player = await loadInstrument(instrument);
  const ac = getAudioContext();
  const now = ac.currentTime;
  player.play(note1, now, { duration: 0.8, gain: 0.8 });
  player.play(note2, now + 0.9, { duration: 0.8, gain: 0.8 });
}

// Play notes simultaneously (for chords)
export async function playChord(
  notes: string[],
  instrument: InstrumentName
): Promise<void> {
  await ensureAudioContext();
  const player = await loadInstrument(instrument);
  const ac = getAudioContext();
  const now = ac.currentTime;
  for (const note of notes) {
    player.play(note, now, { duration: 1.2, gain: 0.7 });
  }
}

// Play rhythm pattern on a single pitch with a count-in
export async function playRhythmWithCountIn(
  durations: string[],
  instrument: InstrumentName,
  bpm: number = 100
): Promise<void> {
  await ensureAudioContext();
  const [player, click] = await Promise.all([
    loadInstrument(instrument),
    getClickInstrument(),
  ]);
  const ac = getAudioContext();
  const beatDuration = 60 / bpm;
  let time = ac.currentTime;

  // Count-in: 4 clicks
  for (let i = 0; i < 4; i++) {
    click.play(i === 0 ? 'G5' : 'C5', time, { duration: 0.05, gain: 0.5 });
    time += beatDuration;
  }

  // Play the rhythm
  for (const dur of durations) {
    const beats = durationToBeats(dur);
    const seconds = beats * beatDuration;
    player.play('C4', time, { duration: seconds * 0.85, gain: 0.8 });
    time += seconds;
  }
}

// Play a chord progression (array of midi note arrays)
export async function playProgression(
  chords: number[][],
  instrument: InstrumentName,
  bpm: number = 80
): Promise<void> {
  await ensureAudioContext();
  const player = await loadInstrument(instrument);
  const ac = getAudioContext();
  const beatDuration = 60 / bpm;
  let time = ac.currentTime;

  for (const chord of chords) {
    for (const midi of chord) {
      const noteName = midiToNoteName(midi);
      player.play(noteName, time, { duration: beatDuration * 1.8, gain: 0.7 });
    }
    time += beatDuration * 2; // 2 beats per chord
  }
}

// Preload an instrument so it's ready when needed
export async function preloadInstrument(instrument: InstrumentName): Promise<void> {
  await ensureAudioContext();
  await loadInstrument(instrument);
}
