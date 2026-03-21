import type { InstrumentName } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/translations';
import type { Language } from '../i18n/translations';

interface Props {
  instrument: InstrumentName;
  onInstrumentChange: (instrument: InstrumentName) => void;
}

const INSTRUMENTS: { value: InstrumentName; labelKey: string }[] = [
  { value: 'piano', labelKey: 'instrument.piano' },
  { value: 'guitar', labelKey: 'instrument.guitar' },
  { value: 'violin', labelKey: 'instrument.violin' },
  { value: 'cello', labelKey: 'instrument.cello' },
  { value: 'strings', labelKey: 'instrument.strings' },
  { value: 'brass', labelKey: 'instrument.brass' },
  { value: 'saxophone', labelKey: 'instrument.saxophone' },
  { value: 'flute', labelKey: 'instrument.flute' },
  { value: 'organ', labelKey: 'instrument.organ' },
  { value: 'marimba', labelKey: 'instrument.marimba' },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

export default function Settings({ instrument, onInstrumentChange }: Props) {
  const { lang, setLang } = useLanguage();

  return (
    <div className="settings-bar">
      <label className="instrument-label">
        {t('settings.instrument', lang)}
        <select
          value={instrument}
          onChange={e => onInstrumentChange(e.target.value as InstrumentName)}
          className="instrument-select"
        >
          {INSTRUMENTS.map(inst => (
            <option key={inst.value} value={inst.value}>
              {t(inst.labelKey as any, lang)}
            </option>
          ))}
        </select>
      </label>
      <label className="instrument-label">
        {t('settings.language', lang)}
        <select
          value={lang}
          onChange={e => setLang(e.target.value as Language)}
          className="instrument-select"
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
