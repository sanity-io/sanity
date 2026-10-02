import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  type RequestHandler,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {firstValueFrom, lastValueFrom, Subject} from 'rxjs'
import {filter, take, toArray} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getClientCredentialSegments} from '../../../document/utils/memoKey'
import {type AuthState} from '../../types'
import {
  getOAuthFlowStorageKey,
  getOAuthTokensStorageKey,
  OAUTH_DEBUG_ACCESS_TOKEN_LIFETIME_KEY,
} from '../constants'
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
} from '../oauthEndpoints'

// Mock supportsLocalStorage to return true so the token pair is persisted to localStorage.
// In jsdom/Node.js it returns false because process.versions.node is defined.
vi.mock('../../../../util/supportsLocalStorage', () => ({
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
/** The bearer a client would send: the static `token`, or the current value of a reactive `auth`. */
async function resolveConfiguredToken(config: SanityClientConfig): Promise<string | undefined> {
  if (config.auth) {
    const auth = await firstValueFrom(config.auth)
    return auth && 'token' in auth ? auth.token : undefined
  }
  return config.token
}

function tokenOf(client: SanityClient): Promise<string | undefined> {
  return resolveConfiguredToken(client.config())
}

function createMockClientFactory(validTokens: Set<string>) {
  const configs: SanityClientConfig[] = []
  const factory = (config: SanityClientConfig): SanityClient => {
    configs.push(config)
    return {
      config: () => config,
      request: vi.fn(async ({url}: {url: string}) => {
        if (url === '/users/me') {
          const token = await resolveConfiguredToken(config)
          if (token && validTokens.has(token)) return MOCK_USER
          throw createExpiredSessionError()
        }
        return {}
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
        loginMethod: 'oauth',
        flow: 'exchange',
        success: true,
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
            const token = await resolveConfiguredToken(config)
            if (token === 'access-0') return MOCK_USER
            if (token === 'access-1') {
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
      expect(await tokenOf(state.client)).toBe('access-1')
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
      expect(await tokenOf(state.client)).toBe('access-2')
      expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
      })
    })

    it('keeps the tokens and shows the signed-out state when the token endpoint fails for another reason', async () => {
      // A failed renewal that is not `invalid_grant` says nothing about the session. The state
      // must not error (an errored state crashes the studio); the pair stays for the next try.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set())
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          refresh: vi.fn(async () => {
            throw new OAuthRequestError(503, {message: 'Service Unavailable'})
          }),
        }),
        ...createEnvironment(),
      })

      const state = await firstValueFrom(store.state)
      expect(state.authenticated).toBe(false)
      expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({
        refreshToken: 'refresh-1',
      })
    })

    it('signs out when the refresh token is refused in the error body the API sends today', async () => {
      // Observed 2026-09-30: the studio crashed with "OAuth request failed (400): Bad Request -
      // Invalid grant: refresh token is invalid" once the refresh token had expired.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'revoked')))
      const {factory} = createMockClientFactory(new Set())
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          refresh: vi.fn(async () => {
            throw new OAuthRequestError(400, {
              statusCode: 400,
              error: 'Bad Request',
              message: 'Invalid grant: refresh token is invalid',
            })
          }),
        }),
        ...createEnvironment(),
      })

      const state = await firstValueFrom(store.state.pipe(filter((s) => !s.authenticated)))

      expect(state.currentUser).toBeNull()
      expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
    })

    it('hands a network failure of the renewal to the studio error handler and retries', async () => {
      // Same treatment as the /users/me probe: a boot-critical request that failed on the
      // network goes to the studio's retryable error dialog instead of crashing the boot.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-2']))
      let calls = 0
      const endpoints = createMockEndpoints({
        refresh: vi.fn(async () => {
          calls++
          if (calls === 1) throw new TypeError('Failed to fetch')
          return tokenResponse('access-2', 'refresh-2')
        }),
      })
      // A handler that "retries" as soon as the first attempt fails.
      const attempt = vi.fn<
        (thunk: () => Promise<unknown>, options?: {retryable?: boolean}) => Promise<unknown>
      >(async (thunk) => {
        try {
          return await thunk()
        } catch {
          return thunk()
        }
      })
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        getRequestErrorHandler: () => ({attempt, handle: vi.fn()}) as never,
        ...createEnvironment(),
      })

      const state = await authenticatedState(store.state)

      expect(await tokenOf(state.client)).toBe('access-2')
      // The store never retries a renewal itself: the second call to the token endpoint can
      // only have come from the handler re-running the thunk. (The handler also wraps the
      // /users/me probes, hence more than one call.)
      expect(endpoints.refresh).toHaveBeenCalledTimes(2)
      expect(attempt.mock.calls.every(([, options]) => options?.retryable === true)).toBe(true)
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
      expect(await tokenOf(state.client)).toBe('access-from-other-tab')
    })

    it('does not publish a renewal over a pair a sign-in exchanged meanwhile', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const environment = createEnvironment()
      const {factory} = createMockClientFactory(new Set(['access-1', 'access-2', 'access-3']))
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
      const requestHandler = (await authenticatedState(store.state)).client.config()
        .requestHandler as RequestHandler

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
      expect(await tokenOf((await firstValueFrom(store.state)).client)).toBe('access-3')
    })

    it('hands requests the renewal in flight instead of the token it replaces', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-1', 'access-2']))
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
        ...createEnvironment(),
      })
      const {client} = await authenticatedState(store.state)
      const requestHandler = client.config().requestHandler as RequestHandler

      // A rejected request starts a refresh.
      const next = vi
        .fn()
        .mockRejectedValueOnce(createExpiredSessionError())
        .mockResolvedValue({ok: true})
      const retried = requestHandler(
        {url: '/data/query', headers: {Authorization: 'Bearer access-1'}},
        next,
      )
      await vi.waitFor(() => expect(endpoints.refresh).toHaveBeenCalled())

      // While it is out, the credential the client resolves for a new request is the renewal
      // itself, so the request waits instead of going out with the token being replaced.
      // (Read with a subscription: `await` would chain onto the emitted promise.)
      let pending: Promise<unknown> | undefined
      client
        .config()
        .auth.pipe(take(1))
        .subscribe((credential) => {
          pending = credential
        })
      expect(pending).toBeDefined()
      let settled: unknown = 'pending'
      void pending!.then((value) => {
        settled = value
      })
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(settled).toBe('pending')

      resolveRefresh(tokenResponse('access-2', 'refresh-2'))
      await retried
      await expect(pending).resolves.toEqual({token: 'access-2'})
    })

    it('renews the configured time before the access token expires', async () => {
      // `expires_in` is 3600s in the mock response; with a 120s margin the pair renews at 3480s.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-2']))
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        renewBeforeExpiryMs: 120_000,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })

      const before = Date.now()
      await authenticatedState(store.state)
      const stored = JSON.parse(localStorage.getItem(TOKENS_KEY)!) as OAuthTokens

      expect(stored.accessToken).toBe('access-2')
      expect(stored.refreshAt - before).toBeGreaterThanOrEqual(3_480_000 - 50)
      expect(stored.refreshAt - before).toBeLessThan(3_480_000 + 1_000)
      expect(stored.expiresAt - before).toBeGreaterThanOrEqual(3_600_000 - 50)
    })

    it('caps the access token lifetime it believes with the debug flag in localStorage', async () => {
      // `expires_in` is 3600s in the mock response; the flag makes the store treat it as 90s,
      // so renewals come around every few minutes while debugging, without a server change.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      localStorage.setItem(OAUTH_DEBUG_ACCESS_TOKEN_LIFETIME_KEY, '90')
      const {factory} = createMockClientFactory(new Set(['access-2']))
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })

      const before = Date.now()
      await authenticatedState(store.state)
      const stored = JSON.parse(localStorage.getItem(TOKENS_KEY)!) as OAuthTokens

      expect(stored.expiresAt - before).toBeGreaterThanOrEqual(90_000 - 50)
      expect(stored.expiresAt - before).toBeLessThan(90_000 + 1_000)
      // 60s margin, but never earlier than halfway: renews at 45s.
      expect(stored.refreshAt - before).toBeGreaterThanOrEqual(45_000 - 50)
      expect(stored.refreshAt - before).toBeLessThan(45_000 + 1_000)
    })

    it('applies the debug lifetime flag to the pair already stored when the store starts', async () => {
      // The flag is usually set after signing in, so the pair in localStorage still carries the
      // real expiry. The store clamps it on start instead of waiting for the next rotation.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      localStorage.setItem(OAUTH_DEBUG_ACCESS_TOKEN_LIFETIME_KEY, '90')
      const {factory} = createMockClientFactory(new Set(['access-1']))
      const before = Date.now()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })

      await authenticatedState(store.state)
      const stored = JSON.parse(localStorage.getItem(TOKENS_KEY)!) as OAuthTokens

      // Still the stored pair, only with a shorter lifetime.
      expect(stored.accessToken).toBe('access-1')
      expect(stored.refreshToken).toBe('refresh-1')
      expect(stored.expiresAt - before).toBeGreaterThanOrEqual(90_000 - 50)
      expect(stored.expiresAt - before).toBeLessThan(90_000 + 1_000)
      expect(stored.refreshAt - before).toBeGreaterThanOrEqual(45_000 - 50)
      expect(stored.refreshAt - before).toBeLessThan(45_000 + 1_000)
    })

    it('never renews earlier than halfway through a short-lived access token', async () => {
      // A margin longer than half the lifetime would renew almost immediately and spin.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-2']))
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        renewBeforeExpiryMs: 120_000,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          refresh: vi.fn(async () => ({...tokenResponse('access-2', 'refresh-2'), expires_in: 60})),
        }),
        ...createEnvironment(),
      })

      const before = Date.now()
      await authenticatedState(store.state)
      const stored = JSON.parse(localStorage.getItem(TOKENS_KEY)!) as OAuthTokens

      expect(stored.refreshAt - before).toBeGreaterThanOrEqual(30_000 - 50)
      expect(stored.refreshAt - before).toBeLessThan(30_000 + 1_000)
    })

    it('follows a rotation done by another tab without changing the client', async () => {
      // One client, reading the current credential: a renewal in another tab reaches this
      // tab's client through the shared token pair, and the auth state, which the studio
      // rebuilds its workspace from, does not emit for it while the user and roles are the same.
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-1', 'access-2']))
      const tabA = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })
      const tabB = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })
      const statesA = lastValueFrom(tabA.state.pipe(take(2), toArray()))
      const first = await authenticatedState(tabA.state)

      // Tab B renews after one of its requests is rejected.
      const handlerB = (await authenticatedState(tabB.state)).client.config()
        .requestHandler as RequestHandler
      await handlerB(
        {url: '/data/query', headers: {Authorization: 'Bearer access-1'}},
        vi.fn().mockRejectedValueOnce(createExpiredSessionError()).mockResolvedValueOnce({}),
      )
      expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({accessToken: 'access-2'})

      await vi.waitFor(async () => expect(await tokenOf(first.client)).toBe('access-2'))
      const emitted = await Promise.race([
        statesA,
        new Promise((resolve) => setTimeout(() => resolve('no second emission'), 200)),
      ])
      expect(emitted).toBe('no second emission')
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

    it('renews at once when the tab becomes visible with a renewal overdue', async () => {
      // A laptop asleep past the renewal time: the clock moves on but no timer fires until the
      // tab is shown again, and the first requests the UI makes on wake would otherwise go out
      // with the expired token. The renewal starts on `visibilitychange`, before them.
      vi.useFakeTimers()
      try {
        localStorage.setItem(
          TOKENS_KEY,
          JSON.stringify({
            ...storedTokens('access-1', 'refresh-1'),
            refreshAt: Date.now() + 60_000,
          }),
        )
        const visible$ = new Subject<void>()
        const {factory} = createMockClientFactory(new Set(['access-1', 'access-2']))
        const endpoints = createMockEndpoints()
        const store = _createOAuthAuthStore({
          projectId: PROJECT_ID,
          dataset: DATASET,
          clientId: CLIENT_ID,
          clientFactory: factory,
          endpoints,
          ...createEnvironment(),
          visible$,
        })
        const subscription = store.state.subscribe()
        await vi.advanceTimersByTimeAsync(0)
        expect(endpoints.refresh).not.toHaveBeenCalled()

        vi.setSystemTime(Date.now() + 3_600_000)
        visible$.next()
        await vi.advanceTimersByTimeAsync(0)

        expect(endpoints.refresh).toHaveBeenCalledTimes(1)
        subscription.unsubscribe()
      } finally {
        vi.useRealTimers()
      }
    })

    it('does nothing on visibility when no renewal is due', async () => {
      const visible$ = new Subject<void>()
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
        visible$,
      })
      await authenticatedState(store.state)

      visible$.next()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(endpoints.refresh).not.toHaveBeenCalled()
    })

    it('retries a request rejected with an invalid session once, with the renewed token', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-1', 'access-2']))
      const endpoints = createMockEndpoints()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints,
        ...createEnvironment(),
      })
      const requestHandler = (await authenticatedState(store.state)).client.config()
        .requestHandler as RequestHandler

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
      const {factory} = createMockClientFactory(new Set(['access-1']))
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })
      const requestHandler = (await authenticatedState(store.state)).client.config()
        .requestHandler as RequestHandler

      const next = vi.fn().mockRejectedValue(createExpiredSessionError())

      await expect(
        requestHandler({url: '/data/query', headers: {Authorization: 'Bearer access-1'}}, next),
      ).rejects.toThrow()
      expect(next).toHaveBeenCalledTimes(2)
    })
  })

  // One client per store. A rotation and a re-login are both the next token on its credential;
  // signed out is an anonymous credential. Streams end because the login screen unmounts their
  // subscribers, not because the credential errors. The state emits only when the signed-in
  // user or their roles change, which is what the studio rebuilds its workspace from.
  describe('one client per store', () => {
    /** A client whose `/users/me` answers per token, so a token can belong to another user. */
    function createUserPerTokenFactory(users: Record<string, CurrentUser>) {
      return (config: SanityClientConfig): SanityClient =>
        ({
          config: () => config,
          request: vi.fn(async ({url}: {url: string}) => {
            if (url !== '/users/me') return {}
            const token = await resolveConfiguredToken(config)
            const user = token && users[token]
            if (user) return user
            throw createExpiredSessionError()
          }),
        }) as unknown as SanityClient
    }

    it('hands out a new credential source for a sign-in after sign-out', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const {factory} = createMockClientFactory(new Set(['access-1', 'access-9']))
      const environment = createEnvironment()
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          exchangeCode: vi.fn(async () => tokenResponse('access-9', 'refresh-9')),
        }),
        ...environment,
      })
      const subscription = store.state.subscribe()
      const signedIn = await authenticatedState(store.state)
      expect(await tokenOf(signedIn.client)).toBe('access-1')

      await store.logout!()
      const signedOut = await firstValueFrom(store.state)
      expect(signedOut.authenticated).toBe(false)
      // Anonymous while signed out, not errored.
      expect(await tokenOf(signedOut.client)).toBeUndefined()

      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      environment.location.search = '?code=the-code&state=expected-state'
      await expect(store.handleCallbackUrl!()).resolves.toMatchObject({
        success: true,
        stateSettleTimedOut: false,
      })
      const signedInAgain = await authenticatedState(store.state)
      expect(await tokenOf(signedInAgain.client)).toBe('access-9')
      // Caches keyed on the credential source (document pairs, project grants) must not carry
      // over from one session to the next.
      expect(getClientCredentialSegments(signedInAgain.client)).not.toEqual(
        getClientCredentialSegments(signedIn.client),
      )
      subscription.unsubscribe()
    })

    it('emits a new state when a pair written by another tab belongs to another user', async () => {
      const otherUser: CurrentUser = {...MOCK_USER, id: 'other-user-456', name: 'Other User'}
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const factory = createUserPerTokenFactory({'access-1': MOCK_USER, 'access-2': otherUser})
      const tabA = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })
      const states: AuthState[] = []
      const subscription = tabA.state.subscribe((state) => states.push(state))
      const users = () => states.map((state) => state.currentUser?.id)
      await vi.waitFor(() => expect(users()).toContain(MOCK_USER.id))

      // Another tab signs in as someone else.
      const environmentB = createEnvironment('?code=the-code&state=expected-state')
      sessionStorage.setItem(
        FLOW_KEY,
        JSON.stringify({codeVerifier: 'verifier', state: 'expected-state', redirectUri: ORIGIN}),
      )
      const tabB = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints({
          exchangeCode: vi.fn(async () => tokenResponse('access-2', 'refresh-2')),
        }),
        ...environmentB,
      })
      await expect(tabB.handleCallbackUrl!()).resolves.toMatchObject({success: true})

      await vi.waitFor(() => expect(users().at(-1)).toBe(otherUser.id))
      // The other user must not be served what was cached for the first one.
      const [first, other] = [states[0], states.at(-1)!]
      expect(getClientCredentialSegments(other.client)).not.toEqual(
        getClientCredentialSegments(first.client),
      )
      subscription.unsubscribe()
    })

    it('emits a new state when a renewal reveals changed roles', async () => {
      const demoted: CurrentUser = {...MOCK_USER, roles: [{name: 'viewer', title: 'Viewer'}]}
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      const factory = createUserPerTokenFactory({'access-1': MOCK_USER, 'access-2': demoted})
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })
      const roles: string[][] = []
      const subscription = store.state.subscribe((state) =>
        roles.push((state.currentUser?.roles ?? []).map((role) => role.name)),
      )
      const {client} = await authenticatedState(store.state)

      const requestHandler = client.config().requestHandler as RequestHandler
      await requestHandler(
        {url: '/data/query', headers: {Authorization: 'Bearer access-1'}},
        vi.fn().mockRejectedValueOnce(createExpiredSessionError()).mockResolvedValueOnce({}),
      )

      await vi.waitFor(() => expect(roles.at(-1)).toEqual(['viewer']))
      expect(roles).toEqual([['editor'], ['viewer']])
      subscription.unsubscribe()
    })

    it('keeps the current state when the probe after a renewal fails for another reason', async () => {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
      let failNextProbe = false
      const factory = (config: SanityClientConfig): SanityClient =>
        ({
          config: () => config,
          request: vi.fn(async ({url}: {url: string}) => {
            if (url !== '/users/me') return {}
            if (failNextProbe) {
              failNextProbe = false
              throw new TypeError('Failed to fetch')
            }
            const token = await resolveConfiguredToken(config)
            if (token === 'access-1' || token === 'access-2') return MOCK_USER
            throw createExpiredSessionError()
          }),
        }) as unknown as SanityClient
      const store = _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: DATASET,
        clientId: CLIENT_ID,
        clientFactory: factory,
        endpoints: createMockEndpoints(),
        ...createEnvironment(),
      })
      const states: boolean[] = []
      const subscription = store.state.subscribe({
        next: (state) => states.push(state.authenticated),
        error: (err) => states.push(err),
      })
      const {client} = await authenticatedState(store.state)

      failNextProbe = true
      const requestHandler = client.config().requestHandler as RequestHandler
      await requestHandler(
        {url: '/data/query', headers: {Authorization: 'Bearer access-1'}},
        vi.fn().mockRejectedValueOnce(createExpiredSessionError()).mockResolvedValueOnce({}),
      )
      await vi.waitFor(async () => expect(await tokenOf(client)).toBe('access-2'))
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(states).toEqual([true])
      subscription.unsubscribe()
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
      const {factory} = createMockClientFactory(new Set(['access-1', 'access-2']))
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
      const requestHandler = (await authenticatedState(store.state)).client.config()
        .requestHandler as RequestHandler

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
