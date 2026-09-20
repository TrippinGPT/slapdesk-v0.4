/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BarRoleDefinition {
  barIndex: number; // 0..7
  barNumber: number; // 1..8
  role: 'A' | 'Response' | 'Variation' | 'Turnaround' | 'Return to A' | 'Response Var' | 'Setup' | 'Turnaround / Space';
  musicalGoal: string;
  energyLevel: number; // 0.0 .. 1.0
  allowMelodyDropout: boolean;
  snareAccentRoll: boolean;
  bassGlideChance: number;
}

export interface PhraseFamily {
  id: number;
  name: string;
  description: string;
  bars: BarRoleDefinition[];
}

export const PHRASE_ROLES = [
  { role: 'A', desc: 'Core Motif (Theme Statement)' },
  { role: 'Response', desc: 'Answer to Motif' },
  { role: 'Variation', desc: 'Subtle Twist on Core Motif' },
  { role: 'Turnaround', desc: 'Half-phrase Cadence / Transition' },
  { role: 'Return to A', desc: 'Home Return (Exact memory anchor)' },
  { role: 'Response Var', desc: 'Sibling Response Variation' },
  { role: 'Setup', desc: 'Climactic Tension Setup' },
  { role: 'Turnaround / Space', desc: 'Breath / Space / Release for Rapper' },
] as const;

export const PHRASE_FAMILIES: PhraseFamily[] = [
  {
    id: 1,
    name: 'Sparse Bay Area',
    description: 'Deep hypnotic restraint. Bar 5 hits hard like home, bar 8 drops out completely.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Establish core pain motif', energyLevel: 0.7, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.1 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Descend 1 note answer', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Octave flick on motif', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.25 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Snare turnaround fill', energyLevel: 0.85, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.4 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Anchor back to Bar 1 core motif (home)', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.15 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Alternate response finish', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Build kick tension', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.35 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Vocal breath & hat silence', energyLevel: 0.5, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.1 },
    ],
  },
  {
    id: 2,
    name: 'Detroit Bounce',
    description: 'Fast double-kick pickups and high energy. Active response bars.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Punchy detached dark motif', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Quick staccato answer', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.35 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Double strike motif', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.4 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Hat stutter & kick roll', energyLevel: 0.9, allowMelodyDropout: false, snareAccentRoll: true, bassGlideChance: 0.5 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Pure thematic return (feels like home)', energyLevel: 0.82, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Higher register octave poke', energyLevel: 0.88, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.4 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Aggressive 808 pickup roll', energyLevel: 0.92, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.6 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Abrupt half-bar pause', energyLevel: 0.6, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.2 },
    ],
  },
  {
    id: 3,
    name: 'Syncopated Off-Grid',
    description: 'Groove pushes and pulls against the grid. Loose pocket with heavy turnaround.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Off-grid downbeat statement', energyLevel: 0.72, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Syncopated sync answer', energyLevel: 0.76, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Triad displacement', energyLevel: 0.78, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.35 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Triplet roll release', energyLevel: 0.88, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.45 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Solid re-grounding at home', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Delayed 16th answer', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.35 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Ascending root climb', energyLevel: 0.86, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.5 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Sub drop and vocal breath', energyLevel: 0.55, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.2 },
    ],
  },
  {
    id: 4,
    name: 'Delayed Response',
    description: 'Response bars hold back before answering, generating suspense.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Clear 2-note motif statement', energyLevel: 0.7, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.15 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Late 3rd-beat entry answer', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.25 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Motif inverted', energyLevel: 0.78, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Clap drag & roll', energyLevel: 0.85, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.4 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Return to exact motif', energyLevel: 0.72, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.15 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Second delayed response', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Building snare pressure', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.4 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Wide vocal pocket space', energyLevel: 0.5, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.1 },
    ],
  },
  {
    id: 5,
    name: 'Intentional Empty Bar',
    description: 'Bars 4 and 8 feature dramatic cutouts for punchy rap cadences.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Dense street melody & 808', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Tight answering hook', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.25 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Rising tension variant', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'TOTAL EMPTY DROP (Kick/Bass muted)', energyLevel: 0.3, allowMelodyDropout: true, snareAccentRoll: false, bassGlideChance: 0.0 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'EXPLOSIVE RETURN TO HOME (A)', energyLevel: 0.9, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Riding the momentum', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Setup into final breath', energyLevel: 0.88, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.4 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'EMPTY BAR OUTRO DROP', energyLevel: 0.3, allowMelodyDropout: true, snareAccentRoll: false, bassGlideChance: 0.0 },
    ],
  },
  {
    id: 6,
    name: 'Aggressive Pocket',
    description: 'Heaviest slap feel. In-your-face kicks and active 808s throughout.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Gritty street motif & double kick', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Aggressive counter poke', energyLevel: 0.88, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.4 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Syncopated slap accent', energyLevel: 0.9, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.45 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Rolls on both snare and hat', energyLevel: 0.95, allowMelodyDropout: false, snareAccentRoll: true, bassGlideChance: 0.6 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Heavy homecoming smack', energyLevel: 0.88, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Slightly higher pitch answer', energyLevel: 0.9, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.45 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Peak energy wall of sound', energyLevel: 0.96, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.65 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Stutter finish into bar 1 restart', energyLevel: 0.7, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.3 },
    ],
  },
  {
    id: 7,
    name: 'Laid-Back Houston',
    description: 'Slow-motion feel. Extra space between hits, deep sustained bass resonance.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Minimal 1-note bell or piano key', energyLevel: 0.65, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.1 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Single pitch drop answer', energyLevel: 0.68, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Long sustain chord pad', energyLevel: 0.7, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Gentle hat cadence', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Revisit the deep motif home', energyLevel: 0.68, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.1 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Slight dynamic shift', energyLevel: 0.72, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.25 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Subtle high hat pickup', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Extended decay space', energyLevel: 0.5, allowMelodyDropout: true, snareAccentRoll: false, bassGlideChance: 0.1 },
    ],
  },
  {
    id: 8,
    name: 'Bar-4 Turnaround Only',
    description: 'Strict restraint through bars 1-3; turnaround erupts only at mid-phrase.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Strict locked rhythm motif', energyLevel: 0.72, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.15 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Strict response repetition', energyLevel: 0.74, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Tension build with same motif', energyLevel: 0.76, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.25 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'FULL TURNAROUND FIREWORKS', energyLevel: 0.95, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.6 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Immediate drop back to calm core (home)', energyLevel: 0.72, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.15 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Clean response variation', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Minor pickup into bar 8', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Quiet turnaround breath', energyLevel: 0.55, allowMelodyDropout: true, snareAccentRoll: false, bassGlideChance: 0.1 },
    ],
  },
  {
    id: 9,
    name: 'Pickup Heavy',
    description: 'Continuous rolling pickups driving momentum into every odd bar.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Motif enters on step 0', energyLevel: 0.8, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Response with step 14-15 pickup', energyLevel: 0.84, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.35 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Step 15 pickup into bar 4', energyLevel: 0.86, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.4 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Triple 16th pickup cascade', energyLevel: 0.9, allowMelodyDropout: false, snareAccentRoll: true, bassGlideChance: 0.5 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Home motif re-statement', energyLevel: 0.82, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Response variant with pickup', energyLevel: 0.86, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.4 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Intense 808 pickup drive', energyLevel: 0.92, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.55 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Final turnaround pickup reset', energyLevel: 0.65, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.3 },
    ],
  },
  {
    id: 10,
    name: 'Repeated Groove Core',
    description: 'Hypnotic consistency. Bar 1, 3, 5, 7 stay ruthlessly on-the-line; variations are subtle.',
    bars: [
      { barIndex: 0, barNumber: 1, role: 'A', musicalGoal: 'Pure locked loop theme', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.15 },
      { barIndex: 1, barNumber: 2, role: 'Response', musicalGoal: 'Subtle note inflection', energyLevel: 0.77, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.2 },
      { barIndex: 2, barNumber: 3, role: 'Variation', musicalGoal: 'Mirror of bar 1 with 1 ghost note', energyLevel: 0.78, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.25 },
      { barIndex: 3, barNumber: 4, role: 'Turnaround', musicalGoal: 'Tasteful turnaround roll', energyLevel: 0.85, allowMelodyDropout: false, snareAccentRoll: true, bassGlideChance: 0.35 },
      { barIndex: 4, barNumber: 5, role: 'Return to A', musicalGoal: 'Exact repeat of bar 1 (the core home)', energyLevel: 0.75, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.15 },
      { barIndex: 5, barNumber: 6, role: 'Response Var', musicalGoal: 'Mirror of bar 2', energyLevel: 0.78, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.25 },
      { barIndex: 6, barNumber: 7, role: 'Setup', musicalGoal: 'Slight velocity bump', energyLevel: 0.82, allowMelodyDropout: false, snareAccentRoll: false, bassGlideChance: 0.3 },
      { barIndex: 7, barNumber: 8, role: 'Turnaround / Space', musicalGoal: 'Quiet step-12 cutoff space', energyLevel: 0.55, allowMelodyDropout: true, snareAccentRoll: true, bassGlideChance: 0.15 },
    ],
  },
];
