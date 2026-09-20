/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HatStep {
  step: number;        // 0..15
  isOpen?: boolean;    // Open hi-hat accent
  velocity: number;    // 0.3 .. 1.0
  microtiming?: number;// Microtiming ticks
  isTripletRoll?: boolean;
}

export interface HatPocketFamily {
  id: number;
  name: string;
  category?: string;
  description: string;
  bars: HatStep[][];
}

export const HAT_FAMILIES: HatPocketFamily[] = [
  {
    id: 1,
    name: 'Sparse Straight 8ths',
    description: 'Clean, unhurried 8th notes on even steps (0, 2, 4, 6, 8, 10, 12, 14) with subtle ghost downbeats.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      const steps: HatStep[] = [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({
        step: s,
        velocity: s % 4 === 0 ? 0.85 : 0.65,
        isOpen: s === 6 && (barIdx === 3 || barIdx === 7),
      }));
      // Bar 4 & 7 turnaround roll
      if (barIdx === 3 || barIdx === 6) {
        steps.push({ step: 15, velocity: 0.7, microtiming: 2 });
      }
      return steps;
    }),
  },
  {
    id: 2,
    name: 'Detroit Double-Tap 16ths',
    description: 'Bouncing 16th doubles on steps 2-3 and 10-11. Classic Michigan bounce.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      const baseSteps = [0, 2, 3, 6, 8, 10, 11, 14];
      const steps: HatStep[] = baseSteps.map(s => ({
        step: s,
        velocity: s === 3 || s === 11 ? 0.6 : 0.82,
        isOpen: s === 14 && barIdx % 2 === 1,
      }));
      if (barIdx === 3) {
        steps.push({ step: 13, velocity: 0.75 }, { step: 15, velocity: 0.85 });
      }
      return steps;
    }),
  },
  {
    id: 3,
    name: 'Off-Beat Open Hat Accent',
    description: 'Sustained sizzle open-hat on steps 2, 6, 10, 14 slicing across the dry clap.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      return [
        { step: 0, velocity: 0.75 },
        { step: 2, isOpen: true, velocity: 0.9 },
        { step: 4, velocity: 0.5 },
        { step: 6, isOpen: true, velocity: 0.85 },
        { step: 8, velocity: 0.75 },
        { step: 10, isOpen: true, velocity: 0.9 },
        { step: 12, velocity: 0.5 },
        { step: 14, isOpen: true, velocity: 0.88 },
      ];
    }),
  },
  {
    id: 4,
    name: 'Selective Pocket Holes',
    description: 'Intentional gaps on steps 3-4 and 11-12 so the clap smacks into absolute silence.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      // Omit steps 3, 4, 11, 12
      return [
        { step: 0, velocity: 0.8 },
        { step: 2, velocity: 0.65 },
        { step: 6, velocity: 0.75 },
        { step: 8, velocity: 0.8 },
        { step: 10, velocity: 0.65 },
        { step: 14, velocity: 0.75 },
      ];
    }),
  },
  {
    id: 5,
    name: 'Turnaround Triplet Cascade',
    description: 'Steady 8th groove throughout bars 1-3, erupting in fast 32nd/triplet rolls on bar 4.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      const isTurnaround = barIdx === 3 || barIdx === 7;
      if (isTurnaround) {
        return [
          { step: 0, velocity: 0.8 },
          { step: 2, velocity: 0.7 },
          { step: 6, velocity: 0.75 },
          { step: 8, velocity: 0.8 },
          { step: 12, velocity: 0.7 },
          { step: 13, velocity: 0.75, isTripletRoll: true },
          { step: 14, velocity: 0.85, isTripletRoll: true },
          { step: 15, velocity: 0.92, isTripletRoll: true },
        ];
      }
      return [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ step: s, velocity: s % 4 === 0 ? 0.8 : 0.6 }));
    }),
  },
  {
    id: 6,
    name: 'Late 16th Slap Swing',
    description: 'Every odd 16th note is pushed late by 15-20 ticks for heavy Bay Area swing.',
    bars: Array(8).fill(null).map(() => {
      const steps: HatStep[] = [];
      for (let s = 0; s < 16; s += 2) {
        steps.push({ step: s, velocity: 0.8, microtiming: 0 });
        if (s !== 4 && s !== 12) {
          steps.push({ step: s + 1, velocity: 0.55, microtiming: 14 });
        }
      }
      return steps;
    }),
  },
  {
    id: 7,
    name: 'Minimal Mobb Hat',
    description: 'Ultra-chunky 4-step quarter/eighth framework giving maximum head-nod pocket.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      return [
        { step: 0, velocity: 0.85 },
        { step: 4, velocity: 0.6 },
        { step: 8, velocity: 0.85 },
        { step: 12, velocity: 0.6 },
        { step: 14, velocity: 0.7, isOpen: barIdx % 2 === 1 },
      ];
    }),
  },
  {
    id: 8,
    name: 'Icewear Stutter',
    description: 'Syncopated triplets on steps 1 and 9 mirroring Detroit drum machine accents.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      return [
        { step: 0, velocity: 0.8 },
        { step: 1, velocity: 0.6, microtiming: 4 },
        { step: 2, velocity: 0.7 },
        { step: 6, velocity: 0.75, isOpen: true },
        { step: 8, velocity: 0.8 },
        { step: 9, velocity: 0.6, microtiming: 4 },
        { step: 10, velocity: 0.7 },
        { step: 14, velocity: 0.75 },
      ];
    }),
  },
  {
    id: 9,
    name: 'Ghost Note Rollers',
    description: 'Dynamic velocity hills: quiet ghost hits rising into sharp accents.',
    bars: Array(8).fill(null).map(() => {
      const vels = [0.85, 0.4, 0.65, 0.45, 0.7, 0.4, 0.9, 0.5, 0.85, 0.4, 0.65, 0.45, 0.7, 0.5, 0.92, 0.4];
      return vels.map((v, s) => ({ step: s, velocity: v }));
    }),
  },
  {
    id: 10,
    name: 'Bar-8 Complete Dropout',
    description: 'High hats run active on bars 1-7, then go 100% dead silent on bar 8 for vocal breath.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      if (barIdx === 7) return []; // dead silent bar 8
      return [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ step: s, velocity: 0.75 }));
    }),
  },
  {
    id: 11,
    name: 'Double-Tap Turnaround',
    category: 'Bay',
    description: 'Straight 8ths punctuated with snappy double taps into bars 4 and 8.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      const base: HatStep[] = [0, 2, 4, 6, 8, 10, 12, 14].map(s => ({ step: s, velocity: 0.75 }));
      if (barIdx % 2 === 1) {
        base.push({ step: 15, velocity: 0.7, microtiming: 3 });
      }
      return base;
    }),
  },
  {
    id: 12,
    name: 'Velocitized Rolling 16ths',
    description: 'Continuous 16ths with an oscillating pendulum velocity wave.',
    bars: Array(8).fill(null).map(() => {
      return Array(16).fill(null).map((_, s) => ({
        step: s,
        velocity: s % 2 === 0 ? 0.8 : 0.5,
        isOpen: s === 14,
      }));
    }),
  },
  {
    id: 13,
    name: 'Clap-Framing Flams',
    description: 'Quick micro-hat taps landing 10 ticks before the clap on steps 4 and 12.',
    bars: Array(8).fill(null).map(() => {
      return [
        { step: 0, velocity: 0.8 },
        { step: 2, velocity: 0.65 },
        { step: 3, velocity: 0.5, microtiming: 8 },
        { step: 6, velocity: 0.75 },
        { step: 8, velocity: 0.8 },
        { step: 10, velocity: 0.65 },
        { step: 11, velocity: 0.5, microtiming: 8 },
        { step: 14, velocity: 0.75 },
      ];
    }),
  },
  {
    id: 14,
    name: 'Syncopated Upbeat Skips',
    description: 'Emphasizes odd 16th steps (1, 5, 9, 13) skipping the downbeats.',
    bars: Array(8).fill(null).map(() => {
      return [
        { step: 0, velocity: 0.7 },
        { step: 3, velocity: 0.8 },
        { step: 7, velocity: 0.85, isOpen: true },
        { step: 11, velocity: 0.8 },
        { step: 15, velocity: 0.85, isOpen: true },
      ];
    }),
  },
  {
    id: 15,
    name: 'Aggressive Detroit Skitter',
    description: 'Rapid-fire bursts of 3 hits followed by wide pauses.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      return [
        { step: 0, velocity: 0.85 },
        { step: 1, velocity: 0.65 },
        { step: 2, velocity: 0.75 },
        { step: 6, velocity: 0.8, isOpen: true },
        { step: 8, velocity: 0.85 },
        { step: 9, velocity: 0.65 },
        { step: 10, velocity: 0.75 },
        { step: 14, velocity: 0.85, isOpen: barIdx === 3 || barIdx === 7 },
      ];
    }),
  },
  {
    id: 16,
    name: 'Push-Pull Swing 8ths',
    description: 'Unquantized feel with alternating positive and negative tick offsets.',
    bars: Array(8).fill(null).map(() => {
      return [
        { step: 0, velocity: 0.8, microtiming: 0 },
        { step: 2, velocity: 0.65, microtiming: -6 },
        { step: 4, velocity: 0.75, microtiming: 2 },
        { step: 6, velocity: 0.65, microtiming: 8 },
        { step: 8, velocity: 0.8, microtiming: 0 },
        { step: 10, velocity: 0.65, microtiming: -6 },
        { step: 12, velocity: 0.75, microtiming: 2 },
        { step: 14, velocity: 0.65, microtiming: 8 },
      ];
    }),
  },
  {
    id: 17,
    name: 'Triplet Pocket Choke',
    description: 'Sharp closed-hat choke stopping the open hat instantly on step 7 and 15.',
    bars: Array(8).fill(null).map(() => {
      return [
        { step: 0, velocity: 0.8 },
        { step: 2, velocity: 0.7 },
        { step: 6, velocity: 0.9, isOpen: true },
        { step: 7, velocity: 0.6 }, // choke
        { step: 8, velocity: 0.8 },
        { step: 10, velocity: 0.7 },
        { step: 14, velocity: 0.9, isOpen: true },
        { step: 15, velocity: 0.6 }, // choke
      ];
    }),
  },
  {
    id: 18,
    name: 'Sparse Mobb Step',
    description: 'Just 3-4 hits per measure. Maximum cold street pocket.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      return [
        { step: 0, velocity: 0.85 },
        { step: 6, velocity: 0.75, isOpen: barIdx % 2 === 1 },
        { step: 8, velocity: 0.8 },
        { step: 14, velocity: 0.7 },
      ];
    }),
  },
  {
    id: 19,
    name: "Cardo 'Got Wings' Triplet Swing",
    category: 'West Coast Swing',
    description: 'TRIFREEZE masterclass Cardo bounce: laid back 8th-note swing with open-hat sizzle on offbeats (step 2 & 10) and subtle triplet rolls.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      const steps: HatStep[] = [
        { step: 0, velocity: 0.85 },
        { step: 2, velocity: 0.9, isOpen: true }, // Open hat accent
        { step: 4, velocity: 0.7 },
        { step: 6, velocity: 0.65, microtiming: 6 },
        { step: 8, velocity: 0.82 },
        { step: 10, velocity: 0.9, isOpen: true }, // Open hat accent
        { step: 12, velocity: 0.72 },
        { step: 14, velocity: 0.65, microtiming: 6 },
      ];
      // Turnaround triplet roll into bar 4 and 8
      if (barIdx === 3 || barIdx === 7) {
        steps.push(
          { step: 14, velocity: 0.7, isTripletRoll: true },
          { step: 15, velocity: 0.82, isTripletRoll: true }
        );
      }
      return steps;
    }),
  },
  {
    id: 20,
    name: 'Southside 808 Mafia Stutter Rolls',
    category: 'Trap Rolls',
    description: 'Aggressive 808 Mafia trap hats: rapid 1/32 velocity drops leading into claps (steps 3 & 11) with stutter turnaround bursts.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      const steps: HatStep[] = [
        { step: 0, velocity: 0.85 },
        { step: 1, velocity: 0.65 },
        { step: 2, velocity: 0.75 },
        { step: 3, velocity: 0.55, microtiming: -2 }, // Pitch drop stutter into clap
        { step: 4, velocity: 0.8 },
        { step: 5, velocity: 0.68 },
        { step: 6, velocity: 0.72 },
        { step: 7, velocity: 0.9, isOpen: barIdx % 2 === 1 },
        { step: 8, velocity: 0.85 },
        { step: 9, velocity: 0.65 },
        { step: 10, velocity: 0.75 },
        { step: 11, velocity: 0.5, microtiming: -2 }, // Stutter into clap
        { step: 12, velocity: 0.8 },
        { step: 13, velocity: 0.7 },
        { step: 14, velocity: 0.82 },
        { step: 15, velocity: 0.6 },
      ];
      if (barIdx === 3 || barIdx === 6) {
        steps.push({ step: 15, velocity: 0.9, isTripletRoll: true });
      }
      return steps;
    }),
  },
  {
    id: 21,
    name: 'Wheezy Wave Velocity 16ths',
    category: 'Atlanta Pocket',
    description: 'Wheezy Outta Here signature bounce: dynamic undulating velocity waves across 16th notes with intentional step-2 skip rests.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      // Intentional skip on step 2 for breathing pocket
      const wavePattern = [
        { step: 0, vel: 0.88 },
        { step: 1, vel: 0.52 },
        // step 2 skipped for Wheezy pocket
        { step: 3, vel: 0.68 },
        { step: 4, vel: 0.92 },
        { step: 5, vel: 0.55 },
        { step: 6, vel: 0.76 },
        { step: 7, vel: 0.6 },
        { step: 8, vel: 0.86 },
        { step: 9, vel: 0.5 },
        { step: 10, vel: 0.72 },
        { step: 11, vel: 0.62 },
        { step: 12, vel: 0.9 },
        { step: 13, vel: 0.58 },
        { step: 14, vel: 0.8 },
        { step: 15, vel: 0.64 },
      ];
      const steps: HatStep[] = wavePattern.map(p => ({
        step: p.step,
        velocity: p.vel,
        isOpen: p.step === 6 && barIdx % 2 === 1,
      }));
      return steps;
    }),
  },
  {
    id: 22,
    name: 'Detroit Fast Gallop (Vezzo)',
    category: 'Detroit Bounce',
    description: 'Pede tutorial Icewear Vezzo stride: rapid 16th double-taps on 2-3, 6-7, 10-11, 14-15 with snappy offbeat open-hat punch.',
    bars: Array(8).fill(null).map((_, barIdx) => {
      const steps: HatStep[] = [
        { step: 0, velocity: 0.88 },
        { step: 2, velocity: 0.82 },
        { step: 3, velocity: 0.6 }, // double-tap ghost
        { step: 6, velocity: 0.85 },
        { step: 7, velocity: 0.62 }, // double-tap ghost
        { step: 8, velocity: 0.88 },
        { step: 10, velocity: 0.82 },
        { step: 11, velocity: 0.6 }, // double-tap ghost
        { step: 14, velocity: 0.92, isOpen: true }, // Detroit open sizzle
        { step: 15, velocity: 0.65 },
      ];
      if (barIdx === 3 || barIdx === 7) {
        steps.push({ step: 13, velocity: 0.78, isTripletRoll: true });
      }
      return steps;
    }),
  },
];
