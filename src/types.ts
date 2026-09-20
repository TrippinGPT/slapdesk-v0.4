/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScaleType = 'natural_minor' | 'harmonic_minor' | 'phrygian' | 'dorian';

export interface NoteEvent {
  step: number;        // Global step 0..127 (16 steps * 8 bars)
  bar: number;         // Bar 0..7
  stepInBar: number;   // 0..15
  pitch: number;       // MIDI pitch (e.g. 36 = C2 for 808, 60 = C4 for melody)
  duration: number;    // In steps (e.g. 1 = 16th, 2 = 8th, 4 = quarter)
  velocity: number;    // 0..127
  glideTo?: number;    // Pitch bend / glide target pitch (for 808)
  microtiming?: number;// Tick offset (-30 to +30 ticks around grid)
}

export type TrackType = 'melody' | 'keys' | 'bass808' | 'kick' | 'snare' | 'hihat';

export type DawView = 'song_editor' | 'beat_bassline' | 'piano_roll' | 'mixer' | 'generator';

// User/audio configuration survives replacement of generated musical events.
export interface TrackSettings {
  id: TrackType;
  name: string;
  channel: number;     // 0=Melody, 1=Keys, 2=808, 9=Drums
  muted?: boolean;
  solo?: boolean;
  volume?: number;     // 0..1.5 (default 1.0)
  pan?: number;        // -1..1 (0 = center)
  enabled?: boolean;   // optional whole-track disable; absent means enabled
  disabledBars?: number[]; // list of bar indexes (0..7) disabled in song editor
  color?: string;      // Track accent color hex
}

export interface TrackEvents {
  notes: NoteEvent[];
}

// Keep the existing flat shape for editors, playback and MIDI consumers.
export interface BeatTrack extends TrackSettings, TrackEvents {}

export type RecookTarget = 'drums' | '808' | 'music';

export interface BeatConfig {
  seed: number;
  bpm: number;
  rootKey: string;     // e.g. 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  scale: ScaleType;
  density: number;     // 0..100
  darkness: number;    // 0..100
  vocalSpace: number;  // 0..100 (higher = more silence/rests for rapper)
  bassMovement: number;// 0..100 (higher = more bounce, glides, pickups)
  swing: number;       // 0..100 (microtiming late 16ths)
  variation: 'V1' | 'V2' | 'V3';
  phraseFamilyId: number;
  kickFamilyId: number;
  bassFamilyId: number;
  hatFamilyId: number;
  melodyPersonalityId?: string;
  recookIntent?: string;
}

export interface BeatData {
  config: BeatConfig;
  // Lane-local generation history; absent on ordinary, never-recooked cookups.
  recookCounts?: Partial<Record<RecookTarget, number>>;
  tracks: Record<TrackType, BeatTrack>;
  barStructure: {
    barIndex: number; // 0..7
    role: 'A' | 'Response' | 'Variation' | 'Turnaround' | 'Return to A' | 'Response Var' | 'Setup' | 'Turnaround / Space';
    description: string;
  }[];
  referenceDNA?: ReferenceDNA;
  melodyQuality?: {
    totalAttacks: number;
    uniquePitchCount: number;
    anchorPitchRecurrence: number;
    emptySpacePercentage: number;
    antiGenericScore: number;
    passed: boolean;
  };
  melodyPersonalityName?: string;
  melodyMotifName?: string;
}

export interface ReferenceDNA {
  sourceFileName: string;
  detectedBpm: number;
  kickDensity: number;     // 0..100
  bass808Activity: number; // 0..100
  hatActivity: number;     // 0..100
  syncopation: number;     // 0..100
  phraseRepetition: number;// 0..100
  turnaroundSpace: number; // 0..100
  darkness: number;        // 0..100
  vocalSpace: number;      // 0..100
  // Curated Reference Target Metadata
  id?: string;
  title?: string;
  author?: string;
  youtubeUrl?: string;
  category?: 'Detroit Slap' | 'West Coast Swing' | 'Trap Bounce' | 'Atlanta Wave' | 'Custom Upload';
  recommendedKey?: string;
  recommendedScale?: ScaleType;
  recommendedKickFamilyId?: number;
  recommendedHatFamilyId?: number;
  recommendedBassFamilyId?: number;
  recommendedMelodyPersonalityId?: string;
  swing?: number;
  producerTips?: string;
  pocketBreakdown?: string[];
}

export interface SampleKit {
  kick?: AudioBuffer;
  snare?: AudioBuffer;
  clap?: AudioBuffer;
  closedHat?: AudioBuffer;
  openHat?: AudioBuffer;
  percussion?: AudioBuffer;
  bass808?: AudioBuffer;
}

export type StudioKitLane = 'kick' | 'snare' | 'clap' | 'closedHat' | 'openHat' | 'percussion' | 'bass808';

/** Serializable reference and import metadata; audio binary stays in IndexedDB. */
export interface StudioKitAssignment {
  id: string;
  lane: StudioKitLane;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  rootMidi?: number;
  persistenceKey: string;
  importedAt: string;
}

export interface StudioKit {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  assignments: Partial<Record<StudioKitLane, StudioKitAssignment>>;
}

export interface StudioKitLibrary {
  kits: StudioKit[];
  selectedKitId: string | null;
  defaultKitId: string | null;
}

export interface SampleKitNames {
  kick: string;
  snare: string;
  closedHat: string;
  openHat: string;
  bass808: string;
}

export interface QATestResult {
  totalCookups: number;
  totalVariations: number;
  passed: boolean;
  legalMidiOk: boolean;
  sixTracksOk: boolean;
  inKeyBassOk: boolean;
  noFourOnFloorOk: boolean;
  siblingIdentityOk: boolean;
  phraseMemoryOk: boolean;
  seedReproducibilityOk: boolean;
  recookIsolationOk: boolean;
  studioKitNormalizationOk: boolean;
  melodyQualityOk: boolean;
  log: string[];
}
