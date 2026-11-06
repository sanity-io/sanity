// Helpers shared by the OAuth auth store tests.
import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  type SanityClient,
} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {firstValueFrom} from 'rxjs'
import {filter} from 'rxjs/operators'
import {vi} from 'vitest'

import {type AuthState} from '../../types'
import {
  type _createOAuthAuthStore,
  type OAuthAuthStoreEnvironment,
  type OAuthTokens,
} from '../createOAuthAuthStore'
import {type OAuthEndpoints, type OAuthTokenResponse} from '../oauthEndpoints'

export const MOCK_USER: CurrentUser = {
  id: 'mock-user-123',
  name: 'Test User',
  email: 'test@example.com',
  profileImage: '',
  provider: 'sanity',
  // oxlint-disable-next-line no-deprecated -- required by the CurrentUser type
  role: '',
  roles: [{name: 'editor', title: 'Editor'}],
}

export const PROJECT_ID = 'test-project'
export const ORIGIN = 'http://localhost:3333'

/** A 401 the API tags as an expired session, as the client throws it. */
export function createExpiredSessionError(): ClientError {
  return new ClientError({
    statusCode: 401,
    headers: {},
    body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX', statusCode: 401},
    method: 'GET',
    statusMessage: 'Unauthorized',
    url: `https://${PROJECT_ID}.api.sanity.io/v1/users/me`,
  })
}

export function tokenResponse(accessToken: string, refreshToken: string): OAuthTokenResponse {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
  }
}

export function storedTokens(accessToken: string, refreshToken: string): OAuthTokens {
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 3_600_000,
    refreshAt: Date.now() + 2_880_000,
  }
}

/** The bearer a client would send: the static `token`, or the current value of a reactive `auth`. */
export async function resolveConfiguredToken(
  config: SanityClientConfig,
): Promise<string | undefined> {
  if (config.auth) {
    const auth = await firstValueFrom(config.auth)
    return auth && 'token' in auth ? auth.token : undefined
  }
  return config.token
}

export function tokenOf(client: SanityClient): Promise<string | undefined> {
  return resolveConfiguredToken(client.config())
}

/**
 * Client factory whose `/users/me` answers for the tokens in `validTokens`, and 401s with an
 * expired session for anything else. Records the configs it was called with.
 */
export function createMockClientFactory(validTokens: Set<string>) {
  const configs: SanityClientConfig[] = []
  // `url` is what a real client derives from its config; the origin check builds on it.
  const factory = (config: SanityClientConfig & {url?: string}): SanityClient => {
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

export function createMockEndpoints(overrides: Partial<OAuthEndpoints> = {}): OAuthEndpoints {
  return {
    authorizeUrl: ({clientId, redirectUri, codeChallenge, state}) =>
      `https://api.sanity.io/v1/auth/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&state=${state}`,
    exchangeCode: vi.fn(async () => tokenResponse('access-1', 'refresh-1')),
    refresh: vi.fn(async () => tokenResponse('access-2', 'refresh-2')),
    revoke: vi.fn(async () => {}),
    ...overrides,
  }
}

export function createEnvironment(search = '') {
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
    locksAvailable: false,
  }
}

export const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function authenticatedState(state: AuthStateSource): Promise<AuthState> {
  return firstValueFrom(state.pipe(filter((s) => s.authenticated)))
}

export type AuthStateSource = ReturnType<typeof _createOAuthAuthStore>['state']
