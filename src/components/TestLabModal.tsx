/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { runAutomatedTestSuite } from '../engine/qaTester';
import { QATestResult } from '../types';
import { ShieldCheck, Play, CheckCircle2, XCircle, X, Terminal, Loader2 } from 'lucide-react';

interface TestLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestLabModal: React.FC<TestLabModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<QATestResult | null>(null);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setStatusText('Initializing 100 cookups & 300 sibling variations...');
    setResult(null);

    try {
      const res = await runAutomatedTestSuite(100, (pct, msg) => {
        setProgress(pct);
        setStatusText(msg);
      });
      setResult(res);
      setProgress(100);
      setStatusText('Testing Complete!');
    } catch (err: any) {
      alert(`Test suite error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const checksList = [
    { key: 'legalMidiOk', label: 'Legal MIDI Binary (Type 1, 480 PPQ, valid headers)' },
    { key: 'sixTracksOk', label: 'Six-Track Output (Melody, Keys, 808, Kick, Snare, Hats)' },
    { key: 'inKeyBassOk', label: 'In-Key Bass (100% modal compliance across 8 bars)' },
    { key: 'noFourOnFloorOk', label: 'No 4-on-the-Floor Leakage (Street pocket verification)' },
    { key: 'siblingIdentityOk', label: 'V1 / V2 / V3 Sibling Identity (Shared core motif)' },
    { key: 'phraseMemoryOk', label: 'Phrase Memory (Bar 5 Home Return & Bar 8 Space)' },
    { key: 'seedReproducibilityOk', label: 'Deterministic Seed Reproducibility' },
    { key: 'recookIsolationOk', label: 'Targeted Recook Isolation (Drums/808/Music)' },
    { key: 'studioKitNormalizationOk', label: 'Studio Kit Fallback & Normalization Safety' },
    { key: 'melodyQualityOk', label: 'Melody Grammar & Anti-Generic Filter (Score >= 70%)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight text-white">
              Music Engine Test Lab (v0.4 Compliance)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="p-3.5 bg-zinc-800/60 rounded-lg text-xs text-zinc-300 border border-zinc-700/60 space-y-1">
            <p className="font-semibold text-emerald-400">Automated QA Spec Verification</p>
            <p>
              Runs 100 deterministic cookups + 300 sibling variations against all non-negotiable musical rules:
              binary MIDI validation, 6-track output, in-key 808 glides, zero 4-on-the-floor leakage,
              phrase memory home return, seed reproducibility, and targeted recook isolation.
            </p>
          </div>

          {/* Action & Progress */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 text-xs font-bold rounded-lg transition shadow-md"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Running 100 Cookups...' : 'Run QA Test Suite (100 Cookups)'}
            </button>

            {isRunning && (
              <div className="flex-1">
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>{statusText}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Checklist */}
          {result && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {result.passed ? 'ALL CHECKS PASSED (100%)' : 'TESTS FAILED'}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Validated {result.totalCookups} cookups and {result.totalVariations} variations
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded">
                  v0.4 Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {checksList.map(chk => {
                  const passed = (result as any)[chk.key];
                  return (
                    <div
                      key={chk.key}
                      className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800/80 rounded"
                    >
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="text-zinc-300 truncate">{chk.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Log Console */}
              <div className="mt-2 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[11px] font-mono text-zinc-400 max-h-36 overflow-y-auto space-y-0.5">
                <div className="flex items-center gap-1.5 text-zinc-500 font-semibold mb-1 pb-1 border-b border-zinc-900">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Execution Diagnostics</span>
                </div>
                {result.log.map((line, i) => (
                  <div key={i} className={line.includes('[FAIL]') ? 'text-red-400' : 'text-zinc-300'}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
