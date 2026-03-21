export type Language = 'en' | 'es';

const translations = {
  // HomeScreen
  'app.title': { en: 'Ear Trainer', es: 'Entrenador Auditivo' },
  'app.subtitle': {
    en: 'Train your musical ear with intervals, chords, rhythms, and progressions',
    es: 'Entrena tu oído musical con intervalos, acordes, ritmos y progresiones',
  },
  'app.currentInstrument': { en: 'Current instrument:', es: 'Instrumento actual:' },

  // Exercise types
  'exercise.intervals': { en: 'Intervals', es: 'Intervalos' },
  'exercise.intervals.desc': { en: 'Identify intervals up to 2 octaves', es: 'Identifica intervalos hasta 2 octavas' },
  'exercise.chords': { en: 'Chord Quality', es: 'Calidad de Acorde' },
  'exercise.chords.desc': { en: 'Identify chord types by ear', es: 'Identifica tipos de acordes de oído' },
  'exercise.rhythm': { en: 'Rhythm', es: 'Ritmo' },
  'exercise.rhythm.desc': { en: 'Identify rhythm patterns', es: 'Identifica patrones rítmicos' },
  'exercise.secondaryDominants': { en: 'Secondary Dominants', es: 'Dominantes Secundarios' },
  'exercise.secondaryDominants.desc': {
    en: 'Identify secondary dominants in progressions',
    es: 'Identifica dominantes secundarios en progresiones',
  },

  // Difficulty
  'difficulty.select': { en: 'Select Difficulty', es: 'Selecciona Dificultad' },
  'difficulty.easy': { en: 'Easy', es: 'Fácil' },
  'difficulty.medium': { en: 'Medium', es: 'Medio' },
  'difficulty.hard': { en: 'Hard', es: 'Difícil' },

  // Difficulty info - intervals
  'difficulty.intervals.easy': {
    en: 'Common intervals within 1 octave (m3, M3, P4, P5, P8)',
    es: 'Intervalos comunes dentro de 1 octava (m3, M3, P4, P5, P8)',
  },
  'difficulty.intervals.medium': {
    en: 'All intervals within 1 octave',
    es: 'Todos los intervalos dentro de 1 octava',
  },
  'difficulty.intervals.hard': {
    en: 'All intervals up to 2 octaves',
    es: 'Todos los intervalos hasta 2 octavas',
  },

  // Difficulty info - chords
  'difficulty.chords.easy': {
    en: 'Major, Minor, Diminished, Augmented',
    es: 'Mayor, Menor, Disminuido, Aumentado',
  },
  'difficulty.chords.medium': {
    en: '+ Dominant 7th, Major 7th, Minor 7th',
    es: '+ Dominante 7ª, Mayor 7ª, Menor 7ª',
  },
  'difficulty.chords.hard': {
    en: '+ Dim7, Half-Dim7, Aug7, Sus2, Sus4',
    es: '+ Dim7, Semi-Dim7, Aug7, Sus2, Sus4',
  },

  // Difficulty info - rhythm
  'difficulty.rhythm.easy': {
    en: 'Whole, half, and quarter notes',
    es: 'Notas redondas, blancas y negras',
  },
  'difficulty.rhythm.medium': {
    en: 'Eighths, triplets, dotted rhythms + grooves (Rock, Shuffle, Bossa Nova, 3:2)',
    es: 'Corcheas, tresillos, ritmos con puntillo + grooves (Rock, Shuffle, Bossa Nova, 3:2)',
  },
  'difficulty.rhythm.hard': {
    en: '16ths, syncopation + polyrhythms (3:4, 4:3) and claves (Son, Rumba, Samba, Afro-Cuban)',
    es: 'Semicorcheas, síncopa + polirritmias (3:4, 4:3) y claves (Son, Rumba, Samba, Afrocubano)',
  },

  // Difficulty info - secondary dominants
  'difficulty.secdom.easy': { en: 'V7/V, V7/IV, V7/ii', es: 'V7/V, V7/IV, V7/ii' },
  'difficulty.secdom.medium': { en: '+ V7/vi, V7/iii', es: '+ V7/vi, V7/iii' },
  'difficulty.secdom.hard': {
    en: '+ Tritone subs (SubV7/I), V7/bVII',
    es: '+ Sustituciones de tritono (SubV7/I), V7/bVII',
  },

  // Playing Changes link
  'playingChanges': { en: 'Playing Changes', es: 'Tocando Cambios' },

  // ExerciseView
  'exercise.back': { en: '← Back', es: '← Volver' },
  'exercise.playAgain': { en: '▶ Play Again', es: '▶ Reproducir' },
  'exercise.playing': { en: '♪ Playing...', es: '♪ Reproduciendo...' },
  'exercise.extensionsOn': { en: '♫ Extensions On', es: '♫ Extensiones Sí' },
  'exercise.extensionsOff': { en: '♫ Extensions Off', es: '♫ Extensiones No' },
  'exercise.arpeggioOn': { en: '♪ Arpeggio On', es: '♪ Arpegio Sí' },
  'exercise.arpeggioOff': { en: '♪ Arpeggio Off', es: '♪ Arpegio No' },
  'exercise.countInOn': { en: 'Count-in On', es: 'Cuenta Sí' },
  'exercise.countInOff': { en: 'Count-in Off', es: 'Cuenta No' },
  'exercise.notation': { en: '♩ Notation', es: '♩ Notación' },
  'exercise.grid': { en: '▦ Grid', es: '▦ Cuadrícula' },
  'exercise.streak': { en: 'streak', es: 'racha' },
  'exercise.correct': { en: 'Correct!', es: '¡Correcto!' },
  'exercise.gotIt': { en: 'Got it! (not on the first try)', es: '¡Acertaste! (no al primer intento)' },
  'exercise.nextQuestion': { en: 'Next Question →', es: 'Siguiente Pregunta →' },
  'exercise.sound': { en: 'Sound:', es: 'Sonido:' },
  'exercise.groove': { en: 'Groove:', es: 'Groove:' },
  'exercise.youPicked': { en: 'you picked', es: 'elegiste' },
  'exercise.soundPrompt': {
    en: 'What sound does this secondary dominant have?',
    es: '¿Qué sonido tiene este dominante secundario?',
  },
  'exercise.groovePrompt': {
    en: 'What groove or polyrhythm is this?',
    es: '¿Qué groove o polirritmia es este?',
  },

  // Question prompts
  'prompt.interval': { en: 'What interval is this?', es: '¿Qué intervalo es este?' },
  'prompt.chord': { en: 'What chord quality is this?', es: '¿Qué calidad de acorde es esta?' },
  'prompt.root': { en: 'Root:', es: 'Raíz:' },
  'prompt.rhythm': { en: 'What rhythm pattern do you hear?', es: '¿Qué patrón rítmico escuchas?' },
  'prompt.beat': { en: 'What beat do you hear?', es: '¿Qué ritmo escuchas?' },
  'prompt.secdom': { en: 'which secondary dominant do you hear?', es: '¿qué dominante secundario escuchas?' },
  'prompt.keyOf': { en: 'Key of', es: 'Tonalidad de' },
  'prompt.major': { en: 'major', es: 'mayor' },

  // Settings
  'settings.instrument': { en: 'Instrument:', es: 'Instrumento:' },
  'settings.language': { en: 'Language:', es: 'Idioma:' },
  'instrument.piano': { en: 'Piano', es: 'Piano' },
  'instrument.guitar': { en: 'Guitar', es: 'Guitarra' },
  'instrument.violin': { en: 'Violin', es: 'Violín' },
  'instrument.cello': { en: 'Cello', es: 'Violonchelo' },
  'instrument.strings': { en: 'String Ensemble', es: 'Ensamble de Cuerdas' },
  'instrument.brass': { en: 'Trumpet', es: 'Trompeta' },
  'instrument.saxophone': { en: 'Saxophone', es: 'Saxofón' },
  'instrument.flute': { en: 'Flute', es: 'Flauta' },
  'instrument.organ': { en: 'Church Organ', es: 'Órgano de Iglesia' },
  'instrument.marimba': { en: 'Marimba', es: 'Marimba' },

  // Intervals
  'interval.Unison': { en: 'Unison', es: 'Unísono' },
  'interval.Minor 2nd': { en: 'Minor 2nd', es: '2ª Menor' },
  'interval.Major 2nd': { en: 'Major 2nd', es: '2ª Mayor' },
  'interval.Minor 3rd': { en: 'Minor 3rd', es: '3ª Menor' },
  'interval.Major 3rd': { en: 'Major 3rd', es: '3ª Mayor' },
  'interval.Perfect 4th': { en: 'Perfect 4th', es: '4ª Justa' },
  'interval.Tritone': { en: 'Tritone', es: 'Tritono' },
  'interval.Perfect 5th': { en: 'Perfect 5th', es: '5ª Justa' },
  'interval.Minor 6th': { en: 'Minor 6th', es: '6ª Menor' },
  'interval.Major 6th': { en: 'Major 6th', es: '6ª Mayor' },
  'interval.Minor 7th': { en: 'Minor 7th', es: '7ª Menor' },
  'interval.Major 7th': { en: 'Major 7th', es: '7ª Mayor' },
  'interval.Octave': { en: 'Octave', es: 'Octava' },
  'interval.Minor 9th': { en: 'Minor 9th', es: '9ª Menor' },
  'interval.Major 9th': { en: 'Major 9th', es: '9ª Mayor' },
  'interval.Minor 10th': { en: 'Minor 10th', es: '10ª Menor' },
  'interval.Major 10th': { en: 'Major 10th', es: '10ª Mayor' },
  'interval.Perfect 11th': { en: 'Perfect 11th', es: '11ª Justa' },
  'interval.Augmented 11th': { en: 'Augmented 11th', es: '11ª Aumentada' },
  'interval.Perfect 12th': { en: 'Perfect 12th', es: '12ª Justa' },
  'interval.Minor 13th': { en: 'Minor 13th', es: '13ª Menor' },
  'interval.Major 13th': { en: 'Major 13th', es: '13ª Mayor' },
  'interval.Minor 14th': { en: 'Minor 14th', es: '14ª Menor' },
  'interval.Major 14th': { en: 'Major 14th', es: '14ª Mayor' },
  'interval.2 Octaves': { en: '2 Octaves', es: '2 Octavas' },

  // Chord qualities
  'chord.Major': { en: 'Major', es: 'Mayor' },
  'chord.Minor': { en: 'Minor', es: 'Menor' },
  'chord.Diminished': { en: 'Diminished', es: 'Disminuido' },
  'chord.Augmented': { en: 'Augmented', es: 'Aumentado' },
  'chord.Dominant 7th': { en: 'Dominant 7th', es: 'Dominante 7ª' },
  'chord.Major 7th': { en: 'Major 7th', es: 'Mayor 7ª' },
  'chord.Minor 7th': { en: 'Minor 7th', es: 'Menor 7ª' },
  'chord.Diminished 7th': { en: 'Diminished 7th', es: 'Disminuido 7ª' },
  'chord.Half-Diminished 7th': { en: 'Half-Diminished 7th', es: 'Semidisminuido 7ª' },
  'chord.Augmented 7th': { en: 'Augmented 7th', es: 'Aumentado 7ª' },
  'chord.Sus2': { en: 'Sus2', es: 'Sus2' },
  'chord.Sus4': { en: 'Sus4', es: 'Sus4' },

  // Circle of Fifths
  'cof.key': { en: 'Key:', es: 'Tonalidad:' },
  'cof.resetToC': { en: 'Reset to C', es: 'Volver a Do' },
  'cof.clickArrow': { en: 'click an arrow', es: 'haz clic en una flecha' },
  'cof.toHearIt': { en: 'to hear it', es: 'para escucharlo' },

  // Playing Changes page
  'pc.back': { en: 'Back', es: 'Volver' },
  'pc.title': { en: 'Playing Changes', es: 'Tocando Cambios' },
  'pc.subtitle': {
    en: 'Secondary dominant extensions — what they are, why they work, and how they sound. All examples in the key of C major.',
    es: 'Extensiones de dominantes secundarios — qué son, por qué funcionan y cómo suenan. Todos los ejemplos en la tonalidad de Do mayor.',
  },
  'pc.whatIsSecDom': { en: "What's a Secondary Dominant?", es: '¿Qué es un Dominante Secundario?' },
  'pc.whatIsSecDom.p1': {
    en: 'In any major key, the V7 chord naturally wants to resolve to I. A secondary dominant borrows that same pull and points it at a different chord in the key. V7/V is a dominant 7th built to resolve to the V chord; V7/ii resolves to ii; and so on. They\'re "temporary key changes" — your ear briefly hears a new tonal center before snapping back.',
    es: 'En cualquier tonalidad mayor, el acorde V7 naturalmente quiere resolver a I. Un dominante secundario toma esa misma atracción y la dirige a otro acorde de la tonalidad. V7/V es un acorde de dominante 7ª construido para resolver al acorde V; V7/ii resuelve a ii; y así sucesivamente. Son "cambios temporales de tonalidad" — tu oído brevemente escucha un nuevo centro tonal antes de regresar.',
  },
  'pc.whatIsSecDom.p2': {
    en: "What makes each one sound different isn't the dom7 shell (they all have root, 3, 5, b7) — it's the extensions on top. Those color tones come from the scale that fits the chord's resolution, and they fall into three categories.",
    es: 'Lo que hace que cada uno suene diferente no es la estructura de dom7 (todos tienen fundamental, 3ª, 5ª, b7ª) — son las extensiones encima. Esos tonos de color vienen de la escala que se ajusta a la resolución del acorde, y caen en tres categorías.',
  },
  'pc.colorDest': { en: 'Color → Destination', es: 'Color → Destino' },
  'pc.colorDest.intro': {
    en: "The goal isn't to memorize which extensions go where — it's to hear the color:",
    es: 'El objetivo no es memorizar qué extensiones van a dónde — es escuchar el color:',
  },
  'pc.colorDest.mixo': {
    en: "Mixolydian — sounds like home turned dominant. It's the blues.",
    es: 'Mixolidio — suena como el hogar convertido en dominante. Es el blues.',
  },
  'pc.colorDest.lyddom': {
    en: "Lydian Dominant — sounds like it's floating above the key. Bright but not inside.",
    es: 'Lidio Dominante — suena como si flotara sobre la tonalidad. Brillante pero no dentro.',
  },
  'pc.colorDest.altered': {
    en: 'Altered — sounds like maximum tension. Dark, chromatic, pulling hard toward resolution.',
    es: 'Alterado — suena como tensión máxima. Oscuro, cromático, tirando fuerte hacia la resolución.',
  },
  'pc.colorDest.wholetone': {
    en: 'Whole Tone — shimmery and symmetrical. Floating with no strong pull in any direction.',
    es: 'Tono Entero — brillante y simétrico. Flotando sin fuerte atracción en ninguna dirección.',
  },
  'pc.colorDest.outro': {
    en: "The chord structure (dom7) is the same for all secondary dominants — the color on top tells your ear where it wants to go.",
    es: 'La estructura del acorde (dom7) es la misma para todos los dominantes secundarios — el color encima le dice a tu oído a dónde quiere ir.',
  },
  'pc.chart': { en: 'The Chart', es: 'La Tabla' },
  'pc.chart.chord': { en: 'Chord', es: 'Acorde' },
  'pc.chart.label': { en: 'Label', es: 'Etiqueta' },
  'pc.chart.example': { en: 'Example', es: 'Ejemplo' },
  'pc.chart.sound': { en: 'Sound', es: 'Sonido' },
  'pc.chart.extensions': { en: 'Extensions', es: 'Extensiones' },
  'pc.setup': { en: 'The Setup', es: 'La Preparación' },
  'pc.setup.p1': {
    en: 'Every example plays: Imaj7 → ii7 → V7 → Imaj7 → [SecDom] → [Target]',
    es: 'Cada ejemplo reproduce: Imaj7 → ii7 → V7 → Imaj7 → [DomSec] → [Destino]',
  },
  'pc.setup.p2': {
    en: "The first four chords establish the key. Then the secondary dominant arrives with its extension color tones, and your ear hears the sound category — mixolydian, lydian dominant, or altered — which tells you where it wants to resolve.",
    es: 'Los primeros cuatro acordes establecen la tonalidad. Luego llega el dominante secundario con sus tonos de color de extensión, y tu oído escucha la categoría de sonido — mixolidio, lidio dominante o alterado — que te dice a dónde quiere resolver.',
  },
  'pc.extIntervals': { en: 'Extension Intervals', es: 'Intervalos de Extensión' },
  'pc.semitones': { en: 'semitones', es: 'semitonos' },
  'pc.extensions': { en: 'Extensions:', es: 'Extensiones:' },
  'pc.whyExtensions': { en: 'Why these extensions?', es: '¿Por qué estas extensiones?' },
  'pc.hearIt': { en: 'Hear it', es: 'Escúchalo' },
  'pc.whereHeard': { en: "Where you've heard it", es: 'Dónde lo has escuchado' },
  'pc.fullProgression': { en: 'Full Progression', es: 'Progresión Completa' },
  'pc.justChord': { en: 'Just the Chord', es: 'Solo el Acorde' },
  'pc.noExtensions': { en: 'No Extensions', es: 'Sin Extensiones' },
  'pc.dualPersonality': { en: 'The Dual Personality Chords', es: 'Los Acordes de Doble Personalidad' },
  'pc.dualPersonality.desc': {
    en: 'V7/V and V7/IV can sound either Mixolydian or Lydian Dominant — both work. Mixolydian is bluesy and inside; Lydian Dominant is polished and lifted. Compare them side by side.',
    es: 'V7/V y V7/IV pueden sonar Mixolidio o Lidio Dominante — ambos funcionan. Mixolidio es blusero y dentro; Lidio Dominante es pulido y elevado. Compáralos lado a lado.',
  },
  'pc.playMixo': { en: 'Play Mixolydian', es: 'Reproducir Mixolidio' },
  'pc.playLydDom': { en: 'Play Lydian Dom', es: 'Reproducir Lidio Dom' },
  'pc.circle': { en: 'The Circle', es: 'El Círculo' },
  'pc.circle.desc': {
    en: 'Secondary dominants resolve clockwise (down a fifth). Tritone subs sit across the circle and resolve down a half step. Click any arrow to hear the full progression.',
    es: 'Los dominantes secundarios resuelven en sentido horario (bajando una quinta). Las sustituciones de tritono se ubican al otro lado del círculo y resuelven bajando un semitono. Haz clic en cualquier flecha para escuchar la progresión completa.',
  },

  // Sound category names (used in exercises and PlayingChanges)
  'sound.Mixolydian': { en: 'Mixolydian', es: 'Mixolidio' },
  'sound.Lydian Dominant': { en: 'Lydian Dominant', es: 'Lidio Dominante' },
  'sound.Altered': { en: 'Altered', es: 'Alterado' },
  'sound.Whole Tone': { en: 'Whole Tone', es: 'Tono Entero' },

  // Sound group descriptions
  'soundGroup.mixo.desc': {
    en: "Bright, bluesy, uncomplicated. The extensions all come from the mixolydian mode — no surprise notes.",
    es: 'Brillante, blusero, sin complicaciones. Las extensiones provienen del modo mixolidio — sin notas sorpresa.',
  },
  'soundGroup.mixo.vibe': {
    en: 'Think Jerry Garcia on Fire on the Mountain, or any classic rock dominant vamp.',
    es: 'Piensa en Jerry Garcia en Fire on the Mountain, o cualquier vamp dominante de rock clásico.',
  },
  'soundGroup.mixo.why1': {
    en: 'These are all diatonic — they sit inside the parent major scale without alteration.',
    es: 'Todas son diatónicas — se ubican dentro de la escala mayor sin alteración.',
  },
  'soundGroup.mixo.why2': {
    en: 'The natural 11 works here because in a mixolydian context the chord functions more as a modal sound than a hard V-I resolution.',
    es: 'La 11ª natural funciona aquí porque en un contexto mixolidio el acorde funciona más como un sonido modal que como una resolución dura V-I.',
  },
  'soundGroup.mixo.why3': {
    en: 'This is the most "inside" a secondary dominant can sound.',
    es: 'Este es el sonido más "dentro" que puede tener un dominante secundario.',
  },
  'soundGroup.mixo.ref1.title': { en: 'Fire on the Mountain', es: 'Fire on the Mountain' },
  'soundGroup.mixo.ref1.desc': {
    en: 'Grateful Dead — B7 vamp with a mixolydian feel',
    es: 'Grateful Dead — vamp de B7 con sensación mixolidia',
  },
  'soundGroup.mixo.ref2.title': { en: 'Blues turnarounds', es: 'Turnarounds de blues' },
  'soundGroup.mixo.ref2.desc': {
    en: 'I7 → IV7 → V7, all mixolydian dominant sounds',
    es: 'I7 → IV7 → V7, todos sonidos de dominante mixolidio',
  },
  'soundGroup.mixo.ref3.title': { en: 'Everyday', es: 'Everyday' },
  'soundGroup.mixo.ref3.desc': {
    en: 'Buddy Holly — D → A7 → D, pure mixolydian color',
    es: 'Buddy Holly — D → A7 → D, color mixolidio puro',
  },

  'soundGroup.lyddom.desc': {
    en: "Floating, bright but sophisticated. The #11 gives it a lifted quality — not as dark as altered, not as plain as mixolydian.",
    es: 'Flotante, brillante pero sofisticado. La #11 le da una cualidad elevada — no tan oscuro como alterado, no tan simple como mixolidio.',
  },
  'soundGroup.lyddom.vibe': {
    en: 'The definitive tritone substitute color. The #11 signals "I\'m a sub, not a regular dominant."',
    es: 'El color definitivo de sustitución de tritono. La #11 señala "soy un sustituto, no un dominante regular."',
  },
  'soundGroup.lyddom.why1': {
    en: "The lydian dominant scale (4th mode of melodic minor) raises the 11th to avoid the clash with the major 3rd.",
    es: 'La escala lidia dominante (4º modo de la menor melódica) eleva la 11ª para evitar el choque con la 3ª mayor.',
  },
  'soundGroup.lyddom.why2': {
    en: "For SubV7/I: the #11 of the tritone sub is the root of the V7 it's substituting for.",
    es: 'Para SubV7/I: la #11 de la sustitución de tritono es la fundamental del V7 que sustituye.',
  },
  'soundGroup.lyddom.why3': {
    en: 'The extensions of a lydian dominant tritone sub mirror the altered dominant they replace.',
    es: 'Las extensiones de una sustitución de tritono con lidio dominante reflejan el dominante alterado que reemplazan.',
  },
  'soundGroup.lyddom.ref1.title': { en: 'Girl From Ipanema', es: 'Chica de Ipanema' },
  'soundGroup.lyddom.ref1.desc': {
    en: 'The Db7 in the bridge — pure lydian dominant color',
    es: 'El Db7 en el puente — color lidio dominante puro',
  },
  'soundGroup.lyddom.ref2.title': { en: 'Lady Bird', es: 'Lady Bird' },
  'soundGroup.lyddom.ref2.desc': {
    en: 'Tadd Dameron — tritone subs with lydian dominant extensions',
    es: 'Tadd Dameron — sustituciones de tritono con extensiones de lidio dominante',
  },
  'soundGroup.lyddom.ref3.title': { en: 'Steely Dan', es: 'Steely Dan' },
  'soundGroup.lyddom.ref3.desc': {
    en: 'Frequently uses II7 with #11 for that polished, lifted sound',
    es: 'Usa frecuentemente II7 con #11 para ese sonido pulido y elevado',
  },

  'soundGroup.altered.desc': {
    en: "Dark, tense, unstable. Maximum chromaticism against the parent key. Every extension is altered from its natural position.",
    es: 'Oscuro, tenso, inestable. Máximo cromatismo contra la tonalidad principal. Cada extensión está alterada de su posición natural.',
  },
  'soundGroup.altered.vibe': {
    en: 'The sound of bebop and modern jazz tension. These resolve to minor chords (ii, vi, iii).',
    es: 'El sonido del bebop y la tensión del jazz moderno. Resuelven a acordes menores (ii, vi, iii).',
  },
  'soundGroup.altered.why1': {
    en: 'The altered extensions reflect the harmonic minor scale of the target key.',
    es: 'Las extensiones alteradas reflejan la escala menor armónica de la tonalidad destino.',
  },
  'soundGroup.altered.why2': {
    en: "Natural 11 is NOT used — it's a half step above the major 3rd, which sounds wrong rather than tense.",
    es: 'La 11ª natural NO se usa — está a un semitono sobre la 3ª mayor, lo cual suena mal en vez de tenso.',
  },
  'soundGroup.altered.why3': {
    en: 'The b9 is the telltale: it creates a diminished sound against the root that your ear immediately codes as "altered."',
    es: 'La b9 es la señal: crea un sonido disminuido contra la fundamental que tu oído inmediatamente codifica como "alterado."',
  },
  'soundGroup.altered.ref1.title': { en: 'Autumn Leaves', es: 'Autumn Leaves' },
  'soundGroup.altered.ref1.desc': {
    en: 'E7 → Am (V7/vi) — the defining altered sound',
    es: 'E7 → Am (V7/vi) — el sonido alterado por excelencia',
  },
  'soundGroup.altered.ref2.title': { en: 'Stella by Starlight', es: 'Stella by Starlight' },
  'soundGroup.altered.ref2.desc': {
    en: 'Loaded with altered dominants resolving to minor chords',
    es: 'Lleno de dominantes alterados resolviendo a acordes menores',
  },
  'soundGroup.altered.ref3.title': { en: 'Blue Bossa', es: 'Blue Bossa' },
  'soundGroup.altered.ref3.desc': {
    en: 'A7(b9) → Dm — textbook altered secondary dominant',
    es: 'A7(b9) → Dm — dominante secundario alterado de libro',
  },

  'soundGroup.wholetone.desc': {
    en: "Shimmery, symmetrical, floating in space. Every note a whole step apart — no half steps means no strong pull in any direction.",
    es: 'Brillante, simétrico, flotando en el espacio. Cada nota a un tono de distancia — sin semitonos significa sin fuerte atracción en ninguna dirección.',
  },
  'soundGroup.wholetone.vibe': {
    en: 'Thelonious Monk and Wayne Shorter territory. The whole tone scale dissolves tonal gravity.',
    es: 'Territorio de Thelonious Monk y Wayne Shorter. La escala de tonos enteros disuelve la gravedad tonal.',
  },
  'soundGroup.wholetone.why1': {
    en: 'The whole tone scale (C, D, E, F#, G#, A#) naturally produces a dom7 chord with exactly 9, #11, and b13.',
    es: 'La escala de tonos enteros (C, D, E, F#, G#, A#) produce naturalmente un acorde dom7 con exactamente 9, #11 y b13.',
  },
  'soundGroup.wholetone.why2': {
    en: "There's no perfect 5th — it's replaced by #5/b13, giving the chord an augmented quality.",
    es: 'No hay 5ª justa — está reemplazada por #5/b13, dando al acorde una cualidad aumentada.',
  },
  'soundGroup.wholetone.why3': {
    en: 'The symmetry of the scale means every note is equidistant, creating that directionless, dreamlike color.',
    es: 'La simetría de la escala significa que cada nota es equidistante, creando ese color sin dirección y onírico.',
  },
  'soundGroup.wholetone.ref1.title': { en: "Monk's Dream", es: "Monk's Dream" },
  'soundGroup.wholetone.ref1.desc': {
    en: 'Thelonious Monk — whole tone runs over dominant chords',
    es: 'Thelonious Monk — escalas de tonos enteros sobre acordes dominantes',
  },
  'soundGroup.wholetone.ref2.title': { en: 'Juju', es: 'Juju' },
  'soundGroup.wholetone.ref2.desc': {
    en: 'Wayne Shorter — whole tone color over suspended dominants',
    es: 'Wayne Shorter — color de tonos enteros sobre dominantes suspendidos',
  },
  'soundGroup.wholetone.ref3.title': { en: 'Debussy', es: 'Debussy' },
  'soundGroup.wholetone.ref3.desc': {
    en: 'Voiles — the original whole tone sound in Western music',
    es: 'Voiles — el sonido original de tonos enteros en la música occidental',
  },

  // Result messages with templates
  'result.incorrect': { en: 'Incorrect — the answer was', es: 'Incorrecto — la respuesta era' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  const entry = translations[key];
  return entry?.[lang] ?? entry?.['en'] ?? key;
}

// Translate interval names
export function tInterval(name: string, lang: Language): string {
  const key = `interval.${name}` as TranslationKey;
  if (key in translations) return t(key, lang);
  return name;
}

// Translate chord quality names
export function tChord(name: string, lang: Language): string {
  const key = `chord.${name}` as TranslationKey;
  if (key in translations) return t(key, lang);
  return name;
}

// Translate sound names
export function tSound(name: string, lang: Language): string {
  const key = `sound.${name}` as TranslationKey;
  if (key in translations) return t(key, lang);
  return name;
}

export default translations;
