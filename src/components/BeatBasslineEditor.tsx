/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BeatData, TrackType, NoteEvent, BeatTrack } from '../types';
import { audioEngine } from '../engine/audioEngine';
import {
  Grid,
  Play,
  Volume2,
  Sliders,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Flame,
} from 'lucide-react';

interface BeatBasslineEditorProps {
  beatData: BeatData;
  onUpdateTrack: (trackType: TrackType, updates: Partial<BeatTrack>) => void;
  currentStep: number;
  isPlaying: boolean;
  onJumpToStep: (step: number) => void;
}

export const BeatBasslineEditor: React.FC<BeatBasslineEditorProps> = ({
  beatData,
  onUpdateTrack,
  currentStep,
  isPlaying,
  onJumpToStep,
}) => {
  const [activeBar, setActiveBar] = useState<number>(() => Math.floor(currentStep / 16));
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('kick');

  const stepInActiveBar = currentStep % 16;
  const isPlayingInActiveBar = isPlaying && Math.floor(currentStep / 16) === activeBar;

  const tracksList: { id: TrackType; name: string; defaultPitch: number; color: string; ledColor: string }[] = [
    { id: 'kick', name: 'Knock Kick', defaultPitch: 36, color: 'text-emerald-400', ledColor: 'bg-emerald-500 shadow-emerald-500/50' },
    { id: 'snare', name: 'Slap Clap / Snare', defaultPitch: 39, color: 'text-purple-400', ledColor: 'bg-purple-500 shadow-purple-500/50' },
    { id: 'hihat', name: '16th Hi-Hat', defaultPitch: 42, color: 'text-sky-400', ledColor: 'bg-sky-400 shadow-sky-400/50' },
    { id: 'bass808', name: '808 Sub-Bass', defaultPitch: 36, color: 'text-rose-400', ledColor: 'bg-rose-500 shadow-rose-500/50' },
    { id: 'melody', name: 'Lead Melody', defaultPitch: 72, color: 'text-amber-400', ledColor: 'bg-amber-500 shadow-amber-500/50' },
    { id: 'keys', name: 'Dark Keys Stabs', defaultPitch: 60, color: 'text-cyan-400', ledColor: 'bg-cyan-500 shadow-cyan-500/50' },
  ];

  // Toggle step in active bar
  const handleToggleStep = (trackType: TrackType, stepInBar: number, defaultPitch: number) => {
    const track = beatData.tracks[trackType];
    const globalStep = activeBar * 16 + stepInBar;

    const existingNoteIndex = track.notes.findIndex(n => n.step === globalStep);

    let updatedNotes: NoteEvent[];
    if (existingNoteIndex >= 0) {
      // Remove step
      updatedNotes = track.notes.filter((_, idx) => idx !== existingNoteIndex);
    } else {
      // Add step
      const newNote: NoteEvent = {
        step: globalStep,
        bar: activeBar,
        stepInBar: stepInBar,
        pitch: defaultPitch,
        duration: 1,
        velocity: 105,
      };
      updatedNotes = [...track.notes, newNote];
      // Audition preview immediately
      audioEngine.previewInstrument(trackType, defaultPitch);
    }

    onUpdateTrack(trackType, { notes: updatedNotes });
  };

  const handleClearTrackBar = (trackType: TrackType) => {
    const track = beatData.tracks[trackType];
    const updatedNotes = track.notes.filter(n => n.bar !== activeBar);
    onUpdateTrack(trackType, { notes: updatedNotes });
  };

  const handleFillSteps = (trackType: TrackType, defaultPitch: number, interval: number) => {
    const track = beatData.tracks[trackType];
    // Remove notes in active bar
    const otherNotes = track.notes.filter(n => n.bar !== activeBar);
    const newNotes: NoteEvent[] = [];
    for (let s = 0; s < 16; s += interval) {
      newNotes.push({
        step: activeBar * 16 + s,
        bar: activeBar,
        stepInBar: s,
        pitch: defaultPitch,
        duration: 1,
        velocity: 100,
      });
    }
    onUpdateTrack(trackType, { notes: [...otherNotes, ...newNotes] });
    audioEngine.previewInstrument(trackType, defaultPitch);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden select-none border border-zinc-800 rounded-xl shadow-2xl">
      {/* Step Sequencer Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-white tracking-wide">Beat+Bassline Editor</span>
            <span className="text-zinc-500 font-mono">| LMMS Step Matrix</span>
          </div>

          {/* Active Bar Selector */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 ml-2">
            <button
              onClick={() => setActiveBar(Math.max(0, activeBar - 1))}
              disabled={activeBar === 0}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition"
              title="Previous Bar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: 8 }).map((_, barIdx) => (
                <button
                  key={barIdx}
                  onClick={() => setActiveBar(barIdx)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                    activeBar === barIdx
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : Math.floor(currentStep / 16) === barIdx && isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  B{barIdx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveBar(Math.min(7, activeBar + 1))}
              disabled={activeBar === 7}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 transition"
              title="Next Bar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Info label */}
        <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
          <span>
            Editing: <strong className="text-amber-400">Bar {activeBar + 1}</strong> ({beatData.barStructure[activeBar]?.role})
          </span>
          <span className="text-zinc-600">|</span>
          <span>Click LED step to toggle note</span>
        </div>
      </div>

      {/* Main Step Sequencer Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 space-y-3">
        {/* Step Beat Ruler (1, 2, 3, 4 with 4 subdivisions each) */}
        <div className="flex items-center">
          <div className="w-60 shrink-0 text-xs font-mono font-bold text-zinc-500 pl-2">
            TRACK / CHANNEL
          </div>

          <div className="flex-1 grid grid-cols-16 gap-1 min-w-[560px]">
            {Array.from({ length: 16 }).map((_, s) => {
              const beat = Math.floor(s / 4) + 1;
              const isFirstStepOfBeat = s % 4 === 0;
              const isPlayhead = isPlayingInActiveBar && stepInActiveBar === s;

              return (
                <div
                  key={s}
                  onClick={() => onJumpToStep(activeBar * 16 + s)}
                  className={`h-6 rounded-md flex flex-col items-center justify-center cursor-pointer transition ${
                    isPlayhead
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/40'
                      : isFirstStepOfBeat
                      ? 'bg-zinc-800/90 text-zinc-300 font-bold'
                      : 'bg-zinc-900/60 text-zinc-500'
                  }`}
                  title={`Step ${s + 1} (Beat ${beat}.${(s % 4) + 1})`}
                >
                  <span className="text-[10px] font-mono leading-none">
                    {isFirstStepOfBeat ? `.${beat}` : `${(s % 4) + 1}`}
                  </span>
                  {/* Miniature playhead LED dot */}
                  <div
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isPlayhead ? 'bg-zinc-950' : 'bg-transparent'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Rows for Each Track */}
        <div className="space-y-2">
          {tracksList.map(item => {
            const track = beatData.tracks[item.id];
            const isMuted = !!track.muted;
            const isSolo = !!track.solo;
            const activeBarNotes = track.notes.filter(n => n.bar === activeBar);
            const activeStepMap = new Set(activeBarNotes.map(n => n.stepInBar));

            return (
              <div
                key={item.id}
                className={`flex items-center p-2 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 transition ${
                  isMuted ? 'opacity-40' : ''
                }`}
              >
                {/* Track Left Strip */}
                <div className="w-60 shrink-0 flex items-center justify-between pr-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      onClick={() => audioEngine.previewInstrument(item.id, item.defaultPitch)}
                      className="p-1 rounded-md bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-400 transition"
                      title="Audition Sound"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <div className="truncate">
                      <span className={`font-bold text-xs block truncate ${item.color}`}>
                        {track.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {activeBarNotes.length} hits in bar
                      </span>
                    </div>
                  </div>

                  {/* Track Mute / Solo */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateTrack(item.id, { muted: !track.muted })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                        isMuted ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => onUpdateTrack(item.id, { solo: !track.solo })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                        isSolo ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      S
                    </button>

                    {/* Quick Fill Dropdown */}
                    <button
                      onClick={() => handleFillSteps(item.id, item.defaultPitch, 2)}
                      className="px-1 py-0.5 rounded text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
                      title="Fill every 2 steps (8th notes)"
                    >
                      /2
                    </button>
                    <button
                      onClick={() => handleFillSteps(item.id, item.defaultPitch, 4)}
                      className="px-1 py-0.5 rounded text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
                      title="Fill every 4 steps (Quarter notes)"
                    >
                      /4
                    </button>
                    <button
                      onClick={() => handleClearTrackBar(item.id)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400"
                      title="Clear bar"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 16 Step Buttons */}
                <div className="flex-1 grid grid-cols-16 gap-1 min-w-[560px]">
                  {Array.from({ length: 16 }).map((_, stepIdx) => {
                    const isActive = activeStepMap.has(stepIdx);
                    const isPlayhead = isPlayingInActiveBar && stepInActiveBar === stepIdx;
                    // Alternating 4-beat color blocks (classic LMMS / FL style)
                    const beatGroup = Math.floor(stepIdx / 4);
                    const isEvenBeat = beatGroup % 2 === 0;

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => handleToggleStep(item.id, stepIdx, item.defaultPitch)}
                        className={`h-10 rounded-md border transition flex flex-col items-center justify-between p-1 relative ${
                          isActive
                            ? `${item.ledColor} text-zinc-950 border-white/40 shadow-lg font-bold`
                            : isPlayhead
                            ? 'bg-amber-500/30 border-amber-400'
                            : isEvenBeat
                            ? 'bg-zinc-800/90 border-zinc-700/80 hover:border-zinc-500'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                        }`}
                        title={`Step ${stepIdx + 1}: ${isActive ? 'ACTIVE (click to remove)' : 'OFF (click to activate)'}`}
                      >
                        {/* Step LED light dot */}
                        <div
                          className={`w-2 h-2 rounded-full transition ${
                            isActive
                              ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]'
                              : isPlayhead
                              ? 'bg-amber-400 animate-ping'
                              : 'bg-zinc-700/60'
                          }`}
                        />

                        {/* Step index label */}
                        <span
                          className={`text-[9px] font-mono ${
                            isActive ? 'text-zinc-950 font-black' : 'text-zinc-500'
                          }`}
                        >
                          {stepIdx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sequencer Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <span className="font-mono text-[11px]">
          16 Steps Per Bar • 4 Beats • 4/4 Timing • Classic LMMS 4-Step Rhythmic Grouping
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">
            Current Beat: <strong className="text-amber-400">Beat {Math.floor(stepInActiveBar / 4) + 1}, Step {(stepInActiveBar % 4) + 1}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
