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
  OAuthRequestTimeoutError,
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
const ORIGIN = 'http://localhost:3333'
const FLOW_KEY = getOAuthFlowStorageKey(PROJECT_ID)

// A client ID per test: stores are never disposed, and a store left over from an earlier test
// would otherwise receive this test's token broadcasts and act on them.
let testCount = 0
let CLIENT_ID = ''
let TOKENS_KEY = ''

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
    CLIENT_ID = `oc-test-client-${++testCount}`
    TOKENS_KEY = getOAuthTokensStorageKey(PROJECT_ID, CLIENT_ID)
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

    it('settles on the exchanged session, not on a session the user already had', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-0', 'refresh-0')))
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      // The probe for the exchanged token answers only when the test lets it.
      let answerNewProbe: () => void = () => {}
      const newProbe = new Promise<void>((resolve) => {
        answerNewProbe = resolve
      })
      const factory = (config: SanityClientConfig): SanityClient =>
        ({
          config: () => config,
          request: vi.fn(async ({url}: {url: string}) => {
            if (url !== '/users/me') return {}
            if (config.token === 'access-0') return MOCK_USER
            if (config.token === 'access-1') {
              await newProbe
              return MOCK_USER
            }
            throw createExpiredSessionError()
          }),
        }) as unknown as SanityClient
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment('?code=the-code&state=expected-state'),
      })
      // Already signed in, and the state replays that session.
      const subscription = store.state.subscribe()
      await authenticatedState(store.state)

      let settled = false
      const callback = store.handleCallbackUrl!().then((result) => {
        settled = true
        return result
      })
      await vi.waitFor(() => expect(localStorage.getItem(TOKENS_KEY)).toContain('access-1'))
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(settled).toBe(false)

      answerNewProbe()
      await expect(callback).resolves.toMatchObject({success: true, stateSettleTimedOut: false})
      const state = await firstValueFrom(store.state)
      expect(state.client.config().token).toBe('access-1')
      subscription.unsubscribe()
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

    it('reports the error code returned by the authorization server for this tab', async () => {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      const {factory} = createMockClientFactory(new Set())
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(
          '?error=access_denied&error_description=The+user+declined&state=expected-state',
        ),
      })

      await expect(store.handleCallbackUrl!()).resolves.toMatchObject({
        success: false,
        failureReason: 'access_denied',
      })
      expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
    })

    it('reports only the error code or a fixed category of a failed code exchange', async () => {
      const failures = [
        new OAuthRequestError(400, {
          error: 'invalid_grant',
          error_description: 'Code abc123 was issued to another client',
        }),
        new OAuthRequestError(502, 'Bad gateway at https://internal.example.com'),
        new OAuthRequestTimeoutError('https://api.example.com/v1/auth/oauth/token', 30_000, null),
        new Error('Failed to fetch https://api.example.com'),
      ]
      const reasons: unknown[] = []
      for (const failure of failures) {
        sessionStorage.setItem(
          FLOW_KEY,
          JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
        )
        const {factory} = createMockClientFactory(new Set())
        const store = _createOAuthAuthStore({
          projectId: PROJECT_ID,
          dataset: DATASET,
          clientId: CLIENT_ID,
          clientFactory: factory,
          endpoints: createMockEndpoints({exchangeCode: vi.fn().mockRejectedValue(failure)}),
          ...createEnvironment('?code=the-code&state=expected-state'),
        })
        reasons.push((await store.handleCallbackUrl!()).failureReason)
      }

      expect(reasons).toEqual([
        'invalid_grant',
        'token endpoint error (502)',
        'token endpoint timeout',
        'code exchange failed',
      ])
    })

    it('refuses a response issued by another authorization server', async () => {
      const exchange = async (iss: string) => {
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
          ...createEnvironment(
            `?code=the-code&state=expected-state&iss=${encodeURIComponent(iss)}`,
          ),
        })
        return {result: await store.handleCallbackUrl!(), endpoints}
      }

      const mixedUp = await exchange('https://auth.example.com')
      expect(mixedUp.result).toMatchObject({success: false, failureReason: 'issuer mismatch'})
      expect(mixedUp.endpoints.exchangeCode).not.toHaveBeenCalled()

      // Compared exactly (RFC 9207): a trailing slash is another issuer.
      const trailingSlash = await exchange('https://api.sanity.io/')
      expect(trailingSlash.result).toMatchObject({success: false, failureReason: 'issuer mismatch'})

      const expected = await exchange('https://api.sanity.io')
      expect(expected.result).toMatchObject({success: true})
      expect(expected.endpoints.exchangeCode).toHaveBeenCalledTimes(1)
    })

    it('does not sign in when the user logs out while the code is being exchanged', async () => {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      const {factory} = createMockClientFactory(new Set(['access-1']))
      let resolveExchange: (response: OAuthTokenResponse) => void = () => {}
      const endpoints = createMockEndpoints({
        exchangeCode: vi.fn(
          () =>
            new Promise<OAuthTokenResponse>((resolve) => {
              resolveExchange = resolve
            }),
        ),
      })
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment('?code=the-code&state=expected-state'),
      })

      const callback = store.handleCallbackUrl!()
      await vi.waitFor(() => expect(endpoints.exchangeCode).toHaveBeenCalled())
      await store.logout!()
      resolveExchange(tokenResponse('access-1', 'refresh-1'))

      await expect(callback).resolves.toMatchObject({
        success: false,
        failureReason: 'logged out during sign-in',
      })
      expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
      await expect(firstValueFrom(store.state)).resolves.toMatchObject({authenticated: false})
      // The pair the exchange obtained is live on the server, so it is revoked, not just dropped.
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'access-1'})
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'refresh-1'})
    })

    it('does not sign in when another tab logs out while the code is being exchanged', async () => {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      const {factory} = createMockClientFactory(new Set(['access-1']))
      let resolveExchange: (response: OAuthTokenResponse) => void = () => {}
      const endpoints = createMockEndpoints({
        exchangeCode: vi.fn(
          () =>
            new Promise<OAuthTokenResponse>((resolve) => {
              resolveExchange = resolve
            }),
        ),
      })
      const options = {
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
      }
      const signingIn = _createOAuthAuthStore({
        ...options,
        ...createEnvironment('?code=the-code&state=expected-state'),
      })
      const otherTab = _createOAuthAuthStore({...options, ...createEnvironment()})

      const callback = signingIn.handleCallbackUrl!()
      await vi.waitFor(() => expect(endpoints.exchangeCode).toHaveBeenCalled())
      await otherTab.logout!()
      resolveExchange(tokenResponse('access-1', 'refresh-1'))

      await expect(callback).resolves.toMatchObject({
        success: false,
        failureReason: 'logged out during sign-in',
      })
      expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'access-1'})
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'refresh-1'})
    })

    it('rejects a response with another state, and leaves the URL and the flow alone', async () => {
      const flow = {codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}
      sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow))
      const {factory} = createMockClientFactory(new Set())
      const environment = createEnvironment(
        '?error=access_denied&error_description=Click+evil.example&state=forged',
      )
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...environment,
      })

      await expect(store.handleCallbackUrl!()).resolves.toMatchObject({
        success: false,
        failureReason: 'state mismatch',
      })
      expect(JSON.parse(sessionStorage.getItem(FLOW_KEY)!)).toEqual(flow)
      expect(environment.replaceUrl).not.toHaveBeenCalled()
    })

    it('treats a URL without state as an ordinary Studio URL', async () => {
      const {factory} = createMockClientFactory(new Set())
      const environment = createEnvironment('?error=not-an-oauth-response')
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...environment,
      })

      await expect(store.handleCallbackUrl!()).resolves.toMatchObject({
        flow: 'already-authenticated',
      })
      expect(environment.replaceUrl).not.toHaveBeenCalled()
    })

    it('removes only the OAuth parameters from the URL', async () => {
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      const {factory} = createMockClientFactory(new Set(['access-1']))
      const environment = createEnvironment(
        '?perspective=drafts&code=the-code&state=expected-state',
      )
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...environment,
      })

      await store.handleCallbackUrl!()

      expect(environment.replaceUrl).toHaveBeenNthCalledWith(1, '/?perspective=drafts')
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

    it('keeps the tokens when the token endpoint fails for another reason', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set())
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          refresh: vi.fn(async () => {
            throw new OAuthRequestError(400, {error: 'invalid_request'})
          }),
        }),
        ...createEnvironment(),
      })

      await expect(firstValueFrom(store.state)).rejects.toThrow('invalid_request')
      expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({
        refreshToken: 'refresh-1',
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

    it('does not publish a renewal over a pair a sign-in exchanged meanwhile', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const environment = createEnvironment()
      const {factory, configs} = createMockClientFactory(
        new Set(['access-1', 'access-2', 'access-3']),
      )
      let resolveRefresh: (response: OAuthTokenResponse) => void = () => {}
      const endpoints = createMockEndpoints({
        exchangeCode: vi.fn(async () => tokenResponse('access-3', 'refresh-3')),
        refresh: vi.fn(
          () =>
            new Promise<OAuthTokenResponse>((resolve) => {
              resolveRefresh = resolve
            }),
        ),
      })
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...environment,
      })
      await authenticatedState(store.state)
      const requestHandler = configs.find((config) => config.token === 'access-1')
        ?.requestHandler as RequestHandler

      // A rejected request starts a refresh; a sign-in completes before the refresh answers.
      const next = vi
        .fn()
        .mockRejectedValueOnce(createExpiredSessionError())
        .mockResolvedValue({ok: true})
      const retried = requestHandler(
        {url: '/data/query', headers: {Authorization: 'Bearer access-1'}},
        next,
      )
      await vi.waitFor(() => expect(endpoints.refresh).toHaveBeenCalled())
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      environment.location.search = '?code=the-code&state=expected-state'
      await expect(store.handleCallbackUrl!()).resolves.toMatchObject({
        success: true,
        stateSettleTimedOut: false,
      })
      resolveRefresh(tokenResponse('access-2', 'refresh-2'))
      await retried

      expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({
        accessToken: 'access-3',
        refreshToken: 'refresh-3',
      })
      expect(next).toHaveBeenLastCalledWith(
        expect.objectContaining({headers: {Authorization: 'Bearer access-3'}}),
      )
      // The renewed pair of the replaced session is live on the server, so it is revoked.
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'access-2'})
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'refresh-2'})
      await expect(firstValueFrom(store.state)).resolves.toMatchObject({authenticated: true})
      expect((await firstValueFrom(store.state)).client.config().token).toBe('access-3')
    })

    it('keeps renewing ahead of expiry when a renewal rotates only the refresh token', async () => {
      vi.useFakeTimers()
      try {
        localStorage.setItem(
          TOKENS_KEY,
          JSON.stringify({...storedTokens('access-1', 'refresh-1'), refreshAt: Date.now()}),
        )
        const {factory} = createMockClientFactory(new Set(['access-1']))
        let rotation = 1
        const endpoints = createMockEndpoints({
          refresh: vi.fn(async () => ({
            ...tokenResponse('access-1', `refresh-${++rotation}`),
            expires_in: 60,
          })),
        })
        const store = _createOAuthAuthStore({
          projectId: PROJECT_ID,
          dataset: DATASET,
          clientId: CLIENT_ID,
          clientFactory: factory,
          endpoints,
          ...createEnvironment(),
        })
        const subscription = store.state.subscribe()

        await vi.advanceTimersByTimeAsync(0)
        expect(endpoints.refresh).toHaveBeenCalledTimes(1)
        // The renewed pair is due at 80% of its 60s lifetime.
        await vi.advanceTimersByTimeAsync(48_000)
        expect(endpoints.refresh).toHaveBeenCalledTimes(2)
        expect(endpoints.refresh).toHaveBeenLastCalledWith({
          clientId: CLIENT_ID,
          refreshToken: 'refresh-2',
        })
        subscription.unsubscribe()
      } finally {
        vi.useRealTimers()
      }
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

    it('does not let a refresh that was in flight sign the user back in', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory, configs} = createMockClientFactory(new Set(['access-1', 'access-2']))
      let resolveRefresh: (response: OAuthTokenResponse) => void = () => {}
      const endpoints = createMockEndpoints({
        refresh: vi.fn(
          () =>
            new Promise<OAuthTokenResponse>((resolve) => {
              resolveRefresh = resolve
            }),
        ),
      })
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        // Not exclusive, like a browser without Web Locks.
        ...createEnvironment(),
      })
      await authenticatedState(store.state)
      const requestHandler = configs.find((config) => config.token === 'access-1')
        ?.requestHandler as RequestHandler

      // A request is rejected and starts a refresh; the user logs out before it answers.
      const retried = requestHandler(
        {url: '/data/query', headers: {Authorization: 'Bearer access-1'}},
        vi.fn().mockRejectedValue(createExpiredSessionError()),
      )
      await vi.waitFor(() => expect(endpoints.refresh).toHaveBeenCalled())
      await store.logout!()
      resolveRefresh(tokenResponse('access-2', 'refresh-2'))
      await expect(retried).rejects.toThrow()

      expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
      await expect(firstValueFrom(store.state)).resolves.toMatchObject({authenticated: false})
      // The pair the refresh obtained is live on the server, so it is revoked, not just dropped.
      await vi.waitFor(() =>
        expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'access-2'}),
      )
      expect(endpoints.revoke).toHaveBeenCalledWith({clientId: CLIENT_ID, token: 'refresh-2'})
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
