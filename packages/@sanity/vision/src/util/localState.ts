import {isPlainObject} from './isPlainObject'

const storageKey = 'sanityVision'
const defaultState: Record<string, any> = {}
const hasLocalStorage = supportsLocalStorage()
let state: Record<string, any> | null = null

export function getState(key: string, defaultVal?: any): any {
  ensureState()

  if (!state) {
    return defaultVal
  }

  return typeof state[key] === 'undefined' ? defaultVal : state[key]
}

export function storeState(key: string, value: unknown): void {
  ensureState()

  if (state) {
    state[key] = value
  }

  localStorage.setItem(storageKey, JSON.stringify(state))
}

function ensureState() {
  if (state === null) {
    state = loadState()
  }
}

function loadState() {
  if (!hasLocalStorage) {
    return defaultState
  }

  try {
    const encodedState = localStorage.getItem(storageKey)
    const stored = encodedState ? JSON.parse(encodedState) : null
    return isPlainObject(stored) ? stored : defaultState
  } catch (err) {
    return defaultState
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
