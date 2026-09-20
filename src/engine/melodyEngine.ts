/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NoteEvent, ScaleType } from '../types';
import { getScaleMidiNotes, getRootMidi } from './scales';
import { MOTIF_CELL_FAMILIES, MotifCellFamily, CellNote } from './motifCells';
import { MELODY_PERSONALITIES, MelodyPersonalityId, MelodyPersonality } from './melodyPersonalities';
import { evaluateMelodyQuality, MelodyQualityMetrics } from './melodyQuality';

export type RecookMusicIntent =
  | 'NEW_RHYTHM'
  | 'NEW_CONTOUR'
  | 'MORE_SPACE'
  | 'DARKER'
  | 'MORE_MEMORABLE'
  | 'NEW_MUSIC';

export interface MelodyGenerationOptions {
  rootKey: string;
  scale: ScaleType;
  seed: number;
  density: number;
  darkness: number;
  vocalSpace: number;
  variation: 'V1' | 'V2' | 'V3';
  personalityId?: MelodyPersonalityId;
  recookIntent?: RecookMusicIntent;
  active808Pitches?: number[];
  keysActiveSteps?: number[];
}

export interface GeneratedMelodyResult {
  notes: NoteEvent[];
  personality: MelodyPersonality;
  motifCell: MotifCellFamily;
  anchorMidis: number[];
  quality: MelodyQualityMetrics;
}

/**
 * High-Priority Compositional Grammar Melody Engine
 * Follows the 21 rules of the SlapDesk compositional spec:
 * - Rhythm first, pitch second
 * - 32 motif-cell families
 * - Strict melodic contour identities
 * - Anchor note hierarchy (1-3 anchors, 2-4 pitch classes)
 * - Anti-generic filtering & rejection loop
 */
export function generateMelodyTrackWithGrammar(
  options: MelodyGenerationOptions
): GeneratedMelodyResult {
  const {
    rootKey,
    scale,
    seed,
    density,
    darkness,
    vocalSpace,
    variation,
    personalityId,
    recookIntent = 'NEW_MUSIC',
    active808Pitches = [],
    keysActiveSteps = [],
  } = options;

  let attempt = 0;
  let bestResult: GeneratedMelodyResult | null = null;
  let highestScore = -1;

  // Anti-generic candidate evaluation loop:
  // Tries up to 6 controlled candidate seeds to guarantee a high-scoring musical idea.
  while (attempt < 6) {
    const runSeed = seed + (attempt * 104729);
    const candidate = buildCandidateMelody({
      rootKey,
      scale,
      seed: runSeed,
      density,
      darkness,
      vocalSpace,
      variation,
      personalityId,
      recookIntent,
      active808Pitches,
      keysActiveSteps,
    });

    if (candidate.quality.passed && candidate.quality.antiGenericScore >= 75) {
      return candidate;
    }

    if (candidate.quality.antiGenericScore > highestScore) {
      highestScore = candidate.quality.antiGenericScore;
      bestResult = candidate;
    }

    attempt++;
  }

  // Fallback to highest-scoring candidate if all attempts were evaluated
  return bestResult!;
}

/**
 * Builds a single melody candidate following strict compositional grammar.
 */
function buildCandidateMelody(
  options: MelodyGenerationOptions
): GeneratedMelodyResult {
  const {
    rootKey,
    scale,
    seed,
    density,
    darkness,
    vocalSpace,
    variation,
    personalityId,
    recookIntent = 'NEW_MUSIC',
    active808Pitches = [],
    keysActiveSteps = [],
  } = options;

  // Deterministic PRNG
  let rndState = (seed * 1664525 + 1013904223) >>> 0;
  const nextRnd = () => {
    rndState = (rndState * 1664525 + 1013904223) >>> 0;
    return (rndState >>> 0) / 4294967296;
  };

  // 1. Select Melody Personality
  const personalityKeys = Object.keys(MELODY_PERSONALITIES) as MelodyPersonalityId[];
  let selectedPersonalityId: MelodyPersonalityId = personalityId || personalityKeys[Math.floor(nextRnd() * personalityKeys.length)];

  if (recookIntent === 'DARKER') {
    selectedPersonalityId = 'DARK_ANCHOR';
  } else if (recookIntent === 'MORE_SPACE') {
    selectedPersonalityId = 'LATE_NIGHT';
  } else if (recookIntent === 'MORE_MEMORABLE') {
    selectedPersonalityId = 'HYPNOTIC';
  }

  const personality = MELODY_PERSONALITIES[selectedPersonalityId];

  // 2. Select Register (Octave 4 main register, occasional 3 or 5 punctuation)
  const baseOctave = (darkness > 70 || recookIntent === 'DARKER') ? 3 : 4;
  const rootMidi = getRootMidi(rootKey, baseOctave);
  const scaleNotes = getScaleMidiNotes(rootKey, scale, [baseOctave, baseOctave + 1]);

  // Scale degrees in semitones above root
  // Minor scales typically: [0, 2, 3, 5, 7, 8 or 9, 10 or 11]
  const thirdMidi = scaleNotes.find(m => (m - rootMidi) === 3) || rootMidi + 3;
  const fifthMidi = scaleNotes.find(m => (m - rootMidi) === 7) || rootMidi + 7;

  // 3. Select 1 to 3 Anchor Notes (Pitches the ear latches onto)
  let anchorMidis: number[] = [rootMidi];
  if (personality.maxUniquePitchClasses >= 2) {
    anchorMidis.push(thirdMidi);
  }
  if (personality.maxUniquePitchClasses >= 3) {
    anchorMidis.push(fifthMidi);
  }

  // 4. Select Motif Cell matching Personality Contours
  const matchingCells = MOTIF_CELL_FAMILIES.filter(cell =>
    personality.preferredContours.includes(cell.contour)
  );
  const pool = matchingCells.length > 0 ? matchingCells : MOTIF_CELL_FAMILIES;
  const motifIndex = Math.floor(nextRnd() * pool.length);
  const motifCell = pool[motifIndex];

  // Map degree offsets into concrete scale MIDI pitches
  const resolveDegreeToPitch = (degreeOffset: number, octaveOffset: number): number => {
    // Degree offset: 0 = root/anchor, 1 = minor 2nd/step up, 2 = minor 3rd, 3 = 4th, 4 = 5th, 5 = 6th, -1 = leading tone
    let semitoneOffset = 0;
    switch (degreeOffset) {
      case 0: semitoneOffset = 0; break;
      case 1: semitoneOffset = scale === 'phrygian' ? 1 : 2; break;
      case 2: semitoneOffset = 3; break; // Minor 3rd
      case 3: semitoneOffset = 5; break; // 4th
      case 4: semitoneOffset = 7; break; // 5th
      case 5: semitoneOffset = scale === 'phrygian' ? 8 : (scale === 'dorian' ? 9 : 8); break;
      case -1: semitoneOffset = scale === 'harmonic_minor' ? -1 : -2; break; // Leading tone / flat 7th below
      case -2: semitoneOffset = -4; break;
      default: semitoneOffset = degreeOffset * 2; break;
    }

    let rawPitch = rootMidi + semitoneOffset + (octaveOffset * 12);
    // Snap strictly to scale
    if (!scaleNotes.includes(rawPitch)) {
      rawPitch = scaleNotes.reduce((prev, curr) =>
        Math.abs(curr - rawPitch) < Math.abs(prev - rawPitch) ? curr : prev, scaleNotes[0]);
    }
    return rawPitch;
  };

  // 5. Generate Bar 1 Motif (A)
  // Check if personality / recook leaves beat 1 silent
  const emptyDownbeat = (nextRnd() < personality.emptyDownbeatPreference) || (vocalSpace > 70);

  const bar1Notes: NoteEvent[] = [];
  if (motifCell.suggestedEntry !== 'delayed_bar_2') {
    motifCell.notes.forEach(n => {
      let step = n.stepInBar;
      // Shift downbeat if empty downbeat is desired
      if (emptyDownbeat && step === 0) {
        step = 2; // Late beat-1 pocket
      }

      // Avoid step collision with heavy keys stabs
      if (keysActiveSteps.includes(step)) {
        step = (step + 2) % 16;
      }

      const pitch = resolveDegreeToPitch(n.degreeOffset, n.octaveOffset);
      const dur = Math.max(1, Math.round(n.duration * (1 - (vocalSpace / 300))));

      bar1Notes.push({
        step,
        bar: 0,
        stepInBar: step,
        pitch,
        duration: dur,
        velocity: n.velocity,
      });
    });
  }

  // 6. Build the 8-Bar Structural Phrase with Micro-Variation
  const allNotes: NoteEvent[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const barOffset = bar * 16;

    // BAR 1: Motif A (Establish Theme)
    if (bar === 0) {
      bar1Notes.forEach(n => allNotes.push({ ...n, bar: 0, step: barOffset + n.stepInBar }));
    }

    // BAR 2: Response B (Conversational answer)
    else if (bar === 1) {
      if (motifCell.suggestedEntry === 'delayed_bar_2') {
        // Enters for the first time in Bar 2!
        motifCell.notes.forEach(n => {
          const pitch = resolveDegreeToPitch(n.degreeOffset, n.octaveOffset);
          allNotes.push({
            step: barOffset + n.stepInBar,
            bar: 1,
            stepInBar: n.stepInBar,
            pitch,
            duration: n.duration,
            velocity: n.velocity,
          });
        });
      } else if (vocalSpace > 85 && nextRnd() > 0.6) {
        // Space for rapper's setup
      } else {
        // Response answers by descending or resolving to anchor
        bar1Notes.forEach(n => {
          // Controlled mutation: Move response down 1 scale step or land on root
          let respPitch = n.pitch;
          if (personality.tensionResolutionBias === 'root') {
            respPitch = rootMidi;
          } else if (personality.tensionResolutionBias === 'third') {
            respPitch = thirdMidi;
          } else {
            respPitch = n.pitch > rootMidi ? n.pitch - 2 : fifthMidi;
          }

          // Keep in scale
          if (!scaleNotes.includes(respPitch)) {
            respPitch = scaleNotes.reduce((prev, curr) =>
              Math.abs(curr - respPitch) < Math.abs(prev - respPitch) ? curr : prev, scaleNotes[0]);
          }

          const respStep = (n.stepInBar + (recookIntent === 'NEW_RHYTHM' ? 4 : 2)) % 16;
          allNotes.push({
            step: barOffset + respStep,
            bar: 1,
            stepInBar: respStep,
            pitch: respPitch,
            duration: n.duration,
            velocity: Math.max(65, n.velocity - 6),
          });
        });
      }
    }

    // BAR 3: Motif A with One Changed Ending (Micro-variation)
    else if (bar === 2) {
      bar1Notes.forEach((n, idx) => {
        const isLastNote = idx === bar1Notes.length - 1;
        let pitch = n.pitch;
        let step = n.stepInBar;

        // Controlled micro-mutation on the final note only
        if (isLastNote) {
          if (recookIntent === 'NEW_CONTOUR') {
            pitch = n.pitch <= rootMidi ? fifthMidi : rootMidi;
          } else {
            pitch = thirdMidi; // Emotion pivot
          }
          step = (step + 1) % 16;
        }

        allNotes.push({
          step: barOffset + step,
          bar: 2,
          stepInBar: step,
          pitch,
          duration: n.duration,
          velocity: n.velocity,
        });
      });
    }

    // BAR 4: Space / Turnaround
    else if (bar === 3) {
      // High vocal space leaves Bar 4 completely empty for drum turnaround
      if (vocalSpace > 50 || personality.densityEnvelope[3] === 0) {
        // Intentional silence
      } else {
        // 1 single turnaround anchor note
        const turnaroundPitch = personality.tensionResolutionBias === 'unresolved_turnaround'
          ? (scale === 'phrygian' ? rootMidi + 1 : fifthMidi)
          : rootMidi;

        allNotes.push({
          step: barOffset + 0,
          bar: 3,
          stepInBar: 0,
          pitch: turnaroundPitch,
          duration: 2,
          velocity: 86,
        });
      }
    }

    // BAR 5: Return to A (STRICT HOME RETURN — EXACT REPEAT OF BAR 1 MOTIF)
    else if (bar === 4) {
      bar1Notes.forEach(n => {
        allNotes.push({
          step: barOffset + n.stepInBar,
          bar: 4,
          stepInBar: n.stepInBar,
          pitch: n.pitch, // Identical pitch
          duration: n.duration,
          velocity: n.velocity,
        });
      });
    }

    // BAR 6: Response Variation B2
    else if (bar === 5) {
      if (vocalSpace > 80 && personality.id !== 'HYPNOTIC') {
        // Space for vocal breath
      } else {
        // Mirrors Bar 2 with subtle octave or inflection tweak
        bar1Notes.forEach((n, idx) => {
          let pitch = n.pitch;
          if (idx === 0 && personality.octaveJumpAllowed && nextRnd() > 0.5) {
            pitch += 12; // Octave punctuation
          } else {
            pitch = (idx % 2 === 0) ? rootMidi : thirdMidi;
          }

          allNotes.push({
            step: barOffset + n.stepInBar,
            bar: 5,
            stepInBar: n.stepInBar,
            pitch,
            duration: n.duration,
            velocity: Math.max(60, n.velocity - 4),
          });
        });
      }
    }

    // BAR 7: Setup / Tension Build
    else if (bar === 6) {
      // Setup derived from A or building tension
      const tensionTone = (darkness > 65)
        ? (scale === 'phrygian' ? rootMidi + 1 : rootMidi + 10)
        : fifthMidi;

      allNotes.push({
        step: barOffset + 0,
        bar: 6,
        stepInBar: 0,
        pitch: tensionTone,
        duration: 3,
        velocity: 96,
      });

      if (density > 60 && vocalSpace < 60) {
        allNotes.push({
          step: barOffset + 8,
          bar: 6,
          stepInBar: 8,
          pitch: rootMidi,
          duration: 3,
          velocity: 90,
        });
      }
    }

    // BAR 8: Turnaround / Space (Rapper drop)
    else if (bar === 7) {
      // Bar 8 is ALWAYS stripped down: zero notes or at most 1 brief tail note on step 0
      if (vocalSpace > 35) {
        // Pure silence into the drop
      } else {
        allNotes.push({
          step: barOffset + 0,
          bar: 7,
          stepInBar: 0,
          pitch: rootMidi,
          duration: 2,
          velocity: 82,
        });
      }
    }
  }

  // 7. Handle Sibling V1 / V2 / V3 Relationships
  // Rule: Share core motif, harmonic frame, main register, anchor pitches, general rhythm.
  const finalNotes = applyMelodyVariation(allNotes, variation, personality);

  // 8. Evaluate Quality & Anti-Generic Compliance
  const quality = evaluateMelodyQuality(finalNotes, anchorMidis);

  return {
    notes: finalNotes,
    personality,
    motifCell,
    anchorMidis,
    quality,
  };
}

// Shared by ordinary generation and targeted recooks, so siblings use one motif.
export function applyMelodyVariation(
  allNotes: NoteEvent[],
  variation: 'V1' | 'V2' | 'V3',
  personality: MelodyPersonality
): NoteEvent[] {
  let finalNotes = allNotes;

  if (variation === 'V2') {
    // Sibling V2: Slightly more response movement in Bar 2 & Bar 6
    finalNotes = allNotes.map(n => {
      if (n.bar === 1 && n.stepInBar === 0 && personality.octaveJumpAllowed) {
        return { ...n, pitch: n.pitch + 12 };
      }
      return n;
    });
  } else if (variation === 'V3') {
    // Sibling V3: More vocal space — dropouts in Bar 6 and Bar 7 for a clean drop
    finalNotes = allNotes.filter(n => n.bar !== 5);
  }

  return finalNotes;
}

/**
 * Backward compatibility wrapper returning NoteEvent[]
 */
export function generateMelodyTrack(
  rootKey: string,
  scale: ScaleType,
  seed: number,
  density: number,
  darkness: number,
  vocalSpace: number,
  variation: 'V1' | 'V2' | 'V3'
): NoteEvent[] {
  const result = generateMelodyTrackWithGrammar({
    rootKey,
    scale,
    seed,
    density,
    darkness,
    vocalSpace,
    variation,
  });
  return result.notes;
}
