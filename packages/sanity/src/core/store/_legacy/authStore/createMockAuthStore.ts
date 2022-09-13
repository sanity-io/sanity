import {of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {CurrentUser} from '@sanity/types'
import {AuthStore} from './types'

interface MockAuthStoreOptions {
  currentUser: CurrentUser | null
  client: SanityClient
}

/**
 * Creates a mock `AuthStore` (for testing) that emits an `AuthState` derived
 * from the `client` and `currentUser` given.
 */
export function createMockAuthStore({client, currentUser = null}: MockAuthStoreOptions): AuthStore {
  return {
    state: of({authenticated: true, client, currentUser}),
  }
}
