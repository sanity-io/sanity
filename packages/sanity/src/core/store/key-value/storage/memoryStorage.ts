import {type KeyValueStoreValue} from '../types'

export function createMemoryStorage() {
  const DB = Object.create(null)
  return {
    getKey(key: string): KeyValueStoreValue | null {
      return DB[key] || null
    },
    setKey(key: string, value: KeyValueStoreValue) {
      DB[key] = value
    },
  }
}
