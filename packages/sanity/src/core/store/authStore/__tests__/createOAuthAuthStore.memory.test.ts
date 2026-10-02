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

// Without localStorage the token pair lives in this tab's memory and is not shared with other
// tabs. (jsdom reports no localStorage support to the store, so this is the default here.)
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
  it('keeps the token pair to the tab that signed in', async () => {
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
    const clientFactory = createClientFactory(new Set(['access-1']))
    const otherTab = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId,
      clientFactory,
      endpoints,
      ...environment(''),
    })
    const otherTabStates: boolean[] = []
    const subscription = otherTab.state.subscribe((state) =>
      otherTabStates.push(state.authenticated),
    )

    // This tab signs in.
    sessionStorage.setItem(
      getOAuthFlowStorageKey(PROJECT_ID),
      JSON.stringify({codeVerifier: 'v', state: 's', redirectUri: ORIGIN}),
    )
    const thisTab = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId,
      clientFactory,
      endpoints,
      ...environment('?code=c&state=s'),
    })
    await expect(thisTab.handleCallbackUrl!()).resolves.toMatchObject({success: true})
    const state = await firstValueFrom(thisTab.state.pipe(filter((s) => s.authenticated)))
    expect(state.client.config().token).toBe('access-1')

    // A broadcast would reach the other tab out of order with the refresh lock, and it could
    // redeem a refresh token this tab already used. So nothing is shared: it stays signed out
    // and never refreshes this tab's pair.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(otherTabStates).toEqual([false])
    expect(endpoints.refresh).not.toHaveBeenCalled()
    subscription.unsubscribe()
  })
})
