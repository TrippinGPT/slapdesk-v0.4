import { BeatData, BeatConfig } from '../types';
import { migrateSession } from './sessionMigration';
import { IndexedDbSessionStorage, SessionStorage } from './sessionStore';
import { SESSION_SCHEMA_VERSION, SlapDeskSession, VariationId } from './sessionTypes';

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function sessionId(): string { return globalThis.crypto?.randomUUID?.() ?? `cookup-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function sessionName(config: BeatConfig): string { return `${config.rootKey} ${config.scale.replace('_', ' ')} Cookup`; }

export interface SessionStateSnapshot {
  config: BeatConfig;
  beatData: BeatData;
  masterVolume: number;
  studioKitReference: string | null;
  referenceDNA?: import('../types').ReferenceDNA;
  variations?: Partial<Record<VariationId, BeatData>>;
  keepState?: Record<string, boolean>;
}

export class SessionService {
  constructor(private readonly storage: SessionStorage) {}

  async list(): Promise<{ sessions: SlapDeskSession[]; invalidCount: number }> {
    const records = await this.storage.list();
    const sessions: SlapDeskSession[] = [];
    let invalidCount = 0;
    for (const raw of records) {
      try { sessions.push(migrateSession(raw)); } catch { invalidCount++; }
    }
    sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { sessions, invalidCount };
  }

  async load(id: string): Promise<SlapDeskSession> {
    const raw = await this.storage.get(id);
    if (!raw) throw new Error('That session is no longer available.');
    const session = migrateSession(raw);
    await this.storage.setLastOpenedId(id);
    return clone(session);
  }

  async getLastOpened(): Promise<SlapDeskSession | undefined> {
    const id = await this.storage.getLastOpenedId();
    if (!id) return undefined;
    try { return await this.load(id); } catch { return undefined; }
  }

  async saveCurrent(existing: SlapDeskSession | null, snapshot: SessionStateSnapshot, name?: string): Promise<SlapDeskSession> {
    const now = new Date().toISOString();
    const id = existing?.id ?? sessionId();
    const createdAt = existing?.createdAt ?? now;
    const activeBeat = clone(snapshot.beatData);
    const persistentConfig = clone(snapshot.beatData.config);
    const selectedVariation = persistentConfig.variation as VariationId;
    activeBeat.config = persistentConfig;
    if (snapshot.referenceDNA) activeBeat.referenceDNA = clone(snapshot.referenceDNA);
    else delete activeBeat.referenceDNA;
    const variations = { ...(existing?.variations ?? {}), ...(snapshot.variations ? clone(snapshot.variations) : {}), [selectedVariation]: activeBeat };
    const session: SlapDeskSession = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      id,
      name: name?.trim() || existing?.name || sessionName(snapshot.config),
      createdAt,
      updatedAt: now,
      generatorSettings: persistentConfig,
      variations,
      selectedVariation,
      ...((snapshot.referenceDNA ?? snapshot.beatData.referenceDNA) ? { referenceDNA: clone(snapshot.referenceDNA ?? snapshot.beatData.referenceDNA!) } : {}),
      masterVolume: snapshot.masterVolume,
      studioKitReference: snapshot.studioKitReference,
      keepState: clone(snapshot.keepState ?? existing?.keepState ?? {}),
    };
    await this.storage.save(session);
    await this.storage.setLastOpenedId(id);
    return session;
  }

  async createDuplicate(source: SlapDeskSession, name = `${source.name} Copy`): Promise<SlapDeskSession> {
    const now = new Date().toISOString();
    const duplicate: SlapDeskSession = {
      ...clone(source), id: sessionId(), name: name.trim() || `${source.name} Copy`, createdAt: now, updatedAt: now,
    };
    await this.storage.save(duplicate);
    return duplicate;
  }

  async rename(id: string, name: string): Promise<SlapDeskSession> {
    const value = name.trim();
    if (!value) throw new Error('Session name cannot be empty.');
    const session = migrateSession(await this.storage.get(id));
    const updated = { ...session, name: value, updatedAt: new Date().toISOString() };
    await this.storage.save(updated);
    return updated;
  }

  async delete(id: string): Promise<void> { await this.storage.delete(id); }
}

export const sessionService = new SessionService(new IndexedDbSessionStorage());
