/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Folder } from 'lucide-react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Key source files embedded for instantaneous in-browser inspection
const PROJECT_FILES: { path: string; label: string; group: string }[] = [
  { path: 'src/types.ts', label: 'types.ts (Data Models & Engine Interfaces)', group: 'Core' },
  { path: 'src/engine/generator.ts', label: 'generator.ts (Multi-Track Beat Orchestrator)', group: 'Engine' },
  { path: 'src/engine/scales.ts', label: 'scales.ts (Modal Theory & Tuning)', group: 'Engine' },
  { path: 'src/engine/kickFamilies.ts', label: 'kickFamilies.ts (40 Kick Pocket Families)', group: 'Families' },
  { path: 'src/engine/phraseFamilies.ts', label: 'phraseFamilies.ts (8-Bar Phrase Memory Skeletons)', group: 'Families' },
  { path: 'src/engine/808Families.ts', label: '808Families.ts (10 808 Behavior Families & Glides)', group: 'Families' },
  { path: 'src/engine/hatFamilies.ts', label: 'hatFamilies.ts (18 Hat Pocket Families)', group: 'Families' },
  { path: 'src/engine/drumsEngine.ts', label: 'drumsEngine.ts (Kick, Snare, Hat Synthesizers)', group: 'Engine' },
  { path: 'src/engine/bassEngine.ts', label: 'bassEngine.ts (808 Glides & Sub Engine)', group: 'Engine' },
  { path: 'src/engine/melodyEngine.ts', label: 'melodyEngine.ts (Pain Loop Archetypes)', group: 'Engine' },
  { path: 'src/engine/secondaryEngine.ts', label: 'secondaryEngine.ts (Dark Keys & Stabs)', group: 'Engine' },
  { path: 'src/engine/midiWriter.ts', label: 'midiWriter.ts (Binary Type 1 MIDI 480 PPQ Encoder)', group: 'MIDI / Export' },
  { path: 'src/engine/tokenCodec.ts', label: 'tokenCodec.ts (Ollama LLM Tokenizer & Python Decoder)', group: 'AI / Tokens' },
  { path: 'src/engine/audioEngine.ts', label: 'audioEngine.ts (Web Audio Synthesizers & Analyzer)', group: 'Audio' },
  { path: 'src/engine/qaTester.ts', label: 'qaTester.ts (Automated 100 Cookup Validation Suite)', group: 'Testing' },
  { path: 'package.json', label: 'package.json (Vite & Dependencies)', group: 'Config' },
];

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(PROJECT_FILES[0].path);
  const [fileContent, setFileContent] = useState<string>('Loading code...');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    // Dynamically fetch or load file content
    setLoading(true);
    fetch(`/${selectedFile}`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.text();
      })
      .then(text => {
        setFileContent(text);
        setLoading(false);
      })
      .catch(() => {
        // Fallback or placeholder if direct fetch is restricted
        setFileContent(`// File: ${selectedFile}\n// You can download the complete source code archive via the "Download Code ZIP" button.`);
        setLoading(false);
      });
  }, [isOpen, selectedFile]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = () => {
    const a = document.createElement('a');
    a.href = '/slapdesk_v0.4_source_code.zip';
    a.download = 'slapdesk_v0.4_source_code.zip';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white">SlapDesk v0.4 Source Code Browser</h2>
              <p className="text-xs text-zinc-400">Complete TypeScript music engine architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Source Code ZIP
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-md transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-pane code browser */}
        <div className="flex-1 flex overflow-hidden">
          {/* File sidebar */}
          <div className="w-64 bg-zinc-950 border-r border-zinc-800 p-3 overflow-y-auto space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Folder className="w-3 h-3" /> Files
            </div>
            {PROJECT_FILES.map(f => (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f.path)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition flex items-center gap-2 ${
                  selectedFile === f.path
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                <span className="truncate">{f.path.replace('src/', '')}</span>
              </button>
            ))}
          </div>

          {/* Code display area */}
          <div className="flex-1 flex flex-col bg-zinc-950/60 overflow-hidden">
            {/* Action header */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs">
              <span className="font-mono text-zinc-300 font-semibold">{selectedFile}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy File Content'}
              </button>
            </div>

            {/* Code content */}
            <pre className="flex-1 p-4 font-mono text-[11px] text-zinc-300 overflow-auto whitespace-pre leading-relaxed select-text bg-[#0d1117]">
              {loading ? '// Loading...' : fileContent}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800 bg-zinc-950 text-xs text-zinc-400">
          <span>You can also export this repository to GitHub or ZIP via Google AI Studio's top Settings menu.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
