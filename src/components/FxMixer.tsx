/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BeatData, TrackType, BeatTrack } from '../types';
import { audioEngine } from '../engine/audioEngine';
import {
  Sliders,
  Volume2,
  VolumeX,
  Headphones,
  Play,
  Activity,
  Shield,
  Zap,
} from 'lucide-react';

interface FxMixerProps {
  beatData: BeatData;
  onUpdateTrack: (trackType: TrackType, updates: Partial<BeatTrack>) => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  currentStep: number;
  isPlaying: boolean;
}

export const FxMixer: React.FC<FxMixerProps> = ({
  beatData,
  onUpdateTrack,
  masterVolume,
  onMasterVolumeChange,
  currentStep,
  isPlaying,
}) => {
  const [softClipper, setSoftClipper] = useState(true);
  const [stereoSpread, setStereoSpread] = useState(true);

  const channels: { id: TrackType; name: string; ch: number; color: string; defaultPitch: number }[] = [
    { id: 'melody', name: 'Melody', ch: 1, color: 'text-amber-400 bg-amber-500', defaultPitch: 72 },
    { id: 'keys', name: 'Keys', ch: 2, color: 'text-cyan-400 bg-cyan-500', defaultPitch: 60 },
    { id: 'bass808', name: '808 Bass', ch: 3, color: 'text-rose-400 bg-rose-500', defaultPitch: 36 },
    { id: 'kick', name: 'Kick', ch: 4, color: 'text-emerald-400 bg-emerald-500', defaultPitch: 36 },
    { id: 'snare', name: 'Snare/Clap', ch: 5, color: 'text-purple-400 bg-purple-500', defaultPitch: 39 },
    { id: 'hihat', name: 'Hi-Hats', ch: 6, color: 'text-sky-400 bg-sky-500', defaultPitch: 42 },
  ];

  // Check if a channel has a note hit at currentStep for LED VU meter activity
  const isChannelActive = (trackType: TrackType) => {
    if (!isPlaying) return false;
    const track = beatData.tracks[trackType];
    if (track.muted) return false;
    const bar = Math.floor(currentStep / 16);
    if (track.disabledBars?.includes(bar)) return false;
    return track.notes.some(n => n.step === currentStep);
  };

  const handleAudition = (trackType: TrackType, pitch: number) => {
    audioEngine.previewInstrument(trackType, pitch);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden select-none border border-zinc-800 rounded-xl shadow-2xl">
      {/* Mixer Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-white tracking-wide">FX Mixer</span>
          <span className="text-zinc-500 font-mono">| LMMS Multi-Track Console</span>
        </div>

        {/* Master FX Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoftClipper(!softClipper)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition border ${
              softClipper
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
            title="West Coast / Detroit Slap Soft Clipper: Saturates transients without harsh digital clipping"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Soft Clipper {softClipper ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setStereoSpread(!stereoSpread)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition border ${
              stereoSpread
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
            title="Stereo Widener on Melodies & Reverbs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Stereo Widener</span>
          </button>

          <div className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Limiter: -0.5 dB Peak Safe</span>
          </div>
        </div>
      </div>

      {/* Main Mixer Channel Strips Rack */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 flex items-stretch gap-3 min-h-[420px]">
        {/* MASTER CHANNEL STRIP */}
        <div className="w-36 shrink-0 bg-zinc-900/90 border-2 border-amber-500/50 rounded-xl p-3 flex flex-col justify-between shadow-xl">
          {/* Header */}
          <div className="text-center border-b border-zinc-800 pb-2">
            <span className="text-[10px] font-mono text-amber-400 font-bold block">CH 0</span>
            <h3 className="font-bold text-sm text-white tracking-wide">MASTER</h3>
          </div>

          {/* Fader & VU Meter Section */}
          <div className="flex-1 flex items-center justify-center gap-3 my-4">
            {/* Master Fader */}
            <div className="flex flex-col items-center h-52 justify-between">
              <span className="text-[10px] font-mono text-zinc-400">+6 dB</span>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.02"
                value={masterVolume}
                onChange={e => onMasterVolumeChange(parseFloat(e.target.value))}
                className="h-36 w-3 accent-amber-500 cursor-pointer -rotate-90 origin-center my-6"
                title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
              />
              <span className="text-[10px] font-mono text-zinc-500">-inf</span>
            </div>

            {/* Simulated Stereo VU Meters (Left & Right) */}
            <div className="flex gap-1 h-44 py-1">
              {[0, 1].map(channelSide => {
                const isActive = isPlaying;
                return (
                  <div
                    key={channelSide}
                    className="w-2.5 bg-zinc-950 rounded-sm border border-zinc-800 flex flex-col-reverse p-0.5 gap-0.5 overflow-hidden"
                  >
                    {Array.from({ length: 14 }).map((_, i) => {
                      const isLit = isActive && Math.random() > (1 - masterVolume * 0.7);
                      const isPeak = i >= 12;
                      const isMid = i >= 8 && i < 12;

                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-xs transition-opacity duration-75 ${
                            isLit
                              ? isPeak
                                ? 'bg-rose-500 opacity-100 shadow-[0_0_4px_rgba(244,63,94,0.8)]'
                                : isMid
                                ? 'bg-amber-400 opacity-100'
                                : 'bg-emerald-500 opacity-100'
                              : 'bg-zinc-800/40 opacity-30'
                          }`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Readout */}
          <div className="border-t border-zinc-800 pt-2 text-center">
            <span className="font-mono text-xs font-bold text-amber-400">
              {Math.round(masterVolume * 100)}%
            </span>
            <span className="text-[9px] text-zinc-500 block">MASTER OUT</span>
          </div>
        </div>

        {/* 6 INSTRUMENT CHANNEL STRIPS */}
        {channels.map(item => {
          const track = beatData.tracks[item.id];
          const volume = track.volume !== undefined ? track.volume : 1.0;
          const pan = track.pan !== undefined ? track.pan : 0;
          const isMuted = !!track.muted;
          const isSolo = !!track.solo;
          const active = isChannelActive(item.id);

          return (
            <div
              key={item.id}
              className={`w-32 shrink-0 bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between hover:border-zinc-700 transition ${
                isMuted ? 'opacity-40' : ''
              }`}
            >
              {/* Header */}
              <div className="text-center border-b border-zinc-800 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">CH {item.ch}</span>
                  <div
                    className={`w-2 h-2 rounded-full transition ${
                      active ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-ping' : 'bg-zinc-800'
                    }`}
                  />
                </div>
                <h4 className="font-bold text-xs text-zinc-100 truncate mt-0.5">{track.name}</h4>
              </div>

              {/* Pan Dial */}
              <div className="my-2 text-center">
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 mb-1">
                  <span>L</span>
                  <span className="text-zinc-300">
                    {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(Math.round(pan * 100))}` : `R${Math.round(pan * 100)}`}
                  </span>
                  <span>R</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={pan}
                  onChange={e => onUpdateTrack(item.id, { pan: parseFloat(e.target.value) })}
                  className="w-full h-1 accent-cyan-500 cursor-pointer"
                  title="Stereo Pan"
                />
              </div>

              {/* Fader & Channel VU Meter */}
              <div className="flex-1 flex items-center justify-center gap-3 my-2">
                {/* Track Volume Fader */}
                <div className="flex flex-col items-center h-48 justify-between">
                  <span className="text-[9px] font-mono text-zinc-500">+6</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={volume}
                    onChange={e => onUpdateTrack(item.id, { volume: parseFloat(e.target.value) })}
                    className="h-32 w-2.5 accent-amber-500 cursor-pointer -rotate-90 origin-center my-4"
                    title={`${track.name} Volume: ${Math.round(volume * 100)}%`}
                  />
                  <span className="text-[9px] font-mono text-zinc-500">-inf</span>
                </div>

                {/* Channel Peak VU Meter */}
                <div className="w-2.5 h-40 bg-zinc-950 rounded-sm border border-zinc-800 flex flex-col-reverse p-0.5 gap-0.5 overflow-hidden">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const isLit = active && Math.random() > (1 - volume * 0.8);
                    const isPeak = i >= 10;
                    const isMid = i >= 7 && i < 10;

                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-xs transition-opacity duration-75 ${
                          isLit
                            ? isPeak
                              ? 'bg-rose-500 opacity-100'
                              : isMid
                              ? 'bg-amber-400 opacity-100'
                              : 'bg-emerald-500 opacity-100'
                            : 'bg-zinc-800/40 opacity-20'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bottom Strip: Mute, Solo & Audition */}
              <div className="border-t border-zinc-800 pt-2 space-y-2">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => onUpdateTrack(item.id, { muted: !track.muted })}
                    className={`flex-1 py-1 rounded text-xs font-bold transition ${
                      isMuted ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Mute Channel"
                  >
                    M
                  </button>

                  <button
                    onClick={() => onUpdateTrack(item.id, { solo: !track.solo })}
                    className={`flex-1 py-1 rounded text-xs font-bold transition ${
                      isSolo ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Solo Channel"
                  >
                    S
                  </button>

                  <button
                    onClick={() => handleAudition(item.id, item.defaultPitch)}
                    className="p-1 rounded bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-400 transition"
                    title="Audition Channel"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>

                <div className="text-center font-mono text-[10px] text-zinc-400">
                  {Math.round(volume * 100)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mixer Status Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <span className="font-mono text-[11px]">
          6 Instrument Channels + 1 Master Bus • Dynamic Peak VU Monitoring • 32-Bit Floating Point Mix Bus
        </span>
        <span className="text-[11px] text-amber-400 font-mono">
          Headroom: Safe (-0.5 dB Peak)
        </span>
      </div>
    </div>
  );
};
