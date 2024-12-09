import {supportsLocalStorage} from '../../../util/supportsLocalStorage'
import {type KeyValueStoreValue} from '../types'
import {createMemoryStorage} from './memoryStorage'

function tryParse(val: string) {
  try {
    return JSON.parse(val)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse settings: ${err.message}`)
    return null
  }
}

function createLocalStoreStorage() {
  if (!supportsLocalStorage) {
    return createMemoryStorage()
  }

  function getKey(key: string): KeyValueStoreValue | null {
    const val = localStorage.getItem(key)

    return val === null ? null : tryParse(val)
  }

  const setKey = function (key: string, nextValue: KeyValueStoreValue) {
    // Can't stringify undefined, and nulls are what
    // `getItem` returns when key does not exist
    if (typeof nextValue === 'undefined' || nextValue === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(nextValue))
    }
  }
  return {getKey, setKey}
}

export const localStoreStorage = createLocalStoreStorage()
