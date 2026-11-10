import {isPlainObject} from './isPlainObject'

/** Every `localStorage` key Vision writes (classic and redesign alike) starts with this prefix */
export const VISION_STORAGE_KEY_PREFIX = 'sanityVision:'

const hasLocalStorage = supportsLocalStorage()
const clearListeners = new Set<() => void>()

export interface LocalStorageish {
  get: <T>(key: string, defaultVal: T) => T
  set: <T>(key: string, value: T) => T
  merge: <T>(props: T) => T
}

/** The `localStorage` instance when it is available and writable, `undefined` otherwise */
export function getStorage(): Storage | undefined {
  return hasLocalStorage ? globalThis.localStorage : undefined
}

/** Runs `listener` after `clearLocalStorage`, so in-memory copies of stored values can drop too */
export function onLocalStorageCleared(listener: () => void): () => void {
  clearListeners.add(listener)
  return () => {
    clearListeners.delete(listener)
  }
}

export function clearLocalStorage() {
  const storage = getStorage()
  if (storage) {
    // Collect first: removing while iterating shifts the indices and skips every other key
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(VISION_STORAGE_KEY_PREFIX)) {
        keys.push(key)
      }
    }
    keys.forEach((key) => storage.removeItem(key))
  }
  // In-memory copies exist even without a storage backend, so they are told either way
  clearListeners.forEach((listener) => listener())
}

export function getLocalStorage(namespace: string): LocalStorageish {
  const storageKey = `${VISION_STORAGE_KEY_PREFIX}${namespace}`
  let loadedState: Record<string, unknown> | null = null

  return {get, set, merge}

  function get<T>(key: string, defaultVal: T): T {
    const state = ensureState()
    return typeof state[key] === 'undefined' ? defaultVal : (state[key] as T)
  }

  function set<T>(key: string, value: T): T {
    const state = ensureState()
    state[key] = value
    localStorage.setItem(storageKey, JSON.stringify(loadedState))
    return value
  }

  function merge<T>(props: T): T {
    const state = {...ensureState(), ...props}
    localStorage.setItem(storageKey, JSON.stringify(state))
    return state
  }

  function ensureState(): Record<string, unknown> {
    if (loadedState === null) {
      loadedState = loadState()
    }

    return loadedState
  }

  function loadState() {
    if (!hasLocalStorage) {
      return {}
    }

    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
      return isPlainObject(stored) ? stored : {}
    } catch {
      return {}
    }
  }
}

function supportsLocalStorage() {
  const mod = 'lsCheck'
  try {
    localStorage.setItem(mod, mod)
    localStorage.removeItem(mod)
    return true
  } catch {
    return false
  }
}
