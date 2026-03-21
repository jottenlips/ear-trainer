import Soundfont from 'soundfont-player';
import type { InstrumentName, PolyLayer } from '../types';
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
    // Use 'playback' category on iOS so audio plays even when the silent switch is on
    // @ts-ignore – webkitAudioCategory is a webkit-specific option recognized by Safari/iOS
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      ...(navigator.userAgent.match(/iPhone|iPad|iPod/) && {
        webkitAudioCategory: 'playback',
      }),
    });
  }
  return audioContext;
}

/**
 * Unlock audio on iOS even when the silent/mute switch is on.
 * Playing a tiny silent WAV through an <audio> element forces Safari to start
 * an audio session in "playback" mode, which then also applies to the
 * Web Audio API AudioContext.
 */
let iosSilentModeUnlocked = false;

function unlockIOSSilentMode(): void {
  if (iosSilentModeUnlocked) return;
  if (!navigator.userAgent.match(/iPhone|iPad|iPod/)) {
    iosSilentModeUnlocked = true;
    return;
  }

  // Tiny silent WAV (44 bytes) encoded as a data URI
  const silentDataURI =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';

  const audio = new Audio(silentDataURI);
  audio.setAttribute('playsinline', 'true');
  audio.play().then(() => {
    iosSilentModeUnlocked = true;
  }).catch(() => {
    // Ignore – user hasn't interacted yet; will retry on next call
  });
}

export async function ensureAudioContext(): Promise<void> {
  unlockIOSSilentMode();
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

// Drum instruments for rhythm exercises
let drumLow: Soundfont.Player | null = null;
let drumHigh: Soundfont.Player | null = null;

async function getDrumInstruments(): Promise<[Soundfont.Player, Soundfont.Player]> {
  const ac = getAudioContext();
  if (!drumLow) {
    drumLow = await Soundfont.instrument(ac, soundfontUrl('synth_drum') as Soundfont.InstrumentName);
  }
  if (!drumHigh) {
    drumHigh = await Soundfont.instrument(ac, soundfontUrl('woodblock') as Soundfont.InstrumentName);
  }
  return [drumLow, drumHigh];
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

// Play rhythm with drum sounds — supports multi-layer polyrhythm patterns
// Pick 2 random voice indices from [0,1,2] for polyrhythm — call once per question
export function randomPolyVoices(): [number, number] {
  const pool = [0, 1, 2];
  const a = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  const b = pool[Math.floor(Math.random() * pool.length)];
  return [a, b];
}

export async function playRhythmDrum(
  durations: string[],
  layers: PolyLayer[] | undefined,
  bpm: number = 100,
  countIn: boolean = true,
  polyVoices?: [number, number]
): Promise<void> {
  await ensureAudioContext();
  const [[low, high], click] = await Promise.all([
    getDrumInstruments(),
    getClickInstrument(),
  ]);
  const ac = getAudioContext();
  const beatDuration = 60 / bpm;
  let time = ac.currentTime;

  if (countIn) {
    for (let i = 0; i < 4; i++) {
      click.play(i === 0 ? 'G5' : 'C5', time, { duration: 0.05, gain: 0.5 });
      time += beatDuration;
    }
  }

  if (layers && layers.length > 0) {
    // All available voice configs (same sounds used in grooves)
    const voicePool = [
      { drum: low,  pitch: 'C2',   gain: 0.95, dur: 0.2  },  // kick
      { drum: low,  pitch: 'E3',   gain: 0.8,  dur: 0.12 },  // snare
      { drum: high, pitch: 'F#5',  gain: 0.5,  dur: 0.06 },  // hi-hat
    ];

    let drumList, pitchList, gainList, durList;

    if (layers.length === 2) {
      // Polyrhythms: use provided voice indices (stable per question)
      const indices = polyVoices ?? [0, 1];
      const picked = indices.map(i => voicePool[i]);
      drumList =  picked.map(v => v.drum);
      pitchList = picked.map(v => v.pitch);
      gainList =  picked.map(v => v.gain);
      durList =   picked.map(v => v.dur);
    } else {
      // 3-voice grooves: kick, snare, hi-hat
      drumList =  voicePool.map(v => v.drum);
      pitchList = voicePool.map(v => v.pitch);
      gainList =  voicePool.map(v => v.gain);
      durList =   voicePool.map(v => v.dur);
    }

    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      const drum = drumList[li];
      const pitch = pitchList[li];
      const gain = gainList[li];
      const dur = durList[li];

      for (const hitBeat of layer.hits) {
        const hitTime = time + hitBeat * beatDuration;
        drum.play(pitch, hitTime, { duration: dur, gain });
      }
    }
  } else {
    // Single voice on drum
    for (const dur of durations) {
      const beats = durationToBeats(dur);
      const seconds = beats * beatDuration;
      low.play('C3', time, { duration: seconds * 0.7, gain: 0.85 });
      time += seconds;
    }
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

// Play progression as block chords, adding one random extension note to the sec dom chord
export async function playProgressionWithExtensionNote(
  chords: number[][],
  instrument: InstrumentName,
  secDomIndex: number,
  extensions: number[],
  bpm: number = 80
): Promise<void> {
  await ensureAudioContext();
  const player = await loadInstrument(instrument);
  const ac = getAudioContext();
  const beatDuration = 60 / bpm;
  let time = ac.currentTime;

  // Pick one random extension to add
  const ext = extensions[Math.floor(Math.random() * extensions.length)];

  for (let ci = 0; ci < chords.length; ci++) {
    const chord = chords[ci];
    for (const midi of chord) {
      const noteName = midiToNoteName(midi);
      player.play(noteName, time, { duration: beatDuration * 1.8, gain: 0.7 });
    }
    // Add the extension note to the sec dom chord
    if (ci === secDomIndex) {
      const extMidi = chord[0] + 12 + ext;
      const noteName = midiToNoteName(extMidi);
      player.play(noteName, time, { duration: beatDuration * 1.8, gain: 0.7 });
    }
    time += beatDuration * 2;
  }
}

// Play progression with arpeggios; for the sec dom chord, arpeggiate chord then extension color tones
export async function playProgressionWithExtensions(
  chords: number[][],
  instrument: InstrumentName,
  secDomIndex: number,
  extensions: number[],
  bpm: number = 80
): Promise<void> {
  await ensureAudioContext();
  const player = await loadInstrument(instrument);
  const ac = getAudioContext();
  const beatDuration = 60 / bpm;
  let time = ac.currentTime;

  for (let ci = 0; ci < chords.length; ci++) {
    const chord = chords[ci];

    if (ci === secDomIndex) {
      // For the secondary dominant: arpeggiate the chord, then play extension color tones
      const chordRoot = chord[0];

      // Arpeggiate the base chord tones
      const arpDelay = (beatDuration * 2) / (chord.length + extensions.length + 1);
      let noteTime = time;
      for (const midi of chord) {
        const noteName = midiToNoteName(midi);
        player.play(noteName, noteTime, { duration: beatDuration * 3, gain: 0.6 });
        noteTime += arpDelay;
      }
      // Then arpeggiate the extension notes (an octave above root)
      for (const ext of extensions) {
        const extMidi = chordRoot + 12 + ext;
        const noteName = midiToNoteName(extMidi);
        player.play(noteName, noteTime, { duration: beatDuration * 2.5, gain: 0.75 });
        noteTime += arpDelay;
      }
    } else {
      // Normal chords: arpeggiate bottom to top
      const arpDelay = (beatDuration * 0.8) / chord.length;
      for (let ni = 0; ni < chord.length; ni++) {
        const noteName = midiToNoteName(chord[ni]);
        player.play(noteName, time + ni * arpDelay, { duration: beatDuration * 1.8, gain: 0.7 });
      }
    }

    time += beatDuration * 2;
  }
}

// Preload an instrument so it's ready when needed
export async function preloadInstrument(instrument: InstrumentName): Promise<void> {
  await ensureAudioContext();
  await loadInstrument(instrument);
}
