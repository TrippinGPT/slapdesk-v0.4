/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BeatData } from '../types';
import { beatToTokens, getPythonDecoderScript, getLlamaFactoryYaml } from '../engine/tokenCodec';
import { Cpu, Copy, Check, Download, FileCode, X, Sparkles } from 'lucide-react';

interface TokenLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  beatData: BeatData;
}

export const TokenLabModal: React.FC<TokenLabModalProps> = ({ isOpen, onClose, beatData }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const tokenString = beatToTokens(beatData);

  const handleCopyTokens = () => {
    navigator.clipboard.writeText(tokenString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold tracking-tight text-white">
              Ollama LLM Token Lab & Training Pipeline
            </h2>
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
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="p-3.5 bg-zinc-800/60 rounded-lg text-zinc-300 border border-zinc-700/60 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Tokenization for Local LLM Music Cooking (Ollama / Llama-3-8B)</span>
            </div>
            <p>
              This stream represents the exact space-delimited text tokens that your fine-tuned model
              spits out. The token vocabulary encodes BPM, Key, Phrase Family, and note-by-note channel
              events (with step offsets, velocities, and 808 pitch-bend glides).
            </p>
          </div>

          {/* Training Deliverables (Options 1, 2, 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  Option 1: Python Decoder Script
                </span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Standalone script (zero pip dependencies) that turns model token outputs directly into
                multi-track Type 1 MIDI files.
              </p>
              <button
                onClick={() => downloadFile('slapdesk_token_decoder.py', getPythonDecoderScript(), 'text/x-python')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download slapdesk_token_decoder.py
              </button>
            </div>

            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  Option 2: LLaMA-Factory YAML
                </span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                GPU / NUC training recipe for LoRA fine-tuning on Llama-3-8B with export to 4-bit GGUF for Ollama.
              </p>
              <button
                onClick={() => downloadFile('train_lora.yaml', getLlamaFactoryYaml(), 'text/yaml')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download train_lora.yaml
              </button>
            </div>
          </div>

          {/* Current Beat Tokens View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200">Current Cookup Token Stream:</span>
              <button
                onClick={handleCopyTokens}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Tokens'}
              </button>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-[11px] text-amber-300/90 leading-relaxed max-h-48 overflow-y-auto break-all select-all">
              {tokenString}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950">
          <span className="text-[11px] text-zinc-500">
            Tokens formatted for 2,000 synthetic dataset training matrix
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
