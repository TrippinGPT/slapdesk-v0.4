import { StudioKitLibrary } from '../types';

const DATABASE_NAME = 'slapdesk-studio-kit';
const DATABASE_VERSION = 2;
const LIBRARY_STORE = 'library';
const SAMPLE_STORE = 'samples';
const SESSION_STORE = 'sessions';
const SESSION_META_STORE = 'sessionMeta';

let sharedDatabase: Promise<IDBDatabase> | null = null;
export function openSlapDeskDatabase(): Promise<IDBDatabase> {
  if (sharedDatabase) return sharedDatabase;
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Local browser storage is unavailable.'));
  sharedDatabase = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LIBRARY_STORE)) db.createObjectStore(LIBRARY_STORE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(SAMPLE_STORE)) db.createObjectStore(SAMPLE_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(SESSION_STORE)) db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(SESSION_META_STORE)) db.createObjectStore(SESSION_META_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local SlapDesk storage.'));
    request.onblocked = () => reject(new Error('Local SlapDesk storage is busy in another tab.'));
  }).catch(error => {
    sharedDatabase = null;
    throw error;
  });
  return sharedDatabase;
}

export interface StudioKitStorage {
  loadLibrary(): Promise<StudioKitLibrary | undefined>;
  saveLibrary(library: StudioKitLibrary): Promise<void>;
  saveSample(id: string, blob: Blob): Promise<void>;
  loadSample(id: string): Promise<Blob | undefined>;
  deleteSample(id: string): Promise<void>;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
}

/** Binary sample files and serializable kit references use separate object stores. */
export class IndexedDbStudioKitStorage implements StudioKitStorage {
  async loadLibrary(): Promise<StudioKitLibrary | undefined> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction(LIBRARY_STORE, 'readonly');
    const done = transactionDone(tx);
    const record = await requestResult<{ key: string; value: StudioKitLibrary } | undefined>(tx.objectStore(LIBRARY_STORE).get('current'));
    await done;
    return record?.value;
  }

  async saveLibrary(library: StudioKitLibrary): Promise<void> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction(LIBRARY_STORE, 'readwrite');
    const done = transactionDone(tx);
    tx.objectStore(LIBRARY_STORE).put({ key: 'current', value: library });
    await done;
  }

  async saveSample(id: string, blob: Blob): Promise<void> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction(SAMPLE_STORE, 'readwrite');
    const done = transactionDone(tx);
    tx.objectStore(SAMPLE_STORE).put({ id, blob });
    await done;
  }

  async loadSample(id: string): Promise<Blob | undefined> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction(SAMPLE_STORE, 'readonly');
    const done = transactionDone(tx);
    const record = await requestResult<{ id: string; blob: Blob } | undefined>(tx.objectStore(SAMPLE_STORE).get(id));
    await done;
    return record?.blob;
  }

  async deleteSample(id: string): Promise<void> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction(SAMPLE_STORE, 'readwrite');
    const done = transactionDone(tx);
    tx.objectStore(SAMPLE_STORE).delete(id);
    await done;
  }
}
