/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CURATED_REFERENCE_TARGETS, ReferenceTarget } from '../engine/referenceLibrary';
import { audioEngine } from '../engine/audioEngine';
import { ReferenceDNA, TrackType } from '../types';
import {
  Folder,
  Music,
  Disc3,
  Sparkles,
  Play,
  Volume2,
  ChevronRight,
  ChevronDown,
  Download,
  FileCode,
  ShieldCheck,
  Cpu,
  Layers,
  Flame,
  Check,
  ExternalLink,
} from 'lucide-react';

interface DawSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyReference: (target: ReferenceTarget) => void;
  activeReferenceId?: string;
  onOpenStudioKit: () => void;
  onOpenTestLab: () => void;
  onOpenTokenLab: () => void;
  onOpenCodeViewer: () => void;
  onDownloadMidi: () => void;
  onExportZip: () => void;
}

export const DawSidebar: React.FC<DawSidebarProps> = ({
  isOpen,
  onClose,
  onApplyReference,
  activeReferenceId,
  onOpenStudioKit,
  onOpenTestLab,
  onOpenTokenLab,
  onOpenCodeViewer,
  onDownloadMidi,
  onExportZip,
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'instruments' | 'references' | 'projects'>('references');
  const [playingSample, setPlayingSample] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAudition = (track: TrackType, pitch = 60, id: string) => {
    setPlayingSample(id);
    audioEngine.previewInstrument(track, pitch);
    setTimeout(() => {
      setPlayingSample(null);
    }, 400);
  };

  const sampleLibrary = [
    { id: 'k1', name: 'West Coast Knock Kick.wav', track: 'kick' as TrackType, pitch: 36, desc: 'Heavy transient punch' },
    { id: 'k2', name: 'Detroit Slap Punch Kick.wav', track: 'kick' as TrackType, pitch: 36, desc: 'Short, tight low-end snap' },
    { id: 's1', name: 'Bay Area Slap Clap.wav', track: 'snare' as TrackType, pitch: 39, desc: 'Stacked layered handclaps' },
    { id: 's2', name: 'Crisp Street Snare.wav', track: 'snare' as TrackType, pitch: 38, desc: 'Sharp 200Hz crack' },
    { id: 'h1', name: '16th Tick Hat.wav', track: 'hihat' as TrackType, pitch: 42, desc: 'Ultra-clean metallic ping' },
    { id: 'h2', name: 'Detroit Sizzle Open Hat.wav', track: 'hihat' as TrackType, pitch: 46, desc: 'Shimmering decay' },
    { id: 'b1', name: 'Moog 808 Sub Boom.wav', track: 'bass808' as TrackType, pitch: 36, desc: 'Deep warm saturated low-end' },
    { id: 'b2', name: 'Short Spank 808.wav', track: 'bass808' as TrackType, pitch: 38, desc: 'Tight staccato sub bounce' },
  ];

  const instrumentLibrary = [
    { id: 'inst_keys', name: 'West Coast Grand Piano', track: 'keys' as TrackType, pitch: 60, desc: 'Dark staccato acoustic keys' },
    { id: 'inst_bell', name: 'Detroit Sinister Tubular Bell', track: 'melody' as TrackType, pitch: 72, desc: 'Haunting street bell lead' },
    { id: 'inst_lead', name: 'Bay Whine Monophonic Synth', track: 'melody' as TrackType, pitch: 74, desc: 'Portamento high whistle' },
    { id: 'inst_808', name: 'Slap Glide Sub-Bass', track: 'bass808' as TrackType, pitch: 36, desc: 'Smooth pitch-bend 808' },
  ];

  return (
    <aside className="w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 text-zinc-300 select-none z-20">
      {/* Sidebar Top Nav Tabs */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/90 text-xs">
        <button
          onClick={() => setActiveTab('references')}
          className={`flex-1 py-2.5 px-2 font-bold text-center border-b-2 transition ${
            activeTab === 'references'
              ? 'border-amber-500 text-amber-300 bg-zinc-950/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Curated Producer Targets"
        >
          Targets
        </button>

        <button
          onClick={() => setActiveTab('samples')}
          className={`flex-1 py-2.5 px-2 font-bold text-center border-b-2 transition ${
            activeTab === 'samples'
              ? 'border-amber-500 text-amber-300 bg-zinc-950/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Drum Samples & Kits"
        >
          Samples
        </button>

        <button
          onClick={() => setActiveTab('instruments')}
          className={`flex-1 py-2.5 px-2 font-bold text-center border-b-2 transition ${
            activeTab === 'instruments'
              ? 'border-amber-500 text-amber-300 bg-zinc-950/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Synthesizers & Presets"
        >
          Presets
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-2.5 px-2 font-bold text-center border-b-2 transition ${
            activeTab === 'projects'
              ? 'border-amber-500 text-amber-300 bg-zinc-950/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
          title="Project Stems & Tools"
        >
          Stems
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* TAB 1: CURATED REFERENCE TARGETS */}
        {activeTab === 'references' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="uppercase font-mono tracking-wider font-semibold">Producer Pockets</span>
              <span>{CURATED_REFERENCE_TARGETS.length} Targets</span>
            </div>

            {CURATED_REFERENCE_TARGETS.map(target => {
              const isActive = activeReferenceId === target.id;
              return (
                <div
                  key={target.id}
                  onClick={() => onApplyReference(target)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md'
                      : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[180px]">
                      {target.title}
                    </span>
                    {isActive ? (
                      <span className="p-0.5 rounded-full bg-amber-500 text-zinc-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono font-semibold">
                        {target.detectedBpm} BPM
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 line-clamp-1">
                    {target.author} • {target.category}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
                    <span>Kick: {target.kickDensity}%</span>
                    <span>Vocal: {target.vocalSpace}%</span>
                    <span className="text-amber-400">Lock Target</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: MY SAMPLES */}
        {activeTab === 'samples' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="uppercase font-mono tracking-wider font-semibold">Factory Samples</span>
              <button
                onClick={onOpenStudioKit}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                + Custom Kit
              </button>
            </div>

            {sampleLibrary.map(s => {
              const isPlaying = playingSample === s.id;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-xs transition group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      onClick={() => handleAudition(s.track, s.pitch, s.id)}
                      className={`p-1.5 rounded-md transition ${
                        isPlaying
                          ? 'bg-emerald-500 text-zinc-950 animate-pulse'
                          : 'bg-zinc-800 group-hover:bg-amber-500 group-hover:text-zinc-950 text-zinc-300'
                      }`}
                      title="Audition Sample"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <div className="truncate">
                      <p className="font-semibold text-zinc-200 text-xs truncate">{s.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{s.desc}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">WAV</span>
                </div>
              );
            })}

            <div className="pt-2">
              <button
                onClick={onOpenStudioKit}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span>Upload Custom Drum WAVs</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: INSTRUMENTS & PRESETS */}
        {activeTab === 'instruments' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="uppercase font-mono tracking-wider font-semibold">Synthesizers & Keys</span>
            </div>

            {instrumentLibrary.map(inst => {
              const isPlaying = playingSample === inst.id;
              return (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-xs transition group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      onClick={() => handleAudition(inst.track, inst.pitch, inst.id)}
                      className={`p-1.5 rounded-md transition ${
                        isPlaying
                          ? 'bg-emerald-500 text-zinc-950 animate-pulse'
                          : 'bg-zinc-800 group-hover:bg-amber-500 group-hover:text-zinc-950 text-zinc-300'
                      }`}
                      title="Audition Preset"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <div className="truncate">
                      <p className="font-semibold text-zinc-200 text-xs truncate">{inst.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{inst.desc}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-amber-500/80 shrink-0">DSP</span>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: STEMS & EXPORTS */}
        {activeTab === 'projects' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="uppercase font-mono tracking-wider font-semibold">Production Stems</span>
            </div>

            <button
              onClick={onDownloadMidi}
              className="w-full p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-left flex items-center justify-between transition group"
            >
              <div>
                <p className="font-bold text-xs text-white">Multi-Track MIDI File</p>
                <p className="text-[10px] text-zinc-400">FL Studio, Ableton, Logic ready (.mid)</p>
              </div>
              <Download className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition" />
            </button>

            <button
              onClick={onExportZip}
              className="w-full p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-left flex items-center justify-between transition group"
            >
              <div>
                <p className="font-bold text-xs text-white">Project Bundle (ZIP)</p>
                <p className="text-[10px] text-zinc-400">MIDI, Token metadata & recipe (.zip)</p>
              </div>
              <Download className="w-4 h-4 text-zinc-400 group-hover:translate-y-0.5 transition" />
            </button>

            <div className="pt-2 border-t border-zinc-900 space-y-1">
              <button
                onClick={onOpenTestLab}
                className="w-full py-2 px-2.5 text-left text-xs text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg flex items-center gap-2 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automated QA Suite</span>
              </button>

              <button
                onClick={onOpenTokenLab}
                className="w-full py-2 px-2.5 text-left text-xs text-zinc-400 hover:text-purple-400 hover:bg-zinc-900 rounded-lg flex items-center gap-2 transition"
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Ollama LLM Token Lab</span>
              </button>

              <button
                onClick={onOpenCodeViewer}
                className="w-full py-2 px-2.5 text-left text-xs text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 rounded-lg flex items-center gap-2 transition"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>Browse Engine Code</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-zinc-900 bg-zinc-950 text-[10px] text-zinc-500 font-mono text-center">
        480 PPQ • 8-Bar Structural Engine
      </div>
    </aside>
  );
};
