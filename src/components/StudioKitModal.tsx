/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StudioKitLane, StudioKitLibrary } from '../types';
import { midiToNoteName } from '../engine/scales';
import { studioKitService } from '../engine/studioKitService';
import { Check, Copy, Disc3, Play, Save, Trash2, Upload, X } from 'lucide-react';

interface StudioKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANES: { id: StudioKitLane; label: string; hint: string }[] = [
  { id: 'kick', label: 'Kick', hint: 'One-shot' },
  { id: 'snare', label: 'Snare', hint: 'One-shot' },
  { id: 'clap', label: 'Clap', hint: 'One-shot' },
  { id: 'closedHat', label: 'Closed Hat', hint: 'One-shot' },
  { id: 'openHat', label: 'Open Hat', hint: 'One-shot' },
  { id: 'percussion', label: 'Percussion', hint: 'One-shot for rim and other percussion events' },
  { id: 'bass808', label: '808', hint: 'Pitched and note-length controlled' },
];

const EMPTY_LIBRARY: StudioKitLibrary = { kits: [], selectedKitId: null, defaultKitId: null };

export const StudioKitModal: React.FC<StudioKitModalProps> = ({ isOpen, onClose }) => {
  const [library, setLibrary] = useState<StudioKitLibrary>(EMPTY_LIBRARY);
  const [activeKitId, setActiveKitId] = useState<string | null>(null);
  const [kitName, setKitName] = useState('My Kit');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropLane, setDropLane] = useState<StudioKitLane | null>(null);
  const inputs = useRef<Partial<Record<StudioKitLane, HTMLInputElement | null>>>({});

  const activeKit = useMemo(() => library.kits.find(kit => kit.id === activeKitId), [library.kits, activeKitId]);

  const refresh = () => {
    setLibrary(studioKitService.getLibrary());
    setActiveKitId(studioKitService.getActiveKitId());
  };

  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    setBusy(true);
    studioKitService.initialize().then(() => {
      if (!live) return;
      refresh();
      const startupError = studioKitService.getInitializationError();
      if (startupError) setError(`${startupError} Built-in sounds are available.`);
      setBusy(false);
    }).catch(reason => {
      if (!live) return;
      setError(reason instanceof Error ? reason.message : 'Could not open Studio Kit.');
      setBusy(false);
    });
    return () => { live = false; };
  }, [isOpen]);

  const run = async (operation: () => Promise<unknown>, successMessage?: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await operation();
      if (Array.isArray(result) && result.length) {
        setMessage(`Some samples could not be restored; fallback sounds are active. ${result.join('; ')}`);
      } else if (studioKitService.getInitializationError()) {
        setMessage(studioKitService.getInitializationError());
      } else if (successMessage) setMessage(successMessage);
      refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Studio Kit action failed.');
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (lane: StudioKitLane, file?: File) => {
    if (!file) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const assignment = await studioKitService.importFile(lane, file);
      const restoreWarning = studioKitService.getInitializationError();
      if (restoreWarning) setError(restoreWarning);
      else setMessage(`Loaded ${assignment.filename} into ${LANES.find(item => item.id === lane)?.label}.`);
      refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sample could not be loaded. The current assignment is unchanged.');
    } finally {
      setBusy(false);
      const input = inputs.current[lane];
      if (input) input.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <section className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl" aria-label="Studio Kit">
        <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Studio Kit</h2>
              <p className="text-[11px] text-zinc-500">Local sounds only · WAV and AIFF/AIF · C2 (MIDI 36) is the default 808 root</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-md" aria-label="Close Studio Kit"><X className="w-5 h-5" /></button>
        </header>

        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <label className="text-xs text-zinc-400" htmlFor="studio-kit-select">Kit</label>
            <select
              id="studio-kit-select"
              className="min-w-40 flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100"
              value={activeKitId ?? ''}
              disabled={busy}
              onChange={event => void run(() => studioKitService.selectKit(event.target.value), 'Kit selected.')}
            >
              <option value="">Built-in fallback sounds</option>
              {library.kits.map(kit => <option key={kit.id} value={kit.id}>{kit.name}{kit.id === library.defaultKitId ? ' · Default' : ''}</option>)}
            </select>
            <input aria-label="New kit name" className="w-32 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100" value={kitName} onChange={event => setKitName(event.target.value)} />
            <button disabled={busy} onClick={() => void run(() => studioKitService.createKit(kitName), 'New kit created.')} className="px-2.5 py-1.5 bg-amber-500 text-zinc-950 rounded text-xs font-bold disabled:opacity-50">New Kit</button>
            <button disabled={busy || !activeKit} onClick={() => void run(() => studioKitService.saveKit(), 'Kit saved locally.')} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 text-zinc-200 rounded text-xs disabled:opacity-40"><Save className="w-3 h-3" />Save Kit</button>
            <button disabled={busy || !activeKit} onClick={() => activeKit && void run(() => studioKitService.duplicateKit(activeKit.id), 'Kit duplicated.')} className="p-1.5 bg-zinc-800 text-zinc-300 rounded disabled:opacity-40" title="Duplicate Kit"><Copy className="w-3.5 h-3.5" /></button>
            <button disabled={busy || !activeKit} onClick={() => {
              if (!activeKit) return;
              const name = window.prompt('Rename kit', activeKit.name);
              if (name !== null) void run(() => studioKitService.renameKit(activeKit.id, name), 'Kit renamed.');
            }} className="px-2.5 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs disabled:opacity-40">Rename</button>
            <button disabled={busy || !activeKit} onClick={() => activeKit && void run(() => studioKitService.setDefaultKit(activeKit.id), 'Default kit set.')} className={`px-2.5 py-1.5 rounded text-xs disabled:opacity-40 ${activeKit?.id === library.defaultKitId ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-300'}`}>
              <Check className="inline w-3 h-3 mr-1" />{activeKit?.id === library.defaultKitId ? 'Default Kit' : 'Set Default'}
            </button>
            <button disabled={busy || !activeKit} onClick={() => activeKit && void run(() => studioKitService.deleteKit(activeKit.id), 'Kit deleted.')} className="p-1.5 text-zinc-400 hover:text-rose-400 disabled:opacity-40" title="Delete Kit"><Trash2 className="w-4 h-4" /></button>
          </div>

          {message && <p role="status" className="rounded border border-emerald-700/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">{message}</p>}
          {error && <p role="alert" className="rounded border border-rose-700/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">{error}</p>}
          {busy && <p className="text-xs text-amber-300">Loading local sample data…</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LANES.map(lane => {
              const assignment = activeKit?.assignments[lane.id];
              const isDropping = dropLane === lane.id;
              return (
                <div
                  key={lane.id}
                  onDragOver={event => { event.preventDefault(); setDropLane(lane.id); }}
                  onDragLeave={() => setDropLane(current => current === lane.id ? null : current)}
                  onDrop={event => {
                    event.preventDefault(); setDropLane(null);
                    void handleImport(lane.id, event.dataTransfer.files[0]);
                  }}
                  className={`rounded-lg border p-3 bg-zinc-950 transition ${isDropping ? 'border-amber-400 bg-amber-950/20' : 'border-zinc-800'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wide text-zinc-100">{lane.label}</h3>
                      <p className="text-[10px] text-zinc-500">{lane.hint}</p>
                    </div>
                    <span className={`text-[10px] ${assignment ? 'text-emerald-300' : 'text-zinc-500'}`}>{assignment ? 'Assigned' : 'Built-in fallback'}</span>
                  </div>
                  <p className="min-h-5 truncate text-xs text-zinc-300" title={assignment?.filename}>{assignment?.filename ?? 'No local sample assigned'}</p>
                  {assignment && <p className="mt-0.5 text-[10px] text-zinc-500">{(assignment.sizeBytes / 1024 / 1024).toFixed(2)} MB · {assignment.durationSeconds.toFixed(2)} s</p>}
                  {lane.id === 'bass808' && assignment && (
                    <label className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400">
                      Root note <span className="font-mono text-amber-300">{midiToNoteName(assignment.rootMidi ?? 36)}</span>
                      <input type="range" min="0" max="127" step="1" value={assignment.rootMidi ?? 36} disabled={busy}
                        onChange={event => void run(() => studioKitService.setRootMidi(Number(event.target.value)))} className="flex-1 accent-amber-500" />
                      <span className="font-mono">{assignment.rootMidi ?? 36}</span>
                    </label>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button disabled={busy} onClick={() => void run(() => studioKitService.audition(lane.id))} className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 disabled:opacity-50"><Play className="w-3 h-3 fill-current text-amber-400" />Audition</button>
                    <button disabled={busy} onClick={() => inputs.current[lane.id]?.click()} className="inline-flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-zinc-950 disabled:opacity-50"><Upload className="w-3 h-3" />Replace</button>
                    {assignment && <button disabled={busy} onClick={() => void run(() => studioKitService.clearLane(lane.id), 'Lane cleared; fallback sound restored.')} className="rounded border border-zinc-800 px-2 py-1.5 text-xs text-zinc-400 hover:text-rose-300 disabled:opacity-50">Clear</button>}
                    <span className="ml-auto text-[10px] text-zinc-600">Drop file here</span>
                    <input ref={element => { inputs.current[lane.id] = element; }} type="file" accept=".wav,.wave,.aif,.aiff,audio/wav,audio/aiff" className="hidden"
                      onChange={event => void handleImport(lane.id, event.target.files?.[0])} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] leading-relaxed text-zinc-500">Files stay in this browser’s local IndexedDB. Original audio is never copied into project ZIP exports. Files over 100 MB and formats other than WAV or AIFF/AIF are rejected.</p>
        </div>

        <footer className="flex justify-end px-5 py-3 border-t border-zinc-800 bg-zinc-950">
          <button onClick={onClose} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-md">Done</button>
        </footer>
      </section>
    </div>
  );
};
