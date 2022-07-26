import {isPlainObject} from './isPlainObject'

const hasLocalStorage = supportsLocalStorage()

export interface LocalStorageish {
  get: <T>(key: string, defaultVal: T) => T
  set: <T>(key: string, value: T) => T
  merge: <T>(props: T) => T
}

export function getLocalStorage(namespace: string): LocalStorageish {
  const storageKey = `sanityVision:${namespace}`
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
    } catch (err) {
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
  } catch (err) {
    return false
  }
}
