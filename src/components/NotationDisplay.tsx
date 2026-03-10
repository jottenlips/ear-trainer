import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Dot } from 'vexflow';
import type { NoteData, ExerciseType } from '../types';

interface Props {
  noteData: NoteData;
  exerciseType: ExerciseType;
  revealed: boolean;
}

export default function NotationDisplay({ noteData, exerciseType, revealed }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !noteData.keys || !noteData.vexDurations) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const width = Math.max(400, noteData.keys.length * 80 + 120);
    renderer.resize(width, 160);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    const stave = new Stave(10, 20, width - 20);
    stave.addClef('treble');
    if (noteData.timeSignature) {
      stave.addTimeSignature(noteData.timeSignature);
    }
    stave.setContext(context).draw();

    try {
      const vexNotes = noteData.keys.map((keyGroup, i) => {
        const duration = noteData.vexDurations![i];
        // Check if dotted
        const isDotted = duration.endsWith('d');
        const baseDuration = isDotted ? duration.slice(0, -1) : duration;

        // For rhythm, show all notes; for intervals/chords before reveal, show question marks
        const note = new StaveNote({
          keys: keyGroup,
          duration: baseDuration,
        });

        if (isDotted) {
          Dot.buildAndAttach([note]);
        }

        return note;
      });

      const voice = new Voice({
        numBeats: 4,
        beatValue: 4,
      }).setMode(Voice.Mode.SOFT);

      voice.addTickables(vexNotes);
      new Formatter().joinVoices([voice]).format([voice], width - 80);
      voice.draw(context, stave);
    } catch (e) {
      console.warn('VexFlow rendering error:', e);
    }
  }, [noteData, exerciseType, revealed]);

  return (
    <div className="notation-container">
      <div ref={containerRef} className="notation-svg" />
    </div>
  );
}
