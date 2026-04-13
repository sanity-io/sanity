import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {_createAuthStore} from '../createAuthStore'
import {type AuthStore} from '../types'

// Mock supportsLocalStorage to return true so createBroadcastStorage uses localStorage.
// In jsdom/Node.js it returns false because process.versions.node is defined.
vi.mock('../../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
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

/**
 * Create a 401 error that matches what the sanity client throws.
 * The `getCurrentUser` function in createAuthStore.ts checks `err.statusCode === 401`.
 */
function create401Error(): Error & {statusCode: number} {
  const err = new Error('Unauthorized') as Error & {statusCode: number}
  err.statusCode = 401
  return err
}

interface MockClientFactoryResult {
  factory: (options: SanityClientConfig) => SanityClient
  setAuthenticated: (v: boolean) => void
}

function createMockClientFactory(): MockClientFactoryResult {
  let authenticated = true

  const factory = (_options: SanityClientConfig): SanityClient => {
    const client = {
      request: vi.fn(({uri, method}: {uri: string; method?: string}) => {
        if (uri === '/users/me') {
          if (authenticated) {
            return Promise.resolve(MOCK_USER)
          }
          return Promise.reject(create401Error())
        }
        if (uri === '/auth/id') {
          if (authenticated) {
            return Promise.resolve({
              id: 'mock-auth-id',
              expiry: Math.floor(Date.now() / 1000) + 3600,
            })
          }
          return Promise.reject(create401Error())
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

describe('createAuthStore: cross-tab sync', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
  })

  afterEach(() => {
    localStorage.clear()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  describe('cookie auth', () => {
    it('logout in one store broadcasts to another store via BroadcastChannel', async () => {
      const mock1 = createMockClientFactory()
      const mock2 = createMockClientFactory()

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock1.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock2.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      // Wait for both stores to be authenticated
      await waitForState(store1, (s) => s.authenticated)
      await waitForState(store2, (s) => s.authenticated)

      // Switch both mocks to unauthenticated (simulates server-side logout)
      mock1.setAuthenticated(false)
      mock2.setAuthenticated(false)

      // Set up a listener for store2 to become unauthenticated
      const store2Unauth = waitForState(store2, (s) => !s.authenticated)

      // Trigger logout on store1
      await store1.logout!()

      // Store2 should receive the broadcast and become unauthenticated
      const state2 = await store2Unauth
      expect(state2.authenticated).toBe(false)
    })

    it('login broadcasts to other store via BroadcastChannel', async () => {
      // Both stores start unauthenticated
      const mock1 = createMockClientFactory()
      mock1.setAuthenticated(false)
      const mock2 = createMockClientFactory()
      mock2.setAuthenticated(false)

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock1.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mock2.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      // Wait for both stores to be unauthenticated initially
      await waitForState(store1, (s) => !s.authenticated)
      await waitForState(store2, (s) => !s.authenticated)

      // Set up listener for store2 to become authenticated
      const store2Auth = waitForState(store2, (s) => s.authenticated)

      // Simulate login: server starts returning user data
      mock1.setAuthenticated(true)
      mock2.setAuthenticated(true)

      // For cookie auth, after login the server sets a cookie and the tab re-loads.
      // The auth store broadcasts cookie auth state on every emission.
      // Simulate this by broadcasting {authenticated: true} via BroadcastChannel.
      const channel = new BroadcastChannel(`__studio_auth_cookie_state_${PROJECT_ID}`)
      channel.postMessage(JSON.stringify({authenticated: true}))
      channel.close()

      // Store2 should detect the broadcast, re-fetch /users/me, and become authenticated
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
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      // Wait for initial authenticated state
      await waitForState(store, (s) => s.authenticated)

      // Switch to unauthenticated
      mock.setAuthenticated(false)

      const unauthState = waitForState(store, (s) => !s.authenticated)
      await (store.logout!() as unknown as Promise<void>)

      const state = await unauthState
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })
  })

  describe('token auth', () => {
    it('logout in one store broadcasts to another store via token storage', async () => {
      // Seed localStorage with token so both stores start authenticated
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'mock-token'}))

      const mock1 = createMockClientFactory()
      const mock2 = createMockClientFactory()

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock1.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock2.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      // Wait for both stores to be authenticated
      await waitForState(store1, (s) => s.authenticated)
      await waitForState(store2, (s) => s.authenticated)

      // Switch both mocks to unauthenticated
      mock1.setAuthenticated(false)
      mock2.setAuthenticated(false)

      // Set up listener for store2 to become unauthenticated
      const store2Unauth = waitForState(store2, (s) => !s.authenticated)

      // Trigger logout on store1 — this calls tokenStorage.update(undefined)
      // which broadcasts via BroadcastChannel to store2
      await (store1.logout!() as unknown as Promise<void>)

      // Store2 should receive the broadcast and transition to unauthenticated
      const state2 = await store2Unauth
      expect(state2.authenticated).toBe(false)

      // Token should be cleared from localStorage
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    })

    it('handleCallbackUrl stores token and broadcasts to other store', async () => {
      // Both stores start unauthenticated (no token in localStorage)
      const mock1 = createMockClientFactory()
      mock1.setAuthenticated(false)
      const mock2 = createMockClientFactory()
      mock2.setAuthenticated(false)

      // Inject a getSessionId that returns a session ID once (simulating a post-login redirect)
      let sessionIdConsumed = false
      const getSessionId = () => {
        if (sessionIdConsumed) return undefined
        sessionIdConsumed = true
        return 'mock-session-id-12345678'
      }

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock1.factory,
        getSessionId,
        consumeHashToken: () => undefined,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock2.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      // Wait for both stores to settle as unauthenticated
      await waitForState(store1, (s) => !s.authenticated)
      await waitForState(store2, (s) => !s.authenticated)

      // Switch mocks to authenticated (server now recognizes the token)
      mock1.setAuthenticated(true)
      mock2.setAuthenticated(true)

      // Set up listener for store2 to become authenticated
      const store2Auth = waitForState(store2, (s) => s.authenticated)

      // Call handleCallbackUrl on store1 — this:
      // 1. Gets the session ID via getHashSessionId (mocked above)
      // 2. Exchanges it for a token via /auth/fetch
      // 3. For token mode, calls tokenStorage.update({token}) which broadcasts to other tabs
      const result = await store1.handleCallbackUrl!()
      expect(result.success).toBe(true)
      expect(result.authMethod).toBe('token')

      // Store2 should receive the token broadcast and become authenticated
      const state2 = await store2Auth
      expect(state2.authenticated).toBe(true)
      expect(state2.currentUser).toEqual(MOCK_USER)

      // Token should be stored in localStorage
      const stored = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY)!)
      expect(stored).toEqual({token: 'mock-exchanged-token'})
    })

    it('single store logout transitions to unauthenticated', async () => {
      // Seed localStorage with token
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'mock-token'}))

      const mock = createMockClientFactory()

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      // Wait for initial authenticated state
      await waitForState(store, (s) => s.authenticated)

      // Switch to unauthenticated
      mock.setAuthenticated(false)

      const unauthState = waitForState(store, (s) => !s.authenticated)
      await (store.logout!() as unknown as Promise<void>)

      const state = await unauthState
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })
  })
})
