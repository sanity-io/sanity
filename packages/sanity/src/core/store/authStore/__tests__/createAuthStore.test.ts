import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {CorsOriginError} from '../../cors'
import {_createAuthStore} from '../createAuthStore'
import {type AuthStore} from '../types'

// Mock supportsLocalStorage to return true so createBroadcastStorage uses localStorage.
// In jsdom/Node.js it returns false because process.versions.node is defined.
vi.mock('../../../util/supportsLocalStorage', () => ({
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

  describe('dual auth', () => {
    it('logout in one store broadcasts to another store via BroadcastChannel', async () => {
      const mock1 = createMockClientFactory()
      const mock2 = createMockClientFactory()

      const store1 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock1.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })
      const store2 = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock2.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
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

    it('handleCallbackUrl succeeds with cookie auth method', async () => {
      const mock = createMockClientFactory()
      mock.setAuthenticated(false)

      let sessionIdConsumed = false
      const getSessionId = () => {
        if (sessionIdConsumed) return undefined
        sessionIdConsumed = true
        return 'mock-session-id-12345678'
      }

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock.factory,
        getSessionId,
        consumeHashToken: () => undefined,
      })

      await waitForState(store, (s) => !s.authenticated)

      mock.setAuthenticated(true)

      // For dual auth, handleCallbackUrl exchanges the session ID then probes
      // /auth/id. Since the probe succeeds, it uses cookie auth (no token fallback).
      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(true)
      expect(result.authMethod).toBe('cookie')
    })

    it('single store logout transitions to unauthenticated', async () => {
      const mock = createMockClientFactory()

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: mock.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
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

  // Regression tests for issues found in code review.
  // These should fail against the current implementation and pass once fixed.
  describe('regressions', () => {
    it('exposes a `token` observable so bifur (real-time) can authenticate', async () => {
      // The AuthStore interface declares `token?: Observable<string | null>`, and
      // prepareConfig.tsx wires it into the bifur WebSocket for real-time updates.
      // If createAuthStore stops emitting `token`, bifur silently runs unauthenticated
      // in token-mode studios.
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'persisted-token'}))

      const mock = createMockClientFactory()
      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: mock.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      expect(store.token).toBeDefined()
      const token = await firstValueFrom(store.token!)
      expect(token).toBe('persisted-token')
    })

    it('does not flash unauthenticated when a sibling workspace for the same project emits unauthenticated', async () => {
      // Regression test for the "flash of login screen" bug observed when
      // multiple workspaces for the same project mount concurrently.
      //
      // `cookieAuthState`'s BroadcastChannel is keyed by projectId, so every
      // workspace for the same project shares it — even within the same page.
      // Only cookie/dual workspaces should write to it (they interact with
      // the cookie); token-only workspaces have no signal about cookie state
      // and shouldn't broadcast unauthenticated values that would poison
      // sibling cookie workspaces.
      //
      // Expected: the cookie store stays authenticated throughout.
      //
      // Note: uses a unique projectId per test run so BroadcastChannels from
      // prior tests (which stay alive for the duration of the test file)
      // can't echo messages back and confuse the assertion.
      const isolatedProjectId = `flash-test-${Math.random().toString(36).slice(2)}`

      const cookieMock = createMockClientFactory()
      // Cookie workspace is authenticated (valid session cookie)
      cookieMock.setAuthenticated(true)

      const tokenMock = createMockClientFactory()
      // Token workspace is unauthenticated (no stored token)
      tokenMock.setAuthenticated(false)

      // Record every emission from the cookie store
      const cookieEmissions: Array<{authenticated: boolean}> = []

      const cookieStore = _createAuthStore({
        projectId: isolatedProjectId,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: cookieMock.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      const sub = cookieStore.state.subscribe((state) => {
        cookieEmissions.push({authenticated: state.authenticated})
      })

      // Mount a sibling workspace for the SAME project after the cookie
      // store is already running. This simulates useWorkspaceAuthStates
      // subscribing to every workspace's auth state.
      const tokenStore = _createAuthStore({
        projectId: isolatedProjectId,
        dataset: DATASET,
        loginMethod: 'token',
        clientFactory: tokenMock.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })
      // Subscribe so its tap() runs and broadcasts to cookieAuthState
      const tokenSub = tokenStore.state.subscribe()

      // Wait for both to settle
      await waitForState(cookieStore, (s) => s.authenticated)
      await waitForState(tokenStore, (s) => !s.authenticated)

      // Give the microtask queue a chance to flush any racing broadcasts
      await new Promise((resolve) => setTimeout(resolve, 50))

      sub.unsubscribe()
      tokenSub.unsubscribe()

      // The cookie store should NEVER have emitted authenticated: false.
      // If it did, that's the flash regression — a sibling workspace
      // broadcast `authenticated: false` via the shared cookieAuthState
      // channel and the cookie store mirrored it.
      expect(
        cookieEmissions.every((e) => e.authenticated === true),
        `Cookie store emitted unauthenticated state(s): ${JSON.stringify(cookieEmissions)}`,
      ).toBe(true)
    })

    it('does not enter a broadcast feedback loop when two cookie workspaces for the same project are mounted', async () => {
      // Regression test: two cookie workspaces for the same project in the
      // same page. The cookieAuthState BroadcastChannel is shared. An earlier
      // iteration of the code broadcast the auth state on every authState$
      // emission, which caused a feedback loop — A broadcasts `true`, B
      // receives it and re-probes, B's authState$ emits, tap broadcasts
      // `true` back to A, A re-probes, and so on. `distinctUntilChanged`
      // absorbed the duplicates but each workspace still re-subscribed to
      // its own pipeline repeatedly.
      //
      // Expected: each store emits exactly once (the initial probe result)
      // and stays quiet after that.
      const isolatedProjectId = `battle-test-${Math.random().toString(36).slice(2)}`

      const mockA = createMockClientFactory()
      const mockB = createMockClientFactory()

      const storeA = _createAuthStore({
        projectId: isolatedProjectId,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mockA.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })
      const storeB = _createAuthStore({
        projectId: isolatedProjectId,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: mockB.factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      const emissionsA: boolean[] = []
      const emissionsB: boolean[] = []
      const subA = storeA.state.subscribe((s) => emissionsA.push(s.authenticated))
      const subB = storeB.state.subscribe((s) => emissionsB.push(s.authenticated))

      await waitForState(storeA, (s) => s.authenticated)
      await waitForState(storeB, (s) => s.authenticated)

      // Let any racing broadcasts settle
      await new Promise((resolve) => setTimeout(resolve, 100))

      subA.unsubscribe()
      subB.unsubscribe()

      // Each store should emit exactly once (initial authenticated state).
      // More than one emission means the shared channel is causing a ricochet.
      expect(
        emissionsA,
        `Store A had unexpected extra emissions: ${JSON.stringify(emissionsA)}`,
      ).toEqual([true])
      expect(
        emissionsB,
        `Store B had unexpected extra emissions: ${JSON.stringify(emissionsB)}`,
      ).toEqual([true])
    })

    it('throws CorsOriginError when /users/me fails for a non-auth reason but /ping succeeds', async () => {
      // Previously, getCurrentUser probed /ping to detect CORS misconfig and threw
      // CorsOriginError, which StudioErrorBoundary renders as CorsOriginErrorScreen.
      // After the refactor, the raw error is propagated and the helpful CORS screen
      // never appears.
      const nonAuthError = Object.assign(new Error('Network error'), {
        statusCode: 0,
        isNetworkError: true,
      })

      const factory = (_options: SanityClientConfig): SanityClient =>
        ({
          request: vi.fn(({uri, withCredentials}: {uri: string; withCredentials?: boolean}) => {
            if (uri === '/users/me') return Promise.reject(nonAuthError)
            // /ping succeeds without credentials → indicates CORS origin isn't allowlisted
            if (uri === '/ping' && withCredentials === false) return Promise.resolve({})
            return Promise.resolve({})
          }),
        }) as unknown as SanityClient

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      // The state stream should error with a CorsOriginError so the StudioErrorBoundary
      // can render CorsOriginErrorScreen.
      await expect(firstValueFrom(store.state)).rejects.toBeInstanceOf(CorsOriginError)
    })
  })
})
