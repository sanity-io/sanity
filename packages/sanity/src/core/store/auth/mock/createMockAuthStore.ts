import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {of} from 'rxjs'

import {type AuthStore} from '../types'

/** @internal */
export interface MockAuthStoreOptions {
  /**
   * The deprecated `role` string may be omitted. `AuthState` still stores a
   * {@link CurrentUser}, so a missing `role` is filled with `''`.
   */
  currentUser: Omit<CurrentUser, 'role'> | null
  client: SanityClient
}

function hasLegacyRole(currentUser: Omit<CurrentUser, 'role'>): currentUser is CurrentUser {
  return 'role' in currentUser && typeof (currentUser as {role?: unknown}).role === 'string'
}

function toAuthCurrentUser(currentUser: Omit<CurrentUser, 'role'>): CurrentUser {
  if (hasLegacyRole(currentUser)) return currentUser
  return {
    ...currentUser,
    // oxlint-disable-next-line no-deprecated -- AuthState still requires CurrentUser.role
    role: '',
  }
}

/**
 * Creates a mock `AuthStore` (for testing) that emits an `AuthState` derived
 * from the `client` and `currentUser` given.
 *
 * @internal
 */
export function createMockAuthStore({client, currentUser = null}: MockAuthStoreOptions): AuthStore {
  return {
    state: of({
      authenticated: true,
      client,
      currentUser: currentUser ? toAuthCurrentUser(currentUser) : null,
    }),
  }
}
