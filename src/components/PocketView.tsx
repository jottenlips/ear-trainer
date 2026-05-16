import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';
import type { TranslationKey } from '../i18n/translations';

type HitRating = 'perfect' | 'great' | 'good' | 'miss';
type Subdivision = 'quarter' | 'eighth' | 'triplet' | 'sixteenth';

interface ExpectedBeat {
  time: number;
  hit: boolean;
}

const THRESHOLDS = { perfect: 25, great: 50, good: 85 };
const POINTS: Record<HitRating, number> = { perfect: 100, great: 50, good: 25, miss: 0 };

function getRating(offsetMs: number): HitRating {
  const abs = Math.abs(offsetMs);
  if (abs <= THRESHOLDS.perfect) return 'perfect';
  if (abs <= THRESHOLDS.great) return 'great';
  if (abs <= THRESHOLDS.good) return 'good';
  return 'miss';
}

function getMultiplier(streak: number): number {
  if (streak >= 30) return 4;
  if (streak >= 20) return 3;
  if (streak >= 10) return 2;
  return 1;
}

function getSubdivOffsets(subdiv: Subdivision, qDur: number, swingPct: number): number[] {
  switch (subdiv) {
    case 'quarter': return [];
    case 'eighth': return [qDur * (swingPct / 100)];
    case 'triplet': return [qDur / 3, (2 * qDur) / 3];
    case 'sixteenth': return [qDur / 4, qDur / 2, (3 * qDur) / 4];
  }
}

function getMinGap(subdiv: Subdivision, qDur: number, swingPct: number): number {
  switch (subdiv) {
    case 'quarter': return qDur;
    case 'eighth': return qDur * Math.min(swingPct / 100, 1 - swingPct / 100);
    case 'triplet': return qDur / 3;
    case 'sixteenth': return qDur / 4;
  }
}

function TripletIcon() {
  return (
    <svg width="28" height="26" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      {/* Stems go UP from note heads (stems on right side of head) */}
      <line x1="7" y1="4" x2="7" y2="16" stroke="currentColor" strokeWidth="1.5" />
      <line x1="17" y1="4" x2="17" y2="16" stroke="currentColor" strokeWidth="1.5" />
      <line x1="27" y1="4" x2="27" y2="16" stroke="currentColor" strokeWidth="1.5" />
      {/* Note heads at bottom, left of stems */}
      <ellipse cx="5.5" cy="17" rx="3" ry="2.2" fill="currentColor" transform="rotate(-15 5.5 17)" />
      <ellipse cx="15.5" cy="17" rx="3" ry="2.2" fill="currentColor" transform="rotate(-15 15.5 17)" />
      <ellipse cx="25.5" cy="17" rx="3" ry="2.2" fill="currentColor" transform="rotate(-15 25.5 17)" />
      {/* Beam across tops of stems */}
      <rect x="6.5" y="2.5" width="21" height="2.5" rx="0.5" fill="currentColor" />
      {/* Bracket above beam */}
      <path d="M7 1.5 Q17 -1 27 1.5" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* "3" label */}
      <text x="17" y="1.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="currentColor"
        style={{ background: 'white' }}>3</text>
    </svg>
  );
}

export default function PocketView() {
  const { lang } = useLanguage();

  const [bpm, setBpm] = useState(100);
  const [swingPercent, setSwingPercent] = useState(50);
  const [subdivision, setSubdivision] = useState<Subdivision>('quarter');
  const [sensitivity, setSensitivity] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCountIn, setIsCountIn] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lastRating, setLastRating] = useState<HitRating | null>(null);
  const [lastOffsetMs, setLastOffsetMs] = useState(0);
  const [ratingKey, setRatingKey] = useState(0);
  const [totalExpected, setTotalExpected] = useState(0);
  const [totalHit, setTotalHit] = useState(0);
  const [recentOffsets, setRecentOffsets] = useState<number[]>([]);
  const [micError, setMicError] = useState('');

  const acRef = useRef<AudioContext | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const schedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);
  const nextBeatRef = useRef(0);
  const beatCountRef = useRef(0);
  const expectedRef = useRef<ExpectedBeat[]>([]);
  const lastOnsetRef = useRef(0);
  const prevRmsRef = useRef(0);
  const countInRef = useRef(0);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const maxStreakRef = useRef(0);
  const bpmRef = useRef(bpm);
  const swingRef = useRef(swingPercent);
  const subdivRef = useRef(subdivision);
  const sensRef = useRef(sensitivity);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { swingRef.current = swingPercent; }, [swingPercent]);
  useEffect(() => { subdivRef.current = subdivision; }, [subdivision]);
  useEffect(() => { sensRef.current = sensitivity; }, [sensitivity]);

  const cleanup = useCallback(() => {
    playingRef.current = false;
    if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null; }
    if (detectRef.current) { clearInterval(detectRef.current); detectRef.current = null; }
    if (micRef.current) { micRef.current.getTracks().forEach(tr => tr.stop()); micRef.current = null; }
    if (acRef.current) { acRef.current.close().catch(() => {}); acRef.current = null; }
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const playClick = useCallback((ac: AudioContext, time: number, type: 'accent' | 'beat' | 'subdiv') => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = type === 'accent' ? 1500 : type === 'beat' ? 1000 : 800;
    const vol = type === 'accent' ? 0.25 : type === 'beat' ? 0.12 : 0.06;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const scheduler = useCallback(() => {
    const ac = acRef.current;
    if (!ac || !playingRef.current) return;

    const lookahead = 0.1;
    const qDur = 60 / bpmRef.current;

    while (nextBeatRef.current < ac.currentTime + lookahead) {
      const beatTime = nextBeatRef.current;
      const bi = beatCountRef.current % 4;

      // Quarter note click (always)
      playClick(ac, beatTime, bi === 0 ? 'accent' : 'beat');

      // Subdivision clicks
      const offsets = getSubdivOffsets(subdivRef.current, qDur, swingRef.current);
      for (const off of offsets) {
        playClick(ac, beatTime + off, 'subdiv');
      }

      // UI update
      const delay = Math.max(0, (beatTime - ac.currentTime) * 1000);
      const beat = bi;
      const cin = countInRef.current;
      setTimeout(() => {
        setCurrentBeat(beat);
        if (cin < 4) setIsCountIn(true);
      }, delay);

      // Count-in vs scoring
      if (countInRef.current < 4) {
        countInRef.current++;
        if (countInRef.current === 4) {
          setTimeout(() => setIsCountIn(false), delay);
        }
      } else {
        // Record all expected positions for this beat
        expectedRef.current.push({ time: beatTime, hit: false });
        for (const off of offsets) {
          expectedRef.current.push({ time: beatTime + off, hit: false });
        }
      }

      nextBeatRef.current += qDur;
      beatCountRef.current++;
    }

    // Clean up old expected beats — no penalty for not playing
    const now = ac.currentTime;
    const beats = expectedRef.current;
    while (beats.length > 0 && now - beats[0].time > 1) {
      beats.shift();
    }
  }, [playClick]);

  const detector = useCallback(() => {
    const ac = acRef.current;
    const analyser = analyserRef.current;
    if (!ac || !analyser || !playingRef.current || countInRef.current < 4) return;

    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);

    const threshold = 0.08 * Math.pow(10, -sensRef.current / 50);
    const now = ac.currentTime;
    const delta = rms - prevRmsRef.current;

    // Short universal debounce — lets ghost notes pass without blocking real onsets
    if (rms > threshold && delta > threshold * 0.3 && now - lastOnsetRef.current > 0.03) {
      lastOnsetRef.current = now;

      // Find nearest unhit expected beat
      let nearest: ExpectedBeat | null = null;
      let nearestDist = Infinity;
      for (const b of expectedRef.current) {
        if (b.hit) continue;
        const d = Math.abs(now - b.time);
        if (d < nearestDist) { nearestDist = d; nearest = b; }
      }

      // Match window: tight to the subdivision so in-between notes are ignored
      const qDur = 60 / bpmRef.current;
      const gap = getMinGap(subdivRef.current, qDur, swingRef.current);
      const maxW = gap * 0.45;

      if (nearest && nearestDist < maxW) {
        nearest.hit = true;
        const offsetMs = Math.round((now - nearest.time) * 1000);
        const rating = getRating(offsetMs);

        if (rating !== 'miss') {
          streakRef.current++;
        } else {
          streakRef.current = 0;
        }

        const mult = getMultiplier(streakRef.current);
        scoreRef.current += POINTS[rating] * mult;
        if (streakRef.current > maxStreakRef.current) maxStreakRef.current = streakRef.current;

        setScore(scoreRef.current);
        setStreak(streakRef.current);
        setMaxStreak(maxStreakRef.current);
        setLastRating(rating);
        setLastOffsetMs(offsetMs);
        setRatingKey(prev => prev + 1);
        setTotalExpected(prev => prev + 1);
        if (rating !== 'miss') setTotalHit(prev => prev + 1);
        setRecentOffsets(prev => [...prev, offsetMs].slice(-20));
      }
      // Onsets outside the match window are silently ignored — no penalty
    }

    if (rms > prevRmsRef.current) {
      prevRmsRef.current = rms;
    } else {
      prevRmsRef.current = prevRmsRef.current * 0.92 + rms * 0.08;
    }
  }, []);

  const start = async () => {
    if (playingRef.current) return;
    setMicError('');

    let ac: AudioContext | null = null;
    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('denied') || msg.includes('dismissed') || msg.includes('NotAllowedError')) {
        setMicError(t('pocket.micError' as TranslationKey, lang));
      } else {
        setMicError(t('pocket.micError' as TranslationKey, lang) + (msg ? ` (${msg})` : ''));
      }
      return;
    }

    try {
      ac = new AudioContext();
      if (ac.state === 'suspended') await ac.resume();

      acRef.current = ac;
      micRef.current = stream;

      const source = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;

      scoreRef.current = 0; streakRef.current = 0; maxStreakRef.current = 0;
      countInRef.current = 0; beatCountRef.current = 0;
      expectedRef.current = []; lastOnsetRef.current = 0; prevRmsRef.current = 0;

      setScore(0); setStreak(0); setMaxStreak(0);
      setLastRating(null); setLastOffsetMs(0);
      setTotalExpected(0); setTotalHit(0);
      setRecentOffsets([]); setCurrentBeat(-1);
      setIsCountIn(true);

      nextBeatRef.current = ac.currentTime + 0.1;
      playingRef.current = true;
      setIsPlaying(true);

      schedRef.current = setInterval(scheduler, 25);
      detectRef.current = setInterval(detector, 10);
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
  }, [cleanup]);

  const tendency = recentOffsets.length >= 3
    ? recentOffsets.reduce((a, b) => a + b, 0) / recentOffsets.length
    : 0;
  const accuracyPct = totalExpected > 0 ? Math.round((totalHit / totalExpected) * 100) : 0;
  const multiplier = getMultiplier(streak);
  const swingApplies = subdivision === 'eighth';

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

      <div className="pocket-title">
        <h2>{t('pocket.title' as TranslationKey, lang)}</h2>
        <p>{t('pocket.subtitle' as TranslationKey, lang)}</p>
      </div>

      <div className="pocket-warning">
        {t('pocket.warning' as TranslationKey, lang)}
      </div>

      {micError && <div className="pocket-error">{micError}</div>}

      <div className="pocket-controls">
        <div className="pocket-control">
          <label>{t('pocket.bpm' as TranslationKey, lang)}: <strong>{bpm}</strong></label>
          <input type="range" min={40} max={220} value={bpm}
            onChange={e => setBpm(+e.target.value)} disabled={isPlaying} />
        </div>
        <div className="pocket-control">
          <label>
            {t('pocket.swing' as TranslationKey, lang)}: <strong>{swingApplies ? `${swingPercent}%` : '—'}</strong>
            {swingApplies && (
              <span className="pocket-swing-tag">
                {swingPercent === 50
                  ? t('pocket.straight' as TranslationKey, lang)
                  : swingPercent >= 65
                    ? t('pocket.triplet' as TranslationKey, lang)
                    : t('pocket.light' as TranslationKey, lang)}
              </span>
            )}
          </label>
          <input type="range" min={50} max={75} value={swingPercent}
            onChange={e => setSwingPercent(+e.target.value)}
            disabled={isPlaying || !swingApplies} />
        </div>
        <div className="pocket-control">
          <label>{t('pocket.subdivision' as TranslationKey, lang)}:</label>
          <div className="pocket-subdiv">
            {(['quarter', 'eighth', 'triplet', 'sixteenth'] as Subdivision[]).map(s => (
              <button key={s}
                className={`btn btn-secondary pocket-subdiv-btn ${subdivision === s ? 'active' : ''}`}
                onClick={() => setSubdivision(s)} disabled={isPlaying}>
                {s === 'triplet' ? <TripletIcon /> : t(`pocket.sub.${s}` as TranslationKey, lang)}
              </button>
            ))}
          </div>
        </div>
        <div className="pocket-control">
          <label>{t('pocket.sensitivity' as TranslationKey, lang)}</label>
          <input type="range" min={10} max={90} value={sensitivity}
            onChange={e => setSensitivity(+e.target.value)} />
        </div>
      </div>

      <p className="pocket-tolerance-hint">
        {t('pocket.toleranceHint' as TranslationKey, lang)}
      </p>

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

      {isPlaying && !isCountIn && lastRating && (
        <div className="pocket-feedback" key={ratingKey}>
          <div className={`pocket-rating ${lastRating}`}>
            {lastRating.toUpperCase()}!
          </div>
          {lastRating !== 'miss' && (
            <div className={`pocket-offset ${lastOffsetMs > 0 ? 'late' : 'early'}`}>
              {lastOffsetMs > 0 ? '+' : ''}{lastOffsetMs}ms
              {Math.abs(lastOffsetMs) > 10 && (
                <span className="pocket-offset-label">
                  {lastOffsetMs > 0
                    ? ` (${t('pocket.dragging' as TranslationKey, lang).toLowerCase()})`
                    : ` (${t('pocket.rushing' as TranslationKey, lang).toLowerCase()})`}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {isPlaying && !isCountIn && (
        <div className="pocket-timing">
          <div className="pocket-timing-track">
            <div className="pocket-timing-center" />
            {lastRating && lastRating !== 'miss' && (
              <div className={`pocket-timing-dot ${lastRating}`}
                style={{ left: `${50 + Math.max(-45, Math.min(45, (lastOffsetMs / THRESHOLDS.good) * 45))}%` }} />
            )}
          </div>
          <div className="pocket-timing-labels">
            <span>{t('pocket.rushing' as TranslationKey, lang)}</span>
            <span>{t('pocket.dragging' as TranslationKey, lang)}</span>
          </div>
        </div>
      )}

      {isPlaying && !isCountIn && totalExpected > 0 && (
        <div className="pocket-stats">
          <div className="pocket-stat">
            <div className="pocket-stat-val">{streak}</div>
            <div className="pocket-stat-lbl">{t('pocket.streak' as TranslationKey, lang)}</div>
          </div>
          <div className="pocket-stat">
            <div className="pocket-stat-val">{accuracyPct}%</div>
            <div className="pocket-stat-lbl">{t('pocket.accuracy' as TranslationKey, lang)}</div>
          </div>
          <div className="pocket-stat">
            <div className={`pocket-stat-val ${Math.abs(tendency) < 10 ? 'in-pocket' : tendency > 0 ? 'dragging' : 'rushing'}`}>
              {Math.abs(tendency) < 10
                ? t('pocket.inThePocket' as TranslationKey, lang)
                : tendency > 0
                  ? `+${Math.round(tendency)}ms`
                  : `${Math.round(tendency)}ms`}
            </div>
            <div className="pocket-stat-lbl">{t('pocket.tendency' as TranslationKey, lang)}</div>
          </div>
        </div>
      )}

      <button className={`btn btn-play pocket-go ${isPlaying ? 'stopping' : ''}`}
        onClick={isPlaying ? stop : start}>
        {isPlaying
          ? t('pocket.stop' as TranslationKey, lang)
          : t('pocket.start' as TranslationKey, lang)}
      </button>

      {!isPlaying && totalExpected > 0 && (
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
              <div className="pocket-summary-val">{accuracyPct}%</div>
              <div className="pocket-summary-lbl">{t('pocket.accuracy' as TranslationKey, lang)}</div>
            </div>
            {recentOffsets.length > 0 && (
              <div className="pocket-summary-item">
                <div className="pocket-summary-val">
                  {Math.round(recentOffsets.reduce((a, b) => a + b, 0) / recentOffsets.length)}ms
                </div>
                <div className="pocket-summary-lbl">{t('pocket.avgOffset' as TranslationKey, lang)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
