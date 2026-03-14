import { useState } from 'react';
import type { InstrumentName } from '../types';
import type { SecondaryDominantInfo, SecDomSound } from '../utils/music';
import {
  getSecondaryDominants,
  buildSecDomProgression,
} from '../utils/music';
import {
  ensureAudioContext,
  playProgressionWithExtensions,
} from '../utils/audio';

interface Props {
  instrument: InstrumentName;
}

// Circle of fifths order starting from top (C), going clockwise
const CIRCLE_NOTES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Scale intervals in semitones
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

type KeyQuality = 'major' | 'minor';

// Determine if a sec dom target is minor from its intervals
function isTargetMinor(secDom: SecondaryDominantInfo): boolean {
  const intervals = secDom.targetIntervals.map(i => (i - secDom.targetIntervals[0]) % 12);
  return intervals.includes(3) && !intervals.includes(4);
}

// Sound colors
const SOUND_COLORS: Record<SecDomSound, string> = {
  'Mixolydian': '#4db6ac',
  'Lydian Dominant': '#ffb74d',
  'Altered': '#e57373',
  'Whole Tone': '#9575cd',
  'Rainbow': '#ffffff',
};

const ALL_SEC_DOMS = getSecondaryDominants('hard');

// Get position on circle for a given note
function notePosition(note: string, radius: number): { x: number; y: number } {
  let idx = CIRCLE_NOTES.indexOf(note);
  if (idx === -1) {
    const alt = note === 'Gb' ? 'F#' : note;
    idx = CIRCLE_NOTES.indexOf(alt);
  }
  const angle = (idx * 30 - 90) * (Math.PI / 180);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

// Get note name from semitone offset relative to key
function noteName(keySemi: number, intervalSemi: number): string {
  return NOTE_NAMES[(keySemi + intervalSemi) % 12];
}

// Build arrow path between two points with a curve
function curvedArrow(
  from: { x: number; y: number },
  to: { x: number; y: number },
  curvature: number = 0.3,
): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

// Shorten a point toward the center by a given amount
function shorten(point: { x: number; y: number }, amount: number): { x: number; y: number } {
  const dist = Math.sqrt(point.x ** 2 + point.y ** 2);
  const scale = (dist - amount) / dist;
  return { x: point.x * scale, y: point.y * scale };
}

export default function CircleOfFifths({ instrument }: Props) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [hoveredArrow, setHoveredArrow] = useState<string | null>(null);
  const [keySemi, setKeySemi] = useState(0);
  const [keyQuality, setKeyQuality] = useState<KeyQuality>('major');

  const keyName = NOTE_NAMES[keySemi];
  const scale = keyQuality === 'minor' ? MINOR_SCALE : MAJOR_SCALE;

  // Compute diatonic notes for the current key
  const diatonicSet = new Set(scale.map(i => NOTE_NAMES[(keySemi + i) % 12]));

  // MIDI root for playback (keep in octave 3)
  const rootMidi = 48 + keySemi;

  const handlePlay = async (secDom: SecondaryDominantInfo) => {
    if (playing) return;
    const id = secDom.label;
    setPlaying(id);
    await ensureAudioContext();

    const prog = buildSecDomProgression('hard', secDom, rootMidi);
    await playProgressionWithExtensions(
      prog.chords, instrument,
      prog.secDomIndex, prog.secDomExtensions, 75,
    );

    // After playback, change key to the target (respecting major/minor)
    const targetSemi = (keySemi + secDom.targetIntervals[0]) % 12;
    const targetQuality: KeyQuality = isTargetMinor(secDom) ? 'minor' : 'major';
    setTimeout(() => {
      setPlaying(null);
      setKeySemi(targetSemi);
      setKeyQuality(targetQuality);
    }, 9800);
  };

  const R = 150;
  const NODE_R = 20;

  const isTritone = (sd: SecondaryDominantInfo) => sd.label.startsWith('SubV7');

  // Get chord root and target note names relative to current key
  const chordRootName = (sd: SecondaryDominantInfo) => noteName(keySemi, sd.dominantIntervals[0]);
  const targetRootName = (sd: SecondaryDominantInfo) => noteName(keySemi, sd.targetIntervals[0]);

  return (
    <div className="cof-container">
      <div className="cof-key-label">
        Key: <strong>{keyName} {keyQuality}</strong>
        {(keySemi !== 0 || keyQuality !== 'major') && (
          <button className="btn cof-reset-btn" onClick={() => { setKeySemi(0); setKeyQuality('major'); }}>
            Reset to C
          </button>
        )}
      </div>
      <svg viewBox="-220 -220 440 440" className="cof-svg">
        <defs>
          {Object.entries(SOUND_COLORS).map(([sound, color]) => (
            <marker
              key={sound}
              id={`arrow-${sound.replace(/\s/g, '')}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
          <marker
            id="arrow-hover"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
          </marker>
        </defs>

        {/* Faint circle */}
        <circle cx="0" cy="0" r={R} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.4" />

        {/* Tritone relationship lines (faint) */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const p1 = notePosition(CIRCLE_NOTES[i], R);
          const p2 = notePosition(CIRCLE_NOTES[i + 6], R);
          return (
            <line
              key={`tritone-${i}`}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.25"
            />
          );
        })}

        {/* Resolution arrows */}
        {ALL_SEC_DOMS.map(sd => {
          const fromNote = chordRootName(sd);
          const toNote = targetRootName(sd);
          const from = shorten(notePosition(fromNote, R), NODE_R + 4);
          const to = shorten(notePosition(toNote, R), NODE_R + 4);
          const color = SOUND_COLORS[sd.sound];
          const isHovered = hoveredArrow === sd.label;
          const isPlaying_ = playing === sd.label;
          const curvature = isTritone(sd) ? 0.15 : 0.25;

          return (
            <g key={sd.label}>
              <path
                d={curvedArrow(from, to, curvature)}
                fill="none"
                stroke={isHovered || isPlaying_ ? 'white' : color}
                strokeWidth={isHovered || isPlaying_ ? 3 : 2}
                opacity={isHovered || isPlaying_ ? 1 : 0.6}
                markerEnd={`url(#arrow-${isHovered || isPlaying_ ? 'hover' : sd.sound.replace(/\s/g, '')})`}
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={() => setHoveredArrow(sd.label)}
                onMouseLeave={() => setHoveredArrow(null)}
                onClick={() => handlePlay(sd)}
              />
              <path
                d={curvedArrow(from, to, curvature)}
                fill="none"
                stroke="transparent"
                strokeWidth="14"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredArrow(sd.label)}
                onMouseLeave={() => setHoveredArrow(null)}
                onClick={() => handlePlay(sd)}
              />
            </g>
          );
        })}

        {/* Note nodes */}
        {CIRCLE_NOTES.map(note => {
          const pos = notePosition(note, R);
          const isDiatonic = diatonicSet.has(note);
          const isKey = note === keyName;

          return (
            <g key={note}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_R}
                fill={isKey ? 'var(--primary)' : isDiatonic ? 'var(--bg-hover)' : 'var(--bg)'}
                stroke={isKey ? 'var(--primary)' : isDiatonic ? 'var(--text-muted)' : 'var(--border)'}
                strokeWidth={isKey ? 2.5 : 1.5}
                style={{ transition: 'all 0.5s ease' }}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isKey ? 'white' : isDiatonic ? 'var(--text)' : 'var(--text-muted)'}
                fontSize={isKey ? '13' : '11'}
                fontWeight={isDiatonic ? '700' : '400'}
                fontFamily="Inter, -apple-system, sans-serif"
                style={{ transition: 'all 0.5s ease' }}
              >
                {note}
              </text>
            </g>
          );
        })}

        {/* Center tooltip */}
        {hoveredArrow && (() => {
          const sd = ALL_SEC_DOMS.find(s => s.label === hoveredArrow);
          if (!sd) return null;
          return (
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text)"
              fontSize="12"
              fontWeight="600"
              fontFamily="Inter, -apple-system, sans-serif"
            >
              <tspan x="0" dy="-8" fill={SOUND_COLORS[sd.sound]}>{sd.label}</tspan>
              <tspan x="0" dy="18" fontSize="11" fill="var(--text-muted)">
                {chordRootName(sd)}7 → {targetRootName(sd)}
              </tspan>
            </text>
          );
        })()}
        {!hoveredArrow && (
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-muted)"
            fontSize="10"
            fontFamily="Inter, -apple-system, sans-serif"
          >
            <tspan x="0" dy="-4">click an arrow</tspan>
            <tspan x="0" dy="14">to hear it</tspan>
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="cof-legend">
        {Object.entries(SOUND_COLORS).filter(([s]) => s !== 'Rainbow').map(([sound, color]) => (
          <div key={sound} className="cof-legend-item">
            <span className="cof-legend-swatch" style={{ background: color }} />
            <span>{sound}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
