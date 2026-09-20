/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BeatConfig, BeatData, ReferenceDNA, ScaleType, TrackType } from '../types';
import { KICK_FAMILIES } from '../engine/kickFamilies';
import { HAT_FAMILIES } from '../engine/hatFamilies';
import { CURATED_REFERENCE_TARGETS } from '../engine/referenceLibrary';
import {
  Sparkles,
  Flame,
  Radio,
  Sliders,
  RotateCcw,
  Check,
  Disc3,
  Layers,
  Activity,
  Award,
} from 'lucide-react';

interface DawGeneratorViewProps {
  config: BeatConfig;
  onConfigChange: (newConfig: BeatConfig) => void;
  beatData: BeatData;
  onNewCookup: () => void;
  onRecook: (target: 'all' | 'drums' | 'bass808' | 'melody') => void;
  referenceDNA?: ReferenceDNA;
  onOpenReferenceModal: () => void;
}

export const DawGeneratorView: React.FC<DawGeneratorViewProps> = ({
  config,
  onConfigChange,
  beatData,
  onNewCookup,
  onRecook,
  referenceDNA,
  onOpenReferenceModal,
}) => {
  const keys = ['C', 'C#', 'D', 'Eb', 'F', 'F#', 'G', 'G#', 'A', 'Bb'];
  const scales: { id: ScaleType; label: string }[] = [
    { id: 'natural_minor', label: 'Natural Minor (Pain / Melancholy)' },
    { id: 'phrygian', label: 'Phrygian (Detroit Sinister Clash)' },
    { id: 'harmonic_minor', label: 'Harmonic Minor (Mobb Tension)' },
    { id: 'dorian', label: 'Dorian (West Coast Funk / Bounce)' },
  ];

  const updateConfig = (updates: Partial<BeatConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden select-none border border-zinc-800 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-white tracking-wide">SlapDesk Algorithmic Beat Engine</span>
          <span className="text-zinc-500 font-mono">| LMMS Generator Plugin</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewCookup}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Cook Fresh Beat</span>
          </button>
        </div>
      </div>

      {/* Main Generator Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top Control Matrix: Sibling Variations & Targeted Recook */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sibling Variations (V1 / V2 / V3) */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block font-mono">
              Sibling Variation Architecture
            </span>
            <p className="text-xs text-zinc-400">
              Preserves root key, scale, and core Bar 1 motif while swapping drum pocket families and phrase counter-melodies:
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {(['V1', 'V2', 'V3'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => updateConfig({ variation: v })}
                  className={`py-2 px-3 rounded-lg font-bold text-xs border transition flex items-center justify-center gap-1.5 ${
                    config.variation === v
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-black'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span>{v}</span>
                  {config.variation === v && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Targeted Recook */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block font-mono">
              Targeted Section Recook
            </span>
            <p className="text-xs text-zinc-400">
              Regenerate only specific stems while keeping the rest of your arrangement locked in place:
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => onRecook('drums')}
                className="py-2 px-2 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
              >
                Recook Drums
              </button>
              <button
                onClick={() => onRecook('bass808')}
                className="py-2 px-2 bg-zinc-950 hover:bg-zinc-800 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
              >
                Recook 808
              </button>
              <button
                onClick={() => onRecook('melody')}
                className="py-2 px-2 bg-zinc-950 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition"
              >
                Recook Melody
              </button>
            </div>
          </div>
        </div>

        {/* Sliders Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Key & Scale */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
              Musical Key & Mode
            </span>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-mono">Root Key</label>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {keys.map(k => (
                    <button
                      key={k}
                      onClick={() => updateConfig({ rootKey: k })}
                      className={`py-1 rounded text-xs font-mono font-bold transition ${
                        config.rootKey === k
                          ? 'bg-amber-500 text-zinc-950 shadow-md'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-mono">Scale Preset</label>
                <select
                  value={config.scale}
                  onChange={e => updateConfig({ scale: e.target.value as ScaleType })}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  {scales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pocket Sliders 1 */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
              Rhythmic Pocket Dynamics
            </span>

            {/* Kick Density */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Kick Pocket Density</span>
                <span className="font-mono text-amber-400 font-bold">{config.density}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={config.density}
                onChange={e => updateConfig({ density: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Vocal Space */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Rapper Vocal Space (Rests)</span>
                <span className="font-mono text-amber-400 font-bold">{config.vocalSpace}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.vocalSpace}
                onChange={e => updateConfig({ vocalSpace: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* 808 Movement */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">808 Activity & Glides</span>
                <span className="font-mono text-amber-400 font-bold">{config.bassMovement}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={config.bassMovement}
                onChange={e => updateConfig({ bassMovement: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Pocket Sliders 2 */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">
              Atmosphere & Swing
            </span>

            {/* Darkness */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Darkness / Tension Index</span>
                <span className="font-mono text-cyan-400 font-bold">{config.darkness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.darkness}
                onChange={e => updateConfig({ darkness: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Swing */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Laid-Back Microtiming Swing</span>
                <span className="font-mono text-cyan-400 font-bold">{config.swing}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.swing}
                onChange={e => updateConfig({ swing: parseInt(e.target.value) })}
                className="w-full h-1.5 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Kick & Hat Family Pickers */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-mono block">Kick Family</label>
                <select
                  value={config.kickFamilyId}
                  onChange={e => updateConfig({ kickFamilyId: parseInt(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 font-mono mt-0.5"
                >
                  {KICK_FAMILIES.map(f => (
                    <option key={f.id} value={f.id}>
                      #{f.id}: {f.name.slice(0, 16)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 uppercase font-mono block">Hat Family</label>
                <select
                  value={config.hatFamilyId}
                  onChange={e => updateConfig({ hatFamilyId: parseInt(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 font-mono mt-0.5"
                >
                  {HAT_FAMILIES.map(f => (
                    <option key={f.id} value={f.id}>
                      #{f.id}: {f.name.slice(0, 16)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Melody Quality & Anti-Generic Score Card */}
        {beatData.melodyQuality && (
          <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Melody Grammar Evaluation: {beatData.melodyPersonalityName || 'Street Composer'}
                </span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded">
                Score: {beatData.melodyQuality.antiGenericScore}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-zinc-400 pt-1 font-mono">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Unique Pitches</span>
                <span className="text-sm font-bold text-zinc-200">{beatData.melodyQuality.uniquePitchCount} notes</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Anchor Pitch Recurrence</span>
                <span className="text-sm font-bold text-zinc-200">{beatData.melodyQuality.anchorPitchRecurrence} hits</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Negative Silence Space</span>
                <span className="text-sm font-bold text-zinc-200">{beatData.melodyQuality.emptySpacePercentage}%</span>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block">Status</span>
                <span className="text-sm font-bold text-emerald-400">PASSED ✓</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <span className="font-mono text-[11px]">
          Seed #{config.seed} • 44 Kick Families • 22 Hat Families • 8-Bar Phrase Architecture
        </span>
        <button
          onClick={onOpenReferenceModal}
          className="text-amber-400 hover:text-white transition font-semibold"
        >
          Open Reference Target Library →
        </button>
      </div>
    </div>
  );
};
