import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {_createAuthStore} from '../createAuthStore'
import {type AuthStore} from '../types'

// Mock supportsLocalStorage to return true so the storage module uses localStorage.
vi.mock('../../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
}))

// Mock the storage module to dispatch StorageEvent on setItem.
// In real browsers, storage events only fire in OTHER tabs. jsdom doesn't
// fire them at all. The auth store's createBroadcastChannel listens for
// storage events to sync across tabs, so we need to simulate this.
// Note: the storage module uses `localStorage[key] = value` (bracket notation),
// not `localStorage.setItem()`, so we can't spy on Storage.prototype.
vi.mock('../storage', () => ({
  setItem(key: string, value: string) {
    localStorage.setItem(key, value)
    window.dispatchEvent(
      new StorageEvent('storage', {key, newValue: value, storageArea: localStorage}),
    )
  },
  getItem(key: string): string | undefined {
    return localStorage.getItem(key) ?? undefined
  },
  removeItem(key: string) {
    localStorage.removeItem(key)
  },
}))

const MOCK_USER: CurrentUser = {
  id: 'mock-user-123',
  name: 'Test User',
  email: 'test@example.com',
  profileImage: '',
  provider: 'google',
  role: '',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const PROJECT_ID = 'test-project'
const DATASET = 'test-dataset'
const TOKEN_STORAGE_KEY = `__studio_auth_token_${PROJECT_ID}`

interface MockClientFactoryResult {
  factory: (options: SanityClientConfig) => SanityClient
  setAuthenticated: (v: boolean) => void
}

function createMockClientFactory(): MockClientFactoryResult {
  let authenticated = true

  const factory = (options: SanityClientConfig): SanityClient => {
    const client = {
      config: () => ({...options, apiHost: 'https://api.sanity.io'}),
      request: vi.fn(({uri, method}: {uri: string; method?: string}) => {
        if (uri === '/users/me') {
          // Return a user object when authenticated, or an empty object (no `id`)
          // when not. We avoid returning 401 because getCurrentUser's 401 handler
          // calls broadcast(null), which re-triggers the state$ pipeline and causes
          // an infinite loop (401 → broadcast → new client → getCurrentUser → 401 → …).
          // NOTE: this is a real production bug, not just a test issue — if a user's
          // token expires, the same loop can happen in the browser.
          return Promise.resolve(authenticated ? MOCK_USER : {})
        }
        if (uri === '/auth/fetch') {
          return Promise.resolve({token: 'mock-exchanged-token'})
        }
        if (uri === '/auth/logout' && method === 'POST') {
          return Promise.resolve({ok: true})
        }
        return Promise.resolve({})
      }),
    } as unknown as SanityClient
    return client
  }

  return {
    factory,
    setAuthenticated: (v: boolean) => {
      authenticated = v
    },
  }
}

/**
 * Wait for the auth store to emit a state matching the predicate.
 */
function waitForState(
  store: AuthStore,
  predicate: (state: {authenticated: boolean}) => boolean,
  timeoutMs = 5000,
): Promise<{authenticated: boolean; currentUser: CurrentUser | null}> {
  return Promise.race([
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out waiting for auth state`)), timeoutMs),
    ),
    new Promise<{authenticated: boolean; currentUser: CurrentUser | null}>((resolve) => {
      const sub = store.state.subscribe((state) => {
        if (predicate(state)) {
          queueMicrotask(() => sub.unsubscribe())
          resolve(state)
        }
      })
    }),
  ])
}

describe('createAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
  })

  afterEach(() => {
    localStorage.clear()
    window.location.hash = ''
  })

  describe('cookie auth', () => {
    it('logout in one store broadcasts to another store', async () => {
      const mock1 = createMockClientFactory()
      const mock2 = createMockClientFactory()

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock1.factory,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock2.factory,
      })

      await waitForState(store1, (s) => s.authenticated)
      await waitForState(store2, (s) => s.authenticated)

      mock1.setAuthenticated(false)
      mock2.setAuthenticated(false)

      const store2Unauth = waitForState(store2, (s) => !s.authenticated)

      // TODO: AuthStore.logout is typed as `() => void` but the implementation
      // returns Promise<void>. The cast works around the type mismatch — the
      // interface should be fixed to `logout?: () => Promise<void>`.
      await (store1.logout!() as unknown as Promise<void>)

      const state2 = await store2Unauth
      expect(state2.authenticated).toBe(false)
    })

    it('login broadcasts to other store', async () => {
      const mock1 = createMockClientFactory()
      mock1.setAuthenticated(false)
      const mock2 = createMockClientFactory()
      mock2.setAuthenticated(false)

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock1.factory,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock2.factory,
      })

      await waitForState(store1, (s) => !s.authenticated)
      await waitForState(store2, (s) => !s.authenticated)

      const store2Auth = waitForState(store2, (s) => s.authenticated)

      mock1.setAuthenticated(true)
      mock2.setAuthenticated(true)

      // handleCallbackUrl with no session ID broadcasts null (cookie token),
      // which triggers store2 to re-create a client and re-fetch /users/me
      await store1.handleCallbackUrl!()

      const state2 = await store2Auth
      expect(state2.authenticated).toBe(true)
      expect(state2.currentUser).toEqual(MOCK_USER)
    })

    it('single store logout transitions to unauthenticated', async () => {
      const mock = createMockClientFactory()

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => s.authenticated)
      mock.setAuthenticated(false)

      const unauthState = waitForState(store, (s) => !s.authenticated)
      await (store.logout!() as unknown as Promise<void>)

      const state = await unauthState
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })
  })

  describe('token auth', () => {
    it('logout in one store broadcasts to another store', async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'mock-token'}))

      const mock1 = createMockClientFactory()
      const mock2 = createMockClientFactory()

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock1.factory,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock2.factory,
      })

      await waitForState(store1, (s) => s.authenticated)
      await waitForState(store2, (s) => s.authenticated)

      mock1.setAuthenticated(false)
      mock2.setAuthenticated(false)

      const store2Unauth = waitForState(store2, (s) => !s.authenticated)
      await (store1.logout!() as unknown as Promise<void>)

      const state2 = await store2Unauth
      expect(state2.authenticated).toBe(false)
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    })

    it('handleCallbackUrl stores token and broadcasts to other store', async () => {
      // Set session ID in hash BEFORE importing the sessionId module (side-effect)
      window.location.hash = '#sid=mock-session-id-12345678'
      vi.resetModules()

      // Re-import after resetModules so sessionId.ts re-consumes the hash
      const {_createAuthStore: createStore} = await import('../createAuthStore')

      const mock1 = createMockClientFactory()
      mock1.setAuthenticated(false)
      const mock2 = createMockClientFactory()
      mock2.setAuthenticated(false)

      const store1 = createStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock1.factory,
      })
      const store2 = createStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock2.factory,
      })

      await waitForState(store1, (s) => !s.authenticated)
      await waitForState(store2, (s) => !s.authenticated)

      mock1.setAuthenticated(true)
      mock2.setAuthenticated(true)

      const store2Auth = waitForState(store2, (s) => s.authenticated)

      const result = await store1.handleCallbackUrl!()
      expect(result.success).toBe(true)
      expect(result.flow).toBe('token-exchange')

      const state2 = await store2Auth
      expect(state2.authenticated).toBe(true)
      expect(state2.currentUser).toEqual(MOCK_USER)

      const stored = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY)!)
      expect(stored.token).toBe('mock-exchanged-token')
    })

    it('single store logout transitions to unauthenticated', async () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'mock-token'}))

      const mock = createMockClientFactory()

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => s.authenticated)
      mock.setAuthenticated(false)

      const unauthState = waitForState(store, (s) => !s.authenticated)
      await (store.logout!() as unknown as Promise<void>)

      const state = await unauthState
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })
  })

  describe('handleCallbackUrl', () => {
    it('dual auth with session ID uses cookie auth when cookie probe succeeds', async () => {
      // Set session ID in hash BEFORE importing the sessionId module (side-effect)
      window.location.hash = '#sid=mock-session-id-12345678'
      vi.resetModules()
      const {_createAuthStore: createStore} = await import('../createAuthStore')

      const mock = createMockClientFactory()

      const store = createStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => s.authenticated)

      // For dual auth with a session ID, handleCallbackUrl tries cookie auth first.
      // Since /users/me succeeds (mock returns user), it uses cookie flow.
      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(true)
      expect(result.flow).toBe('cookie-auth')
    })

    it('cookie auth with session ID uses cookie auth flow', async () => {
      window.location.hash = '#sid=mock-session-id-12345678'
      vi.resetModules()
      const {_createAuthStore: createStore} = await import('../createAuthStore')

      const mock = createMockClientFactory()

      const store = createStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => s.authenticated)

      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(true)
      expect(result.flow).toBe('cookie-auth')
    })

    it('cookie auth reports failure when cookie probe fails', async () => {
      window.location.hash = '#sid=mock-session-id-12345678'
      vi.resetModules()
      const {_createAuthStore: createStore} = await import('../createAuthStore')

      // Mock stays unauthenticated — cookie probe returns empty user
      const mock = createMockClientFactory()
      mock.setAuthenticated(false)

      const store = createStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => !s.authenticated)

      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(false)
      expect(result.flow).toBe('cookie-auth')
      expect(result.failureReason).toBeDefined()
    })

    it('token exchange failure returns error result', async () => {
      window.location.hash = '#sid=mock-session-id-12345678'
      vi.resetModules()
      const {_createAuthStore: createStore} = await import('../createAuthStore')

      const mock = createMockClientFactory()
      mock.setAuthenticated(false)

      // Override /auth/fetch to fail
      const factory = (options: SanityClientConfig): SanityClient => {
        const client = mock.factory(options)
        ;(client.request as ReturnType<typeof vi.fn>).mockImplementation(
          ({uri, method}: {uri: string; method?: string}) => {
            if (uri === '/users/me') return Promise.resolve({})
            if (uri === '/auth/fetch') return Promise.reject(new Error('exchange failed'))
            if (uri === '/auth/logout' && method === 'POST') return Promise.resolve({ok: true})
            return Promise.resolve({})
          },
        )
        return client
      }

      const store = createStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: factory,
      })

      await waitForState(store, (s) => !s.authenticated)

      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(false)
      expect(result.flow).toBe('token-exchange')
      expect(result.failureReason).toBe('exchange failed')
    })
  })

  describe('hash token', () => {
    it('picks up token from URL hash on init', async () => {
      window.location.hash = `#token=${'a'.repeat(32)}`

      const mock = createMockClientFactory()

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => s.authenticated)

      // The hash token should have been saved to localStorage
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.token).toBe('a'.repeat(32))
    })
  })

  describe('dual auth', () => {
    it('logout in one store broadcasts to another store', async () => {
      const mock1 = createMockClientFactory()
      const mock2 = createMockClientFactory()

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock1.factory,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock2.factory,
      })

      await waitForState(store1, (s) => s.authenticated)
      await waitForState(store2, (s) => s.authenticated)

      mock1.setAuthenticated(false)
      mock2.setAuthenticated(false)

      const store2Unauth = waitForState(store2, (s) => !s.authenticated)
      await (store1.logout!() as unknown as Promise<void>)

      const state2 = await store2Unauth
      expect(state2.authenticated).toBe(false)
    })

    it('handleCallbackUrl succeeds with cookie auth flow', async () => {
      const mock = createMockClientFactory()
      mock.setAuthenticated(false)

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => !s.authenticated)
      mock.setAuthenticated(true)

      // For dual auth with no session ID, handleCallbackUrl broadcasts the
      // existing token (or null) and returns 'already-authenticated'
      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(true)
      expect(result.flow).toBe('already-authenticated')
    })

    it('single store logout transitions to unauthenticated', async () => {
      const mock = createMockClientFactory()

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock.factory,
      })

      await waitForState(store, (s) => s.authenticated)
      mock.setAuthenticated(false)

      const unauthState = waitForState(store, (s) => !s.authenticated)
      await (store.logout!() as unknown as Promise<void>)

      const state = await unauthState
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })
  })
})
