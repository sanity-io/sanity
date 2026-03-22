import {type SanityClient} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

// Mock heavy transitive imports that aren't needed for auth store tests
vi.mock('../../../../studioClient', () => ({
  DEFAULT_STUDIO_CLIENT_HEADERS: {'x-sanity-app': 'studio@test'},
}))

vi.mock('../../cors', () => ({
  CorsOriginError: class CorsOriginError extends Error {},
}))

vi.mock('../createLoginComponent', () => ({
  createLoginComponent: () => () => null,
}))

// Spy on storage via mock so we can track calls across module re-imports
const storageSetItemSpy = vi.fn()
const storageGetItemSpy = vi.fn(() => undefined)
const storageRemoveItemSpy = vi.fn()

vi.mock('../storage', () => ({
  setItem: (...args: any[]) => storageSetItemSpy(...args),
  getItem: (...args: any[]) => storageGetItemSpy(...args),
  removeItem: (...args: any[]) => storageRemoveItemSpy(...args),
}))

// Track all clients created by the factory so we can inspect their config
interface MockClientCall {
  options: Record<string, any>
  client: SanityClient
}

function createMockClientFactory() {
  const calls: MockClientCall[] = []

  const factory = vi.fn((options: Record<string, any>) => {
    const client = {
      config: () => ({projectId: options.projectId, apiHost: 'https://api.sanity.io'}),
      request: vi.fn((reqOptions: {uri: string; query?: Record<string, string>}) => {
        if (reqOptions.uri === '/users/me') {
          return Promise.resolve({id: 'user-123', name: 'Test User', roles: [{name: 'admin'}]})
        }
        if (reqOptions.uri === '/auth/fetch') {
          return Promise.resolve({token: 'exchanged-token-abc123'})
        }
        return Promise.resolve(null)
      }),
    } as unknown as SanityClient

    calls.push({options, client})
    return client
  })

  return {factory, calls}
}

describe('createAuthStore', () => {
  beforeEach(() => {
    vi.resetModules()
    storageSetItemSpy.mockClear()
    storageGetItemSpy.mockClear()
    storageRemoveItemSpy.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handleCallbackUrl', () => {
    describe('dual mode (default)', () => {
      it('should trade session for token and save to localStorage even when cookie auth works', async () => {
        // Mock sessionId module to return a SID
        vi.doMock('../sessionId', () => {
          let sid: string | null = 'test-sid-dual-mode'
          return {
            getSessionId: () => {
              const id = sid
              sid = null
              return id
            },
            hasSessionId: () => sid !== null,
          }
        })

        const {_createAuthStore} = await import('../createAuthStore')
        const {factory, calls} = createMockClientFactory()

        const store = _createAuthStore({
          projectId: 'test-project',
          dataset: 'production',
          clientFactory: factory,
          loginMethod: 'dual',
        })

        await store.handleCallbackUrl!()

        // The SID should have been exchanged for a token
        const fetchCalls = calls.flatMap(({client}) =>
          (client.request as ReturnType<typeof vi.fn>).mock.calls.filter(
            ([opts]: [any]) => opts.uri === '/auth/fetch',
          ),
        )
        expect(fetchCalls.length).toBeGreaterThan(0)
        expect(fetchCalls[0][0].query).toEqual({sid: 'test-sid-dual-mode'})

        // Token should have been saved to localStorage
        expect(storageSetItemSpy).toHaveBeenCalledWith(
          '__studio_auth_token_test-project',
          expect.stringContaining('exchanged-token-abc123'),
        )
      })
    })

    describe('token mode', () => {
      it('should trade session for token and save to localStorage', async () => {
        vi.doMock('../sessionId', () => {
          let sid: string | null = 'test-sid-token-mode'
          return {
            getSessionId: () => {
              const id = sid
              sid = null
              return id
            },
            hasSessionId: () => sid !== null,
          }
        })

        const {_createAuthStore} = await import('../createAuthStore')
        const {factory, calls} = createMockClientFactory()

        const store = _createAuthStore({
          projectId: 'test-project',
          dataset: 'production',
          clientFactory: factory,
          loginMethod: 'token',
        })

        await store.handleCallbackUrl!()

        // The SID should have been exchanged for a token
        const fetchCalls = calls.flatMap(({client}) =>
          (client.request as ReturnType<typeof vi.fn>).mock.calls.filter(
            ([opts]: [any]) => opts.uri === '/auth/fetch',
          ),
        )
        expect(fetchCalls.length).toBeGreaterThan(0)

        // Token should have been saved to localStorage
        expect(storageSetItemSpy).toHaveBeenCalledWith(
          '__studio_auth_token_test-project',
          expect.stringContaining('exchanged-token-abc123'),
        )
      })

      it('should not use withCredentials for the SID exchange request', async () => {
        vi.doMock('../sessionId', () => {
          let sid: string | null = 'test-sid-no-credentials'
          return {
            getSessionId: () => {
              const id = sid
              sid = null
              return id
            },
            hasSessionId: () => sid !== null,
          }
        })

        const {_createAuthStore} = await import('../createAuthStore')
        const {factory, calls} = createMockClientFactory()

        const store = _createAuthStore({
          projectId: 'test-project',
          dataset: 'production',
          clientFactory: factory,
          loginMethod: 'token',
        })

        await store.handleCallbackUrl!()

        // Find the client used for the /auth/fetch request
        const clientUsedForFetch = calls.find(({client}) =>
          (client.request as ReturnType<typeof vi.fn>).mock.calls.some(
            ([opts]: [any]) => opts.uri === '/auth/fetch',
          ),
        )

        expect(clientUsedForFetch).toBeDefined()
        // The client should NOT have been created with withCredentials
        expect(clientUsedForFetch!.options.withCredentials).toBeUndefined()
      })
    })

    describe('cookie mode', () => {
      it('should NOT trade session for token', async () => {
        vi.doMock('../sessionId', () => {
          let sid: string | null = 'test-sid-cookie-mode'
          return {
            getSessionId: () => {
              const id = sid
              sid = null
              return id
            },
            hasSessionId: () => sid !== null,
          }
        })

        const {_createAuthStore} = await import('../createAuthStore')
        const {factory, calls} = createMockClientFactory()

        const store = _createAuthStore({
          projectId: 'test-project',
          dataset: 'production',
          clientFactory: factory,
          loginMethod: 'cookie',
        })

        await store.handleCallbackUrl!()

        // No /auth/fetch calls should have been made
        const fetchCalls = calls.flatMap(({client}) =>
          (client.request as ReturnType<typeof vi.fn>).mock.calls.filter(
            ([opts]: [any]) => opts.uri === '/auth/fetch',
          ),
        )
        expect(fetchCalls).toHaveLength(0)
      })
    })
  })

  describe('state$ pipeline', () => {
    it('should emit authenticated state after session exchange in token mode', async () => {
      vi.doMock('../sessionId', () => {
        let sid: string | null = 'test-sid-state-pipeline'
        return {
          getSessionId: () => {
            const id = sid
            sid = null
            return id
          },
          hasSessionId: () => sid !== null,
        }
      })

      const {_createAuthStore} = await import('../createAuthStore')
      const {factory} = createMockClientFactory()

      const store = _createAuthStore({
        projectId: 'test-project',
        dataset: 'production',
        clientFactory: factory,
        loginMethod: 'token',
      })

      // Trigger the callback to exchange the token
      await store.handleCallbackUrl!()

      // state$ should eventually emit an authenticated state
      const state = await firstValueFrom(store.state)
      expect(state.authenticated).toBe(true)
      expect(state.currentUser).toEqual({
        id: 'user-123',
        name: 'Test User',
        roles: [{name: 'admin'}],
      })
    })
  })
})
