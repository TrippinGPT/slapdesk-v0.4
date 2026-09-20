import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BeatData, StudioKitLibrary } from '../src/types';
import { createDefaultConfig, generateFullBeat } from '../src/engine/generator';
import { recookBeat } from '../src/engine/recook';
import { generateMidiFile } from '../src/engine/midiWriter';
import { migrateSession, InvalidSessionError } from '../src/engine/sessionMigration';
import { SessionService } from '../src/engine/sessionService';
import { SESSION_SCHEMA_VERSION, SlapDeskSession } from '../src/engine/sessionTypes';
import { IndexedDbSessionStorage, SessionStorage } from '../src/engine/sessionStore';
import { isTrackAudible } from '../src/engine/playbackMix';
import { IndexedDbStudioKitStorage } from '../src/engine/studioKitStore';

class MemorySessions implements SessionStorage {
  rows = new Map<string, unknown>();
  last: string | null = null;
  async list() { return [...this.rows.values()].map(value => structuredClone(value)); }
  async get(id: string) { const value = this.rows.get(id); return value === undefined ? undefined : structuredClone(value); }
  async save(session: SlapDeskSession) { this.rows.set(session.id, structuredClone(session)); }
  async delete(id: string) { this.rows.delete(id); if (this.last === id) this.last = null; }
  async getLastOpenedId() { return this.last; }
  async setLastOpenedId(id: string | null) { this.last = id; }
}

function setupBeat(): BeatData {
  const config = createDefaultConfig(876543);
  return generateFullBeat(config);
}

function midiFingerprint(beat: BeatData): string {
  return Buffer.from(generateMidiFile(beat)).toString('hex');
}

test('create, modify, save, clear runtime and reload restores the complete active cookup without generation', async () => {
  const storage = new MemorySessions();
  const service = new SessionService(storage);
  let beat = setupBeat();
  beat.tracks.kick.volume = 0.42;
  beat.tracks.kick.pan = -0.8;
  beat.tracks.kick.muted = true;
  beat.tracks.keys.enabled = false;
  beat.tracks.snare.disabledBars = [1, 6];
  beat = recookBeat(beat, 'drums');
  const config = { ...beat.config, swing: 61, darkness: 34, vocalSpace: 73 };
  beat.config = config;
  beat.tracks.melody.notes[0].velocity = 87;
  const originalMidi = midiFingerprint(beat);
  const session = await service.saveCurrent(null, {
    config, beatData: beat, masterVolume: 0.71, studioKitReference: 'kit-reference-1',
    keepState: { V1: true, V2: false },
  });

  const newServiceInstance = new SessionService(storage);
  const restored = await newServiceInstance.getLastOpened();
  assert.ok(restored);
  assert.equal(restored.id, session.id);
  assert.equal(restored.schemaVersion, SESSION_SCHEMA_VERSION);
  assert.equal(restored.selectedVariation, 'V1');
  assert.deepEqual(restored.generatorSettings, config);
  assert.deepEqual(restored.variations.V1?.tracks, migrateSession(session).variations.V1?.tracks);
  assert.deepEqual(restored.variations.V1?.barStructure, beat.barStructure);
  assert.deepEqual(restored.variations.V1?.recookCounts, beat.recookCounts);
  assert.equal(restored.masterVolume, 0.71);
  assert.deepEqual(restored.keepState, { V1: true, V2: false });
  assert.equal(restored.studioKitReference, 'kit-reference-1');
  assert.equal(midiFingerprint(restored.variations.V1!), originalMidi, 'save and load preserve exported MIDI bytes');
  assert.equal(storage.last, session.id);
});

test('targeted recooks after restore replace only their lane events and preserve user settings and kit reference', async () => {
  const storage = new MemorySessions();
  const service = new SessionService(storage);
  const beat = setupBeat();
  beat.tracks.kick.volume = 0.51;
  beat.tracks.bass808.pan = 0.6;
  beat.tracks.melody.muted = true;
  beat.tracks.hihat.disabledBars = [0, 4];
  beat.tracks.keys.enabled = false;
  const session = await service.saveCurrent(null, {
    config: beat.config, beatData: beat, masterVolume: 0.85, studioKitReference: 'shared-kit',
  });
  let reloaded = await service.load(session.id);
  let current = reloaded.variations[reloaded.selectedVariation]!;
  assert.equal(current.config.swing, beat.config.swing);
  assert.equal(isTrackAudible(current.tracks, 'kick', 0), true);
  assert.equal(isTrackAudible(current.tracks, 'keys', 0), false, 'disabled lane remains disabled in playback mix');
  assert.equal(isTrackAudible(current.tracks, 'melody', 0), false, 'muted lane remains muted in playback mix');
  const settings = structuredClone(current.tracks);
  const kitReference = reloaded.studioKitReference;
  for (const [target, laneIds] of [
    ['drums', ['kick', 'snare', 'hihat']], ['808', ['bass808']], ['music', ['melody', 'keys']],
  ] as const) {
    const before = structuredClone(current);
    current = recookBeat(current, target);
    for (const id of laneIds) {
      if (before.tracks[id].notes.length) assert.notDeepEqual(current.tracks[id].notes, before.tracks[id].notes, `${target} actually changes ${id} after restore`);
    }
    for (const id of ['melody', 'keys', 'bass808', 'kick', 'snare', 'hihat'] as const) {
      if (!(laneIds as readonly string[]).includes(id)) assert.deepEqual(current.tracks[id].notes, before.tracks[id].notes, `${target} leaves ${id} events intact`);
      assert.equal(current.tracks[id].volume, settings[id].volume);
      assert.equal(current.tracks[id].pan, settings[id].pan);
      assert.equal(current.tracks[id].muted, settings[id].muted);
      assert.equal(current.tracks[id].enabled, settings[id].enabled);
      assert.deepEqual(current.tracks[id].disabledBars, settings[id].disabledBars);
    }
    assert.equal(reloaded.studioKitReference, kitReference);
    reloaded = await service.saveCurrent(reloaded, {
      config: current.config, beatData: current, masterVolume: reloaded.masterVolume,
      studioKitReference: reloaded.studioKitReference,
    }).then(saved => service.load(saved.id));
    current = reloaded.variations[reloaded.selectedVariation]!;
    assert.ok(current.recookCounts?.[target], `${target} lineage survives the next serialized reload`);
  }
});

test('save updates the selected variation while retaining other cooked variation snapshots', async () => {
  const storage = new MemorySessions();
  const service = new SessionService(storage);
  const v1 = setupBeat();
  const v2Config = { ...v1.config, variation: 'V2' as const };
  const v3Config = { ...v1.config, variation: 'V3' as const };
  const v2 = generateFullBeat(v2Config);
  const v3 = generateFullBeat(v3Config);
  const created = await service.saveCurrent(null, { config: v1.config, beatData: v1, masterVolume: 0.85, studioKitReference: null, variations: { V1: v1, V2: v2, V3: v3 } });
  const editedV1 = structuredClone(v1);
  editedV1.tracks.keys.notes[0] && (editedV1.tracks.keys.notes[0].velocity = 77);
  await service.saveCurrent(created, { config: v1.config, beatData: editedV1, masterVolume: 0.85, studioKitReference: null });
  const loaded = await service.load(created.id);
  assert.deepEqual(loaded.variations.V1?.tracks.keys.notes, editedV1.tracks.keys.notes);
  assert.deepEqual(loaded.variations.V2?.tracks.keys.notes, v2.tracks.keys.notes);
  assert.deepEqual(loaded.variations.V3?.tracks.keys.notes, v3.tracks.keys.notes);
  assert.equal(loaded.selectedVariation, 'V1');
});

test('session library supports list, most-recent sorting, rename, duplicate and isolated delete', async () => {
  const storage = new MemorySessions();
  const service = new SessionService(storage);
  const beat = setupBeat();
  const first = await service.saveCurrent(null, { config: beat.config, beatData: beat, masterVolume: 0.85, studioKitReference: 'kit-a' });
  await new Promise(resolve => setTimeout(resolve, 3));
  const second = await service.saveCurrent(null, { config: beat.config, beatData: beat, masterVolume: 0.85, studioKitReference: 'kit-a' });
  const renamed = await service.rename(first.id, 'Midnight E Minor');
  assert.equal(renamed.name, 'Midnight E Minor');
  await new Promise(resolve => setTimeout(resolve, 3));
  const duplicate = await service.createDuplicate(renamed);
  assert.notEqual(duplicate.id, renamed.id);
  assert.notEqual(duplicate.createdAt, renamed.createdAt);
  assert.deepEqual(duplicate.variations, renamed.variations);
  assert.equal(duplicate.studioKitReference, 'kit-a');
  const listed = await service.list();
  assert.equal(listed.invalidCount, 0);
  assert.equal(listed.sessions[0].id, duplicate.id);
  await service.delete(renamed.id);
  assert.ok(await service.load(second.id));
  assert.ok(await service.load(duplicate.id));
  assert.equal(storage.last, duplicate.id, 'deleting another session keeps last-open pointer untouched');
});

test('malformed and future-schema sessions are skipped without hiding valid sessions; optional track fields get defaults', async () => {
  const storage = new MemorySessions();
  const service = new SessionService(storage);
  const beat = setupBeat();
  const valid = await service.saveCurrent(null, { config: beat.config, beatData: beat, masterVolume: 0.85, studioKitReference: null });
  const optional = structuredClone(valid) as any;
  optional.id = 'optional-fields';
  optional.variations.V1.tracks.kick.volume = undefined;
  optional.variations.V1.tracks.kick.pan = undefined;
  optional.variations.V1.tracks.kick.disabledBars = undefined;
  storage.rows.set(optional.id, optional);
  storage.rows.set('future-schema', { ...valid, id: 'future-schema', schemaVersion: 99 });
  storage.rows.set('broken', { id: 'broken', schemaVersion: 1 });
  const listed = await service.list();
  assert.equal(listed.sessions.length, 2);
  assert.equal(listed.invalidCount, 2);
  const restored = await service.load('optional-fields');
  assert.equal(restored.variations.V1?.tracks.kick.volume, 1);
  assert.equal(restored.variations.V1?.tracks.kick.pan, 0);
  assert.deepEqual(restored.variations.V1?.tracks.kick.disabledBars, []);
  await assert.rejects(service.load('future-schema'), InvalidSessionError);
});

test('missing kit or sample remains a reference-only concern; saved events and MIDI remain available', async () => {
  const storage = new MemorySessions();
  const service = new SessionService(storage);
  const beat = setupBeat();
  const session = await service.saveCurrent(null, { config: beat.config, beatData: beat, masterVolume: 0.85, studioKitReference: 'deleted-kit-id' });
  const loaded = await service.load(session.id);
  assert.equal(loaded.studioKitReference, 'deleted-kit-id');
  assert.deepEqual(loaded.variations.V1?.tracks, migrateSession(await storage.get(session.id)).variations.V1?.tracks);
  assert.equal(midiFingerprint(loaded.variations.V1!), midiFingerprint(beat));
});

class IdRequest<T> { result!: T; error: Error | null = null; onsuccess: ((event: any) => void) | null = null; onerror: ((event: any) => void) | null = null; }
class IdTransaction {
  oncomplete: (() => void) | null = null; onabort: (() => void) | null = null; onerror: (() => void) | null = null; pending = 0;
  constructor(private stores: Map<string, Map<string, any>>) {}
  objectStore(name: string) {
    const map = this.stores.get(name)!;
    const work = <T>(fn: () => T) => { const request = new IdRequest<T>(); this.pending++; queueMicrotask(() => { try { request.result = fn(); request.onsuccess?.({}); } catch (error) { request.error = error as Error; request.onerror?.({}); } if (--this.pending === 0) setTimeout(() => this.oncomplete?.(), 0); }); return request; };
    return { get: (key: string) => work(() => structuredClone(map.get(key))), getAll: () => work(() => [...map.values()].map(value => structuredClone(value))), put: (v: any) => work(() => { map.set(v.id ?? v.key, structuredClone(v)); return v.id ?? v.key; }), delete: (key: string) => work(() => map.delete(key)) };
  }
}
class IdDatabase {
  stores = new Map<string, Map<string, any>>();
  objectStoreNames = { contains: (name: string) => this.stores.has(name) };
  createObjectStore(name: string) { this.stores.set(name, new Map()); }
  transaction() { return new IdTransaction(this.stores); }
}
class IdFactory {
  db: IdDatabase | null = null;
  open() { const req = new IdRequest<IdDatabase>() as IdRequest<IdDatabase> & { onupgradeneeded: (() => void) | null; onblocked: (() => void) | null }; req.onupgradeneeded = null; req.onblocked = null; setTimeout(() => { const fresh = !this.db; this.db ??= new IdDatabase(); req.result = this.db; if (fresh) req.onupgradeneeded?.(); req.onsuccess?.({}); }, 0); return req; }
}

test('IndexedDB session adapter stores records and last-open metadata in the shared database', async () => {
  const old = (globalThis as any).indexedDB;
  (globalThis as any).indexedDB = new IdFactory();
  try {
    const store = new IndexedDbSessionStorage();
    const kitStore = new IndexedDbStudioKitStorage();
    const service = new SessionService(store);
    const beat = setupBeat();
    const kitLibrary: StudioKitLibrary = { kits: [{ id: 'shared', name: 'Shared', createdAt: 'a', updatedAt: 'a', assignments: {} }], selectedKitId: 'shared', defaultKitId: 'shared' };
    await kitStore.saveLibrary(kitLibrary);
    await kitStore.saveSample('sample-shared', new Blob(['sample-data'], { type: 'audio/wav' }));
    const session = await service.saveCurrent(null, { config: beat.config, beatData: beat, masterVolume: 0.85, studioKitReference: 'shared' });
    assert.equal((await service.list()).sessions[0].id, session.id);
    assert.equal((await service.getLastOpened())?.id, session.id);
    await service.delete(session.id);
    assert.deepEqual(await store.list(), []);
    assert.deepEqual(await kitStore.loadLibrary(), kitLibrary, 'deleting a session cannot delete the shared kit library');
    assert.equal(await (await kitStore.loadSample('sample-shared'))?.text(), 'sample-data', 'sample binaries remain outside session deletion');
  } finally {
    if (old === undefined) delete (globalThis as any).indexedDB;
    else (globalThis as any).indexedDB = old;
  }
});
