/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BeatData, TrackType } from '../types';
import { Volume2, VolumeX, Eye } from 'lucide-react';

interface PatternGridProps {
  beatData: BeatData;
  currentStep: number; // 0..127
  currentBar: number;  // 0..7
  isPlaying: boolean;
  onToggleMute: (trackId: TrackType) => void;
  onToggleSolo: (trackId: TrackType) => void;
}

const TRACK_CONFIG: Record<TrackType, { label: string; short: string; color: string; activeColor: string }> = {
  melody: { label: 'Melody (Pain Loop)', short: 'MEL', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', activeColor: 'bg-cyan-400 text-black shadow-cyan-500/50' },
  keys: { label: 'Dark Keys & Stabs', short: 'KEYS', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', activeColor: 'bg-indigo-400 text-black shadow-indigo-500/50' },
  bass808: { label: '808 Sub & Glides', short: '808', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', activeColor: 'bg-amber-400 text-black shadow-amber-500/50' },
  kick: { label: 'Kick Drum Knock', short: 'KICK', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', activeColor: 'bg-rose-400 text-black shadow-rose-500/50' },
  snare: { label: 'Snare & Slap Clap', short: 'CLAP', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', activeColor: 'bg-yellow-400 text-black shadow-yellow-500/50' },
  hihat: { label: 'Hi-Hats & Perc', short: 'HATS', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', activeColor: 'bg-emerald-400 text-black shadow-emerald-500/50' },
};

export const PatternGrid: React.FC<PatternGridProps> = ({
  beatData,
  currentStep,
  currentBar,
  isPlaying,
  onToggleMute,
  onToggleSolo,
}) => {
  // Allow focusing on a specific bar or viewing all 8 bars
  const [viewMode, setViewMode] = useState<'all' | number>('all');
  const activeViewBar = viewMode === 'all' ? currentBar : viewMode;

  const trackKeys: TrackType[] = ['melody', 'keys', 'bass808', 'kick', 'snare', 'hihat'];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* 8-Bar Phrase Memory Header Navigation */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              8-Bar Phrase Memory Architecture:
            </span>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              Bar {currentBar + 1} / 8 • Step {(currentStep % 16) + 1} / 16
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition ${
                viewMode === 'all'
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All 8 Bars
            </button>
          </div>
        </div>

        {/* 8 Bar Tabs */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {beatData.barStructure.map((bar, idx) => {
            const isPlayingThisBar = isPlaying && currentBar === idx;
            const isFocused = viewMode === idx;
            const isHome = idx === 4; // Bar 5 is home

            return (
              <button
                key={idx}
                onClick={() => setViewMode(viewMode === idx ? 'all' : idx)}
                className={`flex flex-col text-left p-2 rounded-lg border transition relative ${
                  isPlayingThisBar
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : isFocused
                    ? 'border-zinc-500 bg-zinc-800'
                    : 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-mono font-bold ${
                    isPlayingThisBar ? 'text-amber-400' : 'text-zinc-400'
                  }`}>
                    BAR {idx + 1}
                  </span>
                  {isHome && (
                    <span className="text-[9px] px-1 bg-amber-500/30 text-amber-300 font-bold rounded">
                      HOME
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-zinc-200 truncate mt-0.5">
                  {bar.role}
                </span>
                <span className="text-[10px] text-zinc-500 truncate">
                  {bar.description}
                </span>

                {isPlayingThisBar && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-b" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Track Rows Visualizer */}
      <div className="p-4 space-y-2.5 overflow-x-auto">
        {trackKeys.map(trackId => {
          const track = beatData.tracks[trackId];
          const cfg = TRACK_CONFIG[trackId];
          const isMuted = track.muted;
          const isSolo = track.solo;

          // Steps to render
          const startStep = viewMode === 'all' ? 0 : viewMode * 16;
          const stepCount = viewMode === 'all' ? 128 : 16;

          return (
            <div
              key={trackId}
              className={`flex items-center gap-3 p-2 bg-zinc-950/70 rounded-lg border border-zinc-800/60 ${
                isMuted ? 'opacity-40' : ''
              }`}
            >
              {/* Track Info & Controls */}
              <div className="w-40 sm:w-48 shrink-0 flex items-center justify-between pr-2 border-r border-zinc-800/80">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-bold text-zinc-200 truncate block">
                    {track.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Ch {track.channel} • {track.notes.length} notes
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleMute(trackId)}
                    className={`p-1 rounded text-[10px] font-bold transition ${
                      isMuted
                        ? 'bg-red-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Mute Track"
                  >
                    M
                  </button>
                  <button
                    onClick={() => onToggleSolo(trackId)}
                    className={`p-1 rounded text-[10px] font-bold transition ${
                      isSolo
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Solo Track"
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="flex-1 flex gap-0.5 overflow-x-auto min-w-[320px]">
                {Array.from({ length: stepCount }).map((_, i) => {
                  const globalStep = startStep + i;
                  const barIndex = Math.floor(globalStep / 16);
                  const stepInBar = globalStep % 16;
                  const isCurrentPlayhead = isPlaying && currentStep === globalStep;
                  const isBarBoundary = stepInBar === 0 && i !== 0;
                  const isBeatBoundary = stepInBar % 4 === 0;

                  // Does this track have a note starting at this step?
                  const hit = track.notes.find(n => n.step === globalStep);
                  const isSustained = track.notes.some(
                    n => globalStep > n.step && globalStep < n.step + n.duration
                  );

                  return (
                    <div
                      key={globalStep}
                      className={`h-7 flex-1 min-w-[5px] rounded-xs flex items-center justify-center transition relative ${
                        isBarBoundary ? 'ml-1.5' : isBeatBoundary ? 'ml-0.5' : ''
                      } ${
                        isCurrentPlayhead
                          ? 'ring-2 ring-amber-400 z-10'
                          : ''
                      } ${
                        hit
                          ? cfg.activeColor
                          : isSustained
                          ? cfg.color
                          : 'bg-zinc-900 hover:bg-zinc-800'
                      }`}
                      title={`Step ${globalStep + 1} (Bar ${barIndex + 1}, Step ${stepInBar + 1}) ${
                        hit ? `Pitch ${hit.pitch} Vel ${hit.velocity}` : ''
                      }`}
                    >
                      {hit && hit.glideTo && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
