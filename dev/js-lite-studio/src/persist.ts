/**
 * A key-value store in IndexedDB, for the replica to outlive the page: one database per project
 * and dataset, one object store with string keys. Every operation runs in a transaction of its
 * own and resolves once it committed, so callers can yield to the main thread between them; where
 * IndexedDB is unavailable (some private windows) every operation is a no-op. The same store as
 * the Rust studio's `persist.rs`.
 */

import {DATASET, PROJECT_ID} from './config'

const STORE = 'replica'

/** A write: `put` a value under a key, or `delete` every key in a range. */
export type Write = {put: string; value: unknown} | {delete: IDBKeyRange}

/** Deletes the keys starting with `prefix`. */
export function deletePrefix(prefix: string): Write {
  return {delete: IDBKeyRange.bound(prefix, `${prefix}\uffff`)}
}

/** Deletes the keys starting with `prefix`, except those starting with `keep`. */
export function deletePrefixExcept(prefix: string, keep: string): Write[] {
  return [
    {delete: IDBKeyRange.bound(prefix, keep, false, true)},
    {delete: IDBKeyRange.bound(`${keep}\uffff`, `${prefix}\uffff`, true, false)},
  ]
}

export function deleteKey(key: string): Write {
  return {delete: IDBKeyRange.only(key)}
}

/** Resolves once the transaction committed, with false when it failed or was aborted. */
function committed(transaction: IDBTransaction): Promise<boolean> {
  return new Promise((resolve) => {
    transaction.oncomplete = () => resolve(true)
    transaction.onerror = () => resolve(false)
    transaction.onabort = () => resolve(false)
  })
}

let forgotten = false

export class Db {
  private readonly db: IDBDatabase

  constructor(db: IDBDatabase) {
    this.db = db
  }

  private store(mode: IDBTransactionMode): [IDBTransaction, IDBObjectStore] | undefined {
    try {
      const transaction = this.db.transaction(STORE, mode)
      return [transaction, transaction.objectStore(STORE)]
    } catch {
      return undefined
    }
  }

  /** Every entry, in two requests. The replica writes its documents as JSON text, which
   * deserializes as a copy, and parses it chunk by chunk as it restores; objects would be rebuilt
   * here, all at once, before the restore could start. */
  entries(): Promise<[string, unknown][]> {
    const opened = this.store('readonly')
    if (!opened) return Promise.resolve([])
    return new Promise((resolve) => {
      let keys: IDBRequest<IDBValidKey[]>
      let values: IDBRequest<unknown[]>
      try {
        keys = opened[1].getAllKeys()
        values = opened[1].getAll()
      } catch {
        resolve([])
        return
      }
      values.onsuccess = () =>
        resolve(
          keys.result.flatMap((key, index): [string, unknown][] =>
            typeof key === 'string' ? [[key, values.result[index]]] : [],
          ),
        )
      opened[0].onerror = () => resolve([])
      opened[0].onabort = () => resolve([])
    })
  }

  /** Applies `writes` in one transaction; true once it committed. Serializing a value is
   * synchronous, so a caller keeps each write small and yields between them. */
  write(writes: Write[]): Promise<boolean> {
    if (forgotten) return Promise.resolve(false)
    const opened = this.store('readwrite')
    if (!opened) return Promise.resolve(false)
    const [transaction, store] = opened
    const done = committed(transaction)
    try {
      for (const write of writes) {
        if ('put' in write) store.put(write.value, write.put)
        else store.delete(write.delete)
      }
    } catch {
      transaction.abort()
    }
    return done
  }

  clear(): Promise<boolean> {
    const opened = this.store('readwrite')
    if (!opened) return Promise.resolve(false)
    const [transaction, store] = opened
    const done = committed(transaction)
    try {
      store.clear()
    } catch {
      transaction.abort()
    }
    return done
  }
}

export function open(): Promise<Db | undefined> {
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(`sanity-js-lite-studio:${PROJECT_ID}:${DATASET}`, 1)
    } catch {
      resolve(undefined)
      return
    }
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(new Db(request.result))
    request.onerror = () => resolve(undefined)
    request.onblocked = () => resolve(undefined)
  })
}

/** Deletes everything and refuses writes for the rest of the page's life, so a save still in
 * flight, or the one the page saves while it unloads, cannot bring the data back. */
export async function forget(): Promise<void> {
  forgotten = true
  const db = await open()
  await db?.clear()
}

let preloaded: Promise<[string, unknown][]> | undefined

/** Starts reading every entry, before the user is known, so the replica restores as soon as they
 * are. */
export function preload(): void {
  preloaded ??= open().then((db) => db?.entries() ?? [])
}

/** The preloaded entries, once; later calls get none. */
export async function takePreloaded(): Promise<[string, unknown][]> {
  preload()
  const entries = await preloaded!
  preloaded = Promise.resolve([])
  return entries
}
