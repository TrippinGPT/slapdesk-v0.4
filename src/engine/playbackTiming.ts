import { TrackType } from '../types';

/** Playback-only timing helpers. Generated event positions remain on the MIDI grid. */
export function swingOffsetSeconds(
  step: number,
  bpm: number,
  swing: number,
  track: TrackType
): number {
  const stepInBar = ((step % 16) + 16) % 16;
  // Delay the offbeat eighths (& after each beat). Quarter-note anchors,
  // snare/clap backbeats, and the intervening 16ths remain fixed.
  if (track === 'snare' || stepInBar % 4 !== 2) return 0;
  const amount = Math.max(0, Math.min(100, swing)) / 100;
  // delay = (60 / BPM / 4) * 0.5 * (swing / 100)
  return ((60 / bpm) / 4) * 0.5 * amount;
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
