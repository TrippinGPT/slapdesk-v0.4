import { BeatData, TrackType } from '../types';
import { SESSION_SCHEMA_VERSION, SlapDeskSession, VariationId } from './sessionTypes';

const VARIATIONS: VariationId[] = ['V1', 'V2', 'V3'];
const TRACKS: TrackType[] = ['melody', 'keys', 'bass808', 'kick', 'snare', 'hihat'];
const SCALES = ['natural_minor', 'harmonic_minor', 'phrygian', 'dorian'];

export class InvalidSessionError extends Error {
  constructor(message: string) { super(message); this.name = 'InvalidSessionError'; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validConfig(config: Record<string, unknown>): boolean {
  const bounded = ['density', 'darkness', 'vocalSpace', 'bassMovement', 'swing'];
  return Number.isInteger(config.seed) && Number.isFinite(config.bpm) && Number(config.bpm) >= 20 && Number(config.bpm) <= 300 &&
    typeof config.rootKey === 'string' && config.rootKey.length > 0 && SCALES.includes(String(config.scale)) &&
    VARIATIONS.includes(config.variation as VariationId) && bounded.every(key => Number.isFinite(config[key]) && Number(config[key]) >= 0 && Number(config[key]) <= 100) &&
    ['phraseFamilyId', 'kickFamilyId', 'bassFamilyId', 'hatFamilyId'].every(key => Number.isInteger(config[key]) && Number(config[key]) >= 1) &&
    (config.melodyPersonalityId === undefined || typeof config.melodyPersonalityId === 'string') &&
    (config.recookIntent === undefined || typeof config.recookIntent === 'string');
}

function validateBeat(raw: unknown): raw is BeatData {
  if (!isRecord(raw) || !isRecord(raw.config) || !isRecord(raw.tracks)) return false;
  const config = raw.config;
  if (!validConfig(config)) return false;
  const tracksValid = TRACKS.every(id => {
    const track = raw.tracks[id];
    return isRecord(track) && track.id === id && typeof track.name === 'string' &&
      (track.color === undefined || typeof track.color === 'string') &&
      Number.isInteger(track.channel) && Array.isArray(track.notes) && track.notes.every(note =>
        isRecord(note) && Number.isInteger(note.step) && Number(note.step) >= 0 && Number(note.step) < 128 &&
        Number.isInteger(note.bar) && Number(note.bar) >= 0 && Number(note.bar) < 8 &&
        Number.isInteger(note.stepInBar) && Number(note.stepInBar) >= 0 && Number(note.stepInBar) < 16 &&
        Number(note.step) === Number(note.bar) * 16 + Number(note.stepInBar) &&
        Number.isInteger(note.pitch) && Number(note.pitch) >= 0 && Number(note.pitch) <= 127 &&
        Number.isFinite(note.duration) && Number(note.duration) > 0 && Number.isFinite(note.velocity) &&
        Number.isInteger(note.velocity) && Number(note.velocity) >= 0 && Number(note.velocity) <= 127);
  });
  const barsValid = Array.isArray(raw.barStructure) && raw.barStructure.length === 8 && raw.barStructure.every(bar =>
    isRecord(bar) && Number.isInteger(bar.barIndex) && typeof bar.role === 'string' && typeof bar.description === 'string');
  const diagnosticsValid = (raw.melodyQuality === undefined || (isRecord(raw.melodyQuality) &&
    ['totalAttacks', 'uniquePitchCount', 'anchorPitchRecurrence', 'emptySpacePercentage', 'antiGenericScore'].every(key => Number.isFinite(raw.melodyQuality![key])) &&
    typeof raw.melodyQuality.passed === 'boolean')) &&
    (raw.melodyPersonalityName === undefined || typeof raw.melodyPersonalityName === 'string') &&
    (raw.melodyMotifName === undefined || typeof raw.melodyMotifName === 'string');
  return tracksValid && barsValid && diagnosticsValid;
}

/** Central migration and trust boundary for records read from IndexedDB or JSON. */
export function migrateSession(raw: unknown): SlapDeskSession {
  if (!isRecord(raw)) throw new InvalidSessionError('Session record is not an object.');
  if (raw.schemaVersion !== SESSION_SCHEMA_VERSION) {
    throw new InvalidSessionError(`Unsupported session schema version: ${String(raw.schemaVersion)}.`);
  }
  if (typeof raw.id !== 'string' || raw.id.length < 1 || raw.id.length > 200) throw new InvalidSessionError('Session ID is invalid.');
  if (typeof raw.name !== 'string' || !raw.name.trim()) throw new InvalidSessionError('Session name is invalid.');
  const variationsRaw = isRecord(raw.variations) ? raw.variations : null;
  if (!variationsRaw) throw new InvalidSessionError('Session variations are missing.');
  const selected = raw.selectedVariation;
  if (!VARIATIONS.includes(selected as VariationId)) throw new InvalidSessionError('Selected variation is invalid.');
  const variations: Partial<Record<VariationId, BeatData>> = {};
  for (const variation of VARIATIONS) {
    const value = variationsRaw[variation];
    if (value !== undefined) {
      if (!validateBeat(value) || value.config.variation !== variation) throw new InvalidSessionError(`${variation} contains invalid cookup data.`);
      variations[variation] = value;
    }
  }
  const selectedBeat = variations[selected as VariationId];
  if (!selectedBeat) throw new InvalidSessionError('Selected variation data is missing.');
  if (!isRecord(raw.generatorSettings) || !validConfig(raw.generatorSettings) ||
      Object.keys(selectedBeat.config).some(key => raw.generatorSettings[key] !== (selectedBeat.config as unknown as Record<string, unknown>)[key]) ||
      Object.keys(raw.generatorSettings).some(key => raw.generatorSettings[key] !== (selectedBeat.config as unknown as Record<string, unknown>)[key])) {
    throw new InvalidSessionError('Core generator settings are invalid.');
  }
  if (raw.studioKitReference !== null && typeof raw.studioKitReference !== 'string') throw new InvalidSessionError('Studio Kit reference is invalid.');
  if (raw.referenceDNA !== undefined && (!isRecord(raw.referenceDNA) || typeof raw.referenceDNA.sourceFileName !== 'string' ||
      !['detectedBpm', 'kickDensity', 'bass808Activity', 'hatActivity', 'syncopation', 'phraseRepetition', 'turnaroundSpace', 'darkness', 'vocalSpace']
        .every(key => Number.isFinite(raw.referenceDNA![key])))) throw new InvalidSessionError('Reference profile is invalid.');
  const now = new Date().toISOString();
  const beat = selectedBeat;
  if (raw.referenceDNA !== undefined) beat.referenceDNA = raw.referenceDNA as BeatData['referenceDNA'];
  // Optional v1 fields receive explicit safe defaults at the single migration boundary.
  for (const id of TRACKS) {
    const track = beat.tracks[id];
    if ((track.volume !== undefined && (!Number.isFinite(track.volume) || track.volume < 0 || track.volume > 1.5)) ||
        (track.pan !== undefined && (!Number.isFinite(track.pan) || track.pan < -1 || track.pan > 1)) ||
        (track.enabled !== undefined && typeof track.enabled !== 'boolean') ||
        (track.muted !== undefined && typeof track.muted !== 'boolean') ||
        (track.solo !== undefined && typeof track.solo !== 'boolean') ||
        (track.disabledBars !== undefined && (!Array.isArray(track.disabledBars) || track.disabledBars.some(bar => !Number.isInteger(bar) || bar < 0 || bar > 7)))) {
      throw new InvalidSessionError(`Track settings for ${id} are invalid.`);
    }
    track.volume ??= 1;
    track.pan ??= 0;
    track.muted ??= false;
    track.solo ??= false;
    track.enabled ??= true;
    track.disabledBars ??= [];
  }
  beat.recookCounts ??= {};
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    id: raw.id,
    name: raw.name.trim(),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    generatorSettings: beat.config,
    variations,
    selectedVariation: selected as VariationId,
    ...(beat.referenceDNA ? { referenceDNA: beat.referenceDNA } : {}),
    masterVolume: Number.isFinite(raw.masterVolume) ? Math.min(1.2, Math.max(0, Number(raw.masterVolume))) : 0.85,
    studioKitReference: raw.studioKitReference as string | null,
    keepState: isRecord(raw.keepState)
      ? Object.fromEntries(Object.entries(raw.keepState).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'))
      : {},
  };
}
