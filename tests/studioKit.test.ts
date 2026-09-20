import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDefaultConfig, generateFullBeat } from '../src/engine/generator';
import { recookBeat } from '../src/engine/recook';
import { samplePlaybackRate } from '../src/engine/samplePitch';
import { StudioKitAudioRuntime, StudioKitService } from '../src/engine/studioKitService';
import { StudioKitLibrary, StudioKitLane } from '../src/types';
import { IndexedDbStudioKitStorage, StudioKitStorage } from '../src/engine/studioKitStore';

class MemoryStudioKitStorage implements StudioKitStorage {
  library?: StudioKitLibrary;
  samples = new Map<string, Blob>();
  failLibrarySave = false;
  async loadLibrary() { return this.library && structuredClone(this.library); }
  async saveLibrary(value: StudioKitLibrary) {
    if (this.failLibrarySave) throw new Error('Disk write failed');
    this.library = structuredClone(value);
  }
  async saveSample(id: string, blob: Blob) { this.samples.set(id, blob); }
  async loadSample(id: string) { return this.samples.get(id); }
  async deleteSample(id: string) { this.samples.delete(id); }
}

class FakeStudioAudio implements StudioKitAudioRuntime {
  cache = new Map<string, AudioBuffer>();
  assigned = new Map<StudioKitLane, { id: string; buffer: AudioBuffer; rootMidi: number }>();
  decodeCount = 0;
  auditioned: StudioKitLane[] = [];
  clears = 0;
  clearStudioSamples() { this.assigned.clear(); this.clears++; }
  setStudioSample(lane: StudioKitLane, id: string | undefined, buffer: AudioBuffer | undefined, rootMidi = 36) {
    if (!id || !buffer) { this.assigned.delete(lane); return; }
    const cached = this.cache.get(id) ?? buffer;
    this.cache.set(id, cached);
    this.assigned.set(lane, { id, buffer: cached, rootMidi });
  }
  getStudioSampleBuffer(id: string) { return this.cache.get(id); }
  retainStudioSampleIds(ids: ReadonlySet<string>) {
    for (const id of this.cache.keys()) if (!ids.has(id)) this.cache.delete(id);
  }
  async decodeAndNormalizeSampleData(data: ArrayBuffer) {
    this.decodeCount++;
    const bytes = new Uint8Array(data);
    if (String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...bytes.slice(8, 12)) !== 'WAVE') {
      throw new Error('Audio data could not be decoded.');
    }
    return { duration: 1.25 } as AudioBuffer;
  }
  auditionStudioLane(lane: StudioKitLane) { this.auditioned.push(lane); }
}

class FakeIdbRequest<T = unknown> {
  result!: T;
  error: Error | null = null;
  onsuccess: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
}

class FakeIdbTransaction {
  oncomplete: (() => void) | null = null;
  onabort: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private pending = 0;
  constructor(private readonly stores: Map<string, Map<string, any>>) {}
  objectStore(name: string) {
    const data = this.stores.get(name)!;
    const enqueue = <T>(work: () => T) => {
      const request = new FakeIdbRequest<T>(); this.pending++;
      queueMicrotask(() => {
        try { request.result = work(); request.onsuccess?.({ target: request }); }
        catch (error) { request.error = error as Error; request.onerror?.({ target: request }); }
        this.pending--;
        if (!this.pending) setTimeout(() => this.oncomplete?.(), 0);
      });
      return request;
    };
    return {
      get: (key: string) => enqueue(() => data.get(key)),
      put: (record: any) => enqueue(() => { data.set(record.key ?? record.id, structuredClone(record)); return record.key ?? record.id; }),
      delete: (key: string) => enqueue(() => data.delete(key)),
    };
  }
}

class FakeIdbDatabase {
  private stores = new Map<string, Map<string, any>>();
  objectStoreNames = { contains: (name: string) => this.stores.has(name) };
  createObjectStore(name: string) { this.stores.set(name, new Map()); }
  transaction(name: string) { return new FakeIdbTransaction(this.stores); }
}

class FakeIndexedDBFactory {
  private db: FakeIdbDatabase | null = null;
  open() {
    const request = new FakeIdbRequest<FakeIdbDatabase>() as FakeIdbRequest<FakeIdbDatabase> & {
      onupgradeneeded: ((event: any) => void) | null;
      onblocked: (() => void) | null;
    };
    request.onupgradeneeded = null; request.onblocked = null;
    setTimeout(() => {
      const isNew = !this.db;
      if (!this.db) this.db = new FakeIdbDatabase();
      request.result = this.db;
      if (isNew) request.onupgradeneeded?.({ target: request });
      request.onsuccess?.({ target: request });
    }, 0);
    return request;
  }
}

function validWaveBytes(): Uint8Array {
  const bytes = new Uint8Array(46), view = new DataView(bytes.buffer);
  bytes.set([82,73,70,70], 0); view.setUint32(4, 38, true); bytes.set([87,65,86,69], 8);
  bytes.set([102,109,116,32], 12); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 8000, true); view.setUint32(28, 16000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); bytes.set([100,97,116,97], 36);
  view.setUint32(40, 2, true); view.setInt16(44, 1200, true);
  return bytes;
}

function fakeFile(name: string, bytes = validWaveBytes(), type = 'audio/wav', size = bytes.length): File {
  const copy = bytes.slice();
  return {
    name, type, size,
    arrayBuffer: async () => copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength),
  } as File;
}

function setup(storage = new MemoryStudioKitStorage(), audio = new FakeStudioAudio()) {
  const service = new StudioKitService(storage, audio);
  return { storage, audio, service };
}

test('valid WAV import assigns locally; replacement and clear clean up unreferenced assets', async () => {
  const { storage, audio, service } = setup();
  await service.initialize();
  const first = await service.importFile('kick', fakeFile('first.wav'));
  assert.equal(first.lane, 'kick');
  assert.equal(first.mimeType, 'audio/wav');
  assert.equal(first.sizeBytes, 46);
  assert.equal(first.durationSeconds, 1.25);
  assert.equal(audio.assigned.get('kick')?.id, first.id);
  assert.ok(await storage.loadSample(first.persistenceKey), 'original file blob is retained locally');

  const second = await service.importFile('kick', fakeFile('replacement.wav'));
  assert.notEqual(second.id, first.id);
  assert.equal(audio.assigned.get('kick')?.id, second.id);
  assert.equal(await storage.loadSample(first.persistenceKey), undefined, 'replaced binary is deleted when no kit refers to it');

  await service.clearLane('kick');
  assert.equal(service.getLibrary().kits[0].assignments.kick, undefined);
  assert.equal(audio.assigned.has('kick'), false, 'clearing restores the built-in fallback path');
  assert.equal(await storage.loadSample(second.persistenceKey), undefined);
});

test('unsupported, empty, oversized, corrupt and failed-save imports keep the previous assignment intact', async () => {
  const { storage, audio, service } = setup();
  await service.initialize();
  const existing = await service.importFile('snare', fakeFile('snare.wav'));
  const before = service.getLibrary();

  await assert.rejects(service.importFile('snare', fakeFile('wrong.mp3', undefined, 'audio/mpeg')), /WAV or AIFF/);
  await assert.rejects(service.importFile('snare', fakeFile('empty.wav', new Uint8Array(), 'audio/wav')), /empty/);
  await assert.rejects(service.importFile('snare', fakeFile('huge.wav', new Uint8Array([82,73,70,70]), 'audio/wav', 101 * 1024 * 1024)), /100 MB/);
  await assert.rejects(service.importFile('snare', fakeFile('broken.wav', new Uint8Array([0,1,2,3]))), /decoded/);
  assert.deepEqual(service.getLibrary(), before);
  assert.equal(audio.assigned.get('snare')?.id, existing.id);

  storage.failLibrarySave = true;
  await assert.rejects(service.importFile('snare', fakeFile('disk-failure.wav')), /Disk write failed/);
  storage.failLibrarySave = false;
  assert.deepEqual(service.getLibrary(), before);
  assert.equal(audio.assigned.get('snare')?.id, existing.id);
  assert.equal(storage.samples.size, 1, 'failed metadata commit removes the unreferenced uploaded bytes');
});

test('lanes remain independent, duplicates share assets, and samples survive every targeted recook', async () => {
  const { service, audio, storage } = setup();
  await service.initialize();
  const kit = await service.createKit('Slap Kit');
  const kick = await service.importFile('kick', fakeFile('kick.wav'));
  const bass = await service.importFile('bass808', fakeFile('sub.wav'));
  assert.notEqual(kick.id, bass.id);
  assert.equal(audio.assigned.get('kick')?.id, kick.id);
  assert.equal(audio.assigned.get('bass808')?.id, bass.id);
  assert.equal(bass.rootMidi, 36);

  await service.importFile('clap', fakeFile('clap.wav'));
  const libraryWithThreeLanes = service.getLibrary();
  assert.ok(libraryWithThreeLanes.kits.find(item => item.id === kit.id)?.assignments.snare === undefined);
  assert.ok(libraryWithThreeLanes.kits.find(item => item.id === kit.id)?.assignments.clap);

  const duplicate = await service.duplicateKit(kit.id);
  assert.equal(duplicate.assignments.kick?.id, kick.id, 'duplicate kits share sample IDs instead of copying binary');
  const before = service.getLibrary();
  let beat = generateFullBeat(createDefaultConfig(98421));
  for (const target of ['drums', '808', 'music'] as const) {
    beat = recookBeat(beat, target);
    assert.deepEqual(service.getLibrary(), before, `${target} recook leaves the separate Studio Kit state unchanged`);
    assert.equal(audio.assigned.get('kick')?.id, kick.id);
    assert.equal(audio.assigned.get('bass808')?.id, bass.id);
    assert.equal(audio.assigned.get('clap')?.id, libraryWithThreeLanes.kits.find(item => item.id === kit.id)?.assignments.clap?.id);
  }
  assert.equal(audio.decodeCount, 3, 'each imported sample is decoded once regardless of recooks');
  await service.selectKit(kit.id);
  await service.clearLane('kick');
  assert.ok(await storage.loadSample(kick.persistenceKey), 'a duplicate kit keeps the shared binary alive');
  await service.selectKit(duplicate.id);
  assert.equal(audio.assigned.get('kick')?.id, kick.id, 'the duplicate still restores its shared assignment');
});

test('kit save, rename, duplicate, default, select and delete operations update local metadata', async () => {
  const { service } = setup();
  await service.initialize();
  const kit = await service.createKit('Pocket');
  await service.saveKit();
  await service.renameKit(kit.id, 'Pocket v2');
  assert.equal(service.getLibrary().kits[0].name, 'Pocket v2');
  const duplicate = await service.duplicateKit(kit.id);
  await service.setDefaultKit(duplicate.id);
  assert.equal(service.getLibrary().defaultKitId, duplicate.id);
  const restoreErrors = await service.selectKit(kit.id);
  assert.deepEqual(restoreErrors, []);
  assert.equal(service.getActiveKitId(), kit.id);
  await service.deleteKit(duplicate.id);
  assert.equal(service.getLibrary().defaultKitId, null);
  await service.selectKit('');
  assert.equal(service.getActiveKitId(), null, 'built-in fallback can be selected while retaining other kits');
  assert.equal(service.getLibrary().kits.length, 1);
});

test('default kit reloads binary data and reconstructs runtime buffers from assignment references', async () => {
  const storage = new MemoryStudioKitStorage();
  const firstAudio = new FakeStudioAudio();
  const first = new StudioKitService(storage, firstAudio);
  await first.initialize();
  const kit = await first.createKit('Desktop Kit');
  const kick = await first.importFile('kick', fakeFile('local-kick.wav'));
  const bass = await first.importFile('bass808', fakeFile('local-808.wav'));
  await first.setRootMidi(40);
  await first.setDefaultKit(kit.id);
  const persisted = storage.library!;
  assert.equal(JSON.stringify(persisted).includes('duration'), true);
  assert.equal(JSON.stringify(persisted).includes('AudioBuffer'), false);
  assert.equal(persisted.kits[0].assignments.bass808?.rootMidi, 40);

  const restoredAudio = new FakeStudioAudio();
  const restored = new StudioKitService(storage, restoredAudio);
  await restored.initialize();
  assert.equal(restored.getActiveKitId(), kit.id);
  assert.equal(restoredAudio.assigned.get('kick')?.id, kick.id);
  assert.equal(restoredAudio.assigned.get('bass808')?.id, bass.id);
  assert.equal(restoredAudio.assigned.get('bass808')?.rootMidi, 40);
  assert.equal(restoredAudio.decodeCount, 2, 'reload decodes each assigned stored blob once');
  const blob = await storage.loadSample(kick.persistenceKey);
  assert.ok(blob && (await blob.arrayBuffer()).byteLength === kick.sizeBytes);
});

test('IndexedDB adapter stores kit metadata separately from retrievable original sample blobs', async () => {
  const originalIndexedDB = (globalThis as any).indexedDB;
  (globalThis as any).indexedDB = new FakeIndexedDBFactory();
  try {
    const storage = new IndexedDbStudioKitStorage();
    const library: StudioKitLibrary = { kits: [], selectedKitId: null, defaultKitId: null };
    await storage.saveLibrary(library);
    assert.deepEqual(await storage.loadLibrary(), library);
    const bytes = validWaveBytes();
    await storage.saveSample('blob-id', new Blob([bytes], { type: 'audio/wav' }));
    const stored = await storage.loadSample('blob-id');
    assert.ok(stored);
    assert.deepEqual(new Uint8Array(await stored.arrayBuffer()), bytes);
    await storage.deleteSample('blob-id');
    assert.equal(await storage.loadSample('blob-id'), undefined);
  } finally {
    if (originalIndexedDB === undefined) delete (globalThis as any).indexedDB;
    else (globalThis as any).indexedDB = originalIndexedDB;
  }
});

test('missing or corrupt stored binaries fall back safely and no-default startup uses built-in sounds', async () => {
  const storage = new MemoryStudioKitStorage();
  const initial = setup(storage);
  await initial.service.initialize();
  const kit = await initial.service.createKit('Damaged Kit');
  const kick = await initial.service.importFile('kick', fakeFile('gone.wav'));
  const bass = await initial.service.importFile('bass808', fakeFile('bad.wav'));
  await initial.service.setDefaultKit(kit.id);
  await storage.deleteSample(kick.persistenceKey);
  await storage.saveSample(bass.persistenceKey, new Blob([new Uint8Array([1,2,3,4])]));

  const restoredAudio = new FakeStudioAudio();
  const restored = new StudioKitService(storage, restoredAudio);
  await restored.initialize();
  assert.equal(restored.getActiveKitId(), kit.id);
  assert.equal(restoredAudio.assigned.size, 0, 'invalid samples are omitted so existing synthesized fallbacks play');
  assert.match(restored.getInitializationError() ?? '', /fallback sounds are active/);

  storage.library!.defaultKitId = null;
  const noDefaultAudio = new FakeStudioAudio();
  const noDefault = new StudioKitService(storage, noDefaultAudio);
  await noDefault.initialize();
  assert.equal(noDefault.getActiveKitId(), null);
  assert.equal(noDefaultAudio.assigned.size, 0);
  assert.equal(noDefaultAudio.clears, 1);
});

test('808 sample pitch follows the configured root-note interval', () => {
  assert.equal(samplePlaybackRate(36, 36), 1);
  assert.equal(samplePlaybackRate(48, 36), 2);
  assert.equal(samplePlaybackRate(24, 36), 0.5);
});
