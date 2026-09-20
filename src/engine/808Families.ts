/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Bass808NotePattern {
  step: number;        // 0..15 in the bar
  duration: number;    // In 16th steps (e.g. 2 = 8th note, 4 = quarter, 8 = half, 16 = whole)
  interval: number;    // Semitones relative to root (0 = root, 3 = m3, 5 = 4th, 7 = 5th, 12 = octave)
  octaveOffset: number;// -1, 0, +1
  glideSemitones?: number; // E.g. +12 for octave up glide, -12 for dive
  velocity?: number;   // 0..127
}

export interface Bass808Family {
  id: number;
  name: string;
  description: string;
  bars: Bass808NotePattern[][];
}

export const BASS_808_FAMILIES: Bass808Family[] = [
  {
    id: 1,
    name: 'Sparse',
    description: 'Deep, room-shaking root drops. Huge space between notes allowing vocals to float.',
    bars: [
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 7, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }], // Home return
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
  {
    id: 2,
    name: 'Sustained',
    description: 'Long drone-like sub sustains holding through the entire bar before changing pitch.',
    bars: [
      [{ step: 0, duration: 14, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 12, interval: 3, octaveOffset: 0 }],
      [{ step: 0, duration: 14, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 10, interval: 7, octaveOffset: 0 }],
      [{ step: 0, duration: 14, interval: 0, octaveOffset: 0 }], // Home return
      [{ step: 0, duration: 12, interval: 3, octaveOffset: 0 }],
      [{ step: 0, duration: 14, interval: 5, octaveOffset: 0 }],
      [{ step: 0, duration: 8, interval: 0, octaveOffset: 0 }], // Bar 8 decay
    ],
  },
  {
    id: 3,
    name: 'Bouncing',
    description: 'Classic Detroit bounce with syncopated 8th-note steps and octave hops.',
    bars: [
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 0, octaveOffset: 0 }, { step: 10, duration: 3, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 8, duration: 2, interval: 12, octaveOffset: 0 }, { step: 14, duration: 2, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 0, octaveOffset: 0 }, { step: 10, duration: 3, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 2, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 7, octaveOffset: 0 }, { step: 12, duration: 2, interval: 12, octaveOffset: 0 }, { step: 14, duration: 2, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 0, octaveOffset: 0 }, { step: 10, duration: 3, interval: 0, octaveOffset: 0 }], // Home
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 8, duration: 2, interval: 12, octaveOffset: 0 }, { step: 14, duration: 2, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 5, octaveOffset: 0 }, { step: 10, duration: 3, interval: 7, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
  {
    id: 4,
    name: 'Aggressive',
    description: 'Punchy, distorted street 808 hitting hard with syncopated double strikes.',
    bars: [
      [{ step: 0, duration: 2, interval: 0, octaveOffset: 0 }, { step: 3, duration: 2, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 0, octaveOffset: 0 }, { step: 14, duration: 2, interval: 12, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 3, octaveOffset: 0 }, { step: 10, duration: 3, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 2, interval: 0, octaveOffset: 0 }, { step: 3, duration: 2, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 0, octaveOffset: 0 }, { step: 14, duration: 2, interval: 12, octaveOffset: 0 }],
      [{ step: 0, duration: 2, interval: 0, octaveOffset: 0 }, { step: 4, duration: 2, interval: 7, octaveOffset: 0 }, { step: 8, duration: 2, interval: 12, octaveOffset: 0 }, { step: 12, duration: 2, interval: 10, octaveOffset: 0 }, { step: 14, duration: 2, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 2, interval: 0, octaveOffset: 0 }, { step: 3, duration: 2, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 0, octaveOffset: 0 }, { step: 14, duration: 2, interval: 12, octaveOffset: 0 }], // Home
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 3, octaveOffset: 0 }, { step: 10, duration: 3, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 2, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 5, octaveOffset: 0 }, { step: 10, duration: 3, interval: 7, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
  {
    id: 5,
    name: 'Call-and-Response',
    description: 'Low root statement on bar 1 followed by high octave answer on bar 2.',
    bars: [
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 2, duration: 4, interval: 12, octaveOffset: 0 }, { step: 10, duration: 3, interval: 10, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 2, duration: 3, interval: 12, octaveOffset: 0 }, { step: 6, duration: 2, interval: 14, octaveOffset: 0 }, { step: 10, duration: 3, interval: 7, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }], // Home
      [{ step: 2, duration: 4, interval: 12, octaveOffset: 0 }, { step: 10, duration: 3, interval: 10, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 3, octaveOffset: 0 }, { step: 12, duration: 3, interval: 5, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
  {
    id: 6,
    name: 'Sliding',
    description: 'Signature Bay / Detroit 808 pitch bends gliding +12 semitones up into turnarounds.',
    bars: [
      [{ step: 0, duration: 5, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 10, duration: 4, interval: 0, octaveOffset: 0, glideSemitones: 12 }],
      [{ step: 0, duration: 5, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 3, interval: 5, octaveOffset: 0, glideSemitones: 7 }, { step: 12, duration: 3, interval: 7, octaveOffset: 0, glideSemitones: -7 }],
      [{ step: 0, duration: 5, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 0, octaveOffset: 0 }], // Home
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 10, duration: 4, interval: 0, octaveOffset: 0, glideSemitones: 12 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 3, octaveOffset: 0, glideSemitones: 5 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
  {
    id: 7,
    name: 'Long-Hold',
    description: 'Deep seismic 808 holding for 12-14 steps, rumbling under the kick knock.',
    bars: [
      [{ step: 0, duration: 12, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 10, interval: 0, octaveOffset: 0 }, { step: 12, duration: 3, interval: 3, octaveOffset: 0 }],
      [{ step: 0, duration: 12, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 10, interval: 0, octaveOffset: 0 }, { step: 12, duration: 3, interval: 7, octaveOffset: 0 }],
      [{ step: 0, duration: 12, interval: 0, octaveOffset: 0 }], // Home
      [{ step: 0, duration: 10, interval: 0, octaveOffset: 0 }, { step: 12, duration: 3, interval: 3, octaveOffset: 0 }],
      [{ step: 0, duration: 12, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
  {
    id: 8,
    name: 'Stop/Start',
    description: 'Abrupt mutes directly before the snare hits, snapping back with heavy impact.',
    bars: [
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 3, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }], // Bar 4 abrupt cutout
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 4, interval: 0, octaveOffset: 0 }], // Home
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 3, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }, { step: 6, duration: 3, interval: 7, octaveOffset: 0 }, { step: 12, duration: 3, interval: 5, octaveOffset: 0 }],
      [{ step: 0, duration: 3, interval: 0, octaveOffset: 0 }], // Bar 8 cutout
    ],
  },
  {
    id: 9,
    name: 'Pickup-Heavy',
    description: 'Late 16th-note pickups (step 14, 15) driving head-nod momentum into each downbeat.',
    bars: [
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 0, octaveOffset: 0 }, { step: 14, duration: 2, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 3, octaveOffset: 0 }, { step: 15, duration: 1, interval: 5, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 0, octaveOffset: 0 }, { step: 14, duration: 2, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 6, duration: 2, interval: 7, octaveOffset: 0 }, { step: 12, duration: 2, interval: 12, octaveOffset: 0 }, { step: 15, duration: 1, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 0, octaveOffset: 0 }, { step: 14, duration: 2, interval: 0, octaveOffset: 0 }], // Home
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 8, duration: 3, interval: 3, octaveOffset: 0 }, { step: 15, duration: 1, interval: 5, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }, { step: 6, duration: 3, interval: 7, octaveOffset: 0 }, { step: 14, duration: 2, interval: 10, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
  {
    id: 10,
    name: 'Minimal Root-Driven',
    description: 'Pure hypnotic foundation locked solely to root note with occasional octave touch.',
    bars: [
      [{ step: 0, duration: 8, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }, { step: 10, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 8, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }, { step: 8, duration: 4, interval: 12, octaveOffset: 0 }],
      [{ step: 0, duration: 8, interval: 0, octaveOffset: 0 }], // Home
      [{ step: 0, duration: 6, interval: 0, octaveOffset: 0 }, { step: 10, duration: 4, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 8, interval: 0, octaveOffset: 0 }],
      [{ step: 0, duration: 4, interval: 0, octaveOffset: 0 }], // Bar 8 space
    ],
  },
];
