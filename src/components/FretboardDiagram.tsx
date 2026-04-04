// SVG guitar fretboard diagram showing highlighted notes
// Standard tuning: E2(40), A2(45), D3(50), G3(55), B3(59), E4(64)
// Shows frets 0-9 (open position through 9th fret)

const OPEN_STRINGS = [40, 45, 50, 55, 59, 64]; // string 6 to 1 (index 0=low E, 5=high E)

const START_FRET = 0;
const END_FRET = 12;

// Fret markers (dots) - only on fretted positions, not open
const FRET_MARKERS = [3, 5, 7, 9, 12].filter(f => f > START_FRET && f <= END_FRET);

/**
 * Find a playable guitar voicing for a chord.
 * Bass note (first pc) is fixed on the lowest string used.
 * Upper notes can be reordered freely — only requirement is ascending MIDI.
 * No open strings, max 4-fret span, consecutive strings strongly preferred.
 */
export function findGuitarVoicing(pcsBassToTop: number[]): { si: number; fret: number }[] {
  const numNotes = pcsBassToTop.length;
  if (numNotes === 0 || numNotes > 6) return [];
  const MAX_SPAN = 3; // max fret distance (4 fret positions, e.g. frets 2-3-4-5)

  const bassPc = pcsBassToTop[0];
  const upperPcs = pcsBassToTop.slice(1);

  // Generate all permutations of the upper pitch classes
  const permutations: number[][] = [];
  const buildPerms = (remaining: number[], current: number[]) => {
    if (remaining.length === 0) { permutations.push([...current]); return; }
    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i]);
      buildPerms([...remaining.slice(0, i), ...remaining.slice(i + 1)], current);
      current.pop();
    }
  };
  buildPerms(upperPcs, []);

  let allVoicings: { voicing: { si: number; fret: number }[]; score: number }[] = [];

  // Generate all combinations of N strings from 6
  const combos: number[][] = [];
  const buildCombos = (start: number, combo: number[]) => {
    if (combo.length === numNotes) { combos.push([...combo]); return; }
    const remaining = numNotes - combo.length;
    for (let s = start; s <= 6 - remaining; s++) {
      combo.push(s);
      buildCombos(s + 1, combo);
      combo.pop();
    }
  };
  buildCombos(0, []);

  for (const perm of permutations) {
    const pcs = [bassPc, ...perm];

    for (const strings of combos) {
      // For each note, find all valid fret positions on its assigned string
      const options: { fret: number; midi: number }[][] = [];
      let viable = true;
      for (let n = 0; n < numNotes; n++) {
        const openMidi = OPEN_STRINGS[strings[n]];
        const targetPc = pcs[n];
        const noteOpts: { fret: number; midi: number }[] = [];
        for (let f = 1; f <= END_FRET; f++) {
          if ((openMidi + f) % 12 === targetPc) noteOpts.push({ fret: f, midi: openMidi + f });
        }
        if (noteOpts.length === 0) { viable = false; break; }
        options.push(noteOpts);
      }
      if (!viable) continue;

      // Search all combinations: ascending MIDI, fretted span ≤ MAX_SPAN
      type Entry = { si: number; fret: number; midi: number };
      const search = (idx: number, prevMidi: number, current: Entry[], minFretted: number, maxFretted: number) => {
        if (idx === numNotes) {
          const spread = maxFretted - minFretted;
          if (spread > MAX_SPAN) return;
          const avgFret = current.reduce((sum, v) => sum + v.fret, 0) / numNotes;
          const stringGaps = strings[strings.length - 1] - strings[0] - (numNotes - 1);
          const pitchSpread = current[current.length - 1].midi - current[0].midi;
          const score = spread * 5 + avgFret + stringGaps * 50 + pitchSpread;
          const v = current.map(({ si, fret }) => ({ si, fret }));
          // Deduplicate: check if this exact voicing already exists
          const key = v.map(p => `${p.si}-${p.fret}`).join(',');
          if (!allVoicings.some(av => av.voicing.map(p => `${p.si}-${p.fret}`).join(',') === key)) {
            allVoicings.push({ voicing: v, score });
          }
          return;
        }

        for (const opt of options[idx]) {
          if (opt.midi <= prevMidi) continue;
          const newMin = Math.min(minFretted, opt.fret);
          const newMax = Math.max(maxFretted, opt.fret);
          if (newMax - newMin > MAX_SPAN) continue;
          current.push({ si: 5 - strings[idx], fret: opt.fret, midi: opt.midi });
          search(idx + 1, opt.midi, current, newMin, newMax);
          current.pop();
        }
      };

      search(0, -1, [], Infinity, 0);
    }
  }

  // Sort by score and return best
  allVoicings.sort((a, b) => a.score - b.score);
  return allVoicings.length > 0 ? allVoicings[0].voicing : [];
}

/** Returns all playable voicings sorted by quality (best first) */
export function findAllGuitarVoicings(pcsBassToTop: number[]): { si: number; fret: number }[][] {
  const numNotes = pcsBassToTop.length;
  if (numNotes === 0 || numNotes > 6) return [];
  const MAX_SPAN = 3;

  const bassPc = pcsBassToTop[0];
  const upperPcs = pcsBassToTop.slice(1);

  const permutations: number[][] = [];
  const buildPerms = (remaining: number[], current: number[]) => {
    if (remaining.length === 0) { permutations.push([...current]); return; }
    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i]);
      buildPerms([...remaining.slice(0, i), ...remaining.slice(i + 1)], current);
      current.pop();
    }
  };
  buildPerms(upperPcs, []);

  const allVoicings: { voicing: { si: number; fret: number }[]; score: number }[] = [];

  const combos: number[][] = [];
  const buildCombos = (start: number, combo: number[]) => {
    if (combo.length === numNotes) { combos.push([...combo]); return; }
    const remaining = numNotes - combo.length;
    for (let s = start; s <= 6 - remaining; s++) {
      combo.push(s);
      buildCombos(s + 1, combo);
      combo.pop();
    }
  };
  buildCombos(0, []);

  for (const perm of permutations) {
    const pcs = [bassPc, ...perm];
    for (const strings of combos) {
      const options: { fret: number; midi: number }[][] = [];
      let viable = true;
      for (let n = 0; n < numNotes; n++) {
        const openMidi = OPEN_STRINGS[strings[n]];
        const targetPc = pcs[n];
        const noteOpts: { fret: number; midi: number }[] = [];
        for (let f = 1; f <= END_FRET; f++) {
          if ((openMidi + f) % 12 === targetPc) noteOpts.push({ fret: f, midi: openMidi + f });
        }
        if (noteOpts.length === 0) { viable = false; break; }
        options.push(noteOpts);
      }
      if (!viable) continue;

      type Entry = { si: number; fret: number; midi: number };
      const search = (idx: number, prevMidi: number, current: Entry[], minF: number, maxF: number) => {
        if (idx === numNotes) {
          if (maxF - minF > MAX_SPAN) return;
          const avgFret = current.reduce((sum, v) => sum + v.fret, 0) / numNotes;
          const stringGaps = strings[strings.length - 1] - strings[0] - (numNotes - 1);
          const pitchSpread = current[current.length - 1].midi - current[0].midi;
          const score = (maxF - minF) * 5 + avgFret + stringGaps * 50 + pitchSpread;
          const v = current.map(({ si, fret }) => ({ si, fret }));
          const key = v.map(p => `${p.si}-${p.fret}`).join(',');
          if (!allVoicings.some(av => av.voicing.map(p => `${p.si}-${p.fret}`).join(',') === key)) {
            allVoicings.push({ voicing: v, score });
          }
          return;
        }
        for (const opt of options[idx]) {
          if (opt.midi <= prevMidi) continue;
          const newMin = Math.min(minF, opt.fret);
          const newMax = Math.max(maxF, opt.fret);
          if (newMax - newMin > MAX_SPAN) continue;
          current.push({ si: 5 - strings[idx], fret: opt.fret, midi: opt.midi });
          search(idx + 1, opt.midi, current, newMin, newMax);
          current.pop();
        }
      };
      search(0, -1, [], Infinity, 0);
    }
  }

  allVoicings.sort((a, b) => a.score - b.score);
  return allVoicings.map(v => v.voicing);
}

interface Props {
  /** Set of pitch classes (0-11) to highlight as scale tones */
  scalePcs?: Set<number>;
  /** Set of pitch classes to highlight as chord tones (shown larger/brighter) */
  chordPcs?: Set<number>;
  /** Root pitch class for the chord (shown with 'R' label) */
  rootPc?: number;
  /** Color for chord tone highlights */
  color?: string;
  /** Specific voicing to outline on the fretboard (e.g. a chord shape) */
  voicing?: { si: number; fret: number }[];
  /** Color for the voicing outline */
  voicingColor?: string;
  /** Use simple chord-tone labels (b3, b5, 6) instead of extension labels (#9, #11, 13) */
  simpleLabels?: boolean;
}

export default function FretboardDiagram({ scalePcs, chordPcs, rootPc, color = '#4a8525', voicing, voicingColor = '#e08020', simpleLabels }: Props) {
  // Build a lookup set for voicing positions
  const voicingSet = new Set(voicing?.map(v => `${v.si}-${v.fret}`) ?? []);
  // Layout
  const leftPad = 20;
  const topPad = 16;
  const openFretW = 18; // narrower area for open strings
  const fretWidthBase = 36;
  const stringSpacing = 14;
  const fretboardH = 5 * stringSpacing;
  const nutX = leftPad + openFretW; // nut position (thick line)
  const frettedFrets = END_FRET - START_FRET; // frets 1-9
  const totalW = nutX + frettedFrets * fretWidthBase + 10;
  const totalH = topPad + fretboardH + 24;

  // Map absolute fret to x position
  const getFretX = (fret: number) => {
    if (fret === 0) return leftPad + openFretW / 2; // center of open area
    return nutX + (fret - 0.5) * fretWidthBase; // center of fret slot
  };

  const getStringY = (str: number) => topPad + str * stringSpacing; // str 0-5 (high E = 0)

  // Interval labels relative to chord root
  const INTERVAL_LABELS: Record<number, string> = simpleLabels
    ? { 0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5',
        7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7' }
    : { 0: 'R', 1: 'b9', 2: '9', 3: '#9', 4: '3', 5: '11', 6: '#11',
        7: '5', 8: 'b13', 9: '13', 10: 'b7', 11: '7' };

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="fretboard-svg"
      style={{ width: '100%', maxWidth: 520 }}
    >
      {/* Nut (thick line at fret 0) */}
      <line
        x1={nutX} y1={topPad - 1}
        x2={nutX} y2={topPad + fretboardH + 1}
        stroke="var(--text)" strokeWidth={3}
      />

      {/* Fret lines (1 through END_FRET) */}
      {Array.from({ length: frettedFrets }, (_, i) => {
        const x = nutX + (i + 1) * fretWidthBase;
        return (
          <line key={`f${i}`}
            x1={x} y1={topPad}
            x2={x} y2={topPad + fretboardH}
            stroke="var(--border)" strokeWidth={1}
          />
        );
      })}

      {/* Strings */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = getStringY(i);
        return (
          <line key={`s${i}`}
            x1={leftPad} y1={y}
            x2={nutX + frettedFrets * fretWidthBase} y2={y}
            stroke="var(--text-muted)" strokeWidth={i < 2 ? 0.7 : i < 4 ? 1 : 1.4}
          />
        );
      })}

      {/* Fret markers (dots) */}
      {FRET_MARKERS.map(f => {
        const x = getFretX(f);
        const isDouble = f === 12;
        return isDouble ? (
          <g key={`m${f}`}>
            <circle cx={x} cy={topPad + fretboardH / 2 - 8} r={2.5} fill="var(--border)" opacity={0.5} />
            <circle cx={x} cy={topPad + fretboardH / 2 + 8} r={2.5} fill="var(--border)" opacity={0.5} />
          </g>
        ) : (
          <circle key={`m${f}`} cx={x} cy={topPad + fretboardH / 2} r={2.5} fill="var(--border)" opacity={0.5} />
        );
      })}

      {/* Fret numbers */}
      {FRET_MARKERS.map(f => (
        <text key={`fn${f}`}
          x={getFretX(f)}
          y={topPad + fretboardH + 14}
          textAnchor="middle" fontSize="8" fill="var(--text-muted)"
          fontFamily="Arial, sans-serif"
        >
          {f}
        </text>
      ))}

      {/* Note dots (frets 0-9, including open strings) */}
      {Array.from({ length: 6 }, (_, si) => {
        const openMidi = OPEN_STRINGS[5 - si]; // si=0 is high E (string 1)
        return Array.from({ length: END_FRET + 1 }, (_, fi) => {
          const fret = fi;
          const midi = openMidi + fret;
          const pc = midi % 12;
          const isChord = chordPcs?.has(pc);
          const isScale = scalePcs?.has(pc);
          const isRoot = rootPc !== undefined && pc === rootPc;

          if (!isChord && !isScale) return null;

          const x = getFretX(fret);
          const y = getStringY(si);
          const isVoicing = voicingSet.has(`${si}-${fret}`);
          const r = isVoicing ? 6 : isChord ? 5.5 : 3.5;
          const fill = isVoicing ? voicingColor : isChord ? color : 'var(--text-muted)';
          const opacity = isVoicing ? 1 : isChord ? 0.9 : 0.3;

          const interval = rootPc !== undefined ? ((pc - rootPc + 12) % 12) : -1;
          const label = (isVoicing || isChord) && rootPc !== undefined ? INTERVAL_LABELS[interval] : undefined;

          return (
            <g key={`n${si}-${fret}`}>
              <circle cx={x} cy={y} r={r} fill={fill} opacity={opacity} />
              {label && (
                <text
                  x={x} y={y + 3}
                  textAnchor="middle" fontSize="6" fontWeight="700"
                  fill="white" fontFamily="Arial, sans-serif"
                >
                  {label}
                </text>
              )}
              {isVoicing && (
                <circle cx={x} cy={y} r={r + 2} fill="none" stroke={voicingColor} strokeWidth={1.5} opacity={0.8} />
              )}
              {!isVoicing && isRoot && isChord && (
                <circle cx={x} cy={y} r={r + 1.5} fill="none" stroke={fill} strokeWidth={1} opacity={0.6} />
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}
