/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { audioEngine } from '../engine/audioEngine';
import { SampleKit } from '../types';
import { Volume2, Upload, Trash2, X, Check, Disc3 } from 'lucide-react';

interface StudioKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudioKitModal: React.FC<StudioKitModalProps> = ({ isOpen, onClose }) => {
  const [sampleNames, setSampleNames] = useState<Record<string, string>>({
    kick: 'Built-in West Coast Knock',
    snare: 'Built-in Slap Crack & Snare',
    closedHat: 'Built-in Sizzle 16th Hat',
    openHat: 'Built-in Off-Beat Open Sizzle',
    bass808: 'Built-in Saturated 808 Sub',
  });
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleSlots = [
    { id: 'kick', label: 'Kick Drum (.wav)', synthDesc: 'Acoustic punch + 45Hz sub knock' },
    { id: 'snare', label: 'Snare / Clap (.wav)', synthDesc: 'Crisp multi-tap backbeat slap crack' },
    { id: 'closedHat', label: 'Closed Hi-Hat (.wav)', synthDesc: 'High-pass filtered metallic sizzle' },
    { id: 'openHat', label: 'Open Hi-Hat (.wav)', synthDesc: '0.35s offbeat tail sizzle' },
    { id: 'bass808', label: '808 Bass (.wav)', synthDesc: 'Waveshaped saturated sub with pitch glide' },
  ] as const;

  const handleFileUpload = async (slotId: keyof SampleKit, file: File) => {
    try {
      setIsProcessing(slotId);
      const normalizedBuffer = await audioEngine.decodeAndNormalizeSample(file);
      audioEngine.setCustomSample(slotId, normalizedBuffer);
      setSampleNames(prev => ({
        ...prev,
        [slotId]: `${file.name} (Normalized -0.5dB)`,
      }));
    } catch (err: any) {
      alert(`Could not load audio file: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAudition = (slotId: keyof SampleKit) => {
    audioEngine.init();
    const now = (audioEngine as any).ctx?.currentTime || 0;
    if (slotId === 'kick') audioEngine.playKick(now + 0.05, 1.0);
    else if (slotId === 'snare') audioEngine.playClap(now + 0.05, 1.0);
    else if (slotId === 'closedHat') audioEngine.playHat(now + 0.05, false, 0.9);
    else if (slotId === 'openHat') audioEngine.playHat(now + 0.05, true, 0.9);
    else if (slotId === 'bass808') audioEngine.play808(now + 0.05, 36, 0.6, 1.0);
  };

  const handleClearSlot = (slotId: keyof SampleKit) => {
    audioEngine.setCustomSample(slotId, undefined);
    const defaults: Record<string, string> = {
      kick: 'Built-in West Coast Knock',
      snare: 'Built-in Slap Crack & Snare',
      closedHat: 'Built-in Sizzle 16th Hat',
      openHat: 'Built-in Off-Beat Open Sizzle',
      bass808: 'Built-in Saturated 808 Sub',
    };
    setSampleNames(prev => ({ ...prev, [slotId]: defaults[slotId] }));
  };

  const handleResetAll = () => {
    audioEngine.clearCustomSamples();
    setSampleNames({
      kick: 'Built-in West Coast Knock',
      snare: 'Built-in Slap Crack & Snare',
      closedHat: 'Built-in Sizzle 16th Hat',
      openHat: 'Built-in Off-Beat Open Sizzle',
      bass808: 'Built-in Saturated 808 Sub',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold tracking-tight text-white">Studio Kit & Custom Drum Samples</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3 bg-zinc-800/60 rounded-lg text-xs text-zinc-300 border border-zinc-700/60">
            <p className="font-semibold text-amber-400 mb-1">Peak Gain Normalization Active</p>
            <p>
              Upload custom WAV or MP3 drum hits. Audio is automatically decoded and peak-normalized to -0.5 dB
              so your samples balance with the slap engine. If no sample is loaded, high-impact synthesized
              street instruments play automatically.
            </p>
          </div>

          <div className="space-y-3">
            {sampleSlots.map(slot => {
              const isCustom = sampleNames[slot.id].includes('(Normalized');
              return (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">{slot.label}</span>
                      {isCustom && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {sampleNames[slot.id]}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {slot.synthDesc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAudition(slot.id as keyof SampleKit)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md transition"
                      title="Audition Sound"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      Audition
                    </button>

                    <label className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 text-xs font-bold rounded-md cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      {isProcessing === slot.id ? 'Loading...' : 'Load'}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(slot.id as keyof SampleKit, file);
                        }}
                      />
                    </label>

                    {isCustom && (
                      <button
                        onClick={() => handleClearSlot(slot.id as keyof SampleKit)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-md transition"
                        title="Revert to built-in sound"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={handleResetAll}
            className="text-xs text-zinc-400 hover:text-red-400 transition"
          >
            Reset All to Built-in Synthesis
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-md transition"
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
