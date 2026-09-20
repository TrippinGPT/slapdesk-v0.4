import {
  StudioKit, StudioKitAssignment, StudioKitLane, StudioKitLibrary,
} from '../types';
import { audioEngine } from './audioEngine';
import { IndexedDbStudioKitStorage, StudioKitStorage } from './studioKitStore';
import { DEFAULT_808_ROOT_MIDI } from './samplePitch';

export const MAX_STUDIO_SAMPLE_BYTES = 100 * 1024 * 1024;
export interface StudioKitAudioRuntime {
  clearStudioSamples(): void;
  setStudioSample(lane: StudioKitLane, id: string | undefined, buffer: AudioBuffer | undefined, rootMidi?: number): void;
  getStudioSampleBuffer(id: string): AudioBuffer | undefined;
  retainStudioSampleIds(ids: ReadonlySet<string>): void;
  decodeAndNormalizeSampleData(data: ArrayBuffer): Promise<AudioBuffer>;
  auditionStudioLane(lane: StudioKitLane, rootMidi?: number): void;
}

export const EMPTY_STUDIO_KIT_LIBRARY: StudioKitLibrary = {
  kits: [],
  selectedKitId: null,
  defaultKitId: null,
};

function cloneLibrary(library: StudioKitLibrary): StudioKitLibrary {
  return JSON.parse(JSON.stringify(library)) as StudioKitLibrary;
}

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `sample-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function inferFileType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowed: Record<string, string> = {
    wav: 'audio/wav', wave: 'audio/wav', aif: 'audio/aiff', aiff: 'audio/aiff',
  };
  const inferred = extension ? allowed[extension] : undefined;
  const reported = file.type.toLowerCase();
  const allowedReported = new Set(['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/aiff', 'audio/x-aiff', 'audio/aifc']);
  if (!inferred || (reported && reported !== 'application/octet-stream' && !allowedReported.has(reported))) {
    throw new Error('Choose a WAV or AIFF/AIF audio file.');
  }
  return inferred;
}

function referencesIn(library: StudioKitLibrary): Set<string> {
  return new Set(library.kits.flatMap(kit =>
    Object.values(kit.assignments).filter((value): value is StudioKitAssignment => !!value)
      .map(assignment => assignment.persistenceKey)
  ));
}

/** Owns kit metadata and binary references; AudioBuffers never enter saved state. */
export class StudioKitService {
  private library = cloneLibrary(EMPTY_STUDIO_KIT_LIBRARY);
  private initializeTask: Promise<void> | null = null;
  private activeKitId: string | null = null;
  private initializationError: string | null = null;
  private restoreWarning: string | null = null;

  constructor(
    private readonly storage: StudioKitStorage,
    private readonly audio: StudioKitAudioRuntime
  ) {}

  initialize(): Promise<void> {
    if (this.initializeTask) return this.initializeTask;
    this.initializeTask = this.loadSavedLibrary();
    return this.initializeTask;
  }

  private async loadSavedLibrary(): Promise<void> {
    try {
      this.library = await this.storage.loadLibrary() ?? cloneLibrary(EMPTY_STUDIO_KIT_LIBRARY);
      const defaultKit = this.library.kits.find(kit => kit.id === this.library.defaultKitId);
      if (defaultKit) {
        this.library.selectedKitId = defaultKit.id;
        await this.activateKit(defaultKit);
      } else {
        // The explicit startup default is the built-in synthesis when no kit is marked default.
        this.activeKitId = null;
        this.audio.clearStudioSamples();
      }
      this.audio.retainStudioSampleIds(referencesIn(this.library));
    } catch (error) {
      this.initializationError = error instanceof Error ? error.message : 'Could not restore Studio Kit.';
      this.library = cloneLibrary(EMPTY_STUDIO_KIT_LIBRARY);
      this.activeKitId = null;
      this.audio.clearStudioSamples();
    }
  }

  getLibrary(): StudioKitLibrary {
    return cloneLibrary(this.library);
  }

  getActiveKitId(): string | null {
    return this.activeKitId;
  }

  getInitializationError(): string | null {
    return this.initializationError ?? this.restoreWarning;
  }

  private async ensureInitialized() {
    await this.initialize();
    if (this.initializationError) throw new Error(this.initializationError);
  }

  private async persist(next: StudioKitLibrary): Promise<void> {
    await this.storage.saveLibrary(next);
    this.library = next;
  }

  private async removeUnreferencedSamples(before: StudioKitLibrary, after: StudioKitLibrary) {
    const afterRefs = referencesIn(after);
    this.audio.retainStudioSampleIds(afterRefs);
    for (const id of referencesIn(before)) {
      if (!afterRefs.has(id)) await this.storage.deleteSample(id);
    }
  }

  private async activateKit(kit: StudioKit | undefined): Promise<string[]> {
    if (!kit) {
      this.audio.clearStudioSamples();
      this.activeKitId = null;
      this.restoreWarning = null;
      return [];
    }
    const decoded: Array<{ assignment: StudioKitAssignment; buffer: AudioBuffer }> = [];
    const errors: string[] = [];
    for (const assignment of Object.values(kit.assignments)) {
      if (!assignment) continue;
      try {
        let buffer = this.audio.getStudioSampleBuffer(assignment.id);
        if (!buffer) {
          const blob = await this.storage.loadSample(assignment.persistenceKey);
          if (!blob) throw new Error('stored audio file is missing');
          buffer = await this.audio.decodeAndNormalizeSampleData(await blob.arrayBuffer());
        }
        decoded.push({ assignment, buffer });
      } catch (error) {
        errors.push(`${assignment.filename}: ${error instanceof Error ? error.message : 'could not restore audio'}`);
      }
    }
    this.audio.clearStudioSamples();
    for (const { assignment, buffer } of decoded) {
      this.audio.setStudioSample(assignment.lane, assignment.id, buffer, assignment.rootMidi);
    }
    this.activeKitId = kit.id;
    this.restoreWarning = errors.length
      ? `Some samples could not be restored; fallback sounds are active. ${errors.join('; ')}`
      : null;
    return errors;
  }

  async selectKit(id: string): Promise<string[]> {
    await this.ensureInitialized();
    if (!id) {
      const next = { ...this.library, selectedKitId: null };
      await this.persist(next);
      this.audio.clearStudioSamples();
      this.audio.retainStudioSampleIds(referencesIn(next));
      this.activeKitId = null;
      this.restoreWarning = null;
      return [];
    }
    const kit = this.library.kits.find(candidate => candidate.id === id);
    if (!kit) throw new Error('That kit no longer exists.');
    const next = { ...this.library, selectedKitId: id };
    await this.persist(next);
    return this.activateKit(kit);
  }

  async createKit(name = 'New Kit'): Promise<StudioKit> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const kit: StudioKit = { id: makeId(), name: name.trim() || 'New Kit', createdAt: now, updatedAt: now, assignments: {} };
    const next = { ...this.library, kits: [...this.library.kits, kit], selectedKitId: kit.id };
    await this.persist(next);
    await this.activateKit(kit);
    return kit;
  }

  async saveKit(): Promise<void> {
    await this.ensureInitialized();
    const kit = this.library.kits.find(candidate => candidate.id === this.activeKitId);
    if (!kit) throw new Error('Create or select a kit before saving.');
    const updated = { ...kit, updatedAt: new Date().toISOString() };
    await this.persist({ ...this.library, kits: this.library.kits.map(candidate => candidate.id === kit.id ? updated : candidate) });
  }

  async renameKit(id: string, name: string): Promise<void> {
    await this.ensureInitialized();
    const value = name.trim();
    if (!value) throw new Error('Kit name cannot be empty.');
    if (!this.library.kits.some(kit => kit.id === id)) throw new Error('That kit no longer exists.');
    await this.persist({
      ...this.library,
      kits: this.library.kits.map(kit => kit.id === id ? { ...kit, name: value, updatedAt: new Date().toISOString() } : kit),
    });
  }

  async duplicateKit(id: string): Promise<StudioKit> {
    await this.ensureInitialized();
    const source = this.library.kits.find(kit => kit.id === id);
    if (!source) throw new Error('That kit no longer exists.');
    const now = new Date().toISOString();
    const duplicate: StudioKit = { ...source, id: makeId(), name: `${source.name} Copy`, createdAt: now, updatedAt: now,
      assignments: { ...source.assignments } };
    await this.persist({ ...this.library, kits: [...this.library.kits, duplicate], selectedKitId: duplicate.id });
    await this.activateKit(duplicate);
    return duplicate;
  }

  async setDefaultKit(id: string): Promise<string[]> {
    await this.ensureInitialized();
    const kit = this.library.kits.find(candidate => candidate.id === id);
    if (!kit) throw new Error('That kit no longer exists.');
    await this.persist({ ...this.library, defaultKitId: id, selectedKitId: id });
    return this.activateKit(kit);
  }

  async deleteKit(id: string): Promise<void> {
    await this.ensureInitialized();
    const before = this.library;
    const kits = before.kits.filter(kit => kit.id !== id);
    if (kits.length === before.kits.length) return;
    const defaultKitId = before.defaultKitId === id ? null : before.defaultKitId;
    const nextActiveId = this.activeKitId === id ? (defaultKitId ?? null) : this.activeKitId;
    const next: StudioKitLibrary = {
      ...before, kits, defaultKitId: defaultKitId ?? null,
      selectedKitId: before.selectedKitId === id ? nextActiveId : before.selectedKitId,
    };
    await this.persist(next);
    const activate = kits.find(kit => kit.id === nextActiveId);
    if (this.activeKitId === id) await this.activateKit(activate);
    await this.removeUnreferencedSamples(before, next);
  }

  async importFile(lane: StudioKitLane, file: File): Promise<StudioKitAssignment> {
    await this.ensureInitialized();
    const mimeType = inferFileType(file);
    if (file.size <= 0) throw new Error('The selected file is empty.');
    if (file.size > MAX_STUDIO_SAMPLE_BYTES) throw new Error('Sample files must be 100 MB or smaller.');
    let kit = this.library.kits.find(candidate => candidate.id === this.activeKitId);
    const bytes = await file.arrayBuffer();
    // Decode first. A bad or unsupported file leaves the current assignment intact.
    const buffer = await this.audio.decodeAndNormalizeSampleData(bytes.slice(0));
    if (!kit) kit = await this.createKit('My Kit');
    const id = makeId();
    const existing = kit.assignments[lane];
    const assignment: StudioKitAssignment = {
      id, lane, filename: file.name, mimeType, sizeBytes: file.size,
      durationSeconds: buffer.duration,
      ...(lane === 'bass808' ? { rootMidi: existing?.rootMidi ?? DEFAULT_808_ROOT_MIDI } : {}),
      persistenceKey: id, importedAt: new Date().toISOString(),
    };
    const before = this.library;
    const updatedKit: StudioKit = { ...kit, updatedAt: new Date().toISOString(),
      assignments: { ...kit.assignments, [lane]: assignment } };
    const next: StudioKitLibrary = {
      ...before,
      kits: before.kits.some(candidate => candidate.id === kit!.id)
        ? before.kits.map(candidate => candidate.id === kit!.id ? updatedKit : candidate)
        : [...before.kits, updatedKit],
      selectedKitId: kit.id,
    };
    await this.storage.saveSample(id, new Blob([bytes], { type: mimeType }));
    try {
      await this.storage.saveLibrary(next);
    } catch (error) {
      await this.storage.deleteSample(id).catch(() => undefined);
      throw error;
    }
    this.library = next;
    if (this.activeKitId === kit.id) {
      this.audio.setStudioSample(lane, id, buffer, assignment.rootMidi);
      await this.activateKit(updatedKit);
    }
    await this.removeUnreferencedSamples(before, next);
    return assignment;
  }

  async clearLane(lane: StudioKitLane): Promise<void> {
    await this.ensureInitialized();
    const kit = this.library.kits.find(candidate => candidate.id === this.activeKitId);
    if (!kit?.assignments[lane]) return;
    const before = this.library;
    const assignments = { ...kit.assignments };
    delete assignments[lane];
    const updatedKit = { ...kit, assignments, updatedAt: new Date().toISOString() };
    const next = { ...before, kits: before.kits.map(candidate => candidate.id === kit.id ? updatedKit : candidate) };
    await this.persist(next);
    this.audio.setStudioSample(lane, undefined, undefined);
    await this.activateKit(updatedKit);
    await this.removeUnreferencedSamples(before, next);
  }

  async setRootMidi(value: number): Promise<void> {
    await this.ensureInitialized();
    const rootMidi = Math.round(value);
    if (rootMidi < 0 || rootMidi > 127) throw new Error('Root MIDI note must be between 0 and 127.');
    const kit = this.library.kits.find(candidate => candidate.id === this.activeKitId);
    const assignment = kit?.assignments.bass808;
    if (!kit || !assignment) throw new Error('Load an 808 sample before setting its root note.');
    const updatedAssignment = { ...assignment, rootMidi };
    const updatedKit = { ...kit, updatedAt: new Date().toISOString(), assignments: { ...kit.assignments, bass808: updatedAssignment } };
    const next = { ...this.library, kits: this.library.kits.map(candidate => candidate.id === kit.id ? updatedKit : candidate) };
    await this.persist(next);
    const buffer = this.audio.getStudioSampleBuffer(assignment.id);
    if (buffer) this.audio.setStudioSample('bass808', assignment.id, buffer, rootMidi);
  }

  async audition(lane: StudioKitLane): Promise<void> {
    await this.ensureInitialized();
    const kit = this.library.kits.find(candidate => candidate.id === this.activeKitId);
    this.audio.auditionStudioLane(lane, lane === 'bass808' ? kit?.assignments.bass808?.rootMidi ?? DEFAULT_808_ROOT_MIDI : undefined);
  }
}

export const studioKitService = new StudioKitService(new IndexedDbStudioKitStorage(), audioEngine);
