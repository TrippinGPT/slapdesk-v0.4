/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BeatData, TrackType, BeatTrack, DawView } from '../types';
import { audioEngine } from '../engine/audioEngine';
import {
  Volume2,
  VolumeX,
  Headphones,
  Sliders,
  Play,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Check,
  Disc3,
  Music2,
  Grid,
} from 'lucide-react';

interface SongEditorProps {
  beatData: BeatData;
  onUpdateTrack: (trackType: TrackType, updates: Partial<BeatTrack>) => void;
  currentStep: number;
  isPlaying: boolean;
  onJumpToStep: (step: number) => void;
  onNavigateView: (view: DawView, track?: TrackType) => void;
  onRecookTrack: (trackType: TrackType) => void;
}

export const SongEditor: React.FC<SongEditorProps> = ({
  beatData,
  onUpdateTrack,
  currentStep,
  isPlaying,
  onJumpToStep,
  onNavigateView,
  onRecookTrack,
}) => {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const currentBar = Math.floor(currentStep / 16);
  const playheadPercent = (currentStep / 128) * 100;

  const tracksList: { id: TrackType; name: string; type: 'drum' | 'instrument'; color: string }[] = [
    { id: 'melody', name: 'Lead Melody (Sinister Bell)', type: 'instrument', color: 'border-amber-500 bg-amber-500' },
    { id: 'keys', name: 'Dark Piano Keys / Stabs', type: 'instrument', color: 'border-cyan-500 bg-cyan-500' },
    { id: 'bass808', name: '808 Sub-Bass & Glides', type: 'instrument', color: 'border-rose-500 bg-rose-500' },
    { id: 'kick', name: 'Knock Kick Pocket', type: 'drum', color: 'border-emerald-500 bg-emerald-500' },
    { id: 'snare', name: 'Slap Clap & Snare', type: 'drum', color: 'border-purple-500 bg-purple-500' },
    { id: 'hihat', name: '16th Hi-Hats & Rolls', type: 'drum', color: 'border-sky-500 bg-sky-500' },
  ];

  const handleToggleBarClip = (trackType: TrackType, barIndex: number) => {
    const track = beatData.tracks[trackType];
    const disabled = track.disabledBars || [];
    const newDisabled = disabled.includes(barIndex)
      ? disabled.filter(b => b !== barIndex)
      : [...disabled, barIndex];
    onUpdateTrack(trackType, { disabledBars: newDisabled });
  };

  const handleTrackMute = (trackType: TrackType) => {
    const track = beatData.tracks[trackType];
    onUpdateTrack(trackType, { muted: !track.muted });
  };

  const handleTrackSolo = (trackType: TrackType) => {
    const track = beatData.tracks[trackType];
    onUpdateTrack(trackType, { solo: !track.solo });
  };

  const handleTrackVolume = (trackType: TrackType, val: number) => {
    onUpdateTrack(trackType, { volume: val });
  };

  const handleTrackPan = (trackType: TrackType, val: number) => {
    onUpdateTrack(trackType, { pan: val });
  };

  const handleAuditionTrack = (trackType: TrackType) => {
    audioEngine.previewInstrument(trackType);
  };

  const handleOpenEditor = (trackType: TrackType) => {
    if (trackType === 'melody' || trackType === 'keys' || trackType === 'bass808') {
      onNavigateView('piano_roll', trackType);
    } else {
      onNavigateView('beat_bassline', trackType);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden select-none border border-zinc-800 rounded-xl shadow-2xl">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-white tracking-wide">Song-Editor</span>
          <span className="text-zinc-500 font-mono">| 8-Bar Structural Timeline</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-zinc-400">
            Click clips to <strong className="text-amber-300">mute/unmute bars</strong> in arrangement
          </span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-zinc-400">Active</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-800 border border-zinc-700 ml-2" />
            <span className="text-zinc-500">Muted Clip</span>
          </div>
        </div>
      </div>

      {/* Main Timeline Workspace */}
      <div className="flex-1 flex flex-col overflow-x-auto overflow-y-auto min-h-[400px]">
        {/* Top Timeline Ruler & Bar Structure Header */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/90 shrink-0 sticky top-0 z-10">
          {/* Left Spacer corresponding to Track Headers */}
          <div className="w-64 shrink-0 px-3 py-2 border-r border-zinc-800 text-[11px] font-mono font-bold text-zinc-400 flex items-center justify-between">
            <span>TRACK / INSTRUMENT</span>
            <span className="text-[10px] text-zinc-500">VOL • PAN</span>
          </div>

          {/* 8 Bars Ruler */}
          <div className="flex-1 grid grid-cols-8 relative min-w-[720px]">
            {/* Real-time Playhead Scrubber */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="w-3 h-3 bg-amber-500 -translate-x-[5px] -translate-y-1 rotate-45 rounded-xs" />
            </div>

            {beatData.barStructure.map((bar, barIdx) => {
              const isCurrent = currentBar === barIdx;
              return (
                <div
                  key={barIdx}
                  onClick={() => onJumpToStep(barIdx * 16)}
                  className={`px-2 py-1.5 border-r border-zinc-800/80 cursor-pointer transition hover:bg-zinc-800/60 ${
                    isCurrent ? 'bg-amber-500/10' : ''
                  }`}
                  title={`Jump playhead to Bar ${barIdx + 1}: ${bar.role}`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={`font-bold ${isCurrent ? 'text-amber-400' : 'text-zinc-300'}`}>
                      BAR {barIdx + 1}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {barIdx * 16}:00
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">
                    {bar.role}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Track Rows */}
        <div className="flex-1 divide-y divide-zinc-900">
          {tracksList.map(item => {
            const track = beatData.tracks[item.id];
            const isMuted = !!track.muted;
            const isSolo = !!track.solo;
            const volume = track.volume !== undefined ? track.volume : 1.0;
            const pan = track.pan !== undefined ? track.pan : 0;
            const disabledBars = track.disabledBars || [];

            return (
              <div
                key={item.id}
                className={`flex hover:bg-zinc-900/30 transition group ${
                  isMuted ? 'opacity-50' : ''
                }`}
              >
                {/* Track Left Control Header */}
                <div className="w-64 shrink-0 p-2.5 border-r border-zinc-800/80 bg-zinc-950 flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button
                        onClick={() => handleAuditionTrack(item.id)}
                        className={`w-2.5 h-7 rounded-sm transition ${item.color}`}
                        title="Click to preview instrument"
                      />
                      <div className="truncate">
                        <span className="font-bold text-xs text-zinc-100 block truncate leading-tight">
                          {track.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {track.notes.length} notes • CH {track.channel + 1}
                        </span>
                      </div>
                    </div>

                    {/* Quick Edit in Piano Roll / Step Sequencer */}
                    <button
                      onClick={() => handleOpenEditor(item.id)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
                      title={item.type === 'instrument' ? 'Open in Piano Roll' : 'Open in Beat+Bassline Sequencer'}
                    >
                      {item.type === 'instrument' ? (
                        <Music2 className="w-3.5 h-3.5" />
                      ) : (
                        <Grid className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Track Knobs & Mute/Solo */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-[10px]">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTrackMute(item.id)}
                        className={`px-2 py-0.5 rounded font-bold transition text-[10px] ${
                          isMuted
                            ? 'bg-rose-500 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Mute Track"
                      >
                        M
                      </button>
                      <button
                        onClick={() => handleTrackSolo(item.id)}
                        className={`px-2 py-0.5 rounded font-bold transition text-[10px] ${
                          isSolo
                            ? 'bg-amber-500 text-zinc-950 font-black'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title="Solo Track"
                      >
                        S
                      </button>
                    </div>

                    {/* Volume slider */}
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono text-[9px]">VOL</span>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={volume}
                        onChange={e => handleTrackVolume(item.id, parseFloat(e.target.value))}
                        className="w-14 h-1 accent-amber-500 cursor-pointer"
                        title={`Volume: ${Math.round(volume * 100)}%`}
                      />
                    </div>

                    {/* Pan slider */}
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 font-mono text-[9px]">PAN</span>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={pan}
                        onChange={e => handleTrackPan(item.id, parseFloat(e.target.value))}
                        className="w-12 h-1 accent-cyan-500 cursor-pointer"
                        title={`Pan: ${pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(Math.round(pan * 100))}` : `R${Math.round(pan * 100)}`}`}
                      />
                    </div>
                  </div>
                </div>

                {/* 8 Bar Clip Blocks */}
                <div className="flex-1 grid grid-cols-8 relative min-w-[720px] bg-zinc-950/40 p-1 gap-1">
                  {/* Playhead vertical guide line across row */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500/80 z-20 pointer-events-none"
                    style={{ left: `${playheadPercent}%` }}
                  />

                  {Array.from({ length: 8 }).map((_, barIdx) => {
                    const isBarDisabled = disabledBars.includes(barIdx);
                    const barNotes = track.notes.filter(n => n.bar === barIdx);
                    const isCurrent = currentBar === barIdx;

                    return (
                      <div
                        key={barIdx}
                        onClick={() => handleToggleBarClip(item.id, barIdx)}
                        onDoubleClick={() => handleOpenEditor(item.id)}
                        className={`relative rounded-lg p-1.5 transition cursor-pointer border flex flex-col justify-between min-h-[52px] group/clip ${
                          isBarDisabled
                            ? 'bg-zinc-900/30 border-zinc-800/50 text-zinc-600 hover:border-zinc-700'
                            : isCurrent
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-md'
                            : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50 text-zinc-300'
                        }`}
                        title={
                          isBarDisabled
                            ? `Bar ${barIdx + 1} is MUTED. Click to activate.`
                            : `Bar ${barIdx + 1} has ${barNotes.length} notes. Click to mute, double-click to edit.`
                        }
                      >
                        {/* Mini MIDI preview / dots */}
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className={isBarDisabled ? 'text-zinc-600' : 'text-zinc-400 font-semibold'}>
                            P{barIdx + 1}
                          </span>
                          <span className="text-[8px] text-zinc-500">
                            {barNotes.length} hits
                          </span>
                        </div>

                        {/* Graphic MIDI Mini Note Stalks */}
                        <div className="h-4 w-full flex items-end gap-0.5 py-0.5 overflow-hidden">
                          {barNotes.length > 0 ? (
                            barNotes.slice(0, 16).map((n, ni) => {
                              const heightPct = Math.min(100, Math.max(25, (n.velocity / 127) * 100));
                              return (
                                <div
                                  key={ni}
                                  className={`flex-1 rounded-xs transition ${
                                    isBarDisabled
                                      ? 'bg-zinc-700/40'
                                      : isCurrent
                                      ? 'bg-amber-400'
                                      : 'bg-amber-500/70'
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                />
                              );
                            })
                          ) : (
                            <span className="text-[8px] text-zinc-700 italic">Empty rest</span>
                          )}
                        </div>

                        {/* Status Label */}
                        <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
                          <span>{isBarDisabled ? 'MUTED' : 'ACTIVE'}</span>
                          <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover/clip:opacity-100 text-amber-400 transition" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Arranger Info Bar */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-zinc-300">
            Song Loop: <strong>8 Bars (128 Steps)</strong>
          </span>
          <span>•</span>
          <span>
            Current Playhead: <strong className="text-amber-400 font-mono">Bar {currentBar + 1}, Step {(currentStep % 16) + 1}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">Double click any pattern clip to open Piano Roll or Step Sequencer</span>
        </div>
      </div>
    </div>
  );
};
