import {type ClientConfig, type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {firstValueFrom, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {CorsOriginError} from '../../cors'
import {_createAuthStore, type AuthStoreOptions} from '../createAuthStore'
import {createBroadcastChannel} from '../createBroadcastChannel'
import {getSessionId} from '../sessionId'
import * as storage from '../storage'

vi.mock('../sessionId', () => ({
  getSessionId: vi.fn(() => null),
}))

vi.mock('../createLoginComponent', () => ({
  createLoginComponent: vi.fn(() => () => null),
}))

vi.mock('../createBroadcastChannel', () => ({
  createBroadcastChannel: vi.fn(() => {
    const subject = new Subject<string | null>()
    return {
      messages: subject.asObservable(),
      broadcast: (msg: string | null) => subject.next(msg),
    }
  }),
}))

vi.mock('../storage', () => ({
  setItem: vi.fn(),
  getItem: vi.fn(() => undefined),
  removeItem: vi.fn(),
}))

class HttpError extends Error {
  statusCode?: number
  isNetworkError?: boolean
  request?: {url: string}

  constructor(message: string, statusCode?: number) {
    super(message)
    this.statusCode = statusCode
  }
}

const mockUser: CurrentUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'administrator',
  roles: [{name: 'administrator', title: 'Administrator'}],
  profileImage: 'https://example.com/avatar.png',
}

function createMockClientFactory(
  requestHandler: (options: {uri: string; [key: string]: unknown}) => unknown = () =>
    Promise.resolve(mockUser),
) {
  return vi.fn((config: ClientConfig) => {
    const client = {
      config: () => ({apiHost: 'https://api.sanity.io', ...config}),
      request: vi.fn(requestHandler),
      withConfig: vi.fn(() => client),
    } as unknown as SanityClient
    return client
  })
}

function getDefaultOptions(overrides: Partial<AuthStoreOptions> = {}): AuthStoreOptions {
  return {
    projectId: 'test-project',
    dataset: 'production',
    clientFactory: createMockClientFactory(),
    ...overrides,
  }
}

/** Helper to set up a broadcast spy and return it along with a fresh Subject */
function setupBroadcastSpy() {
  const broadcastSpy = vi.fn()
  const subject = new Subject<string | null>()
  ;(createBroadcastChannel as Mock).mockReturnValue({
    messages: subject.asObservable(),
    broadcast: broadcastSpy,
  })
  return {broadcastSpy, subject}
}

describe('createAuthStore', () => {
  let broadcastSubject: Subject<string | null>

  beforeEach(() => {
    vi.clearAllMocks()
    broadcastSubject = new Subject<string | null>()
    ;(createBroadcastChannel as Mock).mockReturnValue({
      messages: broadcastSubject.asObservable(),
      broadcast: (msg: string | null) => broadcastSubject.next(msg),
    })
  })

  afterEach(() => {
    broadcastSubject.complete()
  })

  describe('state pipeline: token → client → getCurrentUser → AuthState', () => {
    it('emits authenticated state when /users/me returns a user with an id', async () => {
      const clientFactory = createMockClientFactory(() => Promise.resolve(mockUser))
      const store = _createAuthStore(getDefaultOptions({clientFactory}))

      const statePromise = firstValueFrom(store.state)
      broadcastSubject.next(null)

      const state = await statePromise
      expect(state.authenticated).toBe(true)
      expect(state.currentUser).toEqual(mockUser)
      expect(state.client).toBeDefined()
    })

    it('emits unauthenticated state when /users/me returns null or user without id', async () => {
      const clientFactory = createMockClientFactory(() =>
        Promise.resolve({name: 'No ID', email: 'x@y.com'}),
      )
      const store = _createAuthStore(getDefaultOptions({clientFactory}))

      const statePromise = firstValueFrom(store.state)
      broadcastSubject.next(null)

      const state = await statePromise
      expect(state.authenticated).toBe(false)
      expect(state.currentUser).toBeNull()
    })

    it('replays the last state to late subscribers via shareReplay', async () => {
      const clientFactory = createMockClientFactory(() => Promise.resolve(mockUser))
      const store = _createAuthStore(getDefaultOptions({clientFactory}))

      const firstState = firstValueFrom(store.state)
      broadcastSubject.next(null)
      await firstState

      // Late subscriber gets the same cached state
      const lateState = await firstValueFrom(store.state)
      expect(lateState.authenticated).toBe(true)
      expect(lateState.currentUser).toEqual(mockUser)
    })
  })

  describe('login method → client auth configuration', () => {
    it('"token" mode: uses stored token from localStorage', async () => {
      ;(storage.getItem as Mock).mockReturnValue(JSON.stringify({token: 'my-token'}))

      const clientFactory = createMockClientFactory(() => Promise.resolve(mockUser))
      _createAuthStore(getDefaultOptions({clientFactory, loginMethod: 'token'}))

      // startWith triggers immediately with stored token, no broadcast needed
      await firstValueFrom(
        _createAuthStore(getDefaultOptions({clientFactory, loginMethod: 'token'})).state,
      )

      expect(clientFactory).toHaveBeenCalledWith(expect.objectContaining({token: 'my-token'}))
    })

    it('"cookie" mode: uses withCredentials, ignores stored tokens', async () => {
      const clientFactory = createMockClientFactory(() => Promise.resolve(mockUser))
      const store = _createAuthStore(getDefaultOptions({clientFactory, loginMethod: 'cookie'}))

      const statePromise = firstValueFrom(store.state)
      broadcastSubject.next(null)
      await statePromise

      expect(clientFactory).toHaveBeenCalledWith(expect.objectContaining({withCredentials: true}))
      // Token should not appear in config
      expect(clientFactory).not.toHaveBeenCalledWith(
        expect.objectContaining({token: expect.any(String)}),
      )
    })

    it('"dual" mode: uses token when available, falls back to withCredentials', async () => {
      const clientFactory = createMockClientFactory(() => Promise.resolve(mockUser))
      const store = _createAuthStore(getDefaultOptions({clientFactory, loginMethod: 'dual'}))

      // With no token → withCredentials
      let statePromise = firstValueFrom(store.state)
      broadcastSubject.next(null)
      await statePromise
      expect(clientFactory).toHaveBeenCalledWith(expect.objectContaining({withCredentials: true}))

      // With token → token auth
      statePromise = firstValueFrom(store.state)
      broadcastSubject.next('broadcast-token')
      await statePromise
      expect(clientFactory).toHaveBeenCalledWith(
        expect.objectContaining({token: 'broadcast-token'}),
      )
    })
  })

  describe('error handling in getCurrentUser', () => {
    it('401: clears stored token and broadcasts null', async () => {
      let callCount = 0
      const clientFactory = createMockClientFactory(() => {
        callCount++
        if (callCount === 1) return Promise.reject(new HttpError('Unauthorized', 401))
        // second call after token cleared
        return Promise.resolve(null)
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory}))

      const statePromise = firstValueFrom(store.state)
      broadcastSubject.next('invalid-token')

      const state = await statePromise
      expect(state.authenticated).toBe(false)
      expect(storage.removeItem).toHaveBeenCalledWith('__studio_auth_token_test-project')
    })

    it('non-auth error + /ping succeeds → throws CorsOriginError', async () => {
      const clientFactory = createMockClientFactory((options) => {
        if (options.uri === '/users/me') return Promise.reject(new HttpError('Network error'))
        if (options.uri === '/ping') return Promise.resolve('pong')
        throw new Error(
          `Unexpected request to ${options.uri} during test. Please verify that all requests are handled`,
        )
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory}))
      broadcastSubject.next(null)

      await expect(firstValueFrom(store.state)).rejects.toThrow(CorsOriginError)
    })

    it('CorsOriginError.isStaging is true when apiHost ends with .work', async () => {
      const clientFactory = createMockClientFactory((options) => {
        if (options.uri === '/users/me') return Promise.reject(new HttpError('Network error'))
        if (options.uri === '/ping') return Promise.resolve('pong')
        throw new Error(
          `Unexpected request to ${options.uri} during test. Please verify that all requests are handled`,
        )
      })

      const store = _createAuthStore(
        getDefaultOptions({clientFactory, apiHost: 'https://api.sanity.work'}),
      )
      broadcastSubject.next(null)

      try {
        await firstValueFrom(store.state)
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(CorsOriginError)
        expect((err as CorsOriginError).isStaging).toBe(true)
      }
    })

    it('non-auth error + /ping fails → rethrows original error', async () => {
      const clientFactory = createMockClientFactory((options) => {
        if (options.uri === '/users/me') return Promise.reject(new HttpError('Server Error', 500))
        if (options.uri === '/ping') return Promise.reject(new Error('Network failure'))
        throw new Error(
          `Unexpected request to ${options.uri} during test. Please verify that all requests are handled`,
        )
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory}))
      broadcastSubject.next(null)

      await expect(firstValueFrom(store.state)).rejects.toThrow('Server Error')
    })

    it('network error with no message → wraps with host info', async () => {
      const networkError = new HttpError('')
      networkError.isNetworkError = true
      networkError.request = {url: 'https://api.sanity.io/v2021-06-07/users/me'}

      const clientFactory = createMockClientFactory((options) => {
        if (options.uri === '/users/me') return Promise.reject(networkError)
        if (options.uri === '/ping') return Promise.reject(new Error('Also failed'))
        throw new Error(
          `Unexpected request to ${options.uri} during test. Please verify that all requests are handled`,
        )
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory}))
      broadcastSubject.next(null)

      await expect(firstValueFrom(store.state)).rejects.toThrow(
        'Unknown network error attempting to reach api.sanity.io',
      )
    })
  })

  describe('logout', () => {
    it('clears token, posts to /auth/logout, and broadcasts null', async () => {
      ;(storage.getItem as Mock).mockReturnValue(JSON.stringify({token: 'my-token'}))
      const {broadcastSpy, subject} = setupBroadcastSpy()
      broadcastSubject = subject

      const requestMock = vi.fn(() => Promise.resolve(undefined))
      const clientFactory = vi.fn((config: ClientConfig) => {
        const client = {
          config: () => ({...config}),
          request: requestMock,
          withConfig: vi.fn(() => client),
        } as unknown as SanityClient
        return client
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory}))
      // logout() is typed as () => void but actually returns a Promise
      await (store.logout!() as unknown as Promise<void>)

      expect(storage.removeItem).toHaveBeenCalledWith('__studio_auth_token_test-project')
      expect(requestMock).toHaveBeenCalledWith({uri: '/auth/logout', method: 'POST'})
      expect(broadcastSpy).toHaveBeenCalledWith(null)
    })
  })

  describe('handleCallbackUrl', () => {
    it('no session ID: broadcasts stored token (dual) or null (cookie)', async () => {
      ;(getSessionId as Mock).mockReturnValue(null)
      ;(storage.getItem as Mock).mockReturnValue(JSON.stringify({token: 'existing-token'}))

      // dual mode → broadcasts stored token
      const {broadcastSpy: dualSpy, subject: dualSubject} = setupBroadcastSpy()
      broadcastSubject = dualSubject
      const dualStore = _createAuthStore(getDefaultOptions({loginMethod: 'dual'}))
      await dualStore.handleCallbackUrl!()
      expect(dualSpy).toHaveBeenCalledWith('existing-token')

      // cookie mode → broadcasts null
      const {broadcastSpy: cookieSpy, subject: cookieSubject} = setupBroadcastSpy()
      broadcastSubject = cookieSubject
      const cookieStore = _createAuthStore(getDefaultOptions({loginMethod: 'cookie'}))
      await cookieStore.handleCallbackUrl!()
      expect(cookieSpy).toHaveBeenCalledWith(null)
    })

    it('with session ID in dual mode: tries cookie auth first, trades for token if that fails', async () => {
      ;(getSessionId as Mock).mockReturnValue('session-id-01234567890123')
      const {broadcastSpy, subject} = setupBroadcastSpy()
      broadcastSubject = subject

      const clientFactory = vi.fn((config: ClientConfig) => {
        const client = {
          config: () => ({...config}),
          request: vi.fn((options: {uri: string; [key: string]: unknown}) => {
            if (options.uri === '/users/me') return Promise.resolve(null) // cookie auth fails
            if (options.uri === '/auth/fetch')
              return Promise.resolve({token: 'new-token-from-session'})
            throw new Error(
              `Unexpected request to ${options.uri} during test. Please verify that all requests are handled`,
            )
          }),
          withConfig: vi.fn(() => client),
        } as unknown as SanityClient
        return client
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory, loginMethod: 'dual'}))
      await store.handleCallbackUrl!()

      expect(storage.setItem).toHaveBeenCalledWith(
        '__studio_auth_token_test-project',
        expect.stringContaining('new-token-from-session'),
      )
      expect(broadcastSpy).toHaveBeenCalledWith('new-token-from-session')
    })

    it('with session ID in dual mode: skips token trade if cookie auth succeeds', async () => {
      ;(getSessionId as Mock).mockReturnValue('session-id-01234567890123')
      const {broadcastSpy, subject} = setupBroadcastSpy()
      broadcastSubject = subject

      const clientFactory = vi.fn((config: ClientConfig) => {
        const client = {
          config: () => ({...config}),
          request: vi.fn((options: {uri: string}) => {
            if (options.uri === '/users/me') {
              return Promise.resolve(mockUser)
            }
            throw new Error(
              `Unexpected request to ${options.uri} during test. Please verify that all requests are handled`,
            )
          }),
          withConfig: vi.fn(() => client),
        } as unknown as SanityClient
        return client
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory, loginMethod: 'dual'}))
      await store.handleCallbackUrl!()

      expect(broadcastSpy).toHaveBeenCalledWith(null)
      expect(storage.setItem).not.toHaveBeenCalled()
    })

    it('with session ID in cookie mode: does not trade for token', async () => {
      ;(getSessionId as Mock).mockReturnValue('session-id-01234567890123')
      const {broadcastSpy, subject} = setupBroadcastSpy()
      broadcastSubject = subject

      const clientFactory = vi.fn((config: ClientConfig) => {
        const client = {
          config: () => ({...config}),
          request: vi.fn((options: {uri: string}) => {
            if (options.uri === '/users/me') return Promise.resolve(mockUser)
            throw new Error(
              `Unexpected request to ${options.uri} during test. Please verify that all requests are handled`,
            )
          }),
          withConfig: vi.fn(() => client),
        } as unknown as SanityClient
        return client
      })

      const store = _createAuthStore(getDefaultOptions({clientFactory, loginMethod: 'cookie'}))
      await store.handleCallbackUrl!()

      expect(broadcastSpy).toHaveBeenCalledWith(null)
    })
  })

  describe('broadcast channel', () => {
    it('uses a project-specific namespace', () => {
      _createAuthStore(getDefaultOptions({projectId: 'my-project'}))
      expect(createBroadcastChannel).toHaveBeenCalledWith('dual_mode_auth_my-project')
    })
  })
})
