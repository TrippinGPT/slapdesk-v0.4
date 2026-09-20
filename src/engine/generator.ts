/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BeatConfig, BeatData, BeatTrack, TrackType, ReferenceDNA } from '../types';
import { generateMelodyTrackWithGrammar } from './melodyEngine';
import { generateKeysTrack } from './secondaryEngine';
import { generate808Track } from './bassEngine';
import { generateKickTrack, generateSnareClapTrack, generateHiHatTrack } from './drumsEngine';
import { PHRASE_FAMILIES } from './phraseFamilies';

export function createDefaultConfig(seed?: number): BeatConfig {
  const actualSeed = seed ?? Math.floor(Math.random() * 900000 + 100000);
  return {
    seed: actualSeed,
    bpm: 98,
    rootKey: 'C#',
    scale: 'phrygian',
    density: 50,
    darkness: 65,
    vocalSpace: 60,
    bassMovement: 55,
    swing: 25,
    variation: 'V1',
    phraseFamilyId: 2, // Detroit Bounce
    kickFamilyId: 15,  // Vezzo Stomp
    bassFamilyId: 3,   // Bouncing
    hatFamilyId: 2,    // Detroit Double-Tap 16ths
  };
}

export function generateFullBeat(
  config: BeatConfig,
  referenceDNA?: ReferenceDNA
): BeatData {
  // If Reference DNA is active, lock parameters to DNA constraints
  let effectiveConfig = { ...config };
  if (referenceDNA) {
    effectiveConfig.bpm = referenceDNA.detectedBpm || effectiveConfig.bpm;
    effectiveConfig.density = referenceDNA.kickDensity;
    effectiveConfig.darkness = referenceDNA.darkness;
    effectiveConfig.vocalSpace = referenceDNA.vocalSpace;
    effectiveConfig.bassMovement = referenceDNA.bass808Activity;
    if (referenceDNA.recommendedKickFamilyId !== undefined) {
      effectiveConfig.kickFamilyId = referenceDNA.recommendedKickFamilyId;
    }
    if (referenceDNA.recommendedHatFamilyId !== undefined) {
      effectiveConfig.hatFamilyId = referenceDNA.recommendedHatFamilyId;
    }
    if (referenceDNA.recommendedBassFamilyId !== undefined) {
      effectiveConfig.bassFamilyId = referenceDNA.recommendedBassFamilyId;
    }
    if (referenceDNA.recommendedMelodyPersonalityId) {
      effectiveConfig.melodyPersonalityId = referenceDNA.recommendedMelodyPersonalityId;
    }
    if (referenceDNA.swing !== undefined) {
      effectiveConfig.swing = referenceDNA.swing;
    }
    if (referenceDNA.recommendedKey) {
      effectiveConfig.rootKey = referenceDNA.recommendedKey;
    }
    if (referenceDNA.recommendedScale) {
      effectiveConfig.scale = referenceDNA.recommendedScale;
    }
  }

  const {
    rootKey,
    scale,
    seed,
    density,
    darkness,
    vocalSpace,
    bassMovement,
    swing,
    variation,
    phraseFamilyId,
    kickFamilyId,
    bassFamilyId,
    hatFamilyId,
  } = effectiveConfig;

  // Generate 808 Bass first so melody can be harmonic & pocket aware
  const bassNotes = generate808Track(bassFamilyId, rootKey, scale, bassMovement, vocalSpace, variation);

  // Melody generation with high-priority compositional grammar
  const melodyResult = generateMelodyTrackWithGrammar({
    rootKey,
    scale,
    seed,
    density,
    darkness,
    vocalSpace,
    variation,
    personalityId: effectiveConfig.melodyPersonalityId as any,
    recookIntent: effectiveConfig.recookIntent as any,
    active808Pitches: bassNotes.map(n => n.pitch),
  });

  const melodyNotes = melodyResult.notes;

  // Keys stabs interlock with melody steps so they do not clash
  const melodySteps = melodyNotes.map(n => n.step);
  const keysNotes = generateKeysTrack(rootKey, scale, seed, density, darkness, vocalSpace, variation, melodySteps);

  const kickNotes = generateKickTrack(kickFamilyId, density, swing, vocalSpace, variation);

  const snareNotes = generateSnareClapTrack(phraseFamilyId, vocalSpace, variation);

  const hatNotes = generateHiHatTrack(hatFamilyId, density, swing, vocalSpace, variation);

  const tracks: Record<TrackType, BeatTrack> = {
    melody: {
      id: 'melody',
      name: `Pain Loop (${melodyResult.personality.name})`,
      channel: 0,
      notes: melodyNotes,
      muted: false,
      solo: false,
    },
    keys: {
      id: 'keys',
      name: 'Dark Keys & Stabs',
      channel: 1,
      notes: keysNotes,
      muted: false,
      solo: false,
    },
    bass808: {
      id: 'bass808',
      name: '808 Sub & Glides',
      channel: 2,
      notes: bassNotes,
      muted: false,
      solo: false,
    },
    kick: {
      id: 'kick',
      name: 'Punch Kick Knock',
      channel: 9,
      notes: kickNotes,
      muted: false,
      solo: false,
    },
    snare: {
      id: 'snare',
      name: 'Hard Clap & Snare',
      channel: 9,
      notes: snareNotes,
      muted: false,
      solo: false,
    },
    hihat: {
      id: 'hihat',
      name: 'Sizzle Hats & Perc',
      channel: 9,
      notes: hatNotes,
      muted: false,
      solo: false,
    },
  };

  const selectedPhraseFamily = PHRASE_FAMILIES.find(p => p.id === phraseFamilyId) || PHRASE_FAMILIES[0];
  const barStructure = selectedPhraseFamily.bars.map(b => ({
    barIndex: b.barIndex,
    role: b.role,
    description: b.musicalGoal,
  }));

  return {
    config: effectiveConfig,
    tracks,
    barStructure,
    referenceDNA,
    melodyQuality: melodyResult.quality,
    melodyPersonalityName: melodyResult.personality.name,
    melodyMotifName: melodyResult.motifCell.name,
  };
}
