import isPlainObject from './isPlainObject'

const storageKey = 'sanityVision'
const defaultState = {}
const hasLocalStorage = supportsLocalStorage()
let state = null

export function getState(key, defaultVal) {
  ensureState()
  return typeof state[key] === 'undefined' ? defaultVal : state[key]
}

export function storeState(key, value) {
  ensureState()
  state[key] = value
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
    const stored = JSON.parse(localStorage.getItem(storageKey))
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
