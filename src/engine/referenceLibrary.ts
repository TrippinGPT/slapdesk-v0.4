/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReferenceDNA, ScaleType } from '../types';

export interface ReferenceTarget extends ReferenceDNA {
  id: string;
  title: string;
  author: string;
  youtubeUrl: string;
  category: 'Detroit Slap' | 'West Coast Swing' | 'Trap Bounce' | 'Atlanta Wave' | 'Custom Upload';
  recommendedKey: string;
  recommendedScale: ScaleType;
  recommendedKickFamilyId: number;
  recommendedHatFamilyId: number;
  recommendedBassFamilyId: number;
  recommendedMelodyPersonalityId: string;
  swing: number;
  producerTips: string;
  pocketBreakdown: string[];
}

export const CURATED_REFERENCE_TARGETS: ReferenceTarget[] = [
  {
    id: 'icewear_vezzo',
    title: 'Icewear Vezzo Detroit Slap Target',
    author: 'Pede (FL Studio Tutorial)',
    youtubeUrl: 'https://youtu.be/m92yP0OrFKo',
    category: 'Detroit Slap',
    sourceFileName: 'Icewear_Vezzo_Primary_Target (Detroit_Slap_DNA)',
    detectedBpm: 99,
    kickDensity: 52,
    bass808Activity: 58,
    hatActivity: 48,
    syncopation: 70,
    phraseRepetition: 85,
    turnaroundSpace: 65,
    darkness: 82,
    vocalSpace: 72,
    recommendedKey: 'D',
    recommendedScale: 'phrygian',
    recommendedKickFamilyId: 44, // Icewear Vezzo Detroit Slap
    recommendedHatFamilyId: 22,  // Detroit Fast Gallop (Vezzo)
    recommendedBassFamilyId: 8,  // Syncopated Bounce 808
    recommendedMelodyPersonalityId: 'DETROIT_SPACE',
    swing: 0,
    producerTips: 'Leave beat 1 wide open for Vezzo\'s opening punchlines. Use sinister staccato dark bells and piano with half-step tension. Keep the 808 saturated with punchy double kicks on steps 7, 10, and 15.',
    pocketBreakdown: [
      '99 BPM Detroit half-time stride',
      'Phrygian minor 2nd semitone clashing tension',
      'Double-tap kick pattern on steps 7, 10, 15',
      'Galloping 16th double hats with open sizzle on step 14',
      'High vocal space (72%) for deadpan Detroit delivery',
    ],
  },
  {
    id: 'cardo_bounce',
    title: "Cardo 'Got Wings' West Coast Bounce",
    author: 'TRIFREEZE (Drum Bounce Masterclass)',
    youtubeUrl: 'https://youtu.be/XT06B-6myGg',
    category: 'West Coast Swing',
    sourceFileName: 'Cardo_Got_Wings_Drum_Bounce_Masterclass (TRIFREEZE)',
    detectedBpm: 94,
    kickDensity: 38,
    bass808Activity: 46,
    hatActivity: 42,
    syncopation: 75,
    phraseRepetition: 90,
    turnaroundSpace: 72,
    darkness: 62,
    vocalSpace: 78,
    recommendedKey: 'C#',
    recommendedScale: 'natural_minor',
    recommendedKickFamilyId: 41, // Cardo 'Got Wings' Swing
    recommendedHatFamilyId: 19,  // Cardo 'Got Wings' Triplet Swing
    recommendedBassFamilyId: 2,  // Sustained Glide 808
    recommendedMelodyPersonalityId: 'STREET_KEYS',
    swing: 18,
    producerTips: 'Laid-back West Coast swing (18% swing). Sparse kick hits with high intention; delayed open hats on the offbeats (steps 2 & 10). Deep negative space lets the long sliding 808 breathe.',
    pocketBreakdown: [
      '94 BPM laid-back West Coast tempo',
      '18% MPC swing on 8th-note hats',
      'Delayed open hats on steps 2 & 10 for groove swagger',
      'Sparse kick pattern avoiding 808 slide tails',
      'Expansive negative space (78% vocal room) for Baby Keem / Wiz pockets',
    ],
  },
  {
    id: 'southside_808mafia',
    title: 'Southside / 808 Mafia Stomp & Rolls',
    author: 'TRIFREEZE (Drum Bounce Masterclass)',
    youtubeUrl: 'https://youtu.be/XT06B-6myGg',
    category: 'Trap Bounce',
    sourceFileName: 'Southside_808_Mafia_Master_Bounce (TRIFREEZE)',
    detectedBpm: 138,
    kickDensity: 68,
    bass808Activity: 72,
    hatActivity: 82,
    syncopation: 62,
    phraseRepetition: 80,
    turnaroundSpace: 45,
    darkness: 84,
    vocalSpace: 50,
    recommendedKey: 'F',
    recommendedScale: 'harmonic_minor',
    recommendedKickFamilyId: 42, // Southside 808 Mafia Stomp
    recommendedHatFamilyId: 20,  // Southside 808 Mafia Stutter Rolls
    recommendedBassFamilyId: 3,  // Rolling 808
    recommendedMelodyPersonalityId: 'MOBB_PUNCTUATION',
    swing: 0,
    producerTips: 'Hard-clipping kick stacked directly on the 808 attack for instant chest thump. Fast 1/32 and 1/48 stutter hat rolls dipping in velocity into the clap on steps 3 and 11.',
    pocketBreakdown: [
      '138 BPM hard trap tempo',
      'Harmonic minor sinister tension',
      'Kick glued directly to 808 transient',
      '1/32 stutter rolls with downward velocity ramps into claps',
      'Mobb staccato brass & bell punctuation',
    ],
  },
  {
    id: 'wheezy_outtahere',
    title: "Wheezy 'Outta Here' Wave Pocket",
    author: 'TRIFREEZE (Drum Bounce Masterclass)',
    youtubeUrl: 'https://youtu.be/XT06B-6myGg',
    category: 'Atlanta Wave',
    sourceFileName: 'Wheezy_Outta_Here_Wave_Pocket (TRIFREEZE)',
    detectedBpm: 126,
    kickDensity: 44,
    bass808Activity: 62,
    hatActivity: 60,
    syncopation: 78,
    phraseRepetition: 85,
    turnaroundSpace: 68,
    darkness: 58,
    vocalSpace: 76,
    recommendedKey: 'E',
    recommendedScale: 'dorian',
    recommendedKickFamilyId: 43, // Wheezy Pocket Subtraction
    recommendedHatFamilyId: 21,  // Wheezy Wave Velocity 16ths
    recommendedBassFamilyId: 4,  // Syncopated 808
    recommendedMelodyPersonalityId: 'HYPNOTIC',
    swing: 6,
    producerTips: 'Wave velocity curves on the 16th hats with intentional skips on step 2. Kick subtraction weaves around sustained 808 notes, leaving airy vocal space for melodic flows.',
    pocketBreakdown: [
      '126 BPM Atlanta wave bounce',
      'Dynamic undulating velocity curves on hats',
      'Skip on step 2 for vocal breathing pocket',
      'Kick subtraction that avoids colliding with low-end decays',
      'Hypnotic 2-note motif cell that earworms into the listener',
    ],
  },
  {
    id: 'detroit_roadrunner',
    title: 'Detroit Roadrunner (Babyface Ray / Vezzo Stride)',
    author: 'Detroit Underground / Pede',
    youtubeUrl: 'https://youtu.be/m92yP0OrFKo',
    category: 'Detroit Slap',
    sourceFileName: 'Detroit_Roadrunner_Stride (Michigan_Slap)',
    detectedBpm: 104,
    kickDensity: 58,
    bass808Activity: 65,
    hatActivity: 55,
    syncopation: 72,
    phraseRepetition: 88,
    turnaroundSpace: 60,
    darkness: 86,
    vocalSpace: 68,
    recommendedKey: 'C#',
    recommendedScale: 'phrygian',
    recommendedKickFamilyId: 2,  // Detroit Bounce
    recommendedHatFamilyId: 2,   // Detroit Double-Tap 16ths
    recommendedBassFamilyId: 5,  // Octave Jump 808
    recommendedMelodyPersonalityId: 'DARK_ANCHOR',
    swing: 0,
    producerTips: 'Fast Michigan sprint with chromatic piano stabs and energetic octave jumps on the 808 into bar 4 and bar 8.',
    pocketBreakdown: [
      '104 BPM uptempo Michigan stride',
      'Chromatic staccato minor chord stabs',
      'Double-tap kick pickup into offbeats',
      'Octave 808 flips on turnaround steps',
      'Dark Phrygian atmosphere',
    ],
  },
];
