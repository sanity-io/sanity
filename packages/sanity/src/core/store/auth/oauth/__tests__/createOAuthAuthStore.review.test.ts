import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  createClient,
  type RequestHandler,
  type RequestHandlerOptions,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {firstValueFrom, lastValueFrom} from 'rxjs'
import {filter, take, toArray} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getOAuthTokensStorageKey} from '../constants'
import {_createOAuthAuthStore, type OAuthTokens} from '../createOAuthAuthStore'
import {type OAuthEndpoints, OAuthRequestError, type OAuthTokenResponse} from '../oauthEndpoints'

// Review findings for the experimental OAuth auth store. Each test here fails on the branch under
// review and describes the behaviour the store should have instead.

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

let testCount = 0
let CLIENT_ID = ''
let TOKENS_KEY = ''

function createExpiredSessionError(url = `https://${PROJECT_ID}.api.sanity.io/v1/users/me`) {
  return new ClientError({
    statusCode: 401,
    headers: {},
    body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX', statusCode: 401},
    method: 'GET',
    statusMessage: 'Unauthorized',
    url,
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
    authorizeUrl: () => 'https://api.sanity.io/v1/auth/oauth/authorize',
    exchangeCode: vi.fn(async () => tokenResponse('access-1', 'refresh-1')),
    refresh: vi.fn(async () => tokenResponse('access-2', 'refresh-2')),
    revoke: vi.fn(async () => {}),
    ...overrides,
  }
}

function createEnvironment() {
  const location = {origin: ORIGIN, pathname: '/', search: ''}
  return {
    getLocation: () => location,
    navigate: vi.fn<(url: string) => void>(),
    replaceUrl: vi.fn<(path: string) => void>(),
    // No Web Locks: the fallback the store uses in browsers without `navigator.locks`.
    withLock: <T>(_name: string, task: () => Promise<T>) => task(),
  }
}

function createStore(options: {
  factory: (config: SanityClientConfig) => SanityClient
  endpoints: OAuthEndpoints
}) {
  return _createOAuthAuthStore({
    projectId: PROJECT_ID,
    dataset: DATASET,
    clientId: CLIENT_ID,
    clientFactory: options.factory,
    endpoints: options.endpoints,
    ...createEnvironment(),
  })
}

const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('createOAuthAuthStore review findings', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    CLIENT_ID = `oc-review-client-${++testCount}`
    TOKENS_KEY = getOAuthTokensStorageKey(PROJECT_ID, CLIENT_ID)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stops renewing when the renewed access token is rejected by /users/me as well', async () => {
    // Every renewal succeeds at the token endpoint, but /users/me rejects every access token
    // (a grant problem, not a session problem). The store must not keep rotating the refresh
    // token in a loop; one renewal per rejected access token is the most it should attempt.
    localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-0')))
    let issued = 0
    const endpoints = createMockEndpoints({
      refresh: vi.fn(async () => {
        // A real token endpoint answers over the network. Without this yield the loop below
        // is microtask-only, starves the event loop, and exhausts the heap.
        await settle(0)
        issued++
        return tokenResponse(`access-${issued}`, `refresh-${issued}`)
      }),
    })
    const {factory} = createMockClientFactory(new Set())
    const store = createStore({factory, endpoints})

    const subscription = store.state.subscribe({error: () => {}})
    await settle(100)
    subscription.unsubscribe()

    expect(endpoints.refresh).toHaveBeenCalledTimes(1)
  })

  it('does not sign both tabs out when two tabs redeem the same refresh token without Web Locks', async () => {
    // Both tabs hold the same pair and both renew at once. The second redemption is refused as
    // a reuse (`invalid_grant`). That tab must adopt the pair the first tab stored, not clear it.
    localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('expired', 'refresh-1')))
    let calls = 0
    const refresh = vi.fn(async () => {
      calls++
      if (calls === 1) {
        await settle(10)
        return tokenResponse('access-2', 'refresh-2')
      }
      throw new OAuthRequestError(400, {error: 'invalid_grant'})
    })
    const {factory} = createMockClientFactory(new Set(['access-2']))
    const tabA = createStore({factory, endpoints: createMockEndpoints({refresh})})
    const tabB = createStore({factory, endpoints: createMockEndpoints({refresh})})

    const stateA = firstValueFrom(tabA.state.pipe(filter((s) => s.authenticated)))
    const stateB = firstValueFrom(tabB.state.pipe(filter((s) => s.authenticated)))
    const settled = await Promise.race([Promise.all([stateA, stateB]), settle(500)])

    expect(refresh).toHaveBeenCalledTimes(2)
    expect(JSON.parse(localStorage.getItem(TOKENS_KEY) ?? 'null')).toMatchObject({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    })
    expect(settled, 'both tabs authenticate with the rotated pair').toBeDefined()
  })

  it('renews when a request carried an older token and the current one has expired too', async () => {
    // Seen in dogfooding (HAR 2026-09-28 16:16Z): a tab sat idle past a rotation and past the
    // expiry of the pair that rotation produced. A store still holding a client from before the
    // rotation sent a request with the old token (401 SIO-401-ANF). The handler noticed the token
    // differed from the current one and retried with the current token without renewing, but that
    // token had expired as well (401 SIO-401-AEX). The second 401 reached the studio handler,
    // which revoked both tokens and signed the user out. No refresh was ever attempted.
    const expired: OAuthTokens = {
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresAt: Date.now() - 60_000,
      refreshAt: Date.now() - 240_000,
    }
    localStorage.setItem(TOKENS_KEY, JSON.stringify(expired))
    const {factory} = createMockClientFactory(new Set(['access-1', 'access-2']))
    const endpoints = createMockEndpoints()
    const store = createStore({factory, endpoints})
    const state = await firstValueFrom(store.state.pipe(filter((s) => s.authenticated)))
    const handler = state.client.config().requestHandler as RequestHandler

    const next = vi.fn(async (request: RequestHandlerOptions) => {
      const authorization = Object.entries(request.headers ?? {}).find(
        ([name]) => name.toLowerCase() === 'authorization',
      )?.[1]
      if (authorization === 'Bearer access-2') return 'ok'
      throw createExpiredSessionError()
    })

    // The request was built by a client from before the last rotation.
    await expect(
      handler({url: 'https://x/v1/projects/x', headers: {Authorization: 'Bearer access-0'}}, next),
    ).resolves.toBe('ok')
    expect(endpoints.refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the same client across an access token rotation', async () => {
    // The workspace, every store and every listener are rebuilt whenever `state` emits a new
    // client. A routine access token rotation must not do that; only a sign-in or sign-out
    // should change the authenticated state.
    localStorage.setItem(TOKENS_KEY, JSON.stringify(storedTokens('access-1', 'refresh-1')))
    const {factory} = createMockClientFactory(new Set(['access-1', 'access-2']))
    const store = createStore({factory, endpoints: createMockEndpoints()})

    const states = lastValueFrom(store.state.pipe(take(2), toArray()))
    const first = await firstValueFrom(store.state.pipe(filter((s) => s.authenticated)))

    // A request sent with the current token is rejected: the handler renews and retries.
    const handler = first.client.config().requestHandler as RequestHandler
    const next = vi
      .fn()
      .mockRejectedValueOnce(createExpiredSessionError())
      .mockResolvedValueOnce('ok')
    await handler(
      {url: 'https://x/v1/data/query/x', headers: {Authorization: 'Bearer access-1'}},
      next,
    )
    expect(JSON.parse(localStorage.getItem(TOKENS_KEY)!)).toMatchObject({accessToken: 'access-2'})

    const emitted = await Promise.race([states, settle(200).then(() => 'no second emission')])
    expect(emitted).toBe('no second emission')
  })
})

describe('@sanity/client listen() with a `token` and a `requestHandler`', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not consult the request handler, and replays the token it was created with', async () => {
    // The OAuth store renews tokens inside `requestHandler`. `listen()` never calls it: the
    // EventSource sends the `token` captured at subscribe time on every (re)connection, so a
    // listener that reconnects after a rotation presents a stale token and is refused.
    const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
      async () =>
        new Response(JSON.stringify({error: 'Unauthorized'}), {
          status: 401,
          headers: {'content-type': 'application/json'},
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const requestHandler = vi.fn<RequestHandler>((request, next) => next(request))
    const client = createClient({
      projectId: PROJECT_ID,
      dataset: DATASET,
      apiVersion: '2026-05-04',
      useCdn: false,
      token: 'access-1',
      ignoreBrowserTokenWarning: true,
      requestHandler,
      // Under vitest the node build of the client is resolved, whose transport does not go
      // through `globalThis.fetch`. Route the EventSource connection to the mock explicitly.
      ...({resolveFetch: () => fetchMock} as object),
    })

    const outcome = await new Promise<string>((resolve) => {
      const subscription = client.listen('*[_type == "x"]', {}, {events: ['welcome']}).subscribe({
        next: () => resolve('event'),
        error: (err: Error) => resolve(err.name),
      })
      setTimeout(() => {
        subscription.unsubscribe()
        resolve('timeout')
      }, 2_000)
    })

    expect(outcome).toBe('ConnectionFailedError')
    expect(fetchMock).toHaveBeenCalled()
    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer access-1')
    expect(requestHandler).not.toHaveBeenCalled()
  })
})
