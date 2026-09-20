import React, { useEffect, useState } from 'react';
import { Copy, FolderOpen, Save, Trash2, Pencil, Plus, X } from 'lucide-react';
import { SlapDeskSession, SessionSaveStatus } from '../engine/sessionTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessions: SlapDeskSession[];
  currentSessionId: string | null;
  saveStatus: SessionSaveStatus;
  invalidCount: number;
  onRefresh: () => Promise<void>;
  onOpen: (id: string) => Promise<void>;
  onNew: () => Promise<void>;
  onSave: () => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const statusLabel: Record<SessionSaveStatus, string> = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved' };

export const SessionLibraryModal: React.FC<Props> = props => {
  const { isOpen, onClose, sessions, currentSessionId, saveStatus, invalidCount } = props;
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isOpen) void props.onRefresh().catch(e => setError(e.message)); }, [isOpen]);
  if (!isOpen) return null;

  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await work(); } catch (e) { setError(e instanceof Error ? e.message : 'Session action failed.'); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Session Library">
    <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div><h2 className="text-sm font-bold text-white">Session Library</h2><p className="mt-1 text-[11px] text-zinc-500">Cookups and local settings stored on this device.</p></div>
        <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex items-center justify-between border-b border-zinc-900 px-5 py-3">
        <span className="text-[11px] text-zinc-500">Current session: <b className="text-zinc-300">{statusLabel[saveStatus]}</b></span>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => void run(props.onSave)} className="flex items-center gap-1 rounded border border-zinc-700 px-2.5 py-1.5 text-[11px] hover:bg-zinc-800 disabled:opacity-50"><Save className="h-3 w-3" /> Save</button>
          <button disabled={busy} onClick={() => void run(props.onNew)} className="flex items-center gap-1 rounded bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"><Plus className="h-3 w-3" /> New Cookup</button>
        </div>
      </div>
      {error && <div className="mx-5 mt-3 rounded border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">{error}</div>}
      {invalidCount > 0 && <p className="px-5 pt-3 text-[11px] text-amber-300">{invalidCount} unreadable session{invalidCount === 1 ? '' : 's'} skipped. Other sessions are available.</p>}
      <div className="max-h-[55vh] overflow-y-auto p-3">
        {sessions.length === 0 ? <div className="p-8 text-center text-xs text-zinc-500">No saved cookups yet. Save this one or create a new cookup.</div> : sessions.map(session => <div key={session.id} className={`mb-2 rounded-lg border p-3 ${session.id === currentSessionId ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {renaming === session.id ? <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void run(async () => { await props.onRename(session.id, name); setRenaming(null); }); }}>
                <input autoFocus value={name} onChange={e => setName(e.target.value)} className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white" />
                <button className="rounded bg-zinc-700 px-2 text-[11px]">Save name</button>
              </form> : <div className="truncate text-sm font-semibold text-zinc-100">{session.name}{session.id === currentSessionId && <span className="ml-2 text-[9px] uppercase text-amber-400">Open</span>}</div>}
              <div className="mt-1 text-[10px] text-zinc-500">{session.generatorSettings.bpm} BPM · {session.generatorSettings.rootKey} {session.generatorSettings.scale.replace('_', ' ')} · {session.selectedVariation} · Modified {new Date(session.updatedAt).toLocaleString()}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button title="Open" disabled={busy} onClick={() => void run(() => props.onOpen(session.id))} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"><FolderOpen className="h-3.5 w-3.5" /></button>
              <button title="Save As / Duplicate" disabled={busy} onClick={() => void run(() => props.onDuplicate(session.id))} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
              <button title="Rename" disabled={busy} onClick={() => { setRenaming(session.id); setName(session.name); }} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
              <button title="Delete session" disabled={busy} onClick={() => { if (window.confirm(`Delete “${session.name}”? Studio Kits and samples will remain.`)) void run(() => props.onDelete(session.id)); }} className="rounded p-1.5 text-zinc-500 hover:bg-red-950 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>)}
      </div>
      <div className="border-t border-zinc-800 px-5 py-3 text-[10px] text-zinc-600">Audio sample files stay in Studio Kit storage and are not copied into sessions.</div>
    </div>
  </div>;
};
