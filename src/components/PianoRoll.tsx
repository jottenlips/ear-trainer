// SVG piano keyboard (2 octaves) showing highlighted notes

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const IS_BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];

// Interval labels
const EXT_LABELS: Record<number, string> = {
  0: 'R', 1: 'b9', 2: '9', 3: '#9', 4: '3', 5: '11', 6: '#11',
  7: '5', 8: 'b13', 9: '13', 10: 'b7', 11: '7',
};
const SIMPLE_LABELS: Record<number, string> = {
  0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5',
  7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7',
};

interface Props {
  scalePcs?: Set<number>;
  chordPcs?: Set<number>;
  rootPc?: number;
  color?: string;
  /** Actual MIDI note numbers to highlight (shows exact voicing, auto-sizes octaves) */
  midiNotes?: number[];
  /** Use simple chord-tone labels (b3, b5, 6) instead of extension labels (#9, #11, 13) */
  simpleLabels?: boolean;
}

export default function PianoRoll({ scalePcs, chordPcs, rootPc, color = '#4a8525', midiNotes, simpleLabels }: Props) {
  const INTERVAL_LABELS = simpleLabels ? SIMPLE_LABELS : EXT_LABELS;
  // Auto-size octaves: 2 by default, 3 if midiNotes span > 23 semitones
  const OCTAVES = midiNotes && midiNotes.length > 0
    && (Math.max(...midiNotes) - Math.min(...midiNotes)) > 23 ? 3 : 2;

  // If midiNotes provided, compute the starting octave's C (MIDI)
  const startMidi = midiNotes && midiNotes.length > 0
    ? (() => {
        const lo = Math.min(...midiNotes);
        const hi = Math.max(...midiNotes);
        let start = Math.floor(lo / 12) * 12;
        const range = OCTAVES * 12 - 1; // available semitone range
        if (hi > start + range) start = Math.floor(hi / 12) * 12 - (OCTAVES - 1) * 12;
        return start;
      })()
    : undefined;

  // Build a set of actual MIDI notes for exact voicing matching
  const midiNoteSet = midiNotes ? new Set(midiNotes) : undefined;
  const WHITE_W = 22;
  const WHITE_H = 80;
  const BLACK_W = 14;
  const BLACK_H = 50;

  // Build white and black key positions
  const whiteKeys: { pc: number; midi: number; x: number; noteName: string }[] = [];
  const blackKeys: { pc: number; midi: number; x: number; noteName: string }[] = [];

  let whiteIdx = 0;
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (let i = 0; i < 12; i++) {
      const pc = (i) % 12;
      const midi = startMidi !== undefined ? startMidi + oct * 12 + i : i;
      if (!IS_BLACK[i]) {
        whiteKeys.push({ pc, midi, x: whiteIdx * WHITE_W, noteName: NOTE_NAMES[pc] });
        whiteIdx++;
      }
    }
  }
  // Add final C
  const finalMidi = startMidi !== undefined ? startMidi + OCTAVES * 12 : 0;
  whiteKeys.push({ pc: 0, midi: finalMidi, x: whiteIdx * WHITE_W, noteName: 'C' });

  whiteIdx = 0;
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (let i = 0; i < 12; i++) {
      const pc = (i) % 12;
      const midi = startMidi !== undefined ? startMidi + oct * 12 + i : i;
      if (!IS_BLACK[i]) {
        whiteIdx++;
      } else {
        const x = (whiteIdx - 1) * WHITE_W + WHITE_W - BLACK_W / 2;
        blackKeys.push({ pc, midi, x, noteName: NOTE_NAMES[pc] });
      }
    }
  }

  const totalW = (whiteKeys.length) * WHITE_W;
  const totalH = WHITE_H + 20;

  // When midiNotes provided, match exact MIDI values; otherwise match pitch classes
  const getHighlight = (pc: number, midi: number) => {
    const isChord = midiNoteSet ? midiNoteSet.has(midi) : chordPcs?.has(pc);
    const isScale = midiNoteSet ? false : scalePcs?.has(pc);
    const isRoot = rootPc !== undefined && pc === rootPc;
    return { isChord, isScale, isRoot };
  };

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="piano-roll-svg"
      style={{ width: '100%', maxWidth: 500 }}
    >
      {/* White keys */}
      {whiteKeys.map((key, i) => {
        const { isChord, isScale, isRoot } = getHighlight(key.pc, key.midi);
        const fill = isChord ? color
          : isScale ? 'var(--bg-hover)'
          : 'white';
        return (
          <g key={`w${i}`}>
            <rect
              x={key.x} y={0}
              width={WHITE_W - 1} height={WHITE_H}
              fill={fill}
              stroke="var(--border)"
              strokeWidth={1}
              rx={2}
            />
            {isChord && rootPc !== undefined && (
              <text
                x={key.x + WHITE_W / 2 - 0.5}
                y={WHITE_H - 8}
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill={isRoot ? 'white' : 'rgba(255,255,255,0.9)'}
                fontFamily="Arial, sans-serif"
              >
                {INTERVAL_LABELS[((key.pc - rootPc + 12) % 12)]}
              </text>
            )}
            {isScale && !isChord && (
              <circle
                cx={key.x + WHITE_W / 2 - 0.5}
                cy={WHITE_H - 10}
                r={3}
                fill="var(--text-muted)"
                opacity={0.4}
              />
            )}
          </g>
        );
      })}

      {/* Black keys */}
      {blackKeys.map((key, i) => {
        const { isChord, isScale } = getHighlight(key.pc, key.midi);
        const fill = isChord ? color
          : isScale ? 'var(--text-muted)'
          : '#333';
        return (
          <g key={`b${i}`}>
            <rect
              x={key.x} y={0}
              width={BLACK_W} height={BLACK_H}
              fill={fill}
              stroke="#222"
              strokeWidth={1}
              rx={2}
            />
            {isChord && rootPc !== undefined && (
              <text
                x={key.x + BLACK_W / 2}
                y={BLACK_H - 6}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="white"
                fontFamily="Arial, sans-serif"
              >
                {INTERVAL_LABELS[((key.pc - rootPc + 12) % 12)]}
              </text>
            )}
          </g>
        );
      })}

      {/* Note names below */}
      {whiteKeys.map((key, i) => {
        const { isChord } = getHighlight(key.pc, key.midi);
        return (
          <text
            key={`n${i}`}
            x={key.x + WHITE_W / 2 - 0.5}
            y={WHITE_H + 13}
            textAnchor="middle"
            fontSize="8"
            fill={isChord ? color : 'var(--text-muted)'}
            fontWeight={isChord ? '700' : '400'}
            fontFamily="Arial, sans-serif"
          >
            {key.noteName}
          </text>
        );
      })}
    </svg>
  );
}
