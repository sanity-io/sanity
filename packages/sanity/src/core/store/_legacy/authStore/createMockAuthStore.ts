import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {of} from 'rxjs'

import {type AuthStore} from './types'

/** @internal */
export interface MockAuthStoreOptions {
  currentUser: CurrentUser | null
  client: SanityClient
}

/**
 * Creates a mock `AuthStore` (for testing) that emits an `AuthState` derived
 * from the `client` and `currentUser` given.
 *
 * @internal
 */
export function createMockAuthStore({client, currentUser = null}: MockAuthStoreOptions): AuthStore {
  return {
    state: of({authenticated: true, client, currentUser}),
  }
}
