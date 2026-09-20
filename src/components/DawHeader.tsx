/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DawView, ReferenceDNA } from '../types';
import {
  Play,
  Square,
  Repeat,
  Volume2,
  Sliders,
  Sparkles,
  Disc3,
  FileCode,
  ShieldCheck,
  Cpu,
  Download,
  FolderOpen,
  ChevronDown,
  Layers,
  Music2,
  Grid,
  Radio,
  Clock,
  Activity,
  Mic,
} from 'lucide-react';

interface DawHeaderProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onStop: () => void;
  bpm: number;
  onBpmChange: (newBpm: number) => void;
  activeView: DawView;
  onViewChange: (view: DawView) => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  currentBar: number;
  currentStep: number;
  referenceDNA?: ReferenceDNA;
  onOpenReferenceModal: () => void;
  onOpenStudioKit: () => void;
  onOpenTestLab: () => void;
  onOpenTokenLab: () => void;
  onOpenCodeViewer: () => void;
  onDownloadMidi: () => void;
  onExportZip: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewCookup: () => void;
}

export const DawHeader: React.FC<DawHeaderProps> = ({
  isPlaying,
  onPlayToggle,
  onStop,
  bpm,
  onBpmChange,
  activeView,
  onViewChange,
  masterVolume,
  onMasterVolumeChange,
  currentBar,
  currentStep,
  referenceDNA,
  onOpenReferenceModal,
  onOpenStudioKit,
  onOpenTestLab,
  onOpenTokenLab,
  onOpenCodeViewer,
  onDownloadMidi,
  onExportZip,
  sidebarOpen,
  onToggleSidebar,
  onNewCookup,
}) => {
  const [loopMode, setLoopMode] = useState(true);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const stepInBar = currentStep % 16;
  const beatInBar = Math.floor(stepInBar / 4) + 1;
  const tickInBeat = (stepInBar % 4) * 24; // standard 96 ticks per beat for 16th

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 text-zinc-200 select-none shrink-0">
      {/* Top DAW Menu Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-zinc-900 text-xs bg-zinc-950/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-sm tracking-tight text-white">SLAP<span className="text-amber-500">DESK</span></span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">LMMS DAW</span>
          </div>

          {/* Menu Dropdowns */}
          <div className="flex items-center gap-1 relative">
            <div className="relative">
              <button
                onClick={() => {
                  setFileMenuOpen(!fileMenuOpen);
                  setToolsMenuOpen(false);
                }}
                className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition flex items-center gap-1 text-[11px]"
              >
                <span>File</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {fileMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 z-50 text-xs"
                  onClick={() => setFileMenuOpen(false)}
                >
                  <button
                    onClick={onNewCookup}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                  >
                    <span>New Cookup</span>
                    <span className="text-[10px] text-zinc-500">Ctrl+N</span>
                  </button>
                  <button
                    onClick={onDownloadMidi}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                  >
                    <span>Export Multi-Track MIDI</span>
                    <span className="text-[10px] text-zinc-500">Ctrl+E</span>
                  </button>
                  <button
                    onClick={onExportZip}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                  >
                    <span>Export Project ZIP</span>
                  </button>
                  <div className="my-1 border-t border-zinc-800" />
                  <a
                    href="/slapdesk_v0.4_source_code.zip"
                    download="slapdesk_v0.4_source_code.zip"
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-amber-400 flex items-center justify-between"
                  >
                    <span>Download Source Code</span>
                  </a>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setToolsMenuOpen(!toolsMenuOpen);
                  setFileMenuOpen(false);
                }}
                className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition flex items-center gap-1 text-[11px]"
              >
                <span>Tools</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>

              {toolsMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 z-50 text-xs"
                  onClick={() => setToolsMenuOpen(false)}
                >
                  <button
                    onClick={onOpenReferenceModal}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-amber-400 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reference Target Library</span>
                  </button>
                  <button
                    onClick={onOpenStudioKit}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-cyan-400 flex items-center gap-2"
                  >
                    <Disc3 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Studio Kit Sample Manager</span>
                  </button>
                  <button
                    onClick={onOpenTestLab}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-emerald-400 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Automated QA Test Suite</span>
                  </button>
                  <button
                    onClick={onOpenTokenLab}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-purple-400 flex items-center gap-2"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ollama LLM Token Lab</span>
                  </button>
                  <button
                    onClick={onOpenCodeViewer}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                  >
                    <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Browse Project Source Code</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onOpenReferenceModal}
              className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-white transition text-[11px] text-amber-400"
            >
              References
            </button>
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
          {referenceDNA && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="truncate max-w-[160px] font-mono">{referenceDNA.title || referenceDNA.sourceFileName}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Audio:</span>
            <span className="text-emerald-400 font-mono">44.1 kHz 16-Bit</span>
          </div>
        </div>
      </div>

      {/* Main LMMS Transport & Window Switcher Rack */}
      <div className="flex items-center justify-between px-3 py-2 gap-3 flex-wrap bg-zinc-900/95">
        {/* Left: Transport Controls & LCD Displays */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg border transition ${
              sidebarOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title="Toggle Browser Sidebar"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-zinc-800" />

          {/* Transport Buttons */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={onPlayToggle}
              className={`p-2 rounded-md transition font-bold flex items-center justify-center ${
                isPlaying
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 animate-pulse'
                  : 'bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-200'
              }`}
              title={isPlaying ? 'Pause' : 'Play (Space)'}
            >
              <Play className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onStop}
              className="p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition hover:text-white"
              title="Stop & Reset to Bar 1"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => setLoopMode(!loopMode)}
              className={`p-2 rounded-md transition ${
                loopMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Loop Song (8 Bars)"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Song Position LCD Display */}
          <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Position</span>
              <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                {String(currentBar + 1).padStart(3, '0')} : {String(beatInBar).padStart(2, '0')} : {String(tickInBeat).padStart(2, '0')}
              </span>
            </div>

            <div className="h-5 w-px bg-zinc-800" />

            <div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Time</span>
              <span className="font-mono text-xs text-zinc-300">
                00:{String(Math.floor((currentStep * (60 / bpm / 4)))).padStart(2, '0')}:{String(Math.floor(((currentStep * (60 / bpm / 4)) % 1) * 100)).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* BPM & Time Signature Display */}
          <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Tempo</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-black text-white">{bpm}</span>
                <span className="text-[10px] text-zinc-400 font-mono">BPM</span>
                <div className="flex flex-col ml-1">
                  <button
                    onClick={() => onBpmChange(Math.min(180, bpm + 1))}
                    className="text-[9px] text-zinc-400 hover:text-amber-400 leading-none px-1"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onBpmChange(Math.max(60, bpm - 1))}
                    className="text-[9px] text-zinc-400 hover:text-amber-400 leading-none px-1"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            <div className="h-5 w-px bg-zinc-800" />

            <div>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Sig</span>
              <span className="font-mono text-xs font-bold text-zinc-300">4 / 4</span>
            </div>
          </div>

          {/* Master Volume Slider */}
          <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-mono">Master Vol</span>
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.02"
                value={masterVolume}
                onChange={e => onMasterVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1.5 accent-amber-500 cursor-pointer"
                title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 w-8">{Math.round(masterVolume * 100)}%</span>
          </div>
        </div>

        {/* Center/Right: LMMS Iconic Window Switcher Icon Rack */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => onViewChange('song_editor')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'song_editor'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title="Song-Editor: Timeline Arranger (F5)"
          >
            <Layers className="w-4 h-4" />
            <span>Song-Editor</span>
          </button>

          <button
            onClick={() => onViewChange('beat_bassline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'beat_bassline'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title="Beat+Bassline Editor: Step Sequencer (F6)"
          >
            <Grid className="w-4 h-4" />
            <span>Beat+Bassline</span>
          </button>

          <button
            onClick={() => onViewChange('piano_roll')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'piano_roll'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title="Piano Roll: MIDI Note Editor (F7)"
          >
            <Music2 className="w-4 h-4" />
            <span>Piano Roll</span>
          </button>

          <button
            onClick={() => onViewChange('mixer')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'mixer'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title="FX Mixer: Channel Faders & Meters (F9)"
          >
            <Sliders className="w-4 h-4" />
            <span>FX Mixer</span>
          </button>

          <button
            onClick={() => onViewChange('generator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeView === 'generator'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
                : 'text-amber-400 hover:text-amber-300 hover:bg-zinc-800'
            }`}
            title="SlapDesk Algorithmic Beat Engine & Reference DNA"
          >
            <Radio className="w-4 h-4" />
            <span>Generator</span>
          </button>
        </div>
      </div>
    </header>
  );
};
