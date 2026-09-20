import { BeatTrack, TrackType } from '../types';

export function clampTrackPan(pan: number | undefined): number {
  return Math.max(-1, Math.min(1, pan ?? 0));
}

export function trackGain(track: BeatTrack | undefined): number {
  return track?.volume === undefined ? 1 : Math.max(0, Math.min(1.5, track.volume));
}

export function isTrackAudible(
  tracks: Record<TrackType, BeatTrack>,
  type: TrackType,
  bar: number
): boolean {
  const track = tracks[type];
  if (!track || track.enabled === false || track.disabledBars?.includes(bar) || track.muted) return false;
  const hasSolo = Object.values(tracks).some(candidate => candidate.solo);
  return !hasSolo || !!track.solo;
}
