import { BeatData, NoteEvent, RecookTarget, TrackType } from '../types';
import { generateKickTrack, generateSnareClapTrack, generateHiHatTrack } from './drumsEngine';
import { generate808Track } from './bassEngine';
import { applyMelodyVariation, generateMelodyTrackWithGrammar } from './melodyEngine';
import { generateKeysTrack } from './secondaryEngine';
import { evaluateMelodyQuality } from './melodyQuality';

// Only event arrays may cross the generator -> existing track boundary.
export const RECOOK_TRACKS: Record<RecookTarget, readonly TrackType[]> = {
  drums: ['kick', 'snare', 'hihat'],
  '808': ['bass808'],
  music: ['melody', 'keys'],
};

function varyPocket(notes: NoteEvent[], revision: number, seed: number, track: TrackType): NoteEvent[] {
  return notes.map((note, index) => {
    const phraseBar = track === 'melody' && note.bar === 4 ? 0 : note.bar;
    const accent = ((revision + phraseBar + note.stepInBar) % 7) - 3;
    const next = { ...note, velocity: Math.max(1, Math.min(127, note.velocity + accent)) };
    // Keep the motif/home bars and clap backbeats intact. Move selected pickups
    // by one sixteenth only when the destination has room for the original note.
    if (note.bar === 0 || note.bar === 4 || track === 'melody' || track === 'keys' ||
        (track === 'snare' && note.pitch === 39) || (index + seed + revision) % 3 !== 0) return next;
    const step = note.step + (revision % 2 === 0 ? -1 : 1);
    const barStart = note.bar * 16;
    if (step < barStart || step + note.duration > barStart + 16) return next;
    const overlaps = notes.some((other, otherIndex) => otherIndex !== index &&
      step < other.step + other.duration && step + note.duration > other.step);
    if (overlaps) return next;
    return { ...next, step, stepInBar: step - barStart };
  });
}

function freshEvents(notes: NoteEvent[], previous: NoteEvent[], track: TrackType): NoteEvent[] {
  // Different seeds can select the same motif; even a one-note lane must change.
  // An intentionally silent lane stays silent (e.g. keys at extreme vocal space).
  if (notes.length && JSON.stringify(notes) === JSON.stringify(previous)) {
    return notes.map(n => track === 'melody' && (n.bar === 0 || n.bar === 4)
      ? n
      : { ...n, velocity: n.velocity === 127 ? 126 : n.velocity + 1 });
  }
  return notes;
}

export function recookBeat(beat: BeatData, target: RecookTarget): BeatData {
  const c = beat.config;
  const revision = (beat.recookCounts?.[target] ?? 0) + 1;
  const seed = (c.seed + revision * 104729) >>> 0;
  const events: Partial<Record<TrackType, NoteEvent[]>> = {};
  let musicMetadata: Partial<Pick<BeatData,
    'melodyPersonalityName' | 'melodyMotifName' | 'melodyQuality'>> = {};

  if (target === 'drums') {
    events.kick = generateKickTrack(c.kickFamilyId, c.density, c.swing, c.vocalSpace, c.variation);
    events.snare = generateSnareClapTrack(c.phraseFamilyId, c.vocalSpace, c.variation);
    events.hihat = generateHiHatTrack(c.hatFamilyId, c.density, c.swing, c.vocalSpace, c.variation);
  } else if (target === '808') {
    events.bass808 = generate808Track(c.bassFamilyId, c.rootKey, c.scale, c.bassMovement, c.vocalSpace, c.variation);
  } else {
    // Candidate acceptance must be identical for siblings. Select as V1, then
    // apply the existing sibling rules instead of independently retrying V2/V3.
    const melody = generateMelodyTrackWithGrammar({
      ...c, seed, variation: 'V1',
      personalityId: c.melodyPersonalityId as Parameters<typeof generateMelodyTrackWithGrammar>[0]['personalityId'],
      recookIntent: c.recookIntent as Parameters<typeof generateMelodyTrackWithGrammar>[0]['recookIntent'],
      active808Pitches: beat.tracks.bass808.notes.map(n => n.pitch),
    });
    events.melody = applyMelodyVariation(melody.notes, c.variation, melody.personality);
    events.keys = generateKeysTrack(c.rootKey, c.scale, seed, c.density, c.darkness, c.vocalSpace, c.variation, events.melody.map(n => n.step));
    musicMetadata = {
      melodyPersonalityName: melody.personality.name,
      melodyMotifName: melody.motifCell.name,
      melodyQuality: evaluateMelodyQuality(events.melody, melody.anchorMidis),
    };
  }

  const tracks = { ...beat.tracks };
  for (const id of RECOOK_TRACKS[target]) {
    const notes = freshEvents(varyPocket(events[id]!, revision, c.seed, id), beat.tracks[id].notes, id);
    tracks[id] = { ...beat.tracks[id], notes };
  }
  return {
    ...beat,
    ...musicMetadata,
    tracks,
    recookCounts: { ...beat.recookCounts, [target]: revision },
  };
}
