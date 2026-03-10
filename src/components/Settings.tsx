import type { InstrumentName } from '../types';

interface Props {
  instrument: InstrumentName;
  onInstrumentChange: (instrument: InstrumentName) => void;
}

const INSTRUMENTS: { value: InstrumentName; label: string }[] = [
  { value: 'piano', label: 'Piano' },
  { value: 'guitar', label: 'Guitar' },
  { value: 'violin', label: 'Violin' },
  { value: 'cello', label: 'Cello' },
  { value: 'strings', label: 'String Ensemble' },
  { value: 'brass', label: 'Trumpet' },
  { value: 'saxophone', label: 'Saxophone' },
  { value: 'flute', label: 'Flute' },
  { value: 'organ', label: 'Church Organ' },
  { value: 'marimba', label: 'Marimba' },
];

export default function Settings({ instrument, onInstrumentChange }: Props) {
  return (
    <div className="settings-bar">
      <label className="instrument-label">
        Instrument:
        <select
          value={instrument}
          onChange={e => onInstrumentChange(e.target.value as InstrumentName)}
          className="instrument-select"
        >
          {INSTRUMENTS.map(inst => (
            <option key={inst.value} value={inst.value}>
              {inst.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
