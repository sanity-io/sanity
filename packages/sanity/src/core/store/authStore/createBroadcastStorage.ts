import {supportsLocalStorage} from '../../util/supportsLocalStorage'
import {
  createBroadcastState,
  createLocalStorageStorage,
  createMemoryStorage,
} from './createBroadcastState'

export function createBroadcastStorage<T>(
  localStorageKey: string,
  initial: (current: T | undefined) => T | undefined,
) {
  return createBroadcastState<T>(
    `${localStorageKey}_broadcast`,
    initial,
    supportsLocalStorage ? createLocalStorageStorage(localStorageKey) : createMemoryStorage(),
  )
}
