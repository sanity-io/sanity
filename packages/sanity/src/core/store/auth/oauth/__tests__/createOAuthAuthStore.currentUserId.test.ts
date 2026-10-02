import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import type * as AuthIdProbeModule from '../../utils/createAuthIdProbe'
import {type AuthIdProbeOptions, createAuthIdProbe} from '../../utils/createAuthIdProbe'
import {getOAuthTokensStorageKey} from '../constants'
import {_createOAuthAuthStore, type OAuthAuthStoreEnvironment} from '../createOAuthAuthStore'
import {type OAuthEndpoints} from '../oauthEndpoints'

vi.mock('../../../../util/supportsLocalStorage', () => ({supportsLocalStorage: true}))
vi.mock('../../utils/createAuthIdProbe', async (importActual) => {
  const actual = await importActual<typeof AuthIdProbeModule>()
  return {...actual, createAuthIdProbe: vi.fn(actual.createAuthIdProbe)}
})

const PROJECT_ID = 'test-project'
let testCount = 0

function createStore(clientId: string) {
  const location = {origin: 'http://localhost:3333', pathname: '/', search: ''}
  const environment = {
    getLocation: () => location,
    navigate: vi.fn(),
    replaceUrl: vi.fn(),
    withLock: ((_name, task) => task()) satisfies OAuthAuthStoreEnvironment['withLock'],
  }
  const endpoints: OAuthEndpoints = {
    authorizeUrl: () => 'https://api.sanity.io/v1/auth/oauth/authorize',
    exchangeCode: vi.fn(),
    refresh: vi.fn(),
    revoke: vi.fn(async () => {}),
  }
  return _createOAuthAuthStore({
    projectId: PROJECT_ID,
    dataset: 'test-dataset',
    clientId,
    clientFactory: (config: SanityClientConfig) => ({config: () => config}) as SanityClient,
    endpoints,
    ...environment,
  })
}

function probeOptions(): AuthIdProbeOptions {
  return vi.mocked(createAuthIdProbe).mock.calls.at(-1)![0]
}

describe('createOAuthAuthStore: currentUserId', () => {
  let clientId: string
  beforeEach(() => {
    localStorage.clear()
    clientId = `oc-current-user-${++testCount}`
  })

  it('asks /auth/id with the access token the store holds, never with the cookie', () => {
    localStorage.setItem(
      getOAuthTokensStorageKey(PROJECT_ID, clientId),
      JSON.stringify({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresAt: Date.now() + 3_600_000,
        refreshAt: Date.now() + 2_880_000,
      }),
    )
    const store = createStore(clientId)

    expect(store.currentUserId).toBeDefined()
    const config = probeOptions().clientConfig()
    expect(config).toMatchObject({projectId: PROJECT_ID, token: 'access-1'})
    expect(config?.withCredentials).toBeUndefined()
  })

  it('answers signed out without asking when the store holds no tokens', () => {
    createStore(clientId)

    expect(probeOptions().clientConfig()).toBeUndefined()
  })
})
