import {
  type ClientConfig as SanityClientConfig,
  ClientError,
  type SanityClient,
} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {filter} from 'rxjs/operators'
import {describe, expect, it, vi} from 'vitest'

import {getOAuthFlowStorageKey} from '../constants'
import {_createOAuthAuthStore} from '../createOAuthAuthStore'
import {type OAuthEndpoints} from '../oauth/oauthEndpoints'

// Without localStorage the token pair lives in memory, and other tabs reach this one only through
// broadcasts. (jsdom reports no localStorage support to the store, so this is the default here.)
vi.mock('../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: false,
}))

const PROJECT_ID = 'test-project'
const ORIGIN = 'http://localhost:3333'

function createClientFactory(validTokens: Set<string>) {
  return (config: SanityClientConfig): SanityClient =>
    ({
      config: () => config,
      request: vi.fn(async ({url}: {url: string}) => {
        if (url !== '/users/me') return {}
        if (config.token && validTokens.has(config.token)) {
          return {id: 'user', name: 'User', email: 'u@example.com', role: '', roles: []}
        }
        throw new ClientError({
          statusCode: 401,
          headers: {},
          body: {error: 'Unauthorized', errorCode: 'SIO-401-AEX', statusCode: 401},
          method: 'GET',
          statusMessage: 'Unauthorized',
          url: `https://${PROJECT_ID}.api.sanity.io/v1/users/me`,
        })
      }),
    }) as unknown as SanityClient
}

describe('createOAuthAuthStore without localStorage', () => {
  it('refreshes a pair another tab broadcast, instead of treating it as signed out', async () => {
    const clientId = 'oc-memory-client'
    const endpoints: OAuthEndpoints = {
      authorizeUrl: () => 'https://api.sanity.io/v1/auth/oauth/authorize',
      exchangeCode: vi.fn(async () => ({
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'bearer',
        expires_in: 3600,
      })),
      refresh: vi.fn(async () => ({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        token_type: 'bearer',
        expires_in: 3600,
      })),
      revoke: vi.fn(async () => {}),
    }
    const environment = (search: string) => ({
      getLocation: () => ({origin: ORIGIN, pathname: '/', search}),
      navigate: vi.fn(),
      replaceUrl: vi.fn(),
      withLock: <T>(_name: string, task: () => Promise<T>) => task(),
    })

    // This tab: signed out, with a client that accepts only the renewed token.
    const thisTab = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId,
      clientFactory: createClientFactory(new Set(['access-2'])),
      endpoints,
      ...environment(''),
    })
    const subscription = thisTab.state.subscribe()

    // Another tab signs in and broadcasts its pair.
    sessionStorage.setItem(
      getOAuthFlowStorageKey(PROJECT_ID),
      JSON.stringify({codeVerifier: 'v', state: 's', redirectUri: ORIGIN}),
    )
    const otherTab = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId,
      clientFactory: createClientFactory(new Set(['access-1'])),
      endpoints,
      ...environment('?code=c&state=s'),
    })
    await otherTab.handleCallbackUrl!()

    // This tab finds access-1 rejected and renews it from the broadcast pair.
    const state = await firstValueFrom(thisTab.state.pipe(filter((s) => s.authenticated)))
    expect(endpoints.refresh).toHaveBeenCalledWith({clientId, refreshToken: 'refresh-1'})
    expect(state.client.config().token).toBe('access-2')
    subscription.unsubscribe()
  })
})
