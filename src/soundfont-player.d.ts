declare module 'soundfont-player' {
  interface Player {
    play(note: string, when?: number, options?: PlayOptions): AudioNode;
    stop(): void;
  }

  interface PlayOptions {
    duration?: number;
    gain?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
  }

  type InstrumentName = string;
  type SoundFontType = string;

  interface InstrumentOptions {
    soundfont?: SoundFontType;
    nameToUrl?: (name: string, soundfont: string, format: string) => string;
    gain?: number;
  }

  namespace Soundfont {
    export type Player = import('soundfont-player').Player;
    export type InstrumentName = import('soundfont-player').InstrumentName;
    export function instrument(
      ac: AudioContext,
      name: InstrumentName,
      options?: InstrumentOptions
    ): Promise<Player>;
  }

  export = Soundfont;
}
