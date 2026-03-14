import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, GhostNote, Voice, Formatter, Dot, Tuplet, Beam } from 'vexflow';
import type { RhythmChoice, PolyLayer } from '../types';

interface Props {
  choice: RhythmChoice;
  useNotation?: boolean;
}

// Find the smallest grid resolution (subdivisions per beat) where all hits align
function computeGridResolution(layers: PolyLayer[]): number {
  const allHits = layers.flatMap(l => l.hits);
  for (const res of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 20, 21, 24, 28, 30, 35, 36, 40, 42, 45, 56, 63, 72]) {
    const allAlign = allHits.every(h => {
      const gridPos = h * res;
      return Math.abs(gridPos - Math.round(gridPos)) < 0.01;
    });
    if (allAlign) return res;
  }
  return 12;
}

// Group beamable notes (8th, 16th) by beat and create beams
function beamByBeat(
  notes: (StaveNote | GhostNote)[],
  subsPerBeat: number
): Beam[] {
  const beams: Beam[] = [];
  if (subsPerBeat < 2) return beams; // quarter notes don't need beams

  const numBeats = Math.ceil(notes.length / subsPerBeat);
  for (let beat = 0; beat < numBeats; beat++) {
    const start = beat * subsPerBeat;
    const group = notes.slice(start, start + subsPerBeat);
    // Only beam groups with 2+ actual StaveNotes
    const staveNotes = group.filter((n): n is StaveNote => n instanceof StaveNote);
    if (staveNotes.length >= 2) {
      try {
        beams.push(new Beam(staveNotes));
      } catch {
        // skip if beam creation fails
      }
    }
  }
  return beams;
}

function BeatGrid({ layers }: { layers: PolyLayer[] }) {
  const totalBeats = layers[0].totalBeats;
  const subsPerBeat = computeGridResolution(layers);
  const cols = Math.round(totalBeats * subsPerBeat);

  const labelMap = ['L', 'M', 'H'];
  const voiceLabels = layers.length === 1
    ? ['\u25CF']
    : layers.map((_, i) => labelMap[i] ?? `${i + 1}`);

  return (
    <div className="beat-grid">
      {layers.map((layer, li) => (
        <div key={li} className="beat-grid-row">
          <span className="beat-grid-voice">{voiceLabels[li]}</span>
          {Array.from({ length: cols }, (_, col) => {
            const beatPos = col / subsPerBeat;
            const isHit = layer.hits.some(h => Math.abs(h - beatPos) < 0.01);
            const isBeatStart = col % subsPerBeat === 0;
            return (
              <div
                key={col}
                className={`beat-grid-cell${isHit ? ' hit' : ''}${isBeatStart ? ' beat-start' : ''}`}
              />
            );
          })}
        </div>
      ))}
      {/* Beat numbers */}
      <div className="beat-grid-row beat-numbers">
        <span className="beat-grid-voice" />
        {Array.from({ length: cols }, (_, col) => {
          const isBeatStart = col % subsPerBeat === 0;
          return (
            <div key={col} className="beat-grid-cell number">
              {isBeatStart ? (col / subsPerBeat) + 1 : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PolyrhythmNotation({ layers }: { layers: PolyLayer[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const totalBeats = layers[0].totalBeats;
    const aCount = layers[0].hits.length; // top voice
    const bCount = layers[1].hits.length; // bottom voice

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const width = Math.max(220, Math.max(aCount, bCount) * 35 + 100);
    renderer.resize(width, 120);
    const context = renderer.getContext();
    context.setFont('Arial', 8);

    const stave = new Stave(5, 10, width - 10);
    stave.addClef('percussion');
    stave.addTimeSignature(`${totalBeats}/4`);
    stave.setContext(context).draw();

    try {
      // Top voice (A): stems up
      const topNotes = Array.from({ length: aCount }, () =>
        new StaveNote({ keys: ['b/4'], duration: 'q', stemDirection: 1 })
      );

      // Bottom voice (B): stems down
      const bottomNotes = Array.from({ length: bCount }, () =>
        new StaveNote({ keys: ['d/4'], duration: 'q', stemDirection: -1 })
      );

      const tuplets: Tuplet[] = [];

      // Top voice needs tuplet if aCount != totalBeats
      if (aCount !== totalBeats) {
        tuplets.push(new Tuplet(topNotes, { numNotes: aCount, notesOccupied: totalBeats }));
      }
      // Bottom voice is always totalBeats quarter notes — no tuplet needed

      const topVoice = new Voice({ numBeats: totalBeats, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      const bottomVoice = new Voice({ numBeats: totalBeats, beatValue: 4 }).setMode(Voice.Mode.SOFT);

      topVoice.addTickables(topNotes);
      bottomVoice.addTickables(bottomNotes);

      new Formatter()
        .joinVoices([topVoice])
        .joinVoices([bottomVoice])
        .format([topVoice, bottomVoice], width - 80);

      topVoice.draw(context, stave);
      bottomVoice.draw(context, stave);

      for (const t of tuplets) {
        t.setContext(context).draw();
      }
    } catch (e) {
      console.warn('VexFlow polyrhythm rendering error:', e);
    }
  }, [layers]);

  return <div ref={containerRef} className="rhythm-choice-notation" />;
}

function GrooveNotation({ layers }: { layers: PolyLayer[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const totalBeats = layers[0].totalBeats;
    const subsPerBeat = computeGridResolution(layers);
    const totalSlots = totalBeats * subsPerBeat;

    // Map subdivision to VexFlow duration
    const isTriplet = subsPerBeat === 3 || subsPerBeat === 6;
    let slotDuration: string;
    if (subsPerBeat === 1) slotDuration = 'q';
    else if (subsPerBeat === 2) slotDuration = '8';
    else if (subsPerBeat === 3) slotDuration = '8';
    else if (subsPerBeat === 4) slotDuration = '16';
    else if (subsPerBeat === 6) slotDuration = '16';
    else slotDuration = '16';

    // Staff positions for each voice: kick (low), snare (mid), hi-hat (high)
    const keyMap = ['f/4', 'c/5', 'g/5'];

    // Build hit sets for each layer
    const hitSets = layers.map(layer =>
      new Set(layer.hits.map(h => Math.round(h * subsPerBeat)))
    );

    // Build two voices: stems-up (snare + hi-hat) and stems-down (kick)
    const upNotes: (StaveNote | GhostNote)[] = [];
    const downNotes: (StaveNote | GhostNote)[] = [];

    for (let slot = 0; slot < totalSlots; slot++) {
      // Stems-up voice: snare (layer 1) + hi-hat (layer 2)
      const upKeys: string[] = [];
      if (layers.length > 1 && hitSets[1].has(slot)) upKeys.push(keyMap[1]);
      if (layers.length > 2 && hitSets[2].has(slot)) upKeys.push(keyMap[2]);

      if (upKeys.length > 0) {
        upNotes.push(new StaveNote({ keys: upKeys, duration: slotDuration, stemDirection: 1 }));
      } else {
        upNotes.push(new GhostNote({ duration: slotDuration }));
      }

      // Stems-down voice: kick (layer 0)
      if (hitSets[0].has(slot)) {
        downNotes.push(new StaveNote({ keys: [keyMap[0]], duration: slotDuration, stemDirection: -1 }));
      } else {
        downNotes.push(new GhostNote({ duration: slotDuration }));
      }
    }

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const width = Math.max(250, totalSlots * 18 + 100);
    renderer.resize(width, 120);
    const context = renderer.getContext();
    context.setFont('Arial', 8);

    const stave = new Stave(5, 10, width - 10);
    stave.addClef('percussion');
    stave.addTimeSignature(`${totalBeats}/4`);
    stave.setContext(context).draw();

    try {
      const upVoice = new Voice({ numBeats: totalBeats, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      const downVoice = new Voice({ numBeats: totalBeats, beatValue: 4 }).setMode(Voice.Mode.SOFT);

      upVoice.addTickables(upNotes);
      downVoice.addTickables(downNotes);

      // Triplet brackets
      const tuplets: Tuplet[] = [];
      if (isTriplet) {
        const notesPerGroup = subsPerBeat === 3 ? 3 : 6;
        const occupied = subsPerBeat === 3 ? 2 : 4;
        for (let beat = 0; beat < totalBeats; beat++) {
          const start = beat * subsPerBeat;
          const upGroup = upNotes.slice(start, start + notesPerGroup);
          const downGroup = downNotes.slice(start, start + notesPerGroup);
          if (upGroup.length === notesPerGroup) {
            tuplets.push(new Tuplet(upGroup, { numNotes: notesPerGroup, notesOccupied: occupied }));
          }
          if (downGroup.length === notesPerGroup) {
            tuplets.push(new Tuplet(downGroup, { numNotes: notesPerGroup, notesOccupied: occupied }));
          }
        }
      }

      // Create beams before drawing so flags are suppressed
      const upBeams = beamByBeat(upNotes, subsPerBeat);
      const downBeams = beamByBeat(downNotes, subsPerBeat);

      new Formatter()
        .joinVoices([upVoice])
        .joinVoices([downVoice])
        .format([upVoice, downVoice], width - 80);

      upVoice.draw(context, stave);
      downVoice.draw(context, stave);

      for (const b of [...upBeams, ...downBeams]) {
        b.setContext(context).draw();
      }

      for (const t of tuplets) {
        t.setContext(context).draw();
      }
    } catch (e) {
      console.warn('VexFlow groove rendering error:', e);
    }
  }, [layers]);

  return <div ref={containerRef} className="rhythm-choice-notation" />;
}

export default function RhythmChoiceNotation({ choice, useNotation }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isGroove = !!choice.layers;
  const isPoly = isGroove && choice.layers!.length === 2;

  useEffect(() => {
    if (!containerRef.current || isGroove) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const width = Math.max(220, choice.keys.length * 40 + 80);
    renderer.resize(width, 100);
    const context = renderer.getContext();
    context.setFont('Arial', 8);

    const stave = new Stave(5, 5, width - 10);
    stave.addClef('percussion');
    stave.addTimeSignature('4/4');
    stave.setContext(context).draw();

    try {
      const vexNotes = choice.keys.map((keyGroup, i) => {
        const duration = choice.vexDurations[i];
        const isDotted = duration.endsWith('d');
        const baseDuration = isDotted ? duration.slice(0, -1) : duration;

        const note = new StaveNote({
          keys: keyGroup,
          duration: baseDuration,
        });

        if (isDotted) {
          Dot.buildAndAttach([note]);
        }

        return note;
      });

      const tuplets: Tuplet[] = [];
      if (choice.tripletGroups) {
        for (const [start, count] of choice.tripletGroups) {
          const tupletNotes = vexNotes.slice(start, start + count);
          if (tupletNotes.length === count) {
            tuplets.push(new Tuplet(tupletNotes, { numNotes: 3, notesOccupied: 2 }));
          }
        }
      }

      const voice = new Voice({
        numBeats: 4,
        beatValue: 4,
      }).setMode(Voice.Mode.SOFT);

      voice.addTickables(vexNotes);

      // Create beams before drawing so flags are suppressed
      const beams = Beam.generateBeams(vexNotes);

      new Formatter().joinVoices([voice]).format([voice], width - 60);
      voice.draw(context, stave);

      for (const b of beams) {
        b.setContext(context).draw();
      }
      for (const tuplet of tuplets) {
        tuplet.setContext(context).draw();
      }
    } catch (e) {
      console.warn('VexFlow rendering error:', e);
    }
  }, [choice, isGroove]);

  // Polyrhythms: show notation or beat grid based on toggle
  if (isPoly && choice.layers) {
    if (useNotation) {
      return <PolyrhythmNotation layers={choice.layers} />;
    }
    return <BeatGrid layers={choice.layers} />;
  }

  // Grooves (3-voice): notation or beat grid
  if (isGroove && choice.layers) {
    if (useNotation) {
      return <GrooveNotation layers={choice.layers} />;
    }
    return <BeatGrid layers={choice.layers} />;
  }

  return <div ref={containerRef} className="rhythm-choice-notation" />;
}
