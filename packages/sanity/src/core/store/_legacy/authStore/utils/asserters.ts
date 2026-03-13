import {isRecord} from '../../../../util'
import {type AuthStore} from '../types'

/**
 * Duck-type check for whether or not this looks like an auth store
 *
 * @param maybeStore - Item to check if matches the AuthStore interface
 * @returns True if auth store, false otherwise
 * @internal
 */
export function isAuthStore(maybeStore: unknown): maybeStore is AuthStore {
  return (
    isRecord(maybeStore) &&
    'state' in maybeStore &&
    isRecord(maybeStore.state) &&
    'subscribe' in maybeStore.state &&
    typeof maybeStore.state.subscribe === 'function'
  )
}
