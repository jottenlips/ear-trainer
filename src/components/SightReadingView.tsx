import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Renderer, Stave, StaveNote, Voice, Formatter, Dot, Tuplet, Beam, Accidental,
} from 'vexflow';
import type { Difficulty, InstrumentName } from '../types';
import { generateMelody, midiToNoteName, noteToVexKey, toVexDuration, durationToBeats, TIME_SIGNATURES, setNoteSpellingKey, chordSymbolToMidi } from '../utils/music';
import type { GeneratedMelody } from '../utils/music';
import { playMelody, ensureAudioContext } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';
import type { TranslationKey } from '../i18n/translations';

interface Props {
  instrument: InstrumentName;
}

export default function SightReadingView({ instrument }: Props) {
  const { difficulty: diffParam } = useParams<{ difficulty: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const difficulty = diffParam as Difficulty;

  const [melody, setMelody] = useState<GeneratedMelody | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [countIn, setCountIn] = useState(true);
  const [playChords, setPlayChords] = useState(true);
  const [bpm, setBpm] = useState(90);
  const notationRef = useRef<HTMLDivElement>(null);

  const generateNew = useCallback(() => {
    const m = generateMelody(difficulty);
    setMelody(m);
    setBpm(m.bpm);
    setRevealed(false);
  }, [difficulty]);

  useEffect(() => {
    generateNew();
  }, [generateNew]);

  // Render notation with VexFlow — one stave per measure, split across max 2 lines
  useEffect(() => {
    if (!notationRef.current || !melody) return;
    setNoteSpellingKey(melody.key);
    const container = notationRef.current;
    container.innerHTML = '';

    const ts = TIME_SIGNATURES[melody.timeSignature];
    const isCompound = ts.beatValue === 8;
    const beatsPerMeasure = isCompound ? ts.beats * 0.5 : ts.beats;

    // Use the container's actual width — no hard cap so it fills mobile screens
    const containerWidth = container.parentElement?.clientWidth ?? 700;
    const lineHeight = revealed ? 270 : 200;

    const keyMap: Record<string, string> = {
      'C': 'C', 'Db': 'Db', 'D': 'D', 'Eb': 'Eb', 'E': 'E', 'F': 'F',
      'F#': 'F#', 'G': 'G', 'Ab': 'Ab', 'A': 'A', 'Bb': 'Bb', 'B': 'B',
    };

    // Key signature accidentals: which note letters are sharped/flatted by the key sig
    // Maps key name → set of altered notes (e.g. Eb → {B:'b', E:'b', A:'b'})
    const KEY_SIG_ACCIDENTALS: Record<string, Record<string, string>> = {
      'C':  {},
      'G':  { F: '#' },
      'D':  { F: '#', C: '#' },
      'A':  { F: '#', C: '#', G: '#' },
      'E':  { F: '#', C: '#', G: '#', D: '#' },
      'B':  { F: '#', C: '#', G: '#', D: '#', A: '#' },
      'F#': { F: '#', C: '#', G: '#', D: '#', A: '#', E: '#' },
      'F':  { B: 'b' },
      'Bb': { B: 'b', E: 'b' },
      'Eb': { B: 'b', E: 'b', A: 'b' },
      'Ab': { B: 'b', E: 'b', A: 'b', D: 'b' },
      'Db': { B: 'b', E: 'b', A: 'b', D: 'b', G: 'b' },
      'Gb': { B: 'b', E: 'b', A: 'b', D: 'b', G: 'b', C: 'b' },
    };
    const keySigAcc = KEY_SIG_ACCIDENTALS[melody.key] || {};

    // Determine what accidental to show for a note given the key signature
    // Returns null (no accidental needed), '#', 'b', or 'n' (natural)
    function getAccidental(noteName: string): string | null {
      // noteName is like "Ab4", "C#5", "G4"
      const match = noteName.match(/^([A-G])([#b]?)(\d+)$/);
      if (!match) return null;
      const [, letter, acc] = match;
      const keySigForLetter = keySigAcc[letter]; // what the key sig says for this letter

      if (!keySigForLetter) {
        // Key sig says this letter is natural
        if (acc === '#') return '#';
        if (acc === 'b') return 'b';
        return null; // natural, matches key sig
      } else {
        // Key sig says this letter is sharped or flatted
        if (acc === keySigForLetter) return null; // matches key sig, no accidental needed
        if (acc === '') return 'n'; // natural sign needed to cancel key sig
        return acc; // different accidental than key sig
      }
    }

    // Group notes into measures — also track which melody note index each vexNote corresponds to
    interface MeasureData {
      vexNotes: StaveNote[];
      tuplets: Tuplet[];
      isTriplet: boolean[]; // parallel array: true if note is a triplet
      noteIndices: number[]; // parallel array: index into melody.notes
    }
    const measures: MeasureData[] = [];
    let currentMeasureNotes: StaveNote[] = [];
    let currentMeasureTuplets: Tuplet[] = [];
    let currentIsTriplet: boolean[] = [];
    let currentNoteIndices: number[] = [];
    let measureBeatCount = 0;
    let tripletBuffer: StaveNote[] = [];

    for (let i = 0; i < melody.notes.length; i++) {
      const note = melody.notes[i];
      const noteName = midiToNoteName(note.midi);
      const vexKey = noteToVexKey(noteName);
      const vexDur = toVexDuration(note.duration);
      const isDotted = vexDur.endsWith('d');
      const baseDur = isDotted ? vexDur.slice(0, -1) : vexDur;

      const staveNote = new StaveNote({
        keys: [vexKey],
        duration: baseDur,
      });

      // Add accidental if needed (key sig doesn't cover it, or natural needed)
      const acc = getAccidental(noteName);
      if (acc) {
        staveNote.addModifier(new Accidental(acc));
      }

      if (isDotted) {
        Dot.buildAndAttach([staveNote]);
      }

      if (note.isTriplet) {
        tripletBuffer.push(staveNote);
        if (tripletBuffer.length === 3) {
          currentMeasureTuplets.push(new Tuplet(tripletBuffer, { numNotes: 3, notesOccupied: 2 }));
          tripletBuffer = [];
        }
      }

      measureBeatCount += durationToBeats(note.duration);
      currentMeasureNotes.push(staveNote);
      currentIsTriplet.push(!!note.isTriplet);
      currentNoteIndices.push(i);

      if (measureBeatCount >= beatsPerMeasure - 0.01) {
        measures.push({ vexNotes: currentMeasureNotes, tuplets: currentMeasureTuplets, isTriplet: currentIsTriplet, noteIndices: currentNoteIndices });
        currentMeasureNotes = [];
        currentMeasureTuplets = [];
        currentIsTriplet = [];
        currentNoteIndices = [];
        measureBeatCount = 0;
      }
    }
    if (currentMeasureNotes.length > 0) {
      measures.push({ vexNotes: currentMeasureNotes, tuplets: currentMeasureTuplets, isTriplet: currentIsTriplet, noteIndices: currentNoteIndices });
    }

    // Split measures across max 2 lines
    const totalMeasures = measures.length;
    const line1Count = Math.ceil(totalMeasures / 2);
    const lineAssignments: number[][] = []; // each entry is array of measure indices
    lineAssignments.push(Array.from({ length: line1Count }, (_, i) => i));
    if (line1Count < totalMeasures) {
      lineAssignments.push(Array.from({ length: totalMeasures - line1Count }, (_, i) => i + line1Count));
    }

    const totalHeight = lineAssignments.length * lineHeight;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(containerWidth, totalHeight);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    for (let lineIdx = 0; lineIdx < lineAssignments.length; lineIdx++) {
      const measureIndices = lineAssignments[lineIdx];
      const yOffset = lineIdx * lineHeight;
      const isFirstLine = lineIdx === 0;
      const measuresOnLine = measureIndices.length;

      // Only the very first measure gets clef + key sig + time sig
      const firstMeasureExtra = isFirstLine ? 80 : 0;
      // Distribute remaining width evenly among measures
      const totalLineWidth = containerWidth - 20;
      const remainingWidth = totalLineWidth - firstMeasureExtra;
      const measureWidth = remainingWidth / measuresOnLine;

      let xPos = 10;

      for (let mi = 0; mi < measuresOnLine; mi++) {
        const mIdx = measureIndices[mi];
        const measure = measures[mIdx];
        const isFirstMeasure = mi === 0;

        const w = (isFirstMeasure && isFirstLine) ? measureWidth + firstMeasureExtra : measureWidth;
        const stave = new Stave(xPos, yOffset + 40, w);

        if (isFirstMeasure && isFirstLine) {
          stave.addClef('treble');
          stave.addKeySignature(keyMap[melody.key] || 'C');
          stave.addTimeSignature(melody.timeSignature);
        }

        // Last measure on last line gets end barline
        if (lineIdx === lineAssignments.length - 1 && mi === measuresOnLine - 1) {
          stave.setEndBarType(3); // END barline
        }

        stave.setContext(context).draw();

        // Draw chord symbol above the stave
        if (melody.chordSymbols[mIdx]) {
          const svg = container.querySelector('svg');
          if (svg) {
            const chordText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            // Position at the start of the measure, above the stave
            const chordX = xPos + (isFirstMeasure && isFirstLine ? firstMeasureExtra + 10 : 10);
            const chordY = yOffset + 35; // above the top staff line
            chordText.setAttribute('x', String(chordX));
            chordText.setAttribute('y', String(chordY));
            chordText.setAttribute('font-size', '14');
            chordText.setAttribute('font-family', 'Georgia, serif');
            chordText.setAttribute('fill', '#d4782a');
            chordText.setAttribute('font-weight', '700');
            chordText.textContent = melody.chordSymbols[mIdx];
            svg.appendChild(chordText);
          }
        }

        try {
          if (measure.vexNotes.length === 0) continue;

          // 1. Create beams BEFORE drawing — Beam constructor sets .beam on
          //    each note, so voice.draw() knows to skip the flag.
          const beams: Beam[] = [];
          let run: StaveNote[] = [];
          let runIsTriplet = false;
          for (let ni = 0; ni < measure.vexNotes.length; ni++) {
            const n = measure.vexNotes[ni];
            const dur = n.getDuration();
            const triplet = measure.isTriplet[ni];
            if (dur === '8' || dur === '16') {
              // Break run if triplet status changes
              if (run.length > 0 && triplet !== runIsTriplet) {
                if (run.length >= 2) {
                  try { beams.push(new Beam(run)); } catch { /* skip */ }
                }
                run = [];
              }
              run.push(n);
              runIsTriplet = triplet;
            } else {
              if (run.length >= 2) {
                try { beams.push(new Beam(run)); } catch { /* skip */ }
              }
              run = [];
            }
          }
          if (run.length >= 2) {
            try { beams.push(new Beam(run)); } catch { /* skip */ }
          }

          // 2. Format and draw the voice (flags suppressed on beamed notes)
          const voice = new Voice({
            numBeats: beatsPerMeasure * 4,
            beatValue: 16,
          }).setMode(Voice.Mode.SOFT);
          voice.addTickables(measure.vexNotes);

          const formatWidth = w - (isFirstMeasure && isFirstLine ? firstMeasureExtra + 20 : 30);
          new Formatter().joinVoices([voice]).format([voice], Math.max(formatWidth, 50));
          voice.draw(context, stave);

          // 3. Draw beams and tuplets on top
          for (const beam of beams) {
            beam.setContext(context).draw();
          }
          for (const tuplet of measure.tuplets) {
            tuplet.setContext(context).draw();
          }
          // 4. If revealed, add note name labels under each note
          if (revealed) {
            const svg = container.querySelector('svg');
            if (svg) {
              for (let ni = 0; ni < measure.vexNotes.length; ni++) {
                const vn = measure.vexNotes[ni];
                const noteIdx = measure.noteIndices[ni];
                const melNote = melody.notes[noteIdx];
                const noteName = midiToNoteName(melNote.midi).replace(/\d+$/, '');

                // Get the note head's bounding box for x position
                const bbox = vn.getBoundingBox();
                const x = bbox.getX() + bbox.getW() / 2;
                // Place label below the stave — always below ledger lines
                // Stave bottom is yOffset+40+65, but low notes with stems go further
                const staveBottom = yOffset + 40 + 65;
                const noteBottom = bbox.getY() + bbox.getH();
                const y = Math.max(staveBottom, noteBottom) + 30;

                let labelY = y;

                // Counting label (1 e + a / trip let)
                if (melNote.countLabel) {
                  const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  countText.setAttribute('x', String(x));
                  countText.setAttribute('y', String(labelY));
                  countText.setAttribute('text-anchor', 'middle');
                  countText.setAttribute('font-size', '10');
                  countText.setAttribute('font-family', 'monospace');
                  countText.setAttribute('fill', '#888');
                  countText.setAttribute('font-weight', '500');
                  countText.textContent = melNote.countLabel;
                  svg.appendChild(countText);
                  labelY += 13;
                }

                // Note name
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', String(x));
                text.setAttribute('y', String(labelY));
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '11');
                text.setAttribute('font-family', 'Arial, sans-serif');
                text.setAttribute('fill', '#4a90d9');
                text.setAttribute('font-weight', '600');
                text.textContent = noteName;
                svg.appendChild(text);
                labelY += 13;

                // Extension label for sec dom notes
                if (melNote.extensionLabel) {
                  const extText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  extText.setAttribute('x', String(x));
                  extText.setAttribute('y', String(labelY));
                  extText.setAttribute('text-anchor', 'middle');
                  extText.setAttribute('font-size', '10');
                  extText.setAttribute('font-family', 'Georgia, serif');
                  extText.setAttribute('fill', '#d4782a');
                  extText.setAttribute('font-style', 'italic');
                  extText.textContent = melNote.extensionLabel;
                  svg.appendChild(extText);
                }
              }
            }
          }

        } catch (e) {
          console.warn('VexFlow rendering error (measure ' + mIdx + '):', e);
        }

        xPos += w;
      }
    }
  }, [melody, revealed]);

  const handlePlay = async () => {
    if (!melody || isPlaying) return;
    await ensureAudioContext();
    setIsPlaying(true);
    try {
      const chordMidis = playChords
        ? melody.chordSymbols.map(sym => chordSymbolToMidi(sym, 60))
        : undefined;
      await playMelody(melody.notes, instrument, bpm, countIn, melody.timeSignature, chordMidis);
      // Wait for scheduled audio to finish
      const ts = TIME_SIGNATURES[melody.timeSignature];
      const isCompound = ts.beatValue === 8;
      const beatsPerMeasure = isCompound ? ts.beats * 0.5 : ts.beats;
      const totalBeats = beatsPerMeasure * melody.measures;
      const beatDuration = 60 / bpm;
      const totalMs = totalBeats * beatDuration * 1000 + (countIn ? ts.beats * (isCompound ? beatDuration * 500 : beatDuration * 1000) : 0);
      await new Promise(r => setTimeout(r, totalMs));
    } finally {
      setIsPlaying(false);
    }
  };

  const handleReveal = () => setRevealed(true);

  if (!melody) return null;

  return (
    <div className="exercise-view sight-reading-view">
      <div className="exercise-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          {t('exercise.back', lang)}
        </button>
        <div className="sight-reading-info">
          <span className="sight-reading-key">
            {t('sightReading.key' as TranslationKey, lang) || 'Key'}: {melody.key}
          </span>
          <span className="sight-reading-time">{melody.timeSignature}</span>
          {melody.secDomLabel && revealed && (
            <span className="sight-reading-secdom">{melody.secDomLabel}</span>
          )}
        </div>
      </div>

      <h2 className="exercise-prompt">
        {t('sightReading.prompt' as TranslationKey, lang) || 'Sight-read this melody, then play to check'}
      </h2>

      {/* Sheet music notation - always visible */}
      <div className="notation-container sight-reading-notation">
        <div ref={notationRef} className="notation-svg" />
      </div>

      <div className="play-controls">
        <button
          className="btn btn-play"
          onClick={handlePlay}
          disabled={isPlaying}
        >
          {isPlaying
            ? (t('exercise.playing', lang))
            : (t('sightReading.play' as TranslationKey, lang) || 'Play')}
        </button>

        {!revealed && (
          <button className="btn btn-primary" onClick={handleReveal}>
            {t('sightReading.reveal' as TranslationKey, lang) || 'Reveal Notes'}
          </button>
        )}

        <button className="btn btn-primary" onClick={generateNew}>
          {t('sightReading.newMelody' as TranslationKey, lang) || 'New Melody'}
        </button>

        <button
          className={`btn btn-extensions-toggle ${countIn ? 'active' : ''}`}
          onClick={() => setCountIn(prev => !prev)}
        >
          {countIn
            ? t('exercise.countInOn', lang)
            : t('exercise.countInOff', lang)}
        </button>

        <button
          className={`btn btn-extensions-toggle ${playChords ? 'active' : ''}`}
          onClick={() => setPlayChords(prev => !prev)}
        >
          {playChords ? 'Chords On' : 'Chords Off'}
        </button>

        <div className="tempo-slider">
          <label htmlFor="sr-bpm-slider">{bpm} BPM</label>
          <input
            id="sr-bpm-slider"
            type="range"
            min={50}
            max={160}
            step={5}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Difficulty info */}
      <div className="sight-reading-details">
        <p className="sight-reading-detail-line">
          {melody.measures} {t('sightReading.measures' as TranslationKey, lang) || 'measures'} &middot; {melody.timeSignature} &middot; {melody.key} {t('prompt.major', lang)}
        </p>
        {melody.secDomLabel && (
          <p className="sight-reading-detail-line sight-reading-harmonic">
            {t('sightReading.harmonicColor' as TranslationKey, lang) || 'Harmonic color'}: {revealed ? `${melody.secDomLabel} — ${melody.secDomColorName}` : '???'}
          </p>
        )}
      </div>
    </div>
  );
}
