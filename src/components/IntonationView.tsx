import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';
import type { TranslationKey } from '../i18n/translations';

type PitchRating = 'perfect' | 'great' | 'good' | 'off';

interface ChordInfo {
  roman: string;
  name: string;
  midi: number[];
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const MAJOR_CHORD_DEFS = [
  { degree: 0, intervals: [0, 4, 7], roman: 'I' },
  { degree: 2, intervals: [0, 3, 7], roman: 'ii' },
  { degree: 4, intervals: [0, 3, 7], roman: 'iii' },
  { degree: 5, intervals: [0, 4, 7], roman: 'IV' },
  { degree: 7, intervals: [0, 4, 7], roman: 'V' },
  { degree: 9, intervals: [0, 3, 7], roman: 'vi' },
  { degree: 11, intervals: [0, 3, 6], roman: 'vii°' },
];

const MINOR_CHORD_DEFS = [
  { degree: 0, intervals: [0, 3, 7], roman: 'i' },
  { degree: 2, intervals: [0, 3, 6], roman: 'ii°' },
  { degree: 3, intervals: [0, 4, 7], roman: 'III' },
  { degree: 5, intervals: [0, 3, 7], roman: 'iv' },
  { degree: 7, intervals: [0, 3, 7], roman: 'v' },
  { degree: 8, intervals: [0, 4, 7], roman: 'VI' },
  { degree: 10, intervals: [0, 4, 7], roman: 'VII' },
];

interface ProgressionDef {
  labelKey: string;
  roman: string;
  mode: 'major' | 'minor';
  degrees: number[];
}

const NAMED_PROGRESSIONS: ProgressionDef[] = [
  { labelKey: 'prog.oneChord',   roman: 'I – I – I – I',      mode: 'major', degrees: [0, 0, 0, 0] },
  { labelKey: 'prog.twoChord',   roman: 'I – V – I – V',      mode: 'major', degrees: [0, 4, 0, 4] },
  { labelKey: 'prog.pop',        roman: 'I – V – vi – IV',    mode: 'major', degrees: [0, 4, 5, 3] },
  { labelKey: 'prog.blues',      roman: 'I – IV – V – I',     mode: 'major', degrees: [0, 3, 4, 0] },
  { labelKey: 'prog.jazz',       roman: 'ii – V – I – I',     mode: 'major', degrees: [1, 4, 0, 0] },
  { labelKey: 'prog.fifties',    roman: 'I – vi – IV – V',    mode: 'major', degrees: [0, 5, 3, 4] },
  { labelKey: 'prog.axis',       roman: 'vi – IV – I – V',    mode: 'major', degrees: [5, 3, 0, 4] },
  { labelKey: 'prog.country',    roman: 'I – IV – vi – V',    mode: 'major', degrees: [0, 3, 5, 4] },
  { labelKey: 'prog.rock',       roman: 'I – IV – V – IV',    mode: 'major', degrees: [0, 3, 4, 3] },
  { labelKey: 'prog.andalusian', roman: 'i – VII – VI – v',   mode: 'minor', degrees: [0, 6, 5, 4] },
  { labelKey: 'prog.epic',       roman: 'i – VI – III – VII', mode: 'minor', degrees: [0, 5, 2, 6] },
  { labelKey: 'prog.minorBlues', roman: 'i – iv – v – i',     mode: 'minor', degrees: [0, 3, 4, 0] },
];

interface MelodyNote {
  midi: number;
  name: string;
  pc: number;
}

function generateMelody(progression: ChordInfo[], rootPc: number, scaleIntervals: number[]): MelodyNote[] {
  const scaleMidis: number[] = [];
  for (let midi = 55; midi <= 76; midi++) {
    const pc = midi % 12;
    const relPc = ((pc - rootPc) % 12 + 12) % 12;
    if (scaleIntervals.includes(relPc)) scaleMidis.push(midi);
  }

  const notes: MelodyNote[] = [];
  let idx = scaleMidis.findIndex(m => m % 12 === rootPc && m >= 60);
  if (idx === -1) idx = Math.floor(scaleMidis.length / 2);

  for (let ci = 0; ci < progression.length; ci++) {
    const chord = progression[ci];
    const chordPcs = new Set(chord.midi.map(m => m % 12));

    for (let beat = 0; beat < 2; beat++) {
      if (ci === 0 && beat === 0) {
        // start on root
      } else {
        const moves = [0, 0, -1, 1, 1, -1];
        const step = moves[Math.floor(Math.random() * moves.length)];
        let next = Math.max(0, Math.min(scaleMidis.length - 1, idx + step));
        for (let d = 0; d <= 1; d++) {
          if (next + d < scaleMidis.length && chordPcs.has(scaleMidis[next + d] % 12)) { next += d; break; }
          if (next - d >= 0 && chordPcs.has(scaleMidis[next - d] % 12)) { next -= d; break; }
        }
        idx = next;
      }
      const midi = scaleMidis[idx];
      const pc = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      notes.push({ midi, name: NOTE_NAMES[pc] + octave, pc });
    }
  }
  return notes;
}

function analyzeMelodyPitch(freqHz: number, targetMidi: number): number {
  const midi = 12 * Math.log2(freqHz / 440) + 69;
  const targetPc = targetMidi % 12;
  const pc = ((midi % 12) + 12) % 12;
  let diff = pc - targetPc;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return Math.round(diff * 100);
}

const THRESHOLDS = { perfect: 12, great: 25, good: 40 };
const POINTS: Record<PitchRating, number> = { perfect: 20, great: 8, good: 2, off: 0 };

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function getRating(cents: number): PitchRating {
  const abs = Math.abs(cents);
  if (abs <= THRESHOLDS.perfect) return 'perfect';
  if (abs <= THRESHOLDS.great) return 'great';
  if (abs <= THRESHOLDS.good) return 'good';
  return 'off';
}

function getMultiplier(streak: number): number {
  if (streak >= 30) return 4;
  if (streak >= 20) return 3;
  if (streak >= 10) return 2;
  return 1;
}

function buildProgression(rootPc: number, _mode: 'major' | 'minor', progIdx: number): ChordInfo[] {
  const prog = NAMED_PROGRESSIONS[progIdx];
  const defs = prog.mode === 'major' ? MAJOR_CHORD_DEFS : MINOR_CHORD_DEFS;

  return prog.degrees.map(idx => {
    const def = defs[idx];
    const pc = (rootPc + def.degree) % 12;
    const baseMidi = 48 + pc;
    const midi = def.intervals.map(i => baseMidi + i);
    const suffix = def.intervals[1] === 3 && def.intervals[2] === 6 ? '°'
      : def.intervals[1] === 3 ? 'm' : '';
    return { roman: def.roman, name: NOTE_NAMES[pc] + suffix, midi };
  });
}

function analyzePitch(freqHz: number, rootPc: number, scaleIntervals: number[]): { cents: number; targetPc: number } {
  const midi = 12 * Math.log2(freqHz / 440) + 69;
  const pc = ((midi % 12) + 12) % 12;

  let bestCents = Infinity;
  let bestPc = 0;

  for (const interval of scaleIntervals) {
    const notePc = (rootPc + interval) % 12;
    let diff = pc - notePc;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    const cents = diff * 100;
    if (Math.abs(cents) < Math.abs(bestCents)) {
      bestCents = cents;
      bestPc = notePc;
    }
  }

  return { cents: Math.round(bestCents), targetPc: bestPc };
}

function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MIN_LAG = Math.floor(sampleRate / 1000);
  const MAX_LAG = Math.min(Math.ceil(sampleRate / 70), SIZE - 1);

  let corr0 = 0;
  for (let i = 0; i < SIZE; i++) corr0 += buffer[i] * buffer[i];
  if (corr0 < 0.001) return -1;

  const corr = new Float32Array(MAX_LAG + 1);
  for (let lag = MIN_LAG; lag <= MAX_LAG; lag++) {
    let sum = 0;
    for (let i = 0; i < SIZE - lag; i++) sum += buffer[i] * buffer[i + lag];
    corr[lag] = sum;
  }

  let d = MIN_LAG;
  while (d < MAX_LAG && corr[d] > corr[d + 1]) d++;

  let maxVal = -Infinity;
  let maxPos = d;
  for (let i = d; i <= MAX_LAG; i++) {
    if (corr[i] > maxVal) { maxVal = corr[i]; maxPos = i; }
  }

  if (maxVal / corr0 < 0.25) return -1;

  if (maxPos > MIN_LAG && maxPos < MAX_LAG) {
    const a = corr[maxPos - 1];
    const b = corr[maxPos];
    const c = corr[maxPos + 1];
    const denom = 2 * (a - 2 * b + c);
    if (denom !== 0) maxPos += (a - c) / denom;
  }

  return sampleRate / maxPos;
}

export default function IntonationView() {
  const { lang } = useLanguage();

  const [rootPc, setRootPc] = useState(0);
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [selectedProg, setSelectedProg] = useState(0);
  const [bpm, setBpm] = useState(72);
  const [sensitivity, setSensitivity] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCountIn, setIsCountIn] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [currentChordIdx, setCurrentChordIdx] = useState(0);
  const [progression, setProgression] = useState<ChordInfo[]>([]);
  const [singing, setSinging] = useState(false);
  const [detectedNote, setDetectedNote] = useState('');
  const [detectedMidi, setDetectedMidi] = useState(-1);
  const [_targetPc, setTargetPc] = useState(-1);
  const [centsOffset, setCentsOffset] = useState(0);
  const [lastRating, setLastRating] = useState<PitchRating | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalChecks, setTotalChecks] = useState(0);
  const [goodChecks, setGoodChecks] = useState(0);
  const [recentCents, setRecentCents] = useState<number[]>([]);
  const [micError, setMicError] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [gameMode, setGameMode] = useState<'free' | 'melody'>('melody');
  const [melody, setMelody] = useState<MelodyNote[]>([]);
  const [melodyPhase, setMelodyPhase] = useState<'listen' | 'sing' | null>(null);
  const [currentMelodyIdx, setCurrentMelodyIdx] = useState(-1);

  const acRef = useRef<AudioContext | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const schedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pitchIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);
  const nextClickRef = useRef(0);
  const clickBeatRef = useRef(0);
  const nextChordRef = useRef(0);
  const chordIdxRef = useRef(0);
  const countInRef = useRef(0);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const maxStreakRef = useRef(0);
  const bpmRef = useRef(bpm);
  const sensRef = useRef(sensitivity);
  const rootPcRef = useRef(rootPc);
  const scaleRef = useRef(MAJOR_SCALE);
  const progRef = useRef<ChordInfo[]>([]);
  const smoothCentsRef = useRef(0);
  const gameModeRef = useRef<'free' | 'melody'>('melody');
  const melodyRef = useRef<MelodyNote[]>([]);
  const melodyPhaseRef = useRef<'listen' | 'sing' | null>(null);
  const currentMelodyIdxRef = useRef(-1);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { sensRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { rootPcRef.current = rootPc; }, [rootPc]);
  useEffect(() => { scaleRef.current = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE; }, [mode]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  const cleanup = useCallback(() => {
    playingRef.current = false;
    if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null; }
    if (pitchIntRef.current) { clearInterval(pitchIntRef.current); pitchIntRef.current = null; }
    if (micRef.current) { micRef.current.getTracks().forEach(tr => tr.stop()); micRef.current = null; }
    if (acRef.current) { acRef.current.close().catch(() => {}); acRef.current = null; }
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const playClick = useCallback((ac: AudioContext, time: number, accent: boolean) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = accent ? 1500 : 1000;
    osc.type = 'sine';
    gain.gain.setValueAtTime(accent ? 0.15 : 0.07, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const playGuideNote = useCallback((midi: number) => {
    let ac = acRef.current;
    if (!ac) {
      ac = new AudioContext();
      acRef.current = ac;
    }
    if (ac.state === 'suspended') ac.resume();
    const freq = midiToFreq(midi);
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.7);
  }, []);

  const playMelodyTone = useCallback((ac: AudioContext, midi: number, time: number, dur: number) => {
    const freq = midiToFreq(midi);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.03);
    gain.gain.setValueAtTime(0.18, time + dur - 0.05);
    gain.gain.linearRampToValueAtTime(0, time + dur);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }, []);

  const playPad = useCallback((ac: AudioContext, midiNotes: number[], startTime: number, duration: number) => {
    const master = ac.createGain();
    master.connect(ac.destination);
    master.gain.setValueAtTime(0, startTime);
    master.gain.linearRampToValueAtTime(0.1, startTime + 0.15);
    master.gain.setValueAtTime(0.1, startTime + duration - 0.2);
    master.gain.linearRampToValueAtTime(0, startTime + duration);

    for (const midi of midiNotes) {
      const freq = midiToFreq(midi);
      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(master);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);

      const osc2 = ac.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.002;
      const g2 = ac.createGain();
      g2.gain.value = 0.3;
      osc2.connect(g2);
      g2.connect(master);
      osc2.start(startTime);
      osc2.stop(startTime + duration + 0.1);
    }
  }, []);

  const stopRef = useRef<(() => void) | null>(null);

  const scheduler = useCallback(() => {
    const ac = acRef.current;
    if (!ac || !playingRef.current) return;

    const qDur = 60 / bpmRef.current;
    const chordDur = qDur * 4;
    const lookahead = 0.2;
    const isMelody = gameModeRef.current === 'melody';
    const mel = melodyRef.current;
    const totalMelNotes = mel.length;
    const beatsPerNote = 2;
    const cycleBeats = totalMelNotes * beatsPerNote * 2;

    while (nextClickRef.current < ac.currentTime + lookahead) {
      const bi = clickBeatRef.current % 4;
      playClick(ac, nextClickRef.current, bi === 0);

      const delay = Math.max(0, (nextClickRef.current - ac.currentTime) * 1000);
      const beat = bi;
      const cin = countInRef.current;
      setTimeout(() => {
        setCurrentBeat(beat);
        if (cin < 4) setIsCountIn(true);
      }, delay);

      if (countInRef.current < 4) {
        countInRef.current++;
        if (countInRef.current === 4) setTimeout(() => setIsCountIn(false), delay);
      } else if (isMelody && totalMelNotes > 0) {
        const absBeats = clickBeatRef.current - 4;
        const pos = absBeats % cycleBeats;
        const listenBeats = totalMelNotes * beatsPerNote;
        const isListenPhase = pos < listenBeats;
        const phaseBeat = isListenPhase ? pos : pos - listenBeats;
        const noteIdx = Math.floor(phaseBeat / beatsPerNote);
        const isNoteStart = phaseBeat % beatsPerNote === 0;

        if (isListenPhase) {
          if (isNoteStart) {
            playMelodyTone(ac, mel[noteIdx].midi, nextClickRef.current, qDur * beatsPerNote * 0.85);
            const midx = noteIdx;
            setTimeout(() => {
              setCurrentMelodyIdx(midx);
              melodyPhaseRef.current = 'listen';
              setMelodyPhase('listen');
            }, delay);
          }
        } else {
          if (isNoteStart) {
            const midx = noteIdx;
            setTimeout(() => {
              currentMelodyIdxRef.current = midx;
              setCurrentMelodyIdx(midx);
              melodyPhaseRef.current = 'sing';
              setMelodyPhase('sing');
            }, delay);
          }
        }
      }

      nextClickRef.current += qDur;
      clickBeatRef.current++;
    }

    if (countInRef.current >= 4) {
      while (nextChordRef.current < ac.currentTime + lookahead) {
        const prog = progRef.current;
        if (prog.length === 0) break;
        const idx = chordIdxRef.current % prog.length;
        playPad(ac, prog[idx].midi, nextChordRef.current, chordDur);

        const delay = Math.max(0, (nextChordRef.current - ac.currentTime) * 1000);
        const ci = idx;
        setTimeout(() => setCurrentChordIdx(ci), delay);

        nextChordRef.current += chordDur;
        chordIdxRef.current++;
      }
    }
  }, [playClick, playPad, playMelodyTone]);

  const pitchDetector = useCallback(() => {
    const ac = acRef.current;
    const analyser = analyserRef.current;
    if (!ac || !analyser || !playingRef.current || countInRef.current < 4) return;

    if (gameModeRef.current === 'melody' && melodyPhaseRef.current !== 'sing') return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    let rmsSum = 0;
    for (let i = 0; i < buffer.length; i++) rmsSum += buffer[i] * buffer[i];
    const rms = Math.sqrt(rmsSum / buffer.length);
    const threshold = 0.08 * Math.pow(10, -sensRef.current / 50);

    if (rms < threshold) { setSinging(false); return; }

    const freq = autoCorrelate(buffer, ac.sampleRate);
    if (freq <= 0) { setSinging(false); return; }

    setSinging(true);

    let cents: number;
    let tp: number;
    const midi = 12 * Math.log2(freq / 440) + 69;
    const nearestMidi = Math.round(midi);
    const notePc = ((nearestMidi % 12) + 12) % 12;
    const octave = Math.floor(nearestMidi / 12) - 1;

    if (gameModeRef.current === 'melody') {
      const mel = melodyRef.current;
      const idx = currentMelodyIdxRef.current;
      if (idx >= 0 && idx < mel.length) {
        cents = analyzeMelodyPitch(freq, mel[idx].midi);
        tp = mel[idx].pc;
      } else {
        cents = 0; tp = -1;
      }
    } else {
      const result = analyzePitch(freq, rootPcRef.current, scaleRef.current);
      cents = result.cents;
      tp = result.targetPc;
    }

    smoothCentsRef.current = smoothCentsRef.current * 0.6 + cents * 0.4;
    const smoothed = Math.round(smoothCentsRef.current);

    setCentsOffset(smoothed);
    setDetectedNote(NOTE_NAMES[notePc] + octave);
    setDetectedMidi(nearestMidi);
    setTargetPc(tp);

    const rating = getRating(smoothed);

    if (rating === 'perfect' || rating === 'great') {
      streakRef.current++;
      scoreRef.current += POINTS[rating] * getMultiplier(streakRef.current);
      setGoodChecks(prev => prev + 1);
    } else if (rating === 'good') {
      scoreRef.current += POINTS[rating];
    } else {
      streakRef.current = 0;
    }

    if (streakRef.current > maxStreakRef.current) maxStreakRef.current = streakRef.current;

    setScore(scoreRef.current);
    setStreak(streakRef.current);
    setMaxStreak(maxStreakRef.current);
    setLastRating(rating);
    setTotalChecks(prev => prev + 1);
    if (rating === 'perfect' || rating === 'great') {
      setRecentCents(prev => [...prev, smoothed].slice(-30));
    }
  }, []);

  const start = async () => {
    if (playingRef.current) return;
    setMicError('');

    let stream: MediaStream | null = null;
    let ac: AudioContext | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setMicError(t('pocket.micError' as TranslationKey, lang) + (msg ? ` (${msg})` : ''));
      return;
    }

    try {
      ac = new AudioContext();
      if (ac.state === 'suspended') await ac.resume();

      acRef.current = ac;
      micRef.current = stream;

      const source = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;

      const prog = buildProgression(rootPc, mode, selectedProg);
      progRef.current = prog;
      setProgression(prog);

      if (gameMode === 'melody') {
        const mel = generateMelody(prog, rootPc, scaleRef.current);
        melodyRef.current = mel;
        setMelody(mel);
        melodyPhaseRef.current = 'listen';
        setMelodyPhase('listen');
        currentMelodyIdxRef.current = -1;
        setCurrentMelodyIdx(-1);
      } else {
        melodyRef.current = [];
        setMelody([]);
        melodyPhaseRef.current = null;
        setMelodyPhase(null);
      }

      scoreRef.current = 0; streakRef.current = 0; maxStreakRef.current = 0;
      countInRef.current = 0; clickBeatRef.current = 0; chordIdxRef.current = 0;
      smoothCentsRef.current = 0;

      setScore(0); setStreak(0); setMaxStreak(0);
      setLastRating(null); setCentsOffset(0); setDetectedNote(''); setTargetPc(-1);
      setTotalChecks(0); setGoodChecks(0); setRecentCents([]);
      setCurrentBeat(-1); setCurrentChordIdx(0); setSinging(false);
      setIsCountIn(true);

      const qDur = 60 / bpm;
      nextClickRef.current = ac.currentTime + 0.1;
      nextChordRef.current = ac.currentTime + 0.1 + qDur * 4;

      playingRef.current = true;
      setIsPlaying(true);

      schedRef.current = setInterval(scheduler, 25);
      pitchIntRef.current = setInterval(pitchDetector, 100);
    } catch {
      stream.getTracks().forEach(tr => tr.stop());
      if (ac) ac.close().catch(() => {});
      setMicError(t('pocket.micError' as TranslationKey, lang));
    }
  };

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setIsCountIn(false);
    setCurrentBeat(-1);
    setSinging(false);
    setIsPaused(false);
    setMelodyPhase(null);
    melodyPhaseRef.current = null;
    setCurrentMelodyIdx(-1);
    currentMelodyIdxRef.current = -1;
  }, [cleanup]);

  stopRef.current = stop;

  const togglePause = useCallback(() => {
    const ac = acRef.current;
    if (!ac || !playingRef.current) return;
    if (ac.state === 'running') {
      ac.suspend();
      setIsPaused(true);
    } else {
      ac.resume();
      setIsPaused(false);
    }
  }, []);

  const accuracy = totalChecks > 0 ? Math.round((goodChecks / totalChecks) * 100) : 0;
  const avgCents = recentCents.length > 0
    ? Math.round(recentCents.reduce((a, b) => a + b, 0) / recentCents.length) : 0;
  const multiplier = getMultiplier(streak);
  const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  const twoOctaveNotes = [
    ...scale.map(i => ({ name: NOTE_NAMES[(rootPc + i) % 12], midi: 60 + rootPc + i, pc: (rootPc + i) % 12 })),
    ...scale.map(i => ({ name: NOTE_NAMES[(rootPc + i) % 12], midi: 72 + rootPc + i, pc: (rootPc + i) % 12 })),
  ];

  return (
    <div className="pocket-view">
      <div className="exercise-header">
        <Link to="/" className="btn btn-secondary" onClick={stop}>
          {t('exercise.back' as TranslationKey, lang)}
        </Link>
        {isPlaying && (
          <div className="pocket-score-header">
            <span className="pocket-score">{score.toLocaleString()}</span>
            {multiplier > 1 && (
              <span className={`pocket-multiplier mult-${multiplier}`}>{'×'}{multiplier}</span>
            )}
          </div>
        )}
      </div>

      {!isPlaying && (
        <>
          <div className="pocket-title">
            <h2>{t('intonation.title' as TranslationKey, lang)}</h2>
            <p>{t('intonation.subtitle' as TranslationKey, lang)}</p>
            <button className="btn btn-secondary intonation-tips-btn" onClick={() => setShowTips(true)}>
              {t('intonation.tips' as TranslationKey, lang)}
            </button>
          </div>

          <div className="pocket-warning">
            {t('pocket.warning' as TranslationKey, lang)}
          </div>
        </>
      )}

      {micError && <div className="pocket-error">{micError}</div>}

      {!isPlaying && (
        <div className="pocket-controls">
          <div className="pocket-control">
            <label>{t('intonation.mode' as TranslationKey, lang)}:</label>
            <div className="pocket-subdiv">
              <button className={`btn btn-secondary pocket-subdiv-btn ${gameMode === 'free' ? 'active' : ''}`}
                onClick={() => setGameMode('free')}>
                {t('intonation.modeFree' as TranslationKey, lang)}
              </button>
              <button className={`btn btn-secondary pocket-subdiv-btn ${gameMode === 'melody' ? 'active' : ''}`}
                onClick={() => setGameMode('melody')}>
                {t('intonation.modeMelody' as TranslationKey, lang)}
              </button>
            </div>
          </div>
          <div className="pocket-control">
            <label>{t('intonation.key' as TranslationKey, lang)}:</label>
            <select value={rootPc} onChange={e => setRootPc(+e.target.value)}
              className="instrument-select">
              {NOTE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
          </div>
          <div className="pocket-control">
            <label>{t('intonation.progression' as TranslationKey, lang)}:</label>
            <div className="intonation-prog-grid">
              {NAMED_PROGRESSIONS.map((p, i) => (
                <button key={i}
                  className={`btn btn-secondary intonation-prog-btn ${selectedProg === i ? 'active' : ''}`}
                  onClick={() => { setSelectedProg(i); setMode(p.mode); }}>
                  <span className="intonation-prog-name">{t(p.labelKey as TranslationKey, lang)}</span>
                  <span className="intonation-prog-roman">{p.roman}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pocket-control">
            <label>{t('pocket.bpm' as TranslationKey, lang)}: <strong>{bpm}</strong></label>
            <input type="range" min={50} max={140} value={bpm}
              onChange={e => setBpm(+e.target.value)} />
          </div>
          <div className="pocket-control">
            <label>{t('pocket.sensitivity' as TranslationKey, lang)}</label>
            <input type="range" min={10} max={90} value={sensitivity}
              onChange={e => setSensitivity(+e.target.value)} />
          </div>
        </div>
      )}

      {/* Scale reference — two octaves */}
      <div className="intonation-scale">
        {twoOctaveNotes.map((n, i) => (
          <button key={i}
            className={`intonation-scale-note ${i === 0 || i === scale.length ? 'root' : ''} ${singing && detectedMidi === n.midi ? 'singing' : ''}`}
            onClick={() => playGuideNote(n.midi)}>
            {n.name}
          </button>
        ))}
      </div>

      {/* Beats */}
      {isPlaying && (
        <div className="pocket-beats">
          {isCountIn && <div className="pocket-count-in">{t('pocket.countIn' as TranslationKey, lang)}</div>}
          <div className="pocket-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`pocket-dot ${currentBeat === i ? 'active' : ''} ${currentBeat === i && i === 0 ? 'accent' : ''}`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chord progression */}
      {isPlaying && !isCountIn && progression.length > 0 && (
        <div className="intonation-progression">
          {progression.map((chord, i) => (
            <div key={i} className={`intonation-chord ${currentChordIdx === i ? 'current' : ''}`}>
              <span className="intonation-chord-roman">{chord.roman}</span>
              <span className="intonation-chord-name">{chord.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Melody phase label + notes */}
      {isPlaying && !isCountIn && gameMode === 'melody' && melody.length > 0 && (
        <>
          <div className="intonation-phase-label">
            {melodyPhase === 'listen'
              ? t('intonation.listen' as TranslationKey, lang)
              : t('intonation.yourTurn' as TranslationKey, lang)}
          </div>
          <div className="intonation-melody-notes">
            {melody.map((n, i) => (
              <span key={i} className={`intonation-melody-note ${currentMelodyIdx === i ? 'active' : ''} ${i % 4 === 0 ? 'bar-start' : ''}`}>
                {n.name.replace(/\d/, '')}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Pitch display — always rendered to prevent layout shift */}
      {isPlaying && !isCountIn && (
        <div className="intonation-pitch-display">
          <div className={`intonation-detected-note ${singing && lastRating ? `rating-${lastRating}` : ''}`}
            style={{ visibility: singing ? 'visible' : 'hidden' }}>
            {detectedNote || ' '}
          </div>
          <div className={`intonation-cents ${centsOffset > 0 ? 'sharp' : centsOffset < 0 ? 'flat' : ''}`}
            style={{ visibility: singing ? 'visible' : 'hidden' }}>
            {centsOffset > 0 ? '+' : ''}{centsOffset}¢
          </div>
          {!singing && (
            <div className="intonation-waiting-overlay">{t('intonation.sing' as TranslationKey, lang)}</div>
          )}
        </div>
      )}

      {/* Pitch meter */}
      {isPlaying && !isCountIn && (
        <div className="intonation-meter">
          <div className="intonation-meter-zones">
            <div className="intonation-meter-zone zone-off" style={{ flex: 3 }} />
            <div className="intonation-meter-zone zone-good" style={{ flex: 2 }} />
            <div className="intonation-meter-zone zone-great" style={{ flex: 1.5 }} />
            <div className="intonation-meter-zone zone-perfect" style={{ flex: 1 }} />
            <div className="intonation-meter-zone zone-great" style={{ flex: 1.5 }} />
            <div className="intonation-meter-zone zone-good" style={{ flex: 2 }} />
            <div className="intonation-meter-zone zone-off" style={{ flex: 3 }} />
          </div>
          <div className="intonation-meter-needle"
            style={{
              left: `${50 + Math.max(-49, Math.min(49, (centsOffset / (THRESHOLDS.good * 1.4)) * 49))}%`,
              opacity: singing ? 1 : 0.15,
            }} />
          <div className="intonation-meter-labels">
            <span>{t('intonation.flat' as TranslationKey, lang)}</span>
            <span>{t('intonation.sharp' as TranslationKey, lang)}</span>
          </div>
        </div>
      )}

      {/* Stats — always rendered once playing, visibility toggled */}
      {isPlaying && !isCountIn && (
        <div className="pocket-stats" style={{ visibility: totalChecks > 0 ? 'visible' : 'hidden' }}>
          <div className="pocket-stat">
            <div className="pocket-stat-val">{streak}</div>
            <div className="pocket-stat-lbl">{t('pocket.streak' as TranslationKey, lang)}</div>
          </div>
          <div className="pocket-stat">
            <div className="pocket-stat-val">{accuracy}%</div>
            <div className="pocket-stat-lbl">{t('pocket.accuracy' as TranslationKey, lang)}</div>
          </div>
          <div className="pocket-stat">
            <div className={`pocket-stat-val ${Math.abs(avgCents) <= 10 ? 'in-pocket' : avgCents > 0 ? 'dragging' : 'rushing'}`}>
              {Math.abs(avgCents) <= 10 ? t('intonation.inTune' as TranslationKey, lang) : `${avgCents > 0 ? '+' : ''}${avgCents}¢`}
            </div>
            <div className="pocket-stat-lbl">{t('pocket.tendency' as TranslationKey, lang)}</div>
          </div>
        </div>
      )}

      <div className="intonation-actions">
        <button className={`btn btn-play pocket-go ${isPlaying ? 'stopping' : ''}`}
          onClick={isPlaying ? stop : start}>
          {isPlaying ? t('pocket.stop' as TranslationKey, lang) : t('pocket.start' as TranslationKey, lang)}
        </button>
        {isPlaying && (
          <button className="btn btn-secondary intonation-new-melody" onClick={togglePause}>
            {isPaused ? t('intonation.resume' as TranslationKey, lang) : t('intonation.pause' as TranslationKey, lang)}
          </button>
        )}
        {gameMode === 'melody' && (isPlaying || melody.length > 0) && (
          <button className="btn btn-secondary intonation-new-melody" onClick={() => {
            if (isPlaying) stop();
            const prog = buildProgression(rootPc, mode, selectedProg);
            const mel = generateMelody(prog, rootPc, scaleRef.current);
            progRef.current = prog;
            setProgression(prog);
            melodyRef.current = mel;
            setMelody(mel);
          }}>
            {t('intonation.newMelody' as TranslationKey, lang)}
          </button>
        )}
      </div>

      {!isPlaying && totalChecks > 0 && (
        <div className="pocket-summary">
          <h3>{t('pocket.sessionSummary' as TranslationKey, lang)}</h3>
          <div className="pocket-summary-grid">
            <div className="pocket-summary-item">
              <div className="pocket-summary-val">{score.toLocaleString()}</div>
              <div className="pocket-summary-lbl">{t('pocket.finalScore' as TranslationKey, lang)}</div>
            </div>
            <div className="pocket-summary-item">
              <div className="pocket-summary-val">{maxStreak}</div>
              <div className="pocket-summary-lbl">{t('pocket.maxStreak' as TranslationKey, lang)}</div>
            </div>
            <div className="pocket-summary-item">
              <div className="pocket-summary-val">{accuracy}%</div>
              <div className="pocket-summary-lbl">{t('pocket.accuracy' as TranslationKey, lang)}</div>
            </div>
            {recentCents.length > 0 && (
              <div className="pocket-summary-item">
                <div className="pocket-summary-val">{avgCents > 0 ? '+' : ''}{avgCents}¢</div>
                <div className="pocket-summary-lbl">{t('intonation.avgCents' as TranslationKey, lang)}</div>
              </div>
            )}
          </div>
        </div>
      )}
      {showTips && (
        <div className="intonation-tips-overlay" onClick={() => setShowTips(false)}>
          <div className="intonation-tips-modal" onClick={e => e.stopPropagation()}>
            <button className="intonation-tips-close" onClick={() => setShowTips(false)}>✕</button>
            <h3>{t('intonation.tips' as TranslationKey, lang)}</h3>
            <ul className="intonation-tips-list">
              <li><strong>{t('intonation.tip1.title' as TranslationKey, lang)}</strong> — {t('intonation.tip1.desc' as TranslationKey, lang)}</li>
              <li><strong>{t('intonation.tip2.title' as TranslationKey, lang)}</strong> — {t('intonation.tip2.desc' as TranslationKey, lang)}</li>
              <li><strong>{t('intonation.tip3.title' as TranslationKey, lang)}</strong> — {t('intonation.tip3.desc' as TranslationKey, lang)}</li>
              <li><strong>{t('intonation.tip4.title' as TranslationKey, lang)}</strong> — {t('intonation.tip4.desc' as TranslationKey, lang)}</li>
              <li><strong>{t('intonation.tip5.title' as TranslationKey, lang)}</strong> — {t('intonation.tip5.desc' as TranslationKey, lang)}</li>
              <li><strong>{t('intonation.tip6.title' as TranslationKey, lang)}</strong> — {t('intonation.tip6.desc' as TranslationKey, lang)}</li>
              <li><strong>{t('intonation.tip7.title' as TranslationKey, lang)}</strong> — {t('intonation.tip7.desc' as TranslationKey, lang)}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
