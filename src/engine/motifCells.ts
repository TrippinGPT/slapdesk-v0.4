/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MelodicContour =
  | 'flat'
  | 'ascending'
  | 'descending'
  | 'arch'
  | 'inverted_arch'
  | 'drop_and_return'
  | 'rise_and_drop'
  | 'anchor_and_response';

export type ArticulationStyle = 'sustained' | 'stabbed' | 'mixed' | 'call_stab';

export type EntryTiming =
  | 'downbeat'       // step 0
  | 'late_beat_1'    // step 1 or 2
  | 'beat_2'         // step 4
  | 'beat_3'         // step 8
  | 'upbeat_pickup'  // step 14 or 15 of preceding bar / step 3
  | 'second_half'    // step 8-10
  | 'delayed_bar_2'; // silence in Bar 1, starts Bar 2

export interface CellNote {
  stepInBar: number;       // 0..15
  degreeOffset: number;    // Scale degree offset from anchor (0 = anchor, 1 = next scale tone, -1 = tone below, etc.)
  octaveOffset: number;    // -1, 0, +1
  duration: number;        // In 16th steps (1 = 16th, 2 = 8th, 4 = quarter, 6 = dotted quarter)
  velocity: number;        // 0..127
  isAccent?: boolean;      // Key rhythmic focal point
  isTension?: boolean;     // Leading / approach tone
}

export interface MotifCellFamily {
  id: number;
  name: string;
  contour: MelodicContour;
  articulation: ArticulationStyle;
  suggestedEntry: EntryTiming;
  description: string;
  dominantPitchCount: 1 | 2 | 3 | 4;
  notes: CellNote[];
}

/**
 * 32 Distinct Motif Cell Families
 * Stored as rhythmic identity + relative interval behavior + harmonic role.
 * Never generic scale runs: intentional pockets, small intervals, and producer anchors.
 */
export const MOTIF_CELL_FAMILIES: MotifCellFamily[] = [
  // 1. One-note dominant motifs
  {
    id: 1,
    name: 'Ominous Downbeat Toll',
    contour: 'flat',
    articulation: 'sustained',
    suggestedEntry: 'downbeat',
    description: 'Single dark root bell ringing out on beat 1 with wide negative space.',
    dominantPitchCount: 1,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 8, velocity: 104, isAccent: true },
    ],
  },
  {
    id: 2,
    name: 'Syncopated Offbeat Ping',
    contour: 'flat',
    articulation: 'stabbed',
    suggestedEntry: 'late_beat_1',
    description: 'Single note hitting step 2 with an echo on step 8, leaving beat 1 open.',
    dominantPitchCount: 1,
    notes: [
      { stepInBar: 2, degreeOffset: 0, octaveOffset: 0, duration: 2, velocity: 98, isAccent: true },
      { stepInBar: 8, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 88 },
    ],
  },
  {
    id: 3,
    name: 'Hypnotic Triple Pulse',
    contour: 'flat',
    articulation: 'stabbed',
    suggestedEntry: 'beat_2',
    description: 'Relentless one-note pulse on step 4, 7, 10 for cold street pressure.',
    dominantPitchCount: 1,
    notes: [
      { stepInBar: 4, degreeOffset: 0, octaveOffset: 0, duration: 2, velocity: 95, isAccent: true },
      { stepInBar: 7, degreeOffset: 0, octaveOffset: 0, duration: 2, velocity: 85 },
      { stepInBar: 10, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 90 },
    ],
  },
  {
    id: 4,
    name: 'Octave Answer Punctuation',
    contour: 'anchor_and_response',
    articulation: 'mixed',
    suggestedEntry: 'downbeat',
    description: 'Low root anchor followed by a sharp high octave poke at the tail.',
    dominantPitchCount: 1,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 5, velocity: 96, isAccent: true },
      { stepInBar: 10, degreeOffset: 0, octaveOffset: 1, duration: 3, velocity: 102, isAccent: true },
    ],
  },

  // 2. Two-note dominant motifs
  {
    id: 5,
    name: 'Root to Minor Third Sigh',
    contour: 'ascending',
    articulation: 'sustained',
    suggestedEntry: 'downbeat',
    description: 'Mournful 2-note anchor climbing from root to dark emotional third.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 95, isAccent: true },
      { stepInBar: 6, degreeOffset: 2, octaveOffset: 0, duration: 6, velocity: 92 },
    ],
  },
  {
    id: 6,
    name: 'Third to Root Drop',
    contour: 'descending',
    articulation: 'sustained',
    suggestedEntry: 'beat_2',
    description: 'Begins on the moody minor third and resolves down to home root.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 4, degreeOffset: 2, octaveOffset: 0, duration: 4, velocity: 98, isAccent: true },
      { stepInBar: 10, degreeOffset: 0, octaveOffset: 0, duration: 5, velocity: 90 },
    ],
  },
  {
    id: 7,
    name: 'Phrygian Half-Step Clash',
    contour: 'rise_and_drop',
    articulation: 'mixed',
    suggestedEntry: 'downbeat',
    description: 'Sinister West Coast / Bay clash: root to flat-second and back.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 100, isAccent: true },
      { stepInBar: 6, degreeOffset: 1, octaveOffset: 0, duration: 3, velocity: 92, isTension: true },
      { stepInBar: 12, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 88 },
    ],
  },
  {
    id: 8,
    name: 'Open Fifth Declaration',
    contour: 'anchor_and_response',
    articulation: 'sustained',
    suggestedEntry: 'downbeat',
    description: 'Heavy fifth anchor holding down the pocket with stark simplicity.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 6, velocity: 96, isAccent: true },
      { stepInBar: 8, degreeOffset: 4, octaveOffset: 0, duration: 6, velocity: 90 },
    ],
  },
  {
    id: 9,
    name: 'Late Night Call and Return',
    contour: 'drop_and_return',
    articulation: 'sustained',
    suggestedEntry: 'beat_3',
    description: 'Enters late on beat 3, dips down a step, returns home into next bar.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 8, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 94, isAccent: true },
      { stepInBar: 12, degreeOffset: -1, octaveOffset: 0, duration: 2, velocity: 86, isTension: true },
      { stepInBar: 14, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 92 },
    ],
  },
  {
    id: 10,
    name: 'Detroit Double-Tap Stab',
    contour: 'flat',
    articulation: 'stabbed',
    suggestedEntry: 'late_beat_1',
    description: 'Quick double-tap staccato stab on step 2 and 3, then immediate silence.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 2, degreeOffset: 0, octaveOffset: 0, duration: 1, velocity: 102, isAccent: true },
      { stepInBar: 3, degreeOffset: 2, octaveOffset: 0, duration: 2, velocity: 96 },
    ],
  },

  // 3. Three-note motifs (Contour logic & landing notes)
  {
    id: 11,
    name: 'Root-Fifth-Root Anchor',
    contour: 'arch',
    articulation: 'mixed',
    suggestedEntry: 'downbeat',
    description: 'Classic triumphal yet melancholic arc leaping to fifth and returning.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 96, isAccent: true },
      { stepInBar: 4, degreeOffset: 4, octaveOffset: 0, duration: 4, velocity: 94 },
      { stepInBar: 10, degreeOffset: 0, octaveOffset: 0, duration: 5, velocity: 90 },
    ],
  },
  {
    id: 12,
    name: 'Fifth-Third-Root Cascade',
    contour: 'descending',
    articulation: 'mixed',
    suggestedEntry: 'late_beat_1',
    description: 'Gentle triad cascade landing securely on the root.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 2, degreeOffset: 4, octaveOffset: 0, duration: 3, velocity: 95, isAccent: true },
      { stepInBar: 6, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 90 },
      { stepInBar: 10, degreeOffset: 0, octaveOffset: 0, duration: 5, velocity: 92 },
    ],
  },
  {
    id: 13,
    name: 'Ascending Pickup into Anchor',
    contour: 'ascending',
    articulation: 'call_stab',
    suggestedEntry: 'beat_2',
    description: 'Two quick pickup notes on steps 4 and 6 slamming into a long anchor on 8.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 4, degreeOffset: -2, octaveOffset: 0, duration: 2, velocity: 84, isTension: true },
      { stepInBar: 6, degreeOffset: -1, octaveOffset: 0, duration: 2, velocity: 88, isTension: true },
      { stepInBar: 8, degreeOffset: 0, octaveOffset: 0, duration: 7, velocity: 102, isAccent: true },
    ],
  },
  {
    id: 14,
    name: 'Upper Neighbor Turnaround',
    contour: 'rise_and_drop',
    articulation: 'mixed',
    suggestedEntry: 'downbeat',
    description: 'Root holding, briefly rising to 2nd before landing on 3rd.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 94, isAccent: true },
      { stepInBar: 6, degreeOffset: 1, octaveOffset: 0, duration: 2, velocity: 86, isTension: true },
      { stepInBar: 10, degreeOffset: 2, octaveOffset: 0, duration: 5, velocity: 92 },
    ],
  },
  {
    id: 15,
    name: 'Cold Street Triplet Poke',
    contour: 'drop_and_return',
    articulation: 'stabbed',
    suggestedEntry: 'beat_3',
    description: 'Late beat-3 entry with short percussive notes dropping to 7th and back.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 8, degreeOffset: 0, octaveOffset: 0, duration: 2, velocity: 96, isAccent: true },
      { stepInBar: 11, degreeOffset: -1, octaveOffset: 0, duration: 1, velocity: 88, isTension: true },
      { stepInBar: 13, degreeOffset: 0, octaveOffset: 0, duration: 2, velocity: 94 },
    ],
  },
  {
    id: 16,
    name: 'Sustained Anchor + Short Response',
    contour: 'anchor_and_response',
    articulation: 'mixed',
    suggestedEntry: 'downbeat',
    description: 'Long downbeat toll on root, followed by two tight response stabs on step 12, 14.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 8, velocity: 98, isAccent: true },
      { stepInBar: 12, degreeOffset: 2, octaveOffset: 0, duration: 1, velocity: 90 },
      { stepInBar: 14, degreeOffset: 1, octaveOffset: 0, duration: 2, velocity: 88, isTension: true },
    ],
  },
  {
    id: 17,
    name: 'Inverted Arch Hook',
    contour: 'inverted_arch',
    articulation: 'sustained',
    suggestedEntry: 'downbeat',
    description: 'Third dips down through second to root, then rises back to third.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 0, degreeOffset: 2, octaveOffset: 0, duration: 4, velocity: 92, isAccent: true },
      { stepInBar: 6, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 88 },
      { stepInBar: 10, degreeOffset: 2, octaveOffset: 0, duration: 5, velocity: 94 },
    ],
  },
  {
    id: 18,
    name: 'Dark Minor Sixth Reach',
    contour: 'ascending',
    articulation: 'sustained',
    suggestedEntry: 'late_beat_1',
    description: 'Eerie climb from root through fifth to minor sixth peak.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 2, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 94, isAccent: true },
      { stepInBar: 7, degreeOffset: 4, octaveOffset: 0, duration: 3, velocity: 90 },
      { stepInBar: 11, degreeOffset: 5, octaveOffset: 0, duration: 4, velocity: 96, isTension: true },
    ],
  },

  // 4. Four-note compositional motifs (strict small interval grammar)
  {
    id: 19,
    name: 'Mozzy Pain Loop Hook',
    contour: 'arch',
    articulation: 'mixed',
    suggestedEntry: 'downbeat',
    description: 'Root -> Minor 3rd -> Fourth -> Third resolution. Classic emotional pain hook.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 96, isAccent: true },
      { stepInBar: 4, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 92 },
      { stepInBar: 8, degreeOffset: 3, octaveOffset: 0, duration: 3, velocity: 88, isTension: true },
      { stepInBar: 12, degreeOffset: 2, octaveOffset: 0, duration: 4, velocity: 94 },
    ],
  },
  {
    id: 20,
    name: 'Vezzo Staccato Hammer',
    contour: 'descending',
    articulation: 'stabbed',
    suggestedEntry: 'late_beat_1',
    description: 'Punchy 4-note Detroit hammer with crisp stops.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 1, degreeOffset: 4, octaveOffset: 0, duration: 2, velocity: 102, isAccent: true },
      { stepInBar: 4, degreeOffset: 2, octaveOffset: 0, duration: 2, velocity: 94 },
      { stepInBar: 7, degreeOffset: 1, octaveOffset: 0, duration: 2, velocity: 90, isTension: true },
      { stepInBar: 10, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 96 },
    ],
  },
  {
    id: 21,
    name: 'Bay Area Offbeat Bounce',
    contour: 'anchor_and_response',
    articulation: 'call_stab',
    suggestedEntry: 'beat_2',
    description: 'Syncopated call on 4 and 7, quick answer on 11 and 13.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 4, degreeOffset: 0, octaveOffset: 0, duration: 2, velocity: 98, isAccent: true },
      { stepInBar: 7, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 92 },
      { stepInBar: 11, degreeOffset: 0, octaveOffset: 0, duration: 2, velocity: 90 },
      { stepInBar: 13, degreeOffset: -1, octaveOffset: 0, duration: 2, velocity: 86, isTension: true },
    ],
  },
  {
    id: 22,
    name: 'Melancholic Step Down',
    contour: 'descending',
    articulation: 'sustained',
    suggestedEntry: 'downbeat',
    description: 'Fourth -> Third -> Second -> Root. Stepwise mournful descent with generous rests.',
    dominantPitchCount: 4,
    notes: [
      { stepInBar: 0, degreeOffset: 3, octaveOffset: 0, duration: 3, velocity: 94, isAccent: true },
      { stepInBar: 4, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 90 },
      { stepInBar: 8, degreeOffset: 1, octaveOffset: 0, duration: 3, velocity: 86, isTension: true },
      { stepInBar: 12, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 92 },
    ],
  },
  {
    id: 23,
    name: 'Unresolved Tension Arch',
    contour: 'arch',
    articulation: 'sustained',
    suggestedEntry: 'beat_2',
    description: 'Leaves phrase hanging on 5th or 7th, waiting for the bar 2 answer.',
    dominantPitchCount: 3,
    notes: [
      { stepInBar: 4, degreeOffset: 0, octaveOffset: 0, duration: 3, velocity: 92, isAccent: true },
      { stepInBar: 8, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 90 },
      { stepInBar: 12, degreeOffset: 4, octaveOffset: 0, duration: 4, velocity: 96, isTension: true },
    ],
  },
  {
    id: 24,
    name: 'Stab-Call with Long Resolution',
    contour: 'anchor_and_response',
    articulation: 'call_stab',
    suggestedEntry: 'late_beat_1',
    description: 'Short 2-note question on steps 2, 4, answered by a sustained root anchor at step 8.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 2, degreeOffset: 2, octaveOffset: 0, duration: 2, velocity: 95, isAccent: true },
      { stepInBar: 4, degreeOffset: 1, octaveOffset: 0, duration: 2, velocity: 90, isTension: true },
      { stepInBar: 8, degreeOffset: 0, octaveOffset: 0, duration: 7, velocity: 98, isAccent: true },
    ],
  },

  // 5. Asymmetric & Second-Half Entries
  {
    id: 25,
    name: 'Delayed Second-Half Echo',
    contour: 'descending',
    articulation: 'mixed',
    suggestedEntry: 'second_half',
    description: 'Bar 1 beats 1 & 2 are completely silent; enters softly on step 8 and 12.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 8, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 92, isAccent: true },
      { stepInBar: 12, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 95 },
    ],
  },
  {
    id: 26,
    name: 'Upbeat Ghost Pickup',
    contour: 'ascending',
    articulation: 'mixed',
    suggestedEntry: 'upbeat_pickup',
    description: 'Syncopated pickup on step 14 leading over the bar line into step 0.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 14, degreeOffset: -1, octaveOffset: 0, duration: 2, velocity: 86, isTension: true },
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 6, velocity: 100, isAccent: true },
      { stepInBar: 8, degreeOffset: 2, octaveOffset: 0, duration: 4, velocity: 90 },
    ],
  },
  {
    id: 27,
    name: 'Sparse Single-Note Bell Toll',
    contour: 'flat',
    articulation: 'sustained',
    suggestedEntry: 'downbeat',
    description: 'Absolute minimalist discipline: 1 sustained note, 15 steps of silence.',
    dominantPitchCount: 1,
    notes: [
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 12, velocity: 106, isAccent: true },
    ],
  },
  {
    id: 28,
    name: 'Eerie High Register Drone',
    contour: 'flat',
    articulation: 'sustained',
    suggestedEntry: 'beat_2',
    description: 'High minor-third glass bell pinging on step 4 with tape-like sustain.',
    dominantPitchCount: 1,
    notes: [
      { stepInBar: 4, degreeOffset: 2, octaveOffset: 1, duration: 10, velocity: 92, isAccent: true },
    ],
  },
  {
    id: 29,
    name: 'Stepwise Wave Inversion',
    contour: 'inverted_arch',
    articulation: 'mixed',
    suggestedEntry: 'downbeat',
    description: 'Starts at 5th, dips to 3rd, resolves on 5th.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 0, degreeOffset: 4, octaveOffset: 0, duration: 4, velocity: 94, isAccent: true },
      { stepInBar: 6, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 88 },
      { stepInBar: 10, degreeOffset: 4, octaveOffset: 0, duration: 5, velocity: 92 },
    ],
  },
  {
    id: 30,
    name: 'Late Bar-2 Emergence',
    contour: 'anchor_and_response',
    articulation: 'sustained',
    suggestedEntry: 'delayed_bar_2',
    description: 'Zero notes in Bar 1. The beat knocks naked before the pain loop drops in Bar 2.',
    dominantPitchCount: 2,
    notes: [
      // Bar 1 empty; notes appear in Bar 2
      { stepInBar: 0, degreeOffset: 0, octaveOffset: 0, duration: 6, velocity: 100, isAccent: true },
      { stepInBar: 8, degreeOffset: 2, octaveOffset: 0, duration: 5, velocity: 92 },
    ],
  },
  {
    id: 31,
    name: 'Turnaround Leading Tone Cadence',
    contour: 'ascending',
    articulation: 'call_stab',
    suggestedEntry: 'beat_3',
    description: 'Subtle 7th to root cadence designed for turnarounds and setups.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 8, degreeOffset: -1, octaveOffset: 0, duration: 3, velocity: 88, isTension: true },
      { stepInBar: 12, degreeOffset: 0, octaveOffset: 0, duration: 4, velocity: 98, isAccent: true },
    ],
  },
  {
    id: 32,
    name: 'Low Octave Street Thump',
    contour: 'anchor_and_response',
    articulation: 'stabbed',
    suggestedEntry: 'late_beat_1',
    description: 'Low-register keys poke on step 2, high octave stab on step 6.',
    dominantPitchCount: 2,
    notes: [
      { stepInBar: 2, degreeOffset: 0, octaveOffset: -1, duration: 3, velocity: 100, isAccent: true },
      { stepInBar: 6, degreeOffset: 2, octaveOffset: 0, duration: 3, velocity: 92 },
    ],
  },
];
