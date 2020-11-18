import localStorageBackend from './localStorage'
import memoryBackend from './memory'

let isSupported = null
const supportsLocalStorage = () => {
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

export const resolveBackend = () => (supportsLocalStorage() ? localStorageBackend : memoryBackend)
