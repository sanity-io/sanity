/** Every `localStorage` key Vision writes starts with this prefix */
export const VISION_STORAGE_KEY_PREFIX = 'sanityVision:'

const hasLocalStorage = supportsLocalStorage()
const clearListeners = new Set<() => void>()

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
