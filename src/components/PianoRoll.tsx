/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BeatData, TrackType, NoteEvent, BeatTrack } from '../types';
import { audioEngine } from '../engine/audioEngine';
import { midiToNoteName, isPitchInScale } from '../engine/scales';
import {
  Music2,
  Play,
  Volume2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';

interface PianoRollProps {
  beatData: BeatData;
  onUpdateTrack: (trackType: TrackType, updates: Partial<BeatTrack>) => void;
  currentStep: number;
  isPlaying: boolean;
  onJumpToStep: (step: number) => void;
  initialTrack?: TrackType;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  beatData,
  onUpdateTrack,
  currentStep,
  isPlaying,
  onJumpToStep,
  initialTrack = 'melody',
}) => {
  const [activeTrack, setActiveTrack] = useState<TrackType>(
    initialTrack === 'melody' || initialTrack === 'keys' || initialTrack === 'bass808'
      ? initialTrack
      : 'melody'
  );
  const [activeBar, setActiveBar] = useState<number>(() => Math.floor(currentStep / 16));
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // 1 = 16th, 2 = 8th, 4 = quarter
  const [velocityVal, setVelocityVal] = useState<number>(100);

  // Pitch range depending on track
  // For 808: C1 (24) to C3 (48)
  // For Melody/Keys: C3 (48) to C6 (84)
  const isBass = activeTrack === 'bass808';
  const minPitch = isBass ? 24 : 48;
  const maxPitch = isBass ? 48 : 84;

  const pitches: number[] = [];
  for (let p = maxPitch; p >= minPitch; p--) {
    pitches.push(p);
  }

  const track = beatData.tracks[activeTrack];
  const barNotes = track.notes.filter(n => n.bar === activeBar);
  const stepInActiveBar = currentStep % 16;
  const isPlayingInActiveBar = isPlaying && Math.floor(currentStep / 16) === activeBar;

  const handlePianoKeyClick = (pitch: number) => {
    audioEngine.previewInstrument(activeTrack, pitch);
  };

  const handleCellClick = (pitch: number, stepInBar: number) => {
    const globalStep = activeBar * 16 + stepInBar;
    const existing = track.notes.find(n => n.step === globalStep && n.pitch === pitch);

    let updatedNotes: NoteEvent[];
    if (existing) {
      // Remove note
      updatedNotes = track.notes.filter(n => n !== existing);
    } else {
      // Add note
      const newNote: NoteEvent = {
        step: globalStep,
        bar: activeBar,
        stepInBar: stepInBar,
        pitch: pitch,
        duration: selectedDuration,
        velocity: velocityVal,
      };
      updatedNotes = [...track.notes, newNote];
      audioEngine.previewInstrument(activeTrack, pitch, (selectedDuration * 0.25));
    }

    onUpdateTrack(activeTrack, { notes: updatedNotes });
  };

  const handleTranspose = (semitones: number) => {
    const updatedNotes = track.notes.map(n => {
      if (n.bar === activeBar) {
        return { ...n, pitch: Math.max(12, Math.min(108, n.pitch + semitones)) };
      }
      return n;
    });
    onUpdateTrack(activeTrack, { notes: updatedNotes });
  };

  const handleClearBar = () => {
    const updatedNotes = track.notes.filter(n => n.bar !== activeBar);
    onUpdateTrack(activeTrack, { notes: updatedNotes });
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden select-none border border-zinc-800 rounded-xl shadow-2xl">
      {/* Piano Roll Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0 flex-wrap gap-2">
        {/* Left: Track Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-white tracking-wide">Piano Roll</span>
            <span className="text-zinc-500 font-mono">| LMMS Pitch Grid</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTrack('melody')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                activeTrack === 'melody'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Lead Melody
            </button>
            <button
              onClick={() => setActiveTrack('keys')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                activeTrack === 'keys'
                  ? 'bg-cyan-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Dark Piano Keys
            </button>
            <button
              onClick={() => setActiveTrack('bass808')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                activeTrack === 'bass808'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              808 Sub-Bass
            </button>
          </div>
        </div>

        {/* Center: Bar Switcher */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveBar(Math.max(0, activeBar - 1))}
            disabled={activeBar === 0}
            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
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
            className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Tools & Note Length */}
        <div className="flex items-center gap-2">
          {/* Note Duration */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[11px]">
            <span className="text-zinc-500 font-mono px-1">LEN:</span>
            {[
              { label: '1/16', val: 1 },
              { label: '1/8', val: 2 },
              { label: '1/4', val: 4 },
              { label: '1/2', val: 8 },
            ].map(d => (
              <button
                key={d.val}
                onClick={() => setSelectedDuration(d.val)}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  selectedDuration === d.val
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Transpose Controls */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => handleTranspose(12)}
              className="px-1.5 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 font-mono"
              title="Transpose Octave Up (+12)"
            >
              +12
            </button>
            <button
              onClick={() => handleTranspose(-12)}
              className="px-1.5 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 font-mono"
              title="Transpose Octave Down (-12)"
            >
              -12
            </button>
            <button
              onClick={handleClearBar}
              className="p-1 text-zinc-400 hover:text-rose-400 rounded"
              title="Clear active bar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Piano Roll Workspace (Keyboard + Grid) */}
      <div className="flex-1 flex overflow-y-auto overflow-x-auto min-h-[360px]">
        {/* Left Vertical Piano Keyboard */}
        <div className="w-24 shrink-0 bg-zinc-950 border-r border-zinc-800 sticky left-0 z-10 select-none">
          {/* Top spacer matching step ruler */}
          <div className="h-7 border-b border-zinc-800 bg-zinc-900/80 px-2 flex items-center text-[10px] font-mono text-zinc-500">
            KEY
          </div>

          {pitches.map(pitch => {
            const name = midiToNoteName(pitch);
            const isBlack = name.includes('#') || name.includes('b');
            const inScale = isPitchInScale(pitch, beatData.config.rootKey, beatData.config.scale);

            return (
              <button
                key={pitch}
                onClick={() => handlePianoKeyClick(pitch)}
                className={`w-full h-6 border-b border-zinc-800/60 px-2 flex items-center justify-between text-[11px] font-mono transition text-left ${
                  isBlack
                    ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    : 'bg-zinc-950 text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                <span className="font-bold flex items-center gap-1">
                  {name}
                  {inScale && (
                    <span className="w-1 h-1 rounded-full bg-amber-500/80" title="In scale" />
                  )}
                </span>
                <span className="text-[9px] text-zinc-600">{pitch}</span>
              </button>
            );
          })}
        </div>

        {/* Right Note Grid */}
        <div className="flex-1 flex flex-col min-w-[560px]">
          {/* Top Step Numbers Ruler */}
          <div className="h-7 border-b border-zinc-800 bg-zinc-900/80 grid grid-cols-16 shrink-0 sticky top-0 z-10">
            {Array.from({ length: 16 }).map((_, s) => {
              const beat = Math.floor(s / 4) + 1;
              const isPlayhead = isPlayingInActiveBar && stepInActiveBar === s;
              return (
                <div
                  key={s}
                  onClick={() => onJumpToStep(activeBar * 16 + s)}
                  className={`border-r border-zinc-800/80 flex items-center justify-center cursor-pointer text-[10px] font-mono transition ${
                    isPlayhead
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : s % 4 === 0
                      ? 'bg-zinc-800/50 text-zinc-200 font-bold'
                      : 'text-zinc-500 hover:bg-zinc-800/30'
                  }`}
                >
                  {s % 4 === 0 ? `B${beat}` : `${(s % 4) + 1}`}
                </div>
              );
            })}
          </div>

          {/* Grid Rows for Each Semitone Pitch */}
          <div className="flex-1 relative">
            {/* Playhead vertical line */}
            {isPlayingInActiveBar && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.9)]"
                style={{ left: `${(stepInActiveBar / 16) * 100}%` }}
              />
            )}

            {pitches.map(pitch => {
              const name = midiToNoteName(pitch);
              const isBlack = name.includes('#');
              const inScale = isPitchInScale(pitch, beatData.config.rootKey, beatData.config.scale);
              const notesAtPitch = barNotes.filter(n => n.pitch === pitch);

              return (
                <div
                  key={pitch}
                  className={`h-6 border-b border-zinc-800/50 grid grid-cols-16 relative ${
                    inScale
                      ? isBlack
                        ? 'bg-zinc-900/70'
                        : 'bg-zinc-950'
                      : isBlack
                      ? 'bg-zinc-950/90 opacity-60'
                      : 'bg-zinc-900/40 opacity-60'
                  }`}
                >
                  {Array.from({ length: 16 }).map((_, stepIdx) => {
                    const note = notesAtPitch.find(n => n.stepInBar === stepIdx);
                    const isBeatStart = stepIdx % 4 === 0;

                    return (
                      <div
                        key={stepIdx}
                        onClick={() => handleCellClick(pitch, stepIdx)}
                        className={`border-r border-zinc-800/40 relative cursor-pointer hover:bg-amber-500/20 transition ${
                          isBeatStart ? 'border-r-zinc-700/60' : ''
                        }`}
                      >
                        {note && (
                          <div
                            className={`absolute inset-y-0.5 left-0.5 rounded-sm flex items-center px-1 text-[9px] font-mono font-bold z-10 transition shadow-md ${
                              activeTrack === 'melody'
                                ? 'bg-amber-500 text-zinc-950 shadow-amber-500/40'
                                : activeTrack === 'keys'
                                ? 'bg-cyan-500 text-zinc-950 shadow-cyan-500/40'
                                : 'bg-rose-500 text-white shadow-rose-500/40'
                            }`}
                            style={{
                              width: `calc(${note.duration * 100}% - 4px)`,
                            }}
                            title={`${name} (Step ${stepIdx + 1}, Duration: ${note.duration} steps, Vel: ${note.velocity})`}
                          >
                            <span className="truncate">{name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Piano Roll Status Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono">
            Key: <strong className="text-amber-400">{beatData.config.rootKey} {beatData.config.scale}</strong>
          </span>
          <span>•</span>
          <span>
            Active Track: <strong className="text-white">{track.name}</strong> ({barNotes.length} notes in bar)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>Click grid cell to place note • Click note to remove</span>
        </div>
      </div>
    </div>
  );
};
