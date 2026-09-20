/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NoteEvent, ScaleType } from '../types';
import { BASS_808_FAMILIES, Bass808Family } from './808Families';
import { getRootMidi, getScaleMidiNotes } from './scales';

export function generate808Track(
  bassFamilyId: number,
  rootKey: string,
  scale: ScaleType,
  bassMovement: number,
  vocalSpace: number,
  variation: 'V1' | 'V2' | 'V3'
): NoteEvent[] {
  const family = BASS_808_FAMILIES.find(f => f.id === bassFamilyId) || BASS_808_FAMILIES[0];
  const rootMidi = getRootMidi(rootKey, 1); // Octave 1 (C1 = 24 to B1 = 35)
  const scaleNotes = getScaleMidiNotes(rootKey, scale, [1, 2]);

  const notes: NoteEvent[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const barOffset = bar * 16;
    const barPatterns = family.bars[bar] || [];

    // Rapper Space rule: Bar 8 drops out or cuts very early
    if (bar === 7 && vocalSpace > 50) {
      // Keep only first hit on step 0, duration 3 steps
      notes.push({
        step: barOffset,
        bar: 7,
        stepInBar: 0,
        pitch: rootMidi,
        duration: 3,
        velocity: 110,
      });
      continue;
    }

    barPatterns.forEach((pat, idx) => {
      // Check bassMovement slider: if low, omit complex secondary hits
      if (bassMovement < 35 && idx > 1 && pat.step !== 0) {
        return;
      }

      // Base pitch in scale
      let pitch = rootMidi + pat.interval + (pat.octaveOffset * 12);
      if (!scaleNotes.includes(pitch)) {
        pitch = scaleNotes.reduce((prev, curr) => Math.abs(curr - pitch) < Math.abs(prev - pitch) ? curr : prev, scaleNotes[0]);
      }

      // Glides
      let glideTo: number | undefined;
      if (pat.glideSemitones && bassMovement > 30) {
        glideTo = pitch + pat.glideSemitones;
      }

      // Movement boost: occasionally add glide to high movement
      if (!glideTo && bassMovement > 75 && (bar === 3 || bar === 6) && idx === barPatterns.length - 1) {
        glideTo = pitch + 12; // Octave glide into turnaround
      }

      // Sibling variation adjustments
      if (variation === 'V2' && bar === 1 && idx === 0) {
        // V2 octave variation on response
        pitch = pitch + 12 <= 48 ? pitch + 12 : pitch;
      }

      notes.push({
        step: barOffset + pat.step,
        bar,
        stepInBar: pat.step,
        pitch,
        duration: pat.duration,
        velocity: pat.velocity || 120,
        glideTo,
      });
    });
  }

  return notes;
}
