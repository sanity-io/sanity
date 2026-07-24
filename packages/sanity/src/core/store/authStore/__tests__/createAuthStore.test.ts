import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {BehaviorSubject, firstValueFrom, of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {promiseWithResolvers} from '../../../util/promiseWithResolvers'
import {AUTH_STATE_SETTLE_TIMEOUT_MS} from '../constants'
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
  attributes: [
    {key: 'department', type: 'string', value: 'engineering'},
    {key: 'locale', type: 'string-array', value: ['EN', 'ES']},
  ],
}

const PROJECT_ID = 'test-project'
const DATASET = 'test-dataset'
const TOKEN_STORAGE_KEY = `__studio_auth_token_${PROJECT_ID}`

/**
 * Create a 401 error that matches what the sanity client throws — a real
 * `ClientError`. `getCurrentUser` checks `err.statusCode === 401`, while
 * `probeCurrentUser` checks `err instanceof ClientError`, so the mock must
 * produce the genuine type to exercise both paths faithfully.
 */
function create401Error(): ClientError {
  return new ClientError({
    statusCode: 401,
    headers: {},
    body: {error: 'Unauthorized', statusCode: 401},
  })
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
 * Mock factory that decides auth by *how the client was built*, mirroring
 * createAuthStore: a client configured with `{token}` authenticates via the
 * Authorization header; one with `{withCredentials: true}` authenticates via
 * the cookie.
 *
 */
function createCredentialAwareClientFactory(opts: {
  token: string
  cookieValid: boolean
}): (options: SanityClientConfig) => SanityClient {
  return (options: SanityClientConfig): SanityClient => {
    // A request is authenticated if it carries the valid token, or rides a valid
    // cookie. /auth/id and /users/me both follow this — they never disagree.
    // Evaluated per request (not at client creation) so tests can flip
    // `opts.cookieValid` mid-flight, e.g. to model a login establishing the
    // session cookie.
    const authed = () =>
      options.token === opts.token || (options.withCredentials === true && opts.cookieValid)

    return {
      request: vi.fn(({uri}: {uri: string}) => {
        if (uri === '/auth/fetch') return Promise.resolve({token: opts.token})
        if (uri === '/auth/logout') return Promise.resolve({ok: true})

        if (uri === '/auth/id') {
          return authed()
            ? Promise.resolve({id: 'mock-auth-id', expiry: Math.floor(Date.now() / 1000) + 3600})
            : Promise.reject(create401Error())
        }

        if (uri === '/users/me') {
          return authed() ? Promise.resolve(MOCK_USER) : Promise.reject(create401Error())
        }

        return Promise.resolve({})
      }),
    } as unknown as SanityClient
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

    it('applies the exchanged token in dual mode when the cookie is not established', async () => {
      // Dual/SSO studio: handleCallbackUrl exchanges the sid at /auth/fetch for a
      // VALID token, but the session cookie is not established, so the cookie
      // probe reports unauthenticated.
      // Expected: dual mode must retain the exchanged token so the client
      // re-inits with the Authorization header and authenticates via the token.
      const TOKEN = 'valid-exchanged-token'
      const factory = createCredentialAwareClientFactory({
        token: TOKEN,
        cookieValid: false, // the SSO cookie is not established
      })

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
        clientFactory: factory,
        getSessionId,
        consumeHashToken: () => undefined,
      })

      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(true)

      // The store must converge on authenticated via the token. Against the buggy
      // implementation the token is discarded and /users/me keeps 401-ing, so
      // waitForState rejects with its own timeout.
      const state = await waitForState(store, (s) => s.authenticated, 2000)
      expect(state.authenticated).toBe(true)
      expect(state.currentUser).toEqual(MOCK_USER)

      // The token must be persisted so the client keeps using it.
      const stored = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY)!)
      expect(stored).toEqual({token: TOKEN})
    })

    it('probes /users/me only once on cold load in dual mode with a pre-stored token', async () => {
      // Guards against a perf regression: the token-recheck stream that applies a
      // freshly exchanged token must NOT also re-fire for a token already present
      // at construction time (which the initial probe already used), or every cold
      // load with a stored token would hit /users/me twice.
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'pre-stored-token'}))

      let usersMeProbes = 0
      const factory = (_options: SanityClientConfig): SanityClient =>
        ({
          request: vi.fn(({uri}: {uri: string}) => {
            if (uri === '/users/me') {
              usersMeProbes += 1
              return Promise.resolve(MOCK_USER)
            }
            if (uri === '/auth/id') {
              return Promise.resolve({id: 'x', expiry: Math.floor(Date.now() / 1000) + 3600})
            }
            return Promise.resolve({})
          }),
        }) as unknown as SanityClient

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      await waitForState(store, (s) => s.authenticated)
      // Let any redundant re-probe settle before asserting.
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(usersMeProbes).toBe(1)
    })

    it('transitions to unauthenticated on logout despite the forced-logout middleware parking 401s', async () => {
      // Regression: after a mid-session 401 forces a logout, the dual-mode
      // re-check probes /users/me again. In the studio that probe rides a
      // client carrying the forced-logout middleware (`_requestHandler`), which
      // claims the 401 and parks it forever — so the probe never settles,
      // `getCurrentUser`'s own 401-catch never runs, authState$ never emits
      // `authenticated: false`, and the studio freezes instead of showing the
      // login screen.
      //
      // The fix probes with `withConfig({_requestHandler: undefined})`, so the
      // 401 reaches getCurrentUser's catch. We model the middleware faithfully:
      // a client built WITH `_requestHandler` parks its /users/me 401 (hangs);
      // stripping it via withConfig makes the same 401 reject normally.
      let sessionValid = true

      const makeClient = (options: SanityClientConfig): SanityClient => {
        const middlewareActive = Boolean((options as {_requestHandler?: unknown})._requestHandler)
        const client = {
          config: () => options,
          // Mirrors @sanity/client: withConfig merges config and returns a new
          // client. The fix calls this with `_requestHandler: undefined`.
          withConfig: (next: SanityClientConfig) => makeClient({...options, ...next}),
          request: vi.fn(({uri, method}: {uri: string; method?: string}) => {
            if (uri === '/auth/logout' && method === 'POST') return Promise.resolve({ok: true})
            if (uri === '/users/me') {
              if (sessionValid) return Promise.resolve(MOCK_USER)
              // A 401 on a middleware-bearing client is parked forever; on a
              // stripped client it rejects normally (the real behavior).
              return middlewareActive ? new Promise(() => {}) : Promise.reject(create401Error())
            }
            if (uri === '/auth/id') {
              return sessionValid
                ? Promise.resolve({id: 'x', expiry: Math.floor(Date.now() / 1000) + 3600})
                : Promise.reject(create401Error())
            }
            return Promise.resolve({})
          }),
        }
        return client as unknown as SanityClient
      }

      // prepareConfig installs `_requestHandler` on every studio client; emulate
      // that so the probe client carries the parking middleware by default.
      const factory = (options: SanityClientConfig): SanityClient =>
        makeClient({...options, _requestHandler: (() => {}) as never})

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      await waitForState(store, (s) => s.authenticated)

      // Session lapses: /users/me now 401s (parked on a middleware-bearing
      // client, rejects on a stripped one).
      sessionValid = false

      // Against the bug this rejects with waitForState's own timeout, since the
      // parked probe leaves authState$ without a post-logout emission.
      const unauthState = waitForState(store, (s) => !s.authenticated, 2000)
      await (store.logout!() as unknown as Promise<void>)

      const state = await unauthState
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })

    it('transitions to unauthenticated when /auth/logout itself 401s on a middleware-bearing client', async () => {
      // Regression: a forced logout reacting to a mid-session 401 POSTs
      // /auth/logout to invalidate the (already-gone) session. In the studio
      // those clients carry the forced-logout middleware (`_requestHandler`),
      // which parks any 401 forever. If the logout endpoint answers 401 (the
      // session is already gone), the parked request never settles,
      // `Promise.allSettled` never resolves, and the local teardown that
      // transitions auth state to unauthenticated never runs — the studio
      // freezes instead of landing on the login screen.
      //
      // The fix strips the middleware from the logout clients via
      // `withConfig({_requestHandler: undefined})`, so the 401 rejects normally
      // and teardown proceeds. We model the middleware faithfully: /auth/logout
      // 401s, parked on a middleware-bearing client, rejecting on a stripped
      // one.
      // The session is valid until it lapses; after that everything 401s,
      // including the `/auth/logout` the forced logout POSTs.
      let sessionValid = true

      const makeClient = (options: SanityClientConfig): SanityClient => {
        const middlewareActive = Boolean((options as {_requestHandler?: unknown})._requestHandler)
        const client = {
          config: () => options,
          withConfig: (next: SanityClientConfig) => makeClient({...options, ...next}),
          request: vi.fn(({uri, method}: {uri: string; method?: string}) => {
            if (uri === '/auth/logout' && method === 'POST') {
              // Session already gone: the logout endpoint 401s. Parked forever
              // on a middleware-bearing client; rejects on a stripped one.
              return middlewareActive ? new Promise(() => {}) : Promise.reject(create401Error())
            }
            if (uri === '/users/me') {
              if (sessionValid) return Promise.resolve(MOCK_USER)
              // A 401 on a middleware-bearing client is parked forever; on a
              // stripped (probe) client it rejects normally.
              return middlewareActive ? new Promise(() => {}) : Promise.reject(create401Error())
            }
            if (uri === '/auth/id') {
              return sessionValid
                ? Promise.resolve({id: 'x', expiry: Math.floor(Date.now() / 1000) + 3600})
                : Promise.reject(create401Error())
            }
            return Promise.resolve({})
          }),
        }
        return client as unknown as SanityClient
      }

      // prepareConfig installs `_requestHandler` on every studio client; emulate
      // that so the logout clients carry the parking middleware by default.
      const factory = (options: SanityClientConfig): SanityClient =>
        makeClient({...options, _requestHandler: (() => {}) as never})

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
      })

      await waitForState(store, (s) => s.authenticated)

      // Session lapses: everything now 401s, including /auth/logout.
      sessionValid = false

      // Against the bug this rejects with waitForState's own timeout, since the
      // parked /auth/logout leaves allSettled (and thus teardown) hanging.
      const unauthState = waitForState(store, (s) => !s.authenticated, 2000)
      await (store.logout!() as unknown as Promise<void>)

      const state = await unauthState
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })

    it('completes handleCallbackUrl with token fallback when the cookie probe 401s on a middleware-bearing client', async () => {
      // Regression: on login-after-logout, `handleCallbackUrl` exchanges the sid
      // for a token, then `probeCurrentUser` checks /auth/id to see whether the
      // cookie was established. In the studio that probe rides a client carrying
      // the forced-logout middleware (`_requestHandler`); when the cookie is NOT
      // established, /auth/id 401s, the middleware parks it forever, and
      // `processCallback` (which awaits the probe) never resolves — the login
      // callback hangs and the navbar never appears (the auth e2e failure).
      //
      // The fix probes with `withConfig({_requestHandler: undefined})` so the
      // 401 reaches probeCurrentUser's own catch and the flow falls back to
      // token auth. We model the middleware faithfully: /auth/id 401s (cookie
      // not established), parked on a middleware-bearing client, rejecting on a
      // stripped one; the token exchange and /users/me succeed via the token.
      const TOKEN = 'valid-exchanged-token'

      const makeClient = (options: SanityClientConfig): SanityClient => {
        const middlewareActive = Boolean((options as {_requestHandler?: unknown})._requestHandler)
        const usesToken = (options as {token?: string}).token === TOKEN
        const client = {
          config: () => options,
          withConfig: (next: SanityClientConfig) => makeClient({...options, ...next}),
          request: vi.fn(({uri, method}: {uri: string; method?: string}) => {
            if (uri === '/auth/fetch') return Promise.resolve({token: TOKEN})
            if (uri === '/auth/logout' && method === 'POST') return Promise.resolve({ok: true})
            // The cookie is never established, so /auth/id 401s. Parked forever
            // on a middleware-bearing client; rejects on a stripped one.
            if (uri === '/auth/id') {
              return middlewareActive ? new Promise(() => {}) : Promise.reject(create401Error())
            }
            // /users/me authenticates only via the exchanged token.
            if (uri === '/users/me') {
              return usesToken ? Promise.resolve(MOCK_USER) : Promise.reject(create401Error())
            }
            return Promise.resolve({})
          }),
        }
        return client as unknown as SanityClient
      }

      // prepareConfig installs `_requestHandler` on every studio client.
      const factory = (options: SanityClientConfig): SanityClient =>
        makeClient({...options, _requestHandler: (() => {}) as never})

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
        clientFactory: factory,
        getSessionId,
        consumeHashToken: () => undefined,
      })

      // Against the bug, the parked /auth/id leaves handleCallbackUrl pending
      // forever; this await never resolves and the test times out.
      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(true)

      const state = await waitForState(store, (s) => s.authenticated, 2000)
      expect(state.authenticated).toBe(true)
      expect(state.currentUser).toEqual(MOCK_USER)
    })

    it('reports a diagnosed CORS/config failure on the boot probe and resolves logged-out', async () => {
      // The /users/me probe bypasses the studio request handler (its middleware
      // is stripped), so a CORS / missing-project failure would otherwise show
      // a generic network error. With diagnostics injected, it's diagnosed and
      // reported, and the probe resolves as logged-out (no thrown boot error).
      const factory = (_options: SanityClientConfig): SanityClient =>
        ({
          request: vi.fn(({uri}: {uri: string}) => {
            if (uri === '/users/me') {
              return Promise.reject(
                Object.assign(new Error('Failed to fetch'), {isNetworkError: true}),
              )
            }
            return Promise.resolve({})
          }),
        }) as unknown as SanityClient

      const onRequestFailure = vi.fn()
      const diagnose = vi.fn(async () => ({type: 'project-not-found'}) as const)

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'cookie',
        clientFactory: factory,
        getSessionId: () => undefined,
        consumeHashToken: () => undefined,
        getRequestFailureDiagnostics: () => ({diagnose, onRequestFailure}),
      })

      const state = await waitForState(store, (s) => !s.authenticated, 2000)
      expect(state.authenticated).toBe(false)
      expect(diagnose).toHaveBeenCalled()
      expect(onRequestFailure).toHaveBeenCalledWith({type: 'project-not-found'}, expect.anything())
    })
  })
})

describe('createAuthStore: handleCallbackUrl settle contract', () => {
  // handleCallbackUrl must not resolve until authState$ has emitted a state
  // computed with the exchanged credential. AuthBoundary holds its loading
  // screen until the promise settles; resolving while the stale pre-exchange
  // "logged out" probe result is still current re-opens the gate onto the
  // login screen — the flash these tests guard against.

  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
  })

  afterEach(() => {
    localStorage.clear()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  function oneShotSessionId(): () => string | undefined {
    let consumed = false
    return () => {
      if (consumed) return undefined
      consumed = true
      return 'mock-session-id-12345678'
    }
  }

  it.each(['dual', 'token'] as const)(
    'resolves only after the state reflects the exchanged token (%s mode)',
    async (loginMethod) => {
      const TOKEN = 'valid-exchanged-token'
      const factory = createCredentialAwareClientFactory({token: TOKEN, cookieValid: false})

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod,
        clientFactory: factory,
        getSessionId: oneShotSessionId(),
        consumeHashToken: () => undefined,
      })

      const emissions: boolean[] = []
      const sub = store.state.subscribe((s) => emissions.push(s.authenticated))

      // The stale pre-exchange probe result lands first (no credential).
      await waitForState(store, (s) => !s.authenticated)

      const result = await store.handleCallbackUrl!()
      expect(result.success).toBe(true)
      expect(result.stateSettleTimedOut).toBe(false)

      // The ordering assertion: at the moment the promise resolved, a
      // subscriber attached beforehand had already observed the
      // authenticated state — not just "will eventually".
      expect(emissions[emissions.length - 1]).toBe(true)

      sub.unsubscribe()
    },
  )

  it('resolves only after the state reflects the exchanged token applied mid-initial-probe (token mode)', async () => {
    // The exchange can complete while the initial /users/me probe is still in
    // flight. The token client stream must not positionally skip that update
    // (regression: concat(of(initialClient), storage.skip(1)) dropped it and
    // the store never left the credential-less client).
    const TOKEN = 'valid-exchanged-token'
    const factory = createCredentialAwareClientFactory({token: TOKEN, cookieValid: false})

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'token',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    // No waiting for the initial probe — fire the callback immediately so the
    // token update races it.
    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(true)
    expect(result.stateSettleTimedOut).toBe(false)

    const state = await waitForState(store, (s) => s.authenticated, 2000)
    expect(state.currentUser).toEqual(MOCK_USER)
  })

  it('resolves only after the state reflects the established cookie session (cookie mode)', async () => {
    const opts = {token: 'token-unused-in-cookie-mode', cookieValid: false}
    const factory = createCredentialAwareClientFactory(opts)

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const emissions: boolean[] = []
    const sub = store.state.subscribe((s) => emissions.push(s.authenticated))

    await waitForState(store, (s) => !s.authenticated)

    // The login that produced the sid also established the session cookie.
    opts.cookieValid = true

    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(true)
    expect(result.authMethod).toBe('cookie')
    expect(result.stateSettleTimedOut).toBe(false)
    expect(emissions[emissions.length - 1]).toBe(true)

    sub.unsubscribe()
  })

  it('resolves promptly with success: false when the exchange fails, without waiting for state', async () => {
    const factory = (_options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') {
            return Promise.reject(new Error('sid expired'))
          }
          if (uri === '/users/me') return Promise.reject(create401Error())
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'dual',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(false)
    expect(result.error?.type).toBe('auth-failed')
    // The failure path has no settle wait — nothing to wait for, and the
    // caller should show login guidance promptly.
    expect(result.stateSettleDurationMs).toBeUndefined()
  })

  it('resolves with stateSettleTimedOut when the state never reflects the exchange', async () => {
    // A wedged state chain (here: /users/me never settles) must not hang the
    // callback forever — the timeout resolves it and flags the condition.
    vi.useFakeTimers()
    try {
      const factory = (_options: SanityClientConfig): SanityClient =>
        ({
          request: vi.fn(({uri}: {uri: string}) => {
            if (uri === '/auth/fetch') return Promise.resolve({token: 'exchanged-token'})
            if (uri === '/auth/id') {
              return Promise.resolve({id: 'x', expiry: Math.floor(Date.now() / 1000) + 3600})
            }
            // /users/me hangs: authState$ never emits a post-exchange state.
            return new Promise(() => {})
          }),
        }) as unknown as SanityClient

      const store = _createAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        loginMethod: 'dual',
        clientFactory: factory,
        getSessionId: oneShotSessionId(),
        consumeHashToken: () => undefined,
      })

      const resultPromise = store.handleCallbackUrl!()
      await vi.advanceTimersByTimeAsync(AUTH_STATE_SETTLE_TIMEOUT_MS + 1000)

      const result = await resultPromise
      expect(result.success).toBe(true)
      expect(result.stateSettleTimedOut).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('shares the in-flight exchange with concurrent callers instead of resolving already-authenticated', async () => {
    // StrictMode mounts AuthBoundary's callback effect twice in dev. The sid
    // is a one-shot, so the second call finds none — it must piggyback on the
    // in-flight exchange (same result, single /auth/fetch), not resolve
    // 'already-authenticated' early and reopen the loading gate mid-exchange.
    let exchangeCount = 0
    const TOKEN = 'valid-exchanged-token'
    const factory = (options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') {
            exchangeCount += 1
            return Promise.resolve({token: TOKEN})
          }
          if (uri === '/auth/id') {
            return Promise.resolve({id: 'x', expiry: Math.floor(Date.now() / 1000) + 3600})
          }
          if (uri === '/users/me') {
            return options.token === TOKEN
              ? Promise.resolve(MOCK_USER)
              : Promise.reject(create401Error())
          }
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'dual',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const [first, second] = await Promise.all([
      store.handleCallbackUrl!(),
      store.handleCallbackUrl!(),
    ])

    expect(exchangeCount).toBe(1)
    expect(first.flow).toBe('exchange')
    expect(second.flow).toBe('exchange')
    expect(second).toBe(first)
  })

  it('returns a fresh already-authenticated result once the exchange has settled', async () => {
    // Repeat calls after settlement (workspace switch and back, effect
    // re-runs) are ordinary no-sid loads: replaying the historical exchange
    // result would make AuthBoundary re-log its telemetry with stale
    // durations on every remount.
    const TOKEN = 'valid-exchanged-token'
    const factory = createCredentialAwareClientFactory({token: TOKEN, cookieValid: false})

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'dual',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const first = await store.handleCallbackUrl!()
    expect(first.flow).toBe('exchange')

    const second = await store.handleCallbackUrl!()
    expect(second.flow).toBe('already-authenticated')
    expect(second).not.toBe(first)
  })

  it('does not cache a rejected exchange — a later call recovers as already-authenticated', async () => {
    // A transient non-401 error during the post-exchange probe rejects the
    // callback. The sid is spent, so a retry (e.g. an error-boundary
    // remount) must fall through to the normal no-sid path instead of
    // replaying the rejection until a full page reload.
    const TOKEN = 'valid-exchanged-token'
    const factory = (options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') return Promise.resolve({token: TOKEN})
          if (uri === '/auth/id') return Promise.reject(new Error('transient server error'))
          if (uri === '/users/me') {
            return options.token === TOKEN
              ? Promise.resolve(MOCK_USER)
              : Promise.reject(create401Error())
          }
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'dual',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    await expect(store.handleCallbackUrl!()).rejects.toThrow('transient server error')

    const retry = await store.handleCallbackUrl!()
    expect(retry.flow).toBe('already-authenticated')
    expect(retry.success).toBe(true)
  })

  it('resolves promptly with success: false when the exchange returns an empty token (dual mode)', async () => {
    // An empty token never appears on a client (falsy tokens are dropped
    // from the client config), so waiting for the state to reflect it would
    // just burn the settle timeout before reporting the failure. This test
    // times out if that wait regresses.
    const factory = (_options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') return Promise.resolve({token: ''})
          if (uri === '/auth/id') return Promise.reject(create401Error())
          if (uri === '/users/me') return Promise.reject(create401Error())
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'dual',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(false)
    expect(result.failureReason).toBe('token exchange returned empty token')
    expect(result.stateSettleDurationMs).toBeUndefined()
  })

  it('probes /users/me exactly once for a token applied after the initial probe (token mode)', async () => {
    // The token recheck stream exists to catch a token applied while the
    // initial probe was in flight; for tokens applied after it,
    // workspaceClient$ already re-probes — the recheck re-emitting too would
    // duplicate the request.
    const TOKEN = 'valid-exchanged-token'
    let probesWithToken = 0
    const factory = (options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') return Promise.resolve({token: TOKEN})
          if (uri === '/users/me') {
            if (options.token === TOKEN) {
              probesWithToken += 1
              return Promise.resolve(MOCK_USER)
            }
            return Promise.reject(create401Error())
          }
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'token',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const sub = store.state.subscribe(() => {})

    // Let the initial probe finish so the token lands strictly after it.
    await waitForState(store, (s) => !s.authenticated)

    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(true)

    await waitForState(store, (s) => s.authenticated)
    // Give a would-be duplicate probe a chance to fire before counting.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(probesWithToken).toBe(1)

    sub.unsubscribe()
  })

  it('delivers the post-exchange state to a subscriber that connects only after the exchange completed', async () => {
    // The callback probes the post-exchange state itself, so it must
    // complete even when nothing is subscribed to the state chain yet — and
    // the first subscriber to connect afterwards must land on the
    // authenticated state instead of the stale credential-less initial probe.
    const TOKEN = 'valid-exchanged-token'
    const factory = createCredentialAwareClientFactory({token: TOKEN, cookieValid: false})

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'dual',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    // No subscription anywhere: the exchange runs with the state chain cold.
    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(true)
    expect(result.stateSettleTimedOut).toBe(false)

    const state = await waitForState(store, (s) => s.authenticated, 2000)
    expect(state.currentUser).toEqual(MOCK_USER)
  })

  it('converges without timing out when the exchange completes while the initial probe is in flight (cookie mode)', async () => {
    // The initial /users/me goes out before the login cookie exists and
    // resolves 401 only *after* the callback has written cookieAuthState.
    // That stale result must neither stomp the fresher channel value nor
    // leave the store without a re-probe (regression: the settle wait burned
    // its full timeout and the login screen showed despite a valid session).
    const initialProbe = promiseWithResolvers<never>()
    let cookieValid = false
    let usersMeCalls = 0
    const factory = (_options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') {
            return Promise.resolve({token: 'token-unused-in-cookie-mode'})
          }
          if (uri === '/auth/id') {
            return cookieValid
              ? Promise.resolve({id: 'mock-auth-id', expiry: Math.floor(Date.now() / 1000) + 3600})
              : Promise.reject(create401Error())
          }
          if (uri === '/users/me') {
            usersMeCalls += 1
            // The first call is the initial probe: held pending until the
            // test releases it, after the callback has settled the channel.
            if (usersMeCalls === 1) return initialProbe.promise
            return cookieValid ? Promise.resolve(MOCK_USER) : Promise.reject(create401Error())
          }
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const sub = store.state.subscribe(() => {})

    // The login that produced the sid also established the session cookie.
    cookieValid = true
    const callback = store.handleCallbackUrl!()
    // Let the exchange + /auth/id probe + cookieAuthState write complete
    // while the initial probe is still pending.
    await new Promise((resolve) => setTimeout(resolve, 10))
    // Now the stale pre-cookie 401 lands.
    initialProbe.reject(create401Error())

    const result = await callback
    expect(result.success).toBe(true)
    expect(result.stateSettleTimedOut).toBe(false)

    const state = await waitForState(store, (s) => s.authenticated)
    expect(state.currentUser).toEqual(MOCK_USER)

    sub.unsubscribe()
  })

  it('expires an unconsumed callback state instead of emitting it long after the exchange (cookie mode)', async () => {
    // A cookie-mode login that lands while the channel already reads
    // authenticated is a no-op for the state chain (distinctUntilChanged
    // suppresses the write), so nothing consumes the pre-probed one-shot.
    // A chain emission long after the settle window — here a cross-tab
    // logout/login cycle — must probe fresh instead of emitting the stale
    // exchange-time snapshot.
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    let currentUser: CurrentUser = MOCK_USER
    const factory = (_options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') return Promise.resolve({token: 'exchanged-token'})
          if (uri === '/auth/id') {
            return Promise.resolve({
              id: 'mock-auth-id',
              expiry: Math.floor(Date.now() / 1000) + 3600,
            })
          }
          if (uri === '/users/me') return Promise.resolve(currentUser)
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const sub = store.state.subscribe(() => {})

    // Already authenticated at boot: the callback's channel write changes
    // nothing, so the one-shot lingers unconsumed.
    await waitForState(store, (s) => s.authenticated)
    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(true)

    // Long after the settle window, another tab logs out and a different
    // user logs in.
    now += AUTH_STATE_SETTLE_TIMEOUT_MS + 1
    currentUser = {...MOCK_USER, id: 'fresh-user-456'}

    const channel = new BroadcastChannel(`__studio_auth_cookie_state_${PROJECT_ID}`)
    channel.postMessage(JSON.stringify({authenticated: false}))
    await waitForState(store, (s) => !s.authenticated)
    channel.postMessage(JSON.stringify({authenticated: true}))
    channel.close()

    // Fresh probe, not the stale exchange-time snapshot.
    const state = await waitForState(store, (s) => s.authenticated)
    expect(state.currentUser?.id).toBe('fresh-user-456')

    sub.unsubscribe()
  })

  it('drops an unconsumed callback state on credential teardown within the settle window (cookie mode)', async () => {
    // Same linger setup as the expiry test above, but the cross-tab
    // logout/login cycle happens INSIDE the settle window, where the
    // one-shot is still fresh. The unauthenticated emission (credential
    // teardown) must clear it — same rule as logout() — so the login that
    // follows probes fresh instead of emitting the stale snapshot.
    let currentUser: CurrentUser = MOCK_USER
    const factory = (_options: SanityClientConfig): SanityClient =>
      ({
        request: vi.fn(({uri}: {uri: string}) => {
          if (uri === '/auth/fetch') return Promise.resolve({token: 'exchanged-token'})
          if (uri === '/auth/id') {
            return Promise.resolve({
              id: 'mock-auth-id',
              expiry: Math.floor(Date.now() / 1000) + 3600,
            })
          }
          if (uri === '/users/me') return Promise.resolve(currentUser)
          return Promise.resolve({})
        }),
      }) as unknown as SanityClient

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: oneShotSessionId(),
      consumeHashToken: () => undefined,
    })

    const sub = store.state.subscribe(() => {})

    // Already authenticated at boot: the callback's channel write changes
    // nothing, so the one-shot lingers unconsumed.
    await waitForState(store, (s) => s.authenticated)
    const result = await store.handleCallbackUrl!()
    expect(result.success).toBe(true)

    // Immediately after — well within the settle window — another tab logs
    // out and a different user logs in.
    currentUser = {...MOCK_USER, id: 'fresh-user-456'}

    const channel = new BroadcastChannel(`__studio_auth_cookie_state_${PROJECT_ID}`)
    channel.postMessage(JSON.stringify({authenticated: false}))
    await waitForState(store, (s) => !s.authenticated)
    channel.postMessage(JSON.stringify({authenticated: true}))
    channel.close()

    // Fresh probe, not the stale exchange-time snapshot.
    const state = await waitForState(store, (s) => s.authenticated)
    expect(state.currentUser?.id).toBe('fresh-user-456')

    sub.unsubscribe()
  })
})

describe('createAuthStore: currentUser attributes', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
  })

  afterEach(() => {
    localStorage.clear()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it('preserves attributes from /users/me response', async () => {
    const mock = createMockClientFactory()

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: mock.factory,
      getSessionId: () => undefined,
      consumeHashToken: () => undefined,
    })

    const state = await waitForState(store, (s) => s.authenticated)
    expect(state.currentUser?.attributes).toEqual(MOCK_USER.attributes)
  })
})

describe('createAuthStore: workbench OS token', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ''
  })

  afterEach(() => {
    localStorage.clear()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it('authenticates from the OS token, overriding loginMethod, without persisting it', async () => {
    const OS_TOKEN = 'workbench-os-token'
    // Cookie mode with an invalid cookie: without the OS token the store would be
    // unauthenticated. Authenticating proves the OS token takes precedence and the
    // loginMethod machinery is bypassed.
    const factory = createCredentialAwareClientFactory({token: OS_TOKEN, cookieValid: false})

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: () => undefined,
      consumeHashToken: () => undefined,
      observeWorkbenchToken: () => of(OS_TOKEN),
    })

    const state = await waitForState(store, (s) => s.authenticated, 2000)
    expect(state.authenticated).toBe(true)
    expect(state.currentUser).toEqual(MOCK_USER)

    // The OS token is used in-memory only and must never be written to storage.
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('exposes the OS token on the token output (for Bifur/realtime), not the stored one', async () => {
    // Bifur authenticates from `auth.token`, so it must carry the OS token —
    // not the (unwritten/stale) storage token.
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'stale-stored-token'}))
    const OS_TOKEN = 'workbench-os-token'
    const factory = createCredentialAwareClientFactory({token: OS_TOKEN, cookieValid: false})

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: () => undefined,
      consumeHashToken: () => undefined,
      observeWorkbenchToken: () => of(OS_TOKEN),
    })

    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    expect(await firstValueFrom(store.token)).toBe(OS_TOKEN)
  })

  it('is unauthenticated when the OS is signed out, ignoring a stored token', async () => {
    // Even with a valid stored token, an OS-embedded studio must follow the OS:
    // a `null` emission means signed out, and the loginMethod flow is bypassed.
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'mock-token'}))
    const mock = createMockClientFactory()

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'token',
      clientFactory: mock.factory,
      getSessionId: () => undefined,
      consumeHashToken: () => undefined,
      observeWorkbenchToken: () => of(null),
    })

    const state = await firstValueFrom(store.state)
    expect(state.authenticated).toBe(false)
  })

  it('tracks the OS auth state over time — a later sign-out logs the studio out', async () => {
    // Regression guard for the "auth frozen after OS token" case: the stream must
    // keep emitting so an OS sign-out (null) transitions to unauthenticated
    // instead of replaying the authenticated result forever.
    const OS_TOKEN = 'workbench-os-token'
    const factory = createCredentialAwareClientFactory({token: OS_TOKEN, cookieValid: false})
    const token$ = new BehaviorSubject<string | null>(OS_TOKEN)

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: () => undefined,
      consumeHashToken: () => undefined,
      observeWorkbenchToken: () => token$,
    })

    await waitForState(store, (s) => s.authenticated, 2000)

    // OS signs out.
    token$.next(null)
    const state = await waitForState(store, (s) => !s.authenticated, 2000)
    expect(state.authenticated).toBe(false)
  })

  it('refreshes the OS token instead of tearing down on logout (forced 401)', async () => {
    // In the workbench, a forced logout (rejected token) must ask the OS to
    // reissue rather than clear local state or hit /auth/logout.
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'stored-token'}))
    const OS_TOKEN = 'workbench-os-token'
    const factory = createCredentialAwareClientFactory({token: OS_TOKEN, cookieValid: false})
    const refreshWorkbenchToken = vi.fn()

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'cookie',
      clientFactory: factory,
      getSessionId: () => undefined,
      consumeHashToken: () => undefined,
      observeWorkbenchToken: () => of(OS_TOKEN),
      refreshWorkbenchToken,
    })

    await waitForState(store, (s) => s.authenticated, 2000)
    await store.logout!()

    expect(refreshWorkbenchToken).toHaveBeenCalledTimes(1)
    // Local state is left intact — the OS drives sign-out, not us.
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toEqual(JSON.stringify({token: 'stored-token'}))
  })

  it('falls through to the normal flow when not embedded in the workbench', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({token: 'mock-token'}))
    const mock = createMockClientFactory()

    const store = _createAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      loginMethod: 'token',
      clientFactory: mock.factory,
      getSessionId: () => undefined,
      consumeHashToken: () => undefined,
      observeWorkbenchToken: () => undefined,
    })

    const state = await waitForState(store, (s) => s.authenticated)
    expect(state.authenticated).toBe(true)
  })
})
