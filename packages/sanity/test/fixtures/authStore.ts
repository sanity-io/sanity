/**
 * Shared auth store fixtures for tests of the studio request handler wiring
 * (`getAuthStore`, `prepareConfig`) and the `AuthStore` derivation helpers.
 */
import {createClient, type RequestHandler, type SanityClient} from '@sanity/client'
import {type Observable, of} from 'rxjs'

import {createMockAuthStore} from '../../src/core/store/authStore/createMockAuthStore'
import {
  type AuthState,
  type AuthStore,
  type HandleCallbackResult,
} from '../../src/core/store/authStore/types'

export const passthroughRequestHandler: RequestHandler = (request, next) => next(request)

export const CALLBACK_RESULT: HandleCallbackResult = {
  loginMethod: 'dual',
  flow: 'already-authenticated',
  success: true,
  durationMs: 0,
}

export function createBareClient(projectId = 'abc123'): SanityClient {
  return createClient({projectId, dataset: 'test', apiVersion: '2025-01-01', useCdn: false})
}

/**
 * A pre-built store: `createMockAuthStore` plus the `logout` a store must have
 * for the studio to complete a forced logout (`createMockAuthStore` has none,
 * which is why the studio request handler gate skips it).
 */
export function createPrebuiltStore(client: SanityClient): AuthStore {
  return {
    ...createMockAuthStore({client, currentUser: null}),
    logout: () => Promise.resolve(),
  }
}

/**
 * `AuthStore` is duck-typed, so a class instance is a valid store. Its methods
 * live on the prototype and read `this`, which an object spread would drop.
 */
export class ClassAuthStore implements AuthStore {
  state: Observable<AuthState>
  loggedOut = 0
  callbacks = 0

  constructor(client: SanityClient) {
    this.state = of({client, authenticated: true, currentUser: null})
  }

  logout() {
    this.loggedOut += 1
    return Promise.resolve()
  }

  handleCallbackUrl() {
    this.callbacks += 1
    return Promise.resolve(CALLBACK_RESULT)
  }
}
