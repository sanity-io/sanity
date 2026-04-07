import {supportsLocalStorage} from '../../../util/supportsLocalStorage'
import {
  createBroadcastState,
  createLocalStorageStorage,
  createMemoryStorage,
} from './createBroadcastState'

export type TokenValue = {token: string}

export function createTokenStorage(
  localStorageKey: string,
  initial: (current: TokenValue | undefined) => TokenValue | undefined,
) {
  return createBroadcastState<TokenValue>(
    `${localStorageKey}_broadcast`,
    initial,
    supportsLocalStorage ? createLocalStorageStorage(localStorageKey) : createMemoryStorage(),
  )
}
