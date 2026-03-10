import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Dot } from 'vexflow';
import type { RhythmChoice } from '../types';

interface Props {
  choice: RhythmChoice;
}

export default function RhythmChoiceNotation({ choice }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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

      const voice = new Voice({
        numBeats: 4,
        beatValue: 4,
      }).setMode(Voice.Mode.SOFT);

      voice.addTickables(vexNotes);
      new Formatter().joinVoices([voice]).format([voice], width - 60);
      voice.draw(context, stave);
    } catch (e) {
      console.warn('VexFlow rendering error:', e);
    }
  }, [choice]);

  return <div ref={containerRef} className="rhythm-choice-notation" />;
}
