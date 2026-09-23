import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {getOAuthFlowStorageKey} from '../constants'
import {_createOAuthAuthStore} from '../createOAuthAuthStore'
import {createOAuthEndpoints} from '../oauth/oauthEndpoints'

const PROJECT_ID = 'test-project'
const ORIGIN = 'http://localhost:3333'

function createAnonymousClient(config: SanityClientConfig): SanityClient {
  return {config: () => config, request: vi.fn()} as unknown as SanityClient
}

describe('OAuth login component', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('sends the user to the authorization server with a PKCE challenge', async () => {
    const navigate = vi.fn()
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints('https://api.sanity.io'),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
    })
    const {LoginComponent} = store
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/structure" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    const authorizeUrl = new URL(navigate.mock.calls[0][0])
    const flow = JSON.parse(sessionStorage.getItem(getOAuthFlowStorageKey(PROJECT_ID))!)

    expect(authorizeUrl.origin + authorizeUrl.pathname).toBe(
      'https://api.sanity.io/v1/auth/oauth/authorize',
    )
    expect(Object.fromEntries(authorizeUrl.searchParams)).toEqual({
      response_type: 'code',
      client_id: 'oc-test-client',
      redirect_uri: ORIGIN,
      code_challenge: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      code_challenge_method: 'S256',
      state: flow.state,
    })
    expect(flow).toMatchObject({redirectUri: ORIGIN, redirectPath: '/structure'})
  })

  it('returns to the workspace base path by default', async () => {
    const navigate = vi.fn()
    const {LoginComponent} = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      basePath: '/oauth/',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints('https://api.sanity.io'),
      getLocation: () => ({origin: ORIGIN, pathname: '/oauth', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
    })
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/oauth" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(new URL(navigate.mock.calls[0][0]).searchParams.get('redirect_uri')).toBe(
      `${ORIGIN}/oauth`,
    )
  })

  it('does not leave for the authorization server when the request cannot be stored', async () => {
    const navigate = vi.fn()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const {LoginComponent} = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints('https://api.sanity.io'),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
    })
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()
    const onError = vi.fn((event: ErrorEvent) => event.preventDefault())
    window.addEventListener('error', onError)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    await waitFor(() => expect(onError).toHaveBeenCalled())
    expect(navigate).not.toHaveBeenCalled()
    window.removeEventListener('error', onError)
  })

  it.each([
    ['on another origin', 'https://elsewhere.example.com', 'must be on the Studio origin'],
    ['that is relative', '/callback', 'must be an absolute URL'],
    ['with a fragment', `${ORIGIN}/callback#done`, 'must not have a fragment'],
  ])('refuses a redirect URL %s', async (_case, redirectUri, message) => {
    const navigate = vi.fn()
    const {LoginComponent} = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      redirectUri,
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints('https://api.sanity.io'),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
    })
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()
    const onError = vi.fn((event: ErrorEvent) => event.preventDefault())
    window.addEventListener('error', onError)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    await waitFor(() => expect(onError).toHaveBeenCalled())
    expect(onError.mock.calls[0][0].error.message).toContain(message)
    expect(navigate).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(getOAuthFlowStorageKey(PROJECT_ID))).toBeNull()
    window.removeEventListener('error', onError)
  })
})
