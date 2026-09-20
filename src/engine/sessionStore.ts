import { SlapDeskSession } from './sessionTypes';
import { openSlapDeskDatabase } from './studioKitStore';

export interface SessionStorage {
  list(): Promise<unknown[]>;
  get(id: string): Promise<unknown | undefined>;
  save(session: SlapDeskSession): Promise<void>;
  delete(id: string): Promise<void>;
  getLastOpenedId(): Promise<string | null>;
  setLastOpenedId(id: string | null): Promise<void>;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Session storage request failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Session storage transaction aborted.'));
    tx.onerror = () => reject(tx.error ?? new Error('Session storage transaction failed.'));
  });
}

export class IndexedDbSessionStorage implements SessionStorage {
  async list(): Promise<unknown[]> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction('sessions', 'readonly');
    const done = transactionDone(tx);
    const rows = await requestResult<unknown[]>(tx.objectStore('sessions').getAll());
    await done;
    return rows;
  }
  async get(id: string): Promise<unknown | undefined> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction('sessions', 'readonly');
    const done = transactionDone(tx);
    const row = await requestResult<unknown>(tx.objectStore('sessions').get(id));
    await done;
    return row;
  }
  async save(session: SlapDeskSession): Promise<void> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction('sessions', 'readwrite');
    const done = transactionDone(tx);
    tx.objectStore('sessions').put(session);
    await done;
  }
  async delete(id: string): Promise<void> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction(['sessions', 'sessionMeta'], 'readwrite');
    const done = transactionDone(tx);
    tx.objectStore('sessions').delete(id);
    const meta = tx.objectStore('sessionMeta');
    const get = meta.get('last-opened');
    get.onsuccess = () => { if (get.result?.value === id) meta.put({ key: 'last-opened', value: null }); };
    await done;
  }
  async getLastOpenedId(): Promise<string | null> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction('sessionMeta', 'readonly');
    const done = transactionDone(tx);
    const row = await requestResult<{ key: string; value: string | null } | undefined>(tx.objectStore('sessionMeta').get('last-opened'));
    await done;
    return row?.value ?? null;
  }
  async setLastOpenedId(id: string | null): Promise<void> {
    const db = await openSlapDeskDatabase();
    const tx = db.transaction('sessionMeta', 'readwrite');
    const done = transactionDone(tx);
    tx.objectStore('sessionMeta').put({ key: 'last-opened', value: id });
    await done;
  }
}
