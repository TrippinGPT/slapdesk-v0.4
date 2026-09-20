/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NoteEvent } from '../types';
import { KICK_FAMILIES, KickPatternFamily } from './kickFamilies';
import { HAT_FAMILIES, HatPocketFamily } from './hatFamilies';

export const MIDI_PERC = {
  KICK: 36,       // C1
  SNARE: 38,      // D1
  CLAP: 39,       // D#1
  CLOSED_HAT: 42, // F#1
  OPEN_HAT: 46,   // A#1
  RIM_SHOT: 37,   // C#1
};

export function generateKickTrack(
  kickFamilyId: number,
  density: number,
  swing: number,
  vocalSpace: number,
  variation: 'V1' | 'V2' | 'V3'
): NoteEvent[] {
  const family = KICK_FAMILIES.find(f => f.id === kickFamilyId) || KICK_FAMILIES[0];
  const notes: NoteEvent[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const barOffset = bar * 16;
    const barPattern = family.bars[bar] || [];

    // Vocal space filter: if vocal space is extreme (>85), trim down extra kicks
    const allowedHits = barPattern.filter(hit => {
      if (vocalSpace > 75 && hit.step !== 0 && hit.step !== 10) {
        return density > 60;
      }
      return true;
    });

    allowedHits.forEach(hit => {
      // Swing calculation
      const isOdd16th = hit.step % 2 === 1;
      const swingTicks = isOdd16th ? Math.round((swing / 100) * 16) : 0;
      const micro = (hit.micro || 0) + swingTicks;

      // Sibling variation adjustments
      let velocity = Math.round((hit.velocity || 0.95) * 120);
      if (variation === 'V2' && bar === 3) {
        velocity = Math.min(127, velocity + 6);
      } else if (variation === 'V3' && bar === 7) {
        // V3 strips down bar 8 for extra vocal room
        return;
      }

      notes.push({
        step: barOffset + hit.step,
        bar,
        stepInBar: hit.step,
        pitch: MIDI_PERC.KICK,
        duration: 1,
        velocity,
        microtiming: micro,
      });
    });
  }

  return notes;
}

export function generateSnareClapTrack(
  phraseFamilyId: number,
  vocalSpace: number,
  variation: 'V1' | 'V2' | 'V3'
): NoteEvent[] {
  const notes: NoteEvent[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const barOffset = bar * 16;

    // Standard Slap Backbeat: Hard hits on step 4 and step 12 (Beats 2 and 4)
    // Step 4 = Beat 2
    notes.push({
      step: barOffset + 4,
      bar,
      stepInBar: 4,
      pitch: MIDI_PERC.CLAP,
      duration: 1,
      velocity: 122,
    });

    // Step 12 = Beat 4
    // Bar 8 Dropout rule: If vocal space is high, step 12 drops out in bar 8 to clear for rapper
    if (bar === 7 && vocalSpace > 65) {
      // Dropout for vocal punch into bar 1!
    } else {
      notes.push({
        step: barOffset + 12,
        bar,
        stepInBar: 12,
        pitch: MIDI_PERC.CLAP,
        duration: 1,
        velocity: 125,
      });
    }

    // Turnaround rolls on Bar 4 and Bar 7
    if (bar === 3 || bar === 6) {
      // Ghost snare hit on step 14 or 15
      notes.push({
        step: barOffset + 14,
        bar,
        stepInBar: 14,
        pitch: MIDI_PERC.SNARE,
        duration: 1,
        velocity: 88,
      });
      if (variation === 'V2') {
        // V2 has a double roll at turnaround
        notes.push({
          step: barOffset + 15,
          bar,
          stepInBar: 15,
          pitch: MIDI_PERC.SNARE,
          duration: 1,
          velocity: 96,
        });
      }
    }
  }

  return notes;
}

export function generateHiHatTrack(
  hatFamilyId: number,
  density: number,
  swing: number,
  vocalSpace: number,
  variation: 'V1' | 'V2' | 'V3'
): NoteEvent[] {
  const family = HAT_FAMILIES.find(f => f.id === hatFamilyId) || HAT_FAMILIES[0];
  const notes: NoteEvent[] = [];

  for (let bar = 0; bar < 8; bar++) {
    const barOffset = bar * 16;
    const barSteps = family.bars[bar] || [];

    barSteps.forEach(h => {
      // Vocal space trimming on very high settings
      if (vocalSpace > 80 && (h.step === 4 || h.step === 12)) {
        return; // Keep clap isolated
      }

      // Swing
      const isOdd16th = h.step % 2 === 1;
      const swingTicks = isOdd16th ? Math.round((swing / 100) * 18) : 0;
      const micro = (h.microtiming || 0) + swingTicks;

      const pitch = h.isOpen ? MIDI_PERC.OPEN_HAT : MIDI_PERC.CLOSED_HAT;
      let velocity = Math.round(h.velocity * 115);

      if (variation === 'V2' && bar === 3 && h.isTripletRoll) {
        velocity = Math.min(127, velocity + 10);
      }

      notes.push({
        step: barOffset + h.step,
        bar,
        stepInBar: h.step,
        pitch,
        duration: h.isOpen ? 2 : 1,
        velocity,
        microtiming: micro,
      });
    });
  }

  return notes;
}
