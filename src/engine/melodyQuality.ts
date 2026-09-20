/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NoteEvent } from '../types';

export interface MelodyQualityMetrics {
  totalAttacks: number;
  uniquePitchCount: number;
  anchorPitchRecurrence: number;      // 0..100%
  emptySpacePercentage: number;       // 0..100%
  largestConsecutiveInterval: number; // In semitones
  scaleRunDetected: boolean;
  continuousGridMovement: boolean;
  allBarsStartBeat1: boolean;
  identicalDurations: boolean;
  phraseSimilarityBar1And5: number;   // 0..100%
  responseSimilarityBar2And6: number; // 0..100%
  antiGenericScore: number;           // 0..100
  passed: boolean;
  rejectionReasons: string[];
}

/**
 * Rigorous evaluation of melodic quality and anti-generic compliance.
 * Verifies that the melody sounds like an intentional hip-hop pocket rather
 * than a computer-generated scale exercise.
 */
export function evaluateMelodyQuality(
  notes: NoteEvent[],
  anchorMidis: number[]
): MelodyQualityMetrics {
  const reasons: string[] = [];

  if (notes.length === 0) {
    return {
      totalAttacks: 0,
      uniquePitchCount: 0,
      anchorPitchRecurrence: 0,
      emptySpacePercentage: 100,
      largestConsecutiveInterval: 0,
      scaleRunDetected: false,
      continuousGridMovement: false,
      allBarsStartBeat1: false,
      identicalDurations: false,
      phraseSimilarityBar1And5: 100,
      responseSimilarityBar2And6: 100,
      antiGenericScore: 40,
      passed: false,
      rejectionReasons: ['Melody is completely silent across all 8 bars'],
    };
  }

  // 1. Total attacks & unique pitch count
  const totalAttacks = notes.length;
  const uniquePitchClasses = new Set(notes.map(n => n.pitch % 12));
  const uniquePitchCount = uniquePitchClasses.size;

  if (uniquePitchCount > 5) {
    reasons.push(`Too many unique pitch classes (${uniquePitchCount}) - lacks anchor hierarchy`);
  }

  // 2. Anchor pitch recurrence
  const anchorPcs = new Set(anchorMidis.map(m => m % 12));
  const anchorAttacks = notes.filter(n => anchorPcs.has(n.pitch % 12)).length;
  const anchorPitchRecurrence = Math.round((anchorAttacks / totalAttacks) * 100);

  if (anchorPitchRecurrence < 50) {
    reasons.push(`Low anchor note recurrence (${anchorPitchRecurrence}%) - melody wanders`);
  }

  // 3. Empty space calculation across 128 steps
  const occupiedSteps = new Set<number>();
  notes.forEach(n => {
    for (let s = 0; s < Math.max(1, n.duration); s++) {
      if (n.step + s < 128) {
        occupiedSteps.add(n.step + s);
      }
    }
  });
  const emptySpacePercentage = Math.round(((128 - occupiedSteps.size) / 128) * 100);

  if (emptySpacePercentage < 40) {
    reasons.push(`Too dense for hip-hop vocal pocket (${emptySpacePercentage}% empty space)`);
  }

  // 4. Consecutive interval analysis & Scale runs
  const sorted = [...notes].sort((a, b) => a.step - b.step);
  let largestConsecutiveInterval = 0;
  let scaleRunCount = 0;
  let scaleRunDetected = false;

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.abs(sorted[i].pitch - sorted[i - 1].pitch);
    if (diff > largestConsecutiveInterval) {
      largestConsecutiveInterval = diff;
    }

    // Check for mechanical scale runs (stepwise consecutive motion on consecutive grid steps)
    const stepDiff = sorted[i].step - sorted[i - 1].step;
    const pitchDiff = sorted[i].pitch - sorted[i - 1].pitch;
    if (stepDiff <= 4 && (Math.abs(pitchDiff) === 1 || Math.abs(pitchDiff) === 2)) {
      scaleRunCount++;
      if (scaleRunCount >= 3) {
        scaleRunDetected = true;
      }
    } else {
      scaleRunCount = 0;
    }
  }

  if (scaleRunDetected) {
    reasons.push('Scale run detected (consecutive unpunctuated scale climbing)');
  }

  // If jump is huge (> 12 semitones) without being an octave punctuation
  if (largestConsecutiveInterval > 12 && largestConsecutiveInterval % 12 !== 0) {
    reasons.push(`Chaotic interval leap (${largestConsecutiveInterval} semitones)`);
  }

  // 5. Continuous grid movement (continuous 8ths or 16ths without rest)
  let continuousMovementCount = 0;
  let continuousGridMovement = false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].step - sorted[i - 1].step <= 2) {
      continuousMovementCount++;
      if (continuousMovementCount >= 5) {
        continuousGridMovement = true;
        break;
      }
    } else {
      continuousMovementCount = 0;
    }
  }

  if (continuousGridMovement) {
    reasons.push('Continuous un-spaced 16th/8th movement detected');
  }

  // 6. All bars start beat 1 check
  const barsPresent = new Set(notes.map(n => n.bar));
  let allBarsStartBeat1 = true;
  for (const bar of barsPresent) {
    const barNotes = notes.filter(n => n.bar === bar);
    const hasDownbeat = barNotes.some(n => n.stepInBar === 0);
    if (!hasDownbeat) {
      allBarsStartBeat1 = false;
      break;
    }
  }
  if (allBarsStartBeat1 && barsPresent.size >= 4) {
    reasons.push('Mechanical downbeat entry in every single bar');
  }

  // 7. Identical durations check
  const durations = new Set(notes.map(n => n.duration));
  const identicalDurations = durations.size === 1 && notes.length > 4;
  if (identicalDurations) {
    reasons.push('Zero rhythmic diversity: all notes share identical duration');
  }

  // 8. Phrase Similarity: Bar 1 and Bar 5 (Strict Home Return)
  const bar1Pitches = notes.filter(n => n.bar === 0).map(n => n.pitch).join(',');
  const bar5Pitches = notes.filter(n => n.bar === 4).map(n => n.pitch).join(',');
  let phraseSimilarityBar1And5 = 0;
  if (bar1Pitches && bar5Pitches) {
    phraseSimilarityBar1And5 = bar1Pitches === bar5Pitches ? 100 : 50;
  } else if (!bar1Pitches && !bar5Pitches) {
    phraseSimilarityBar1And5 = 100;
  }

  // 9. Response Similarity: Bar 2 and Bar 6
  const bar2Pitches = notes.filter(n => n.bar === 1).map(n => n.pitch).join(',');
  const bar6Pitches = notes.filter(n => n.bar === 5).map(n => n.pitch).join(',');
  let responseSimilarityBar2And6 = 0;
  if (bar2Pitches && bar6Pitches) {
    responseSimilarityBar2And6 = bar2Pitches === bar6Pitches ? 100 : 70;
  } else if (!bar2Pitches && !bar6Pitches) {
    responseSimilarityBar2And6 = 100;
  }

  // Calculate Anti-Generic Score (0..100)
  let score = 100;
  if (scaleRunDetected) score -= 25;
  if (continuousGridMovement) score -= 20;
  if (uniquePitchCount > 4) score -= 15;
  if (anchorPitchRecurrence < 60) score -= 15;
  if (emptySpacePercentage < 50) score -= 15;
  if (allBarsStartBeat1) score -= 15;
  if (identicalDurations) score -= 10;
  if (phraseSimilarityBar1And5 < 80 && bar1Pitches.length > 0) score -= 20;

  const finalScore = Math.max(0, Math.min(100, score));
  const passed = reasons.length === 0 || finalScore >= 70;

  return {
    totalAttacks,
    uniquePitchCount,
    anchorPitchRecurrence,
    emptySpacePercentage,
    largestConsecutiveInterval,
    scaleRunDetected,
    continuousGridMovement,
    allBarsStartBeat1,
    identicalDurations,
    phraseSimilarityBar1And5,
    responseSimilarityBar2And6,
    antiGenericScore: finalScore,
    passed,
    rejectionReasons: reasons,
  };
}
