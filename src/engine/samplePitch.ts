/** Playback rate for a pitched sample. MIDI 36 is C2 and is the 808 default root. */
export const DEFAULT_808_ROOT_MIDI = 36;

export function samplePlaybackRate(targetMidi: number, rootMidi: number): number {
  return 2 ** ((targetMidi - rootMidi) / 12);
}
