/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NoteEvent, ScaleType } from '../types';
import { getRootMidi } from './scales';

export interface KeysOptions {
  rootKey: string;
  scale: ScaleType;
  seed: number;
  density: number;
  darkness: number;
  vocalSpace: number;
  variation: 'V1' | 'V2' | 'V3';
  melodyNoteSteps?: number[]; // Global steps where melody is active
}

/**
 * Secondary Keys / Dark EP Piano Engine
 * Interlocks with the melody track to avoid collision.
 * Respects vocal space and call-and-response dynamics.
 */
export function generateKeysTrack(
  rootKey: string,
  scale: ScaleType,
  seed: number,
  density: number,
  darkness: number,
  vocalSpace: number,
  variation: 'V1' | 'V2' | 'V3',
  melodyNoteSteps: number[] = []
): NoteEvent[] {
  // If vocal space is very high (>80), secondary keys part drops out entirely to preserve negative space
  if (vocalSpace > 82) {
    return [];
  }

  const rootMidi = getRootMidi(rootKey, 3); // Octave 3 for dark Rhodes / piano stabs
  const thirdInterval = 3; // minor 3rd
  const fifthInterval = 7; // perfect 5th
  const extensionInterval = darkness > 50 ? (scale === 'phrygian' ? 8 : 10) : 10; // minor 6th or 7th

  const notes: NoteEvent[] = [];

  // Deterministic random
  let rndState = ((seed + 9999) * 1664525 + 1013904223) >>> 0;
  const nextRnd = () => {
    rndState = (rndState * 1664525 + 1013904223) >>> 0;
    return (rndState >>> 0) / 4294967296;
  };

  const melodyStepSet = new Set(melodyNoteSteps);

  // 8-Bar structure with whole-bar rests
  for (let bar = 0; bar < 8; bar++) {
    // Bar 4 (Turnaround) and Bar 8 (Space) rest to clear space for drum fills/drops
    if (bar === 3 || bar === 7) {
      continue;
    }

    // High vocal space adds whole-bar rests on Bar 2 and Bar 6
    if (vocalSpace > 50 && (bar === 1 || bar === 5)) {
      continue;
    }

    const barOffset = bar * 16;
    // Interlocking stab step: choose step 2 or 6, or step 4 if melody isn't there
    let stabStep = (bar % 2 === 0) ? 2 : 6;
    if (melodyStepSet.has(barOffset + stabStep)) {
      // Step clash avoidance: move keys to step 4 or 8
      stabStep = (stabStep + 2) % 16;
    }

    const chordDuration = density > 65 ? 3 : 2; // Crisp stab

    // Root triad: Root + Minor 3rd + 5th
    const chordPitches = [
      rootMidi,
      rootMidi + thirdInterval,
      rootMidi + fifthInterval,
    ];

    if (darkness > 70) {
      chordPitches.push(rootMidi + extensionInterval);
    }

    chordPitches.forEach(pitch => {
      notes.push({
        step: barOffset + stabStep,
        bar,
        stepInBar: stabStep,
        pitch,
        duration: chordDuration,
        velocity: 76 + Math.round(nextRnd() * 12),
      });
    });

    // Secondary subtle stab on step 10 in denser settings (only if melody isn't active on step 10)
    if (density > 75 && vocalSpace < 40 && !melodyStepSet.has(barOffset + 10)) {
      chordPitches.slice(0, 2).forEach(pitch => {
        notes.push({
          step: barOffset + 10,
          bar,
          stepInBar: 10,
          pitch,
          duration: 2,
          velocity: 68,
        });
      });
    }
  }

  return notes;
}
