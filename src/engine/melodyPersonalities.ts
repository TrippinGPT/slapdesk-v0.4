/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MelodicContour, ArticulationStyle, EntryTiming } from './motifCells';

export type MelodyPersonalityId =
  | 'DARK_ANCHOR'
  | 'MOBB_PUNCTUATION'
  | 'LATE_NIGHT'
  | 'STREET_KEYS'
  | 'DETROIT_SPACE'
  | 'COLD_RESPONSE'
  | 'HYPNOTIC'
  | 'TENSION_LOOP';

export interface MelodyPersonality {
  id: MelodyPersonalityId;
  name: string;
  tagline: string;
  description: string;
  preferredContours: MelodicContour[];
  preferredArticulation: ArticulationStyle;
  preferredEntries: EntryTiming[];
  // Density envelope across 8 bars (target max notes per bar)
  densityEnvelope: number[]; // 8 elements (bars 0..7)
  anchorFocusWeight: number; // 0..1 (how strictly melody anchors to 1-3 pitch classes)
  maxUniquePitchClasses: number; // 2..4
  tensionResolutionBias: 'root' | 'third' | 'fifth' | 'unresolved_turnaround';
  octaveJumpAllowed: boolean;
  emptyDownbeatPreference: number; // 0..1 (probability of leaving beat 1 empty)
}

export const MELODY_PERSONALITIES: Record<MelodyPersonalityId, MelodyPersonality> = {
  DARK_ANCHOR: {
    id: 'DARK_ANCHOR',
    name: 'Dark Anchor',
    tagline: 'Mournful single/dual-note sustained pain loop',
    description: 'Minimalist emotional anchor notes with long decay and deep vocal pocket.',
    preferredContours: ['flat', 'ascending', 'anchor_and_response'],
    preferredArticulation: 'sustained',
    preferredEntries: ['downbeat', 'late_beat_1'],
    densityEnvelope: [2, 1, 2, 0, 2, 1, 2, 0],
    anchorFocusWeight: 0.9,
    maxUniquePitchClasses: 2,
    tensionResolutionBias: 'root',
    octaveJumpAllowed: false,
    emptyDownbeatPreference: 0.2,
  },
  MOBB_PUNCTUATION: {
    id: 'MOBB_PUNCTUATION',
    name: 'Mobb Punctuation',
    tagline: 'Funky syncopation with octave and fifth snaps',
    description: 'Raw Bay Area bounce where notes act like rhythmic instruments in the pocket.',
    preferredContours: ['anchor_and_response', 'rise_and_drop', 'arch'],
    preferredArticulation: 'mixed',
    preferredEntries: ['late_beat_1', 'beat_2'],
    densityEnvelope: [3, 2, 3, 1, 3, 2, 2, 0],
    anchorFocusWeight: 0.75,
    maxUniquePitchClasses: 3,
    tensionResolutionBias: 'root',
    octaveJumpAllowed: true,
    emptyDownbeatPreference: 0.6,
  },
  LATE_NIGHT: {
    id: 'LATE_NIGHT',
    name: 'Late Night',
    tagline: 'Spacious delayed entrances and maximum breath',
    description: 'Atmospheric and sparse; lets the 808 glide underneath before chiming in.',
    preferredContours: ['drop_and_return', 'flat', 'descending'],
    preferredArticulation: 'sustained',
    preferredEntries: ['beat_3', 'second_half', 'delayed_bar_2'],
    densityEnvelope: [1, 2, 2, 0, 1, 2, 1, 0],
    anchorFocusWeight: 0.85,
    maxUniquePitchClasses: 3,
    tensionResolutionBias: 'third',
    octaveJumpAllowed: false,
    emptyDownbeatPreference: 0.8,
  },
  STREET_KEYS: {
    id: 'STREET_KEYS',
    name: 'Street Keys',
    tagline: 'Crisp minor-key stabs answering chord stabs',
    description: 'Cold electric piano and bell staccato jabs that interlock with keys.',
    preferredContours: ['descending', 'flat', 'drop_and_return'],
    preferredArticulation: 'stabbed',
    preferredEntries: ['late_beat_1', 'beat_2'],
    densityEnvelope: [3, 1, 3, 1, 3, 2, 2, 0],
    anchorFocusWeight: 0.7,
    maxUniquePitchClasses: 3,
    tensionResolutionBias: 'third',
    octaveJumpAllowed: false,
    emptyDownbeatPreference: 0.5,
  },
  DETROIT_SPACE: {
    id: 'DETROIT_SPACE',
    name: 'Detroit Space',
    tagline: 'Asymmetric short phrases with empty downbeats',
    description: 'Vezzo-style staccato pings that leave beat 1 completely wide open.',
    preferredContours: ['descending', 'anchor_and_response', 'flat'],
    preferredArticulation: 'stabbed',
    preferredEntries: ['late_beat_1', 'beat_2', 'beat_3'],
    densityEnvelope: [2, 3, 2, 1, 2, 3, 2, 0],
    anchorFocusWeight: 0.75,
    maxUniquePitchClasses: 3,
    tensionResolutionBias: 'root',
    octaveJumpAllowed: true,
    emptyDownbeatPreference: 0.75,
  },
  COLD_RESPONSE: {
    id: 'COLD_RESPONSE',
    name: 'Cold Response',
    tagline: 'Strong call in bar 1, stepwise descending answer',
    description: 'Clear conversational structure where every phrase feels like question and answer.',
    preferredContours: ['descending', 'arch', 'anchor_and_response'],
    preferredArticulation: 'call_stab',
    preferredEntries: ['downbeat', 'late_beat_1'],
    densityEnvelope: [3, 2, 3, 1, 3, 2, 2, 0],
    anchorFocusWeight: 0.8,
    maxUniquePitchClasses: 4,
    tensionResolutionBias: 'root',
    octaveJumpAllowed: false,
    emptyDownbeatPreference: 0.3,
  },
  HYPNOTIC: {
    id: 'HYPNOTIC',
    name: 'Hypnotic',
    tagline: 'One or two-note rhythmic loop with micro-mutations',
    description: 'Infectious repetitive hook that drills the pocket without distracting the rapper.',
    preferredContours: ['flat', 'rise_and_drop'],
    preferredArticulation: 'mixed',
    preferredEntries: ['downbeat', 'beat_2'],
    densityEnvelope: [3, 3, 3, 1, 3, 3, 2, 0],
    anchorFocusWeight: 0.95,
    maxUniquePitchClasses: 2,
    tensionResolutionBias: 'root',
    octaveJumpAllowed: false,
    emptyDownbeatPreference: 0.4,
  },
  TENSION_LOOP: {
    id: 'TENSION_LOOP',
    name: 'Tension Loop',
    tagline: 'Unresolved color notes resolving only at turnarounds',
    description: 'Uses the minor 2nd or 5th as a restless pedal point, releasing at bar 4 and 8.',
    preferredContours: ['arch', 'inverted_arch', 'drop_and_return'],
    preferredArticulation: 'sustained',
    preferredEntries: ['beat_2', 'late_beat_1'],
    densityEnvelope: [2, 2, 3, 1, 2, 2, 3, 0],
    anchorFocusWeight: 0.75,
    maxUniquePitchClasses: 3,
    tensionResolutionBias: 'unresolved_turnaround',
    octaveJumpAllowed: false,
    emptyDownbeatPreference: 0.5,
  },
};
