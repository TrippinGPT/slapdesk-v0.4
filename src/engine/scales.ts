/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScaleType } from '../types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Accept the flat spellings used by the generator UI and QA suite.
function getRootIndex(rootKey: string): number {
  const flatAliases: Record<string, string> = {
    Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#',
  };
  return NOTE_NAMES.indexOf((flatAliases[rootKey] ?? rootKey) as any);
}

// Scale formulas (semitone intervals from root)
export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  natural_minor: [0, 2, 3, 5, 7, 8, 10],   // Classic Bay / Mobb pain loop (Aeolian)
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],  // Eerie Detroit bounce / tension (sharp 7th)
  phrygian: [0, 1, 3, 5, 7, 8, 10],        // Dark sinister minor 2nd clash (Vezzo / Mozzy)
  dorian: [0, 2, 3, 5, 7, 9, 10],          // Melancholy West Coast funk / bittersweet
};

export function getRootMidi(rootKey: string, octave: number): number {
  const idx = getRootIndex(rootKey);
  const base = idx >= 0 ? idx : 0;
  return (octave + 1) * 12 + base;
}

export function getScaleMidiNotes(rootKey: string, scale: ScaleType, octaveRange: [number, number]): number[] {
  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.natural_minor;
  const rootIndex = getRootIndex(rootKey);
  const safeRootIndex = rootIndex >= 0 ? rootIndex : 0;
  const notes: number[] = [];

  for (let oct = octaveRange[0]; oct <= octaveRange[1]; oct++) {
    const octRoot = (oct + 1) * 12 + safeRootIndex;
    for (const interval of intervals) {
      const midi = octRoot + interval;
      if (midi >= 0 && midi <= 127) {
        notes.push(midi);
      }
    }
  }

  return notes;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number): string {
  const noteIdx = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIdx]}${oct}`;
}

export function isPitchInScale(pitch: number, rootKey: string, scale: ScaleType): boolean {
  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.natural_minor;
  const rootIndex = getRootIndex(rootKey);
  const pitchClass = (pitch % 12 + 12) % 12;
  const relativeClass = (pitchClass - rootIndex + 12) % 12;
  return intervals.includes(relativeClass);
}
