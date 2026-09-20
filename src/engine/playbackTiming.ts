import { TrackType } from '../types';

export const MIDI_PPQ = 480;

/** Shared playback and MIDI timing helpers. Generated event positions stay on the MIDI grid. */
export function swingOffsetSeconds(
  step: number,
  bpm: number,
  swing: number,
  track: TrackType
): number {
  const stepInBar = ((step % 16) + 16) % 16;
  // Delay the offbeat eighths (& after each beat). Quarter-note anchors,
  // snare/clap backbeats, and the intervening 16ths remain fixed.
  if (!isSwingableSubdivision(stepInBar, track)) return 0;
  const amount = Math.max(0, Math.min(100, swing)) / 100;
  // delay = (60 / BPM / 4) * 0.5 * (swing / 100)
  return ((60 / bpm) / 4) * 0.5 * amount;
}

/** The one shared subdivision rule used by playback and MIDI serialization. */
export function isSwingableSubdivision(stepInBar: number, track: TrackType): boolean {
  const normalizedStep = ((stepInBar % 16) + 16) % 16;
  return track !== 'snare' && normalizedStep % 4 === 2;
}

/**
 * Quantize the playback swing delay to the nearest MIDI tick. At 480 PPQ the
 * delay is 60 * swing/100 ticks, independent of tempo; rounding occurs once
 * per event, so it cannot accumulate across bars.
 */
export function swingOffsetTicks(
  step: number,
  bpm: number,
  swing: number,
  track: TrackType,
  ppq = MIDI_PPQ
): number {
  if (!isSwingableSubdivision(step, track)) return 0;
  const offsetSeconds = swingOffsetSeconds(step, bpm, swing, track);
  return Math.round(offsetSeconds * (bpm / 60) * ppq);
}

export function scheduledStepTime(
  barStart: number,
  stepInBar: number,
  bpm: number,
  swing: number,
  track: TrackType = 'hihat'
): number {
  const stepDuration = (60 / bpm) / 4;
  return barStart + stepInBar * stepDuration + swingOffsetSeconds(stepInBar, bpm, swing, track);
}
