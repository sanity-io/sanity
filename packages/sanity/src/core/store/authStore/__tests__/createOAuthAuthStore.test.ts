import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  type RequestHandler,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {firstValueFrom} from 'rxjs'
import {filter} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getOAuthFlowStorageKey, getOAuthTokensStorageKey} from '../constants'
import {
  _createOAuthAuthStore,
  type OAuthAuthStoreEnvironment,
  type OAuthTokens,
} from '../createOAuthAuthStore'
import {
  type OAuthEndpoints,
  OAuthRequestError,
  type OAuthTokenResponse,
} from '../oauth/oauthEndpoints'
import {type AuthState} from '../types'

// Mock supportsLocalStorage to return true so the token pair is persisted to localStorage.
// In jsdom/Node.js it returns false because process.versions.node is defined.
vi.mock('../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
}))

const MOCK_USER: CurrentUser = {
  id: 'mock-user-123',
  name: 'Test User',
  email: 'test@example.com',
  profileImage: '',
  provider: 'sanity',
  // oxlint-disable-next-line no-deprecated -- required by the CurrentUser type
  role: '',
  roles: [{name: 'editor', title: 'Editor'}],
}

const PROJECT_ID = 'test-project'
const DATASET = 'test-dataset'
const CLIENT_ID = 'oc-test-client'
const ORIGIN = 'http://localhost:3333'
const TOKENS_KEY = getOAuthTokensStorageKey(PROJECT_ID, CLIENT_ID)
const FLOW_KEY = getOAuthFlowStorageKey(PROJECT_ID)

/** A 401 the API tags as an expired session, as the client throws it. */
function createExpiredSessionError(): ClientError {
  return new ClientError({
    statusCode: 401,
    headers: {},
    body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX', statusCode: 401},
    method: 'GET',
    statusMessage: 'Unauthorized',
    url: `https://${PROJECT_ID}.api.sanity.io/v1/users/me`,
  })
}

function tokenResponse(accessToken: string, refreshToken: string): OAuthTokenResponse {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
  }
}

function storedTokens(accessToken: string, refreshToken: string): OAuthTokens {
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 3_600_000,
    refreshAt: Date.now() + 2_880_000,
  }
}

/**
 * Client factory whose `/users/me` answers for the tokens in `validTokens`, and 401s with an
 * expired session for anything else. Records the configs it was called with.
 */
function createMockClientFactory(validTokens: Set<string>) {
  const configs: SanityClientConfig[] = []
  const factory = (config: SanityClientConfig): SanityClient => {
    configs.push(config)
    return {
      config: () => config,
      request: vi.fn(({url}: {url: string}) => {
        if (url === '/users/me') {
          return config.token && validTokens.has(config.token)
            ? Promise.resolve(MOCK_USER)
            : Promise.reject(createExpiredSessionError())
        }
        return Promise.resolve({})
      }),
    } as unknown as SanityClient
  }
  return {factory, configs}
}

function createMockEndpoints(overrides: Partial<OAuthEndpoints> = {}): OAuthEndpoints {
  return {
    authorizeUrl: ({clientId, redirectUri, codeChallenge, state}) =>
      `https://api.sanity.io/v1/auth/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`,
    exchangeCode: vi.fn(async () => tokenResponse('access-1', 'refresh-1')),
    refresh: vi.fn(async () => tokenResponse('access-2', 'refresh-2')),
    revoke: vi.fn(async () => {}),
    ...overrides,
  }
}

function createEnvironment(search = '') {
  const location = {origin: ORIGIN, pathname: '/', search}
  return {
    location,
    getLocation: () => location,
    navigate: vi.fn<(url: string) => void>(),
    replaceUrl: vi.fn((path: string) => {
      const url = new URL(path, ORIGIN)
      location.pathname = url.pathname
      location.search = url.search
    }),
    withLock: ((_name, task) => task()) satisfies OAuthAuthStoreEnvironment['withLock'],
  }
}

function authenticatedState(state: AuthStateSource): Promise<AuthState> {
  return firstValueFrom(state.pipe(filter((s) => s.authenticated)))
}

type AuthStateSource = ReturnType<typeof _createOAuthAuthStore>['state']

describe('createOAuthAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits an unauthenticated state without a stored token pair', async () => {
    const {factory} = createMockClientFactory(new Set())
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      clientId: CLIENT_ID,
      clientFactory: factory,
      endpoints: createMockEndpoints(),
      ...createEnvironment(),
    })

    const state = await firstValueFrom(store.state)
    expect(state.authenticated).toBe(false)
    expect(state.currentUser).toBeNull()
    expect(store.LoginComponent).toBeDefined()
  })

  it('authenticates with a stored token pair', async () => {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
    const {factory} = createMockClientFactory(new Set(['access-1']))
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: DATASET,
      clientId: CLIENT_ID,
      clientFactory: factory,
      endpoints: createMockEndpoints(),
      ...createEnvironment(),
    })

    const state = await authenticatedState(store.state)
    expect(state.currentUser?.id).toBe(MOCK_USER.id)
    await expect(firstValueFrom(store.token!)).resolves.toBe('access-1')
  })

  describe('handleCallbackUrl', () => {
    it('resolves promptly as already authenticated when the URL has no authorization response', async () => {
      const {factory} = createMockClientFactory(new Set())
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment(),
      })

      const result = await store.handleCallbackUrl!()
      expect(result).toMatchObject({flow: 'already-authenticated', success: true})
      expect(endpoints.exchangeCode).not.toHaveBeenCalled()
    })

    it('exchanges the code, strips it from the URL, and resolves once the state is authenticated', async () => {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({
          codeVerifier: 'verifier',
          state: 'expected-state',
          redirectUri: ORIGIN,
          redirectPath: '/structure',
        }),
      )
      const environment = createEnvironment('?code=the-code&state=expected-state')
      const {factory} = createMockClientFactory(new Set(['access-1']))
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...environment,
      })

      const result = await store.handleCallbackUrl!()

      expect(endpoints.exchangeCode).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        redirectUri: ORIGIN,
        code: 'the-code',
        codeVerifier: 'verifier',
      })
      expect(result).toMatchObject({
        loginMethod: 'token',
        flow: 'exchange',
        success: true,
        authMethod: 'oauth',
        stateSettleTimedOut: false,
      })
      expect(environment.replaceUrl).toHaveBeenNthCalledWith(1, '/')
      expect(environment.replaceUrl).toHaveBeenLastCalledWith('/structure')
      expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      })
      expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
      // Settle-before-resolve: the state already reflects the exchange.
      await expect(firstValueFrom(store.state)).resolves.toMatchObject({authenticated: true})
    })

    it('exchanges a single-use code once when called twice concurrently', async () => {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      const {factory} = createMockClientFactory(new Set(['access-1']))
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment('?code=the-code&state=expected-state'),
      })

      const [first, second] = await Promise.all([
        store.handleCallbackUrl!(),
        store.handleCallbackUrl!(),
      ])

      expect(endpoints.exchangeCode).toHaveBeenCalledTimes(1)
      expect(first).toBe(second)
    })

    it('fails without exchanging when the state does not match', async () => {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      const {factory} = createMockClientFactory(new Set())
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment('?code=the-code&state=forged-state'),
      })

      const result = await store.handleCallbackUrl!()

      expect(result).toMatchObject({
        flow: 'exchange',
        success: false,
        failureReason: 'state mismatch',
        error: {type: 'auth-failed'},
      })
      expect(endpoints.exchangeCode).not.toHaveBeenCalled()
    })

    it('reports an error returned by the authorization server', async () => {
      const {factory} = createMockClientFactory(new Set())
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment('?error=access_denied&error_description=The+user+declined'),
      })

      await expect(store.handleCallbackUrl!()).resolves.toMatchObject({
        success: false,
        failureReason: 'The user declined',
      })
    })
  })

  describe('refresh', () => {
    it('renews an access token that the API rejects, and authenticates with the new one', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-2']))
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment(),
      })

      const state = await authenticatedState(store.state)

      expect(endpoints.refresh).toHaveBeenCalledWith({
        clientId: CLIENT_ID,
        refreshToken: 'refresh-1',
      })
      expect(state.client.config().token).toBe('access-2')
      expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      })
    })

    it('signs out when the refresh token is refused', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'revoked')))
      const {factory} = createMockClientFactory(new Set())
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          refresh: vi.fn(async () => {
            throw new OAuthRequestError(400, {error: 'invalid_grant'})
          }),
        }),
        ...createEnvironment(),
      })

      const state = await firstValueFrom(store.state.pipe(filter((s) => !s.authenticated)))

      expect(state.currentUser).toBeNull()
      expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
    })

    it('adopts a pair another tab rotated instead of redeeming a used refresh token', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-from-other-tab']))
      const endpoints = createMockEndpoints()
      const environment = createEnvironment()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...environment,
        // Another tab holds the lock, rotates the pair, and releases it.
        withLock: async (_name, task) => {
          localStorage.setItem(
            TOKENS_KEY,
            JSON.stringify(storedTokens('access-from-other-tab', 'refresh-from-other-tab')),
          )
          return task()
        },
      })

      const state = await authenticatedState(store.state)

      expect(endpoints.refresh).not.toHaveBeenCalled()
      expect(state.client.config().token).toBe('access-from-other-tab')
    })

    it('retries a request rejected with an invalid session once, with the renewed token', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory, configs} = createMockClientFactory(new Set(['access-1', 'access-2']))
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment(),
      })
      await authenticatedState(store.state)
      const requestHandler = configs.find((config) => config.token === 'access-1')
        ?.requestHandler as RequestHandler

      const next = vi
        .fn()
        .mockRejectedValueOnce(createExpiredSessionError())
        .mockResolvedValueOnce({ok: true})
      const result = await requestHandler(
        {url: '/data/query', headers: {Authorization: 'Bearer access-1'}},
        next,
      )

      expect(result).toEqual({ok: true})
      expect(endpoints.refresh).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenLastCalledWith(
        expect.objectContaining({headers: {Authorization: 'Bearer access-2'}}),
      )
    })

    it('passes a second invalid-session rejection on to the studio', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory, configs} = createMockClientFactory(new Set(['access-1']))
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })
      await authenticatedState(store.state)
      const requestHandler = configs.find((config) => config.token === 'access-1')
        ?.requestHandler as RequestHandler

      const next = vi.fn().mockRejectedValue(createExpiredSessionError())

      await expect(
        requestHandler({url: '/data/query', headers: {Authorization: 'Bearer access-1'}}, next),
      ).rejects.toThrow()
      expect(next).toHaveBeenCalledTimes(2)
    })
  })

  describe('logout', () => {
    it('revokes both tokens and clears local state on logout', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-1']))
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment(),
      })
      await authenticatedState(store.state)

      await store.logout!()

      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'access-1'})
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'refresh-1'})
      expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
      await expect(firstValueFrom(store.state)).resolves.toMatchObject({authenticated: false})
    })

    it('clears local state even when revocation fails', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-1']))
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          revoke: vi.fn(async () => {
            throw new Error('network')
          }),
        }),
        ...createEnvironment(),
      })

      await store.logout!()

      expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
    })
  })
})
