/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { audioEngine } from '../engine/audioEngine';
import { CURATED_REFERENCE_TARGETS, ReferenceTarget } from '../engine/referenceLibrary';
import { ReferenceDNA } from '../types';
import {
  Sparkles,
  Upload,
  X,
  Lock,
  CheckCircle2,
  ExternalLink,
  Youtube,
  Disc3,
  Info,
  Flame,
  Music,
  Check,
} from 'lucide-react';

interface ReferenceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDNA?: ReferenceDNA;
  onApplyDNA: (dna: ReferenceDNA, lockConstraints: boolean) => void;
  onClearDNA: () => void;
}

export const ReferenceModeModal: React.FC<ReferenceModeModalProps> = ({
  isOpen,
  onClose,
  currentDNA,
  onApplyDNA,
  onClearDNA,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    currentDNA?.id || CURATED_REFERENCE_TARGETS[0].id
  );
  const [dna, setDna] = useState<ReferenceDNA | undefined>(currentDNA || CURATED_REFERENCE_TARGETS[0]);
  const [lockAsConstraint, setLockAsConstraint] = useState(true);
  const [activeTab, setActiveTab] = useState<'curated' | 'upload'>('curated');

  if (!isOpen) return null;

  const handleSelectCurated = (target: ReferenceTarget) => {
    setSelectedTargetId(target.id);
    setDna(target);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAnalyzing(true);
      const result = await audioEngine.analyzeReferenceAudio(file);
      const customDna: ReferenceDNA = {
        ...result,
        id: 'custom_upload_' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        author: 'Custom Audio Upload',
        category: 'Custom Upload',
      };
      setDna(customDna);
      setSelectedTargetId(customDna.id!);
      setActiveTab('curated'); // display preview
    } catch (err: any) {
      alert(`Audio analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (dna) {
      onApplyDNA(dna, lockAsConstraint);
    }
    onClose();
  };

  const currentTarget = CURATED_REFERENCE_TARGETS.find(t => t.id === selectedTargetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Reference Mode & Pocket Target Library
              </h2>
              <p className="text-xs text-zinc-400">
                Acoustic constraints from Cardo, Southside, Wheezy, and Icewear Vezzo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6 pt-2 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('curated')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'curated'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Youtube className="w-4 h-4 text-red-400" />
            <span>Curated Tutorial References ({CURATED_REFERENCE_TARGETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Custom Audio File Analysis (.mp3, .wav)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'upload' ? (
            /* Upload Screen */
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700/60 rounded-xl space-y-2 text-xs text-zinc-300">
                <p className="font-semibold text-amber-400 text-sm">Upload Any Commercial Track</p>
                <p>
                  SlapDesk uses client-side Web Audio API transient analysis to extract real acoustic pocket
                  metrics without transmitting or storing copyrighted files:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                  <li>Detects true BPM via low-frequency transient peak correlation.</li>
                  <li>Measures kick sub-frequency energy (kick density %).</li>
                  <li>Measures 808 duration and harmonic saturation index.</li>
                  <li>Calculates hi-hat sparsity and offbeat syncopation.</li>
                  <li>Evaluates mid-frequency vocal space (rapper pocket headroom).</li>
                </ul>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-xl p-8 transition bg-zinc-950/40">
                <Upload className="w-10 h-10 text-amber-500 mb-3" />
                <p className="text-sm font-semibold text-zinc-200 mb-1">
                  {analyzing ? 'Analyzing Transient DNA...' : 'Drag & drop audio file or click to browse'}
                </p>
                <p className="text-xs text-zinc-500 mb-4">Supports MP3, WAV, FLAC, AAC up to 50MB</p>

                <label className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg cursor-pointer transition shadow-md flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>{analyzing ? 'Processing Transient Vectors...' : 'Select Audio File'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={analyzing}
                    onChange={handleAudioUpload}
                  />
                </label>
              </div>
            </div>
          ) : (
            /* Curated Library Screen */
            <div className="space-y-6">
              {/* Reference Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CURATED_REFERENCE_TARGETS.map(target => {
                  const isSelected = selectedTargetId === target.id;
                  return (
                    <div
                      key={target.id}
                      onClick={() => handleSelectCurated(target)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/5'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                                target.category === 'Detroit Slap'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : target.category === 'West Coast Swing'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : target.category === 'Trap Bounce'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {target.category}
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-300">
                              {target.detectedBpm} BPM • {target.recommendedKey} {target.recommendedScale}
                            </span>
                          </div>

                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-500 font-medium">Select</span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition">
                          {target.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                          <span className="text-zinc-500">Tutorial:</span>
                          <span className="text-zinc-300 font-medium">{target.author}</span>
                        </p>

                        <p className="text-xs text-zinc-300/90 mt-2 line-clamp-2 leading-relaxed">
                          {target.producerTips}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-3 text-zinc-400">
                          <span>
                            Kick: <strong className="text-zinc-200">{target.kickDensity}%</strong>
                          </span>
                          <span>
                            Vocal Space: <strong className="text-amber-300">{target.vocalSpace}%</strong>
                          </span>
                          <span>
                            Darkness: <strong className="text-zinc-200">{target.darkness}%</strong>
                          </span>
                        </div>

                        <a
                          href={target.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300 underline text-[10px] font-medium"
                        >
                          <Youtube className="w-3 h-3" />
                          <span>Watch</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Target Deep Breakdown */}
              {currentTarget && (
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                        Active Target Specs: {currentTarget.title}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-mono font-bold rounded">
                      {currentTarget.detectedBpm} BPM • Swing: {currentTarget.swing}%
                    </span>
                  </div>

                  {/* Curated Settings Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Recommended Kick</span>
                      <p className="text-xs font-bold text-zinc-100 mt-0.5">Family #{currentTarget.recommendedKickFamilyId}</p>
                    </div>
                    <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Recommended Hats</span>
                      <p className="text-xs font-bold text-zinc-100 mt-0.5">Family #{currentTarget.recommendedHatFamilyId}</p>
                    </div>
                    <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Recommended 808</span>
                      <p className="text-xs font-bold text-zinc-100 mt-0.5">Family #{currentTarget.recommendedBassFamilyId}</p>
                    </div>
                    <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Melody Personality</span>
                      <p className="text-xs font-bold text-cyan-300 mt-0.5">{currentTarget.recommendedMelodyPersonalityId}</p>
                    </div>
                  </div>

                  {/* 5 Pocket Breakdown Bullets */}
                  <div>
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wide block mb-1.5">
                      Pocket Breakdown & Bounce Rules
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-300">
                      {currentTarget.pocketBreakdown.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DNA Metrics Preview */}
          {dna && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">Acoustic DNA Constraint Parameters:</span>
                </div>
                <span className="text-xs font-mono text-amber-400">{dna.detectedBpm} BPM</span>
              </div>

              {/* DNA Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Kick Density</span>
                  <p className="text-sm font-mono font-bold text-zinc-100 mt-0.5">{dna.kickDensity}%</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">808 Activity</span>
                  <p className="text-sm font-mono font-bold text-zinc-100 mt-0.5">{dna.bass808Activity}%</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Hat Sparsity</span>
                  <p className="text-sm font-mono font-bold text-zinc-100 mt-0.5">{dna.hatActivity}%</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Syncopation</span>
                  <p className="text-sm font-mono font-bold text-zinc-100 mt-0.5">{dna.syncopation}%</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Darkness Index</span>
                  <p className="text-sm font-mono font-bold text-zinc-100 mt-0.5">{dna.darkness}%</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Vocal Space</span>
                  <p className="text-sm font-mono font-bold text-amber-300 mt-0.5">{dna.vocalSpace}%</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Phrase Memory</span>
                  <p className="text-sm font-mono font-bold text-zinc-100 mt-0.5">{dna.phraseRepetition}%</p>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Turnaround Space</span>
                  <p className="text-sm font-mono font-bold text-zinc-100 mt-0.5">{dna.turnaroundSpace}%</p>
                </div>
              </div>

              {/* Constraint Lock Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={lockAsConstraint}
                  onChange={e => setLockAsConstraint(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs text-zinc-300 font-medium">
                  Lock DNA parameters into sliders & generator (enforce pocket constraints)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
          {dna ? (
            <button
              onClick={() => {
                setDna(undefined);
                onClearDNA();
              }}
              className="text-xs text-zinc-400 hover:text-red-400 transition"
            >
              Clear Reference DNA
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!dna}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold rounded-lg transition shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Apply & Cook with Target DNA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
