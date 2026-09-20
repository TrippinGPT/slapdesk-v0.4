/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BeatConfig, ScaleType } from '../types';
import { KICK_FAMILIES } from '../engine/kickFamilies';
import { PHRASE_FAMILIES } from '../engine/phraseFamilies';
import { BASS_808_FAMILIES } from '../engine/808Families';
import { HAT_FAMILIES } from '../engine/hatFamilies';
import { MELODY_PERSONALITIES, MelodyPersonalityId } from '../engine/melodyPersonalities';
import { RecookMusicIntent } from '../engine/melodyEngine';
import { NOTE_NAMES } from '../engine/scales';
import {
  Play,
  Pause,
  Square,
  Dices,
  RefreshCw,
  Sliders,
  Flame,
  Volume2,
  Sparkles,
  Music2,
  CheckCircle2,
} from 'lucide-react';

interface CookupControlsProps {
  config: BeatConfig;
  isPlaying: boolean;
  melodyQuality?: {
    totalAttacks: number;
    uniquePitchCount: number;
    anchorPitchRecurrence: number;
    emptySpacePercentage: number;
    antiGenericScore: number;
    passed: boolean;
  };
  melodyPersonalityName?: string;
  melodyMotifName?: string;
  onPlayToggle: () => void;
  onStop: () => void;
  onNewCookup: () => void;
  onRecook: (target: 'drums' | '808' | 'music', intent?: RecookMusicIntent) => void;
  onVariationChange: (v: 'V1' | 'V2' | 'V3') => void;
  onConfigChange: (updates: Partial<BeatConfig>) => void;
  onRandomSeed: () => void;
}

export const CookupControls: React.FC<CookupControlsProps> = ({
  config,
  isPlaying,
  melodyQuality,
  melodyPersonalityName,
  melodyMotifName,
  onPlayToggle,
  onStop,
  onNewCookup,
  onRecook,
  onVariationChange,
  onConfigChange,
  onRandomSeed,
}) => {
  const [showRecookMenu, setShowRecookMenu] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Primary Action & Transport Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main New Cookup Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNewCookup}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-zinc-950 font-black text-sm rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] transition cursor-pointer"
            >
              <Flame className="w-5 h-5 fill-zinc-950" />
              NEW COOKUP
            </button>

            {/* Playback Controls */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={onPlayToggle}
                className={`p-2.5 rounded-md transition ${
                  isPlaying
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                }`}
                title={isPlaying ? 'Pause' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={onStop}
                className="p-2.5 text-zinc-400 hover:text-white rounded-md transition"
                title="Stop & Reset"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Sibling Variations: V1 / V2 / V3 */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 px-2 uppercase tracking-wider">
              Siblings:
            </span>
            {(['V1', 'V2', 'V3'] as const).map(v => (
              <button
                key={v}
                onClick={() => onVariationChange(v)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition ${
                  config.variation === v
                    ? 'bg-amber-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Recook Isolation Buttons & Music Intent Menu */}
          <div className="relative flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 px-1 uppercase tracking-wider">
              Recook:
            </span>
            <button
              onClick={() => onRecook('drums')}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-xs font-semibold rounded-md transition"
              title="Recook Drums (preserves 808 + music)"
            >
              <RefreshCw className="w-3 h-3 text-rose-400" />
              Drums
            </button>
            <button
              onClick={() => onRecook('808')}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-xs font-semibold rounded-md transition"
              title="Recook 808 (preserves drums + music)"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              808
            </button>
            <div className="relative">
              <button
                onClick={() => setShowRecookMenu(!showRecookMenu)}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 active:scale-95 text-cyan-200 text-xs font-semibold rounded-md transition"
                title="Recook Music Options"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                Music ▾
              </button>
              {showRecookMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 p-1.5 text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase border-b border-zinc-800/80">
                    Recook Intent
                  </div>
                  <button
                    onClick={() => { onRecook('music', 'NEW_MUSIC'); setShowRecookMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 font-medium"
                  >
                    🎲 Fresh Idea
                  </button>
                  <button
                    onClick={() => { onRecook('music', 'NEW_RHYTHM'); setShowRecookMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 font-medium"
                  >
                    🥁 Change Rhythm
                  </button>
                  <button
                    onClick={() => { onRecook('music', 'NEW_CONTOUR'); setShowRecookMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 font-medium"
                  >
                    📈 Change Contour
                  </button>
                  <button
                    onClick={() => { onRecook('music', 'MORE_SPACE'); setShowRecookMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 font-medium"
                  >
                    🌌 More Negative Space
                  </button>
                  <button
                    onClick={() => { onRecook('music', 'DARKER'); setShowRecookMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 font-medium"
                  >
                    🌑 Darker Pitch Register
                  </button>
                  <button
                    onClick={() => { onRecook('music', 'MORE_MEMORABLE'); setShowRecookMenu(false); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-800 text-zinc-200 font-medium"
                  >
                    🎯 Hypnotic / Memorable
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Seed Input & Randomizer */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">Seed</span>
            <input
              type="number"
              value={config.seed}
              onChange={e => onConfigChange({ seed: parseInt(e.target.value) || 0 })}
              className="w-24 bg-transparent font-mono text-xs text-amber-300 font-bold focus:outline-none"
            />
            <button
              onClick={onRandomSeed}
              className="p-1 text-zinc-400 hover:text-amber-400 transition"
              title="Random Seed"
            >
              <Dices className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Melody Engine Grammar Badge */}
        {melodyQuality && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-zinc-800/80 bg-zinc-950/40 p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-zinc-200">Melody Engine:</span>
              <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800/50 rounded font-mono text-[11px] font-semibold">
                {melodyPersonalityName || 'Dark Anchor'}
              </span>
              <span className="text-[11px] text-zinc-400">
                Cell: <span className="text-zinc-200 font-medium">{melodyMotifName || 'Detached Motif'}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-zinc-400">
                Silence: <strong className="text-zinc-200">{melodyQuality.emptySpacePercentage}%</strong>
              </span>
              <span className="text-zinc-400">
                Unique Pitches: <strong className="text-zinc-200">{melodyQuality.uniquePitchCount}</strong>
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/60 rounded text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Anti-Generic Score: {melodyQuality.antiGenericScore}%
              </div>
            </div>
          </div>
        )}

        {/* Global Musical Settings (BPM, Key, Scale, Swing) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-800/80 text-xs">
          {/* BPM */}
          <div>
            <div className="flex justify-between text-zinc-400 font-semibold mb-1">
              <span>BPM (Tempo)</span>
              <span className="font-mono text-amber-400">{config.bpm}</span>
            </div>
            <input
              type="range"
              min="92"
              max="122"
              value={config.bpm}
              onChange={e => onConfigChange({ bpm: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Root Key */}
          <div>
            <div className="flex justify-between text-zinc-400 font-semibold mb-1">
              <span>Root Key</span>
              <span className="font-mono text-amber-400">{config.rootKey}</span>
            </div>
            <select
              value={config.rootKey}
              onChange={e => onConfigChange({ rootKey: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-1.5 text-zinc-200 text-xs font-mono font-bold"
            >
              {NOTE_NAMES.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Scale Mode */}
          <div>
            <div className="flex justify-between text-zinc-400 font-semibold mb-1">
              <span>Scale Archetype</span>
            </div>
            <select
              value={config.scale}
              onChange={e => onConfigChange({ scale: e.target.value as ScaleType })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-1.5 text-zinc-200 text-xs font-semibold"
            >
              <option value="phrygian">Phrygian (Dark Street Clash)</option>
              <option value="natural_minor">Natural Minor (Pain Loop)</option>
              <option value="harmonic_minor">Harmonic Minor (Sinister Detroit)</option>
              <option value="dorian">Dorian (Bittersweet West Coast)</option>
            </select>
          </div>

          {/* Swing / Pocket */}
          <div>
            <div className="flex justify-between text-zinc-400 font-semibold mb-1">
              <span>Slap Swing</span>
              <span className="font-mono text-amber-400">{config.swing}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.swing}
              onChange={e => onConfigChange({ swing: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Core Slap Sliders (Density, Darkness, Vocal Space, 808 Movement) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Core Street Sliders (Reference Target DNA)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Density */}
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-zinc-200">Density</span>
              <span className="text-xs font-mono font-bold text-amber-400">{config.density}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.density}
              onChange={e => onConfigChange({ density: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Sparse</span>
              <span>Packed</span>
            </div>
          </div>

          {/* 2. Darkness */}
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-zinc-200">Darkness</span>
              <span className="text-xs font-mono font-bold text-amber-400">{config.darkness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.darkness}
              onChange={e => onConfigChange({ darkness: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Melancholic</span>
              <span>Eerie Sinister</span>
            </div>
          </div>

          {/* 3. Vocal Space */}
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-zinc-200">Vocal Space</span>
              <span className="text-xs font-mono font-bold text-amber-400">{config.vocalSpace}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.vocalSpace}
              onChange={e => onConfigChange({ vocalSpace: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Arranged</span>
              <span>Rapper Pocket</span>
            </div>
          </div>

          {/* 4. 808 Movement */}
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-zinc-200">808 Movement</span>
              <span className="text-xs font-mono font-bold text-amber-400">{config.bassMovement}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.bassMovement}
              onChange={e => onConfigChange({ bassMovement: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Long Holds</span>
              <span>Glides & Bounces</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pocket & Behavior Family Pickers (Kick, Phrase, 808, Hats, Melody Personality) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Kick Pocket Family (40 total) */}
          <div>
            <div className="flex justify-between text-zinc-300 font-bold mb-1">
              <span>Kick Family ({KICK_FAMILIES.length})</span>
            </div>
            <select
              value={config.kickFamilyId}
              onChange={e => onConfigChange({ kickFamilyId: parseInt(e.target.value) })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 text-xs font-medium focus:border-amber-500"
            >
              {KICK_FAMILIES.map(kf => (
                <option key={kf.id} value={kf.id}>
                  #{kf.id} {kf.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1 truncate">
              {KICK_FAMILIES.find(f => f.id === config.kickFamilyId)?.description}
            </p>
          </div>

          {/* 8-Bar Phrase Memory Skeleton (10 total) */}
          <div>
            <div className="flex justify-between text-zinc-300 font-bold mb-1">
              <span>Phrase Structure ({PHRASE_FAMILIES.length})</span>
            </div>
            <select
              value={config.phraseFamilyId}
              onChange={e => onConfigChange({ phraseFamilyId: parseInt(e.target.value) })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 text-xs font-medium focus:border-amber-500"
            >
              {PHRASE_FAMILIES.map(pf => (
                <option key={pf.id} value={pf.id}>
                  #{pf.id} {pf.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1 truncate">
              {PHRASE_FAMILIES.find(f => f.id === config.phraseFamilyId)?.description}
            </p>
          </div>

          {/* 808 Behavior Family (10 total) */}
          <div>
            <div className="flex justify-between text-zinc-300 font-bold mb-1">
              <span>808 Behavior ({BASS_808_FAMILIES.length})</span>
            </div>
            <select
              value={config.bassFamilyId}
              onChange={e => onConfigChange({ bassFamilyId: parseInt(e.target.value) })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 text-xs font-medium focus:border-amber-500"
            >
              {BASS_808_FAMILIES.map(bf => (
                <option key={bf.id} value={bf.id}>
                  #{bf.id} {bf.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1 truncate">
              {BASS_808_FAMILIES.find(f => f.id === config.bassFamilyId)?.description}
            </p>
          </div>

          {/* Hat Pocket Family (18 total) */}
          <div>
            <div className="flex justify-between text-zinc-300 font-bold mb-1">
              <span>Hat Pocket ({HAT_FAMILIES.length})</span>
            </div>
            <select
              value={config.hatFamilyId}
              onChange={e => onConfigChange({ hatFamilyId: parseInt(e.target.value) })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 text-xs font-medium focus:border-amber-500"
            >
              {HAT_FAMILIES.map(hf => (
                <option key={hf.id} value={hf.id}>
                  #{hf.id} {hf.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1 truncate">
              {HAT_FAMILIES.find(f => f.id === config.hatFamilyId)?.description}
            </p>
          </div>

          {/* Melody Personality (8 total) */}
          <div>
            <div className="flex justify-between text-zinc-300 font-bold mb-1">
              <span>Melody Personality</span>
            </div>
            <select
              value={config.melodyPersonalityId || 'DARK_ANCHOR'}
              onChange={e => onConfigChange({ melodyPersonalityId: e.target.value })}
              className="w-full bg-zinc-950 border border-cyan-800/60 rounded-md p-2 text-cyan-200 text-xs font-medium focus:border-cyan-400"
            >
              {Object.values(MELODY_PERSONALITIES).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-cyan-400/80 mt-1 truncate">
              {MELODY_PERSONALITIES[(config.melodyPersonalityId as MelodyPersonalityId) || 'DARK_ANCHOR']?.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
