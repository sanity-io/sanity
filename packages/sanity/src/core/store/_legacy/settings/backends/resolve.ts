import {localStorageBackend} from './localStorage'
import {memoryBackend} from './memory'
import {Backend} from './types'

let isSupported: boolean | null = null
function supportsLocalStorage() {
  if (isSupported !== null) {
    return isSupported
  }

  const testKey = '__test__'
  try {
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    isSupported = true
  } catch (evt) {
    isSupported = false
  }

  return isSupported
}

export function resolveBackend(): Backend {
  return supportsLocalStorage() ? localStorageBackend : memoryBackend
}
