import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {act, render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {getOAuthFlowStorageKey} from '../constants'
import {_createOAuthAuthStore} from '../createOAuthAuthStore'
import {createOAuthEndpoints} from '../oauthEndpoints'

const PROJECT_ID = 'test-project'
const ORIGIN = 'http://localhost:3333'
const FLOW_KEY = getOAuthFlowStorageKey(PROJECT_ID, 'oc-test-client')

function createAnonymousClient(config: SanityClientConfig): SanityClient {
  return {config: () => config, request: vi.fn()} as unknown as SanityClient
}

describe('OAuth login component', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('shows why the authorization server refused, and clears it on the next attempt', async () => {
    // The authorization server answered our request with an error (RFC 6749 section 4.1.2.1).
    // The response is matched against the pending request's `state`, so only the server's own
    // redirect reaches this path, and its description is safe to show.
    sessionStorage.setItem(
      FLOW_KEY,
      JSON.stringify({codeVerifier: 'v', state: 'expected-state', redirectUri: ORIGIN}),
    )
    const navigate = vi.fn()
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({
        origin: ORIGIN,
        pathname: '/',
        search:
          '?error=access_denied&error_description=The+resource+owner+denied+the+request&state=expected-state',
      }),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    await expect(store.handleCallbackUrl!()).resolves.toMatchObject({success: false})
    const {LoginComponent} = store
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/structure" />
      </TestProvider>,
    )

    const notice = await screen.findByTestId('oauth-login-error')
    expect(notice.textContent).toContain('The resource owner denied the request')
    expect(notice.textContent).toContain('access_denied')

    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId('oauth-login-error')).toBeNull()
  })

  it.each([
    ['the response names another issuer', '&iss=https%3A%2F%2Fevil.example', undefined],
    ['the code exchange fails', '', new Error('token endpoint unavailable')],
  ])('shows that sign-in did not complete when %s', async (_case, issParam, exchangeError) => {
    sessionStorage.setItem(
      FLOW_KEY,
      JSON.stringify({codeVerifier: 'v', state: 'expected-state', redirectUri: ORIGIN}),
    )
    const endpoints = createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'})
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: {
        ...endpoints,
        exchangeCode: exchangeError ? () => Promise.reject(exchangeError) : endpoints.exchangeCode,
      },
      getLocation: () => ({
        origin: ORIGIN,
        pathname: '/',
        search: `?code=c&state=expected-state${issParam}`,
      }),
      navigate: vi.fn(),
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    await expect(store.handleCallbackUrl!()).resolves.toMatchObject({success: false})
    const {LoginComponent} = store
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/structure" />
      </TestProvider>,
    )

    expect(await screen.findByTestId('oauth-login-error')).toHaveTextContent(
      'Sign-in was not completed',
    )
  })

  it('sends the user to the authorization server with a PKCE challenge', async () => {
    const navigate = vi.fn()
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
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
    const flow = JSON.parse(sessionStorage.getItem(FLOW_KEY)!)

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

  it('reports that sign-in started, with nothing else', async () => {
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate: vi.fn(),
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    const events: unknown[] = []
    const subscription = store.telemetryEvents.subscribe((event) => events.push(event))
    const {LoginComponent} = store
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/structure" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    await waitFor(() => expect(events).toEqual([{type: 'sign-in-started'}]))
    subscription.unsubscribe()
  })

  it('sends the authorization response through a redirect relay, with the Studio URL in state', async () => {
    // A branch deploy's origin isn't known ahead of time, so it can't be a registered redirect
    // URL. The application registers a relay instead, which reads the Studio URL from `state`
    // and redirects there.
    const relay = 'https://oauth-relay.example/'
    const navigate = vi.fn()
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      redirectRelayUri: relay,
      basePath: '/oauth',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/oauth', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    const {LoginComponent} = store
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/oauth/structure" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    const authorizeUrl = new URL(navigate.mock.calls[0][0])
    const flow = JSON.parse(sessionStorage.getItem(FLOW_KEY)!)
    const state = authorizeUrl.searchParams.get('state')!
    const [random, returnTo] = state.split('.')

    expect(authorizeUrl.searchParams.get('redirect_uri')).toBe(relay)
    expect(random).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(Buffer.from(returnTo, 'base64url').toString()).toBe(`${ORIGIN}/oauth`)
    // The code is redeemed with the redirect URL it was issued for: the relay.
    expect(flow).toMatchObject({state, redirectUri: relay, redirectPath: '/oauth/structure'})
  })

  it('refuses a redirect relay that is not an absolute https URL without a fragment', () => {
    const create = (redirectRelayUri: string) => () =>
      _createOAuthAuthStore({
        projectId: PROJECT_ID,
        dataset: 'test-dataset',
        clientId: 'oc-test-client',
        redirectRelayUri,
        clientFactory: createAnonymousClient,
        endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
        getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
        navigate: vi.fn(),
        replaceUrl: vi.fn(),
        withLock: (_name, task) => task(),
        locksAvailable: false,
      })

    expect(create('http://oauth-relay.example/')).toThrow(/redirectRelayUri/)
    expect(create('/relay')).toThrow(/redirectRelayUri/)
    expect(create('https://oauth-relay.example/#x')).toThrow(/redirectRelayUri/)
    expect(create('https://oauth-relay.example/')).not.toThrow()
  })

  it('leaves an earlier authorization response out of the path it returns to', async () => {
    // A response this tab did not request stays in the URL, and the login screen passes that URL
    // on. Returning to it after the next sign-in would bring the old code back.
    const navigate = vi.fn()
    const {LoginComponent} = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent
          projectId={PROJECT_ID}
          redirectPath="/structure?code=old-code&state=old-state&iss=x&perspective=drafts"
        />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(JSON.parse(sessionStorage.getItem(FLOW_KEY)!)).toMatchObject({
      redirectPath: '/structure?perspective=drafts',
    })
  })

  it('lets the user try again after coming back from the authorization server', async () => {
    // Leaving for the authorization server is a full navigation, but the browser can keep the
    // page in its back/forward cache. When the authorization page fails (for example the redirect
    // URL is not registered) and the user presses Back, the login screen is restored as it was,
    // with the button still busy. The restore fires `pageshow` with `persisted: true`.
    const navigate = vi.fn()
    const {LoginComponent} = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/" />
      </TestProvider>,
    )
    const button = screen.getByRole<HTMLButtonElement>('button', {name: 'Sign in with Sanity'})
    await userEvent.click(button)
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(button.disabled).toBe(true)

    act(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}))
    })

    await waitFor(() => expect(button.disabled).toBe(false))
    await userEvent.click(button)
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(2))
  })

  it('returns to the workspace base path by default', async () => {
    const navigate = vi.fn()
    const {LoginComponent} = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      basePath: '/oauth/',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/oauth', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
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

  it('shows why sign-in could not start when the request cannot be stored', async () => {
    const navigate = vi.fn()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const {LoginComponent} = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: 'oc-test-client',
      clientFactory: createAnonymousClient,
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/" />
      </TestProvider>,
    )
    const button = screen.getByRole('button', {name: 'Sign in with Sanity'})
    await userEvent.click(button)

    const error = await screen.findByTestId('oauth-login-error')
    expect(error).toHaveTextContent('Could not start signing in')
    expect(error).toHaveTextContent('QuotaExceededError')
    expect(button).toBeEnabled()
    expect(navigate).not.toHaveBeenCalled()
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
      endpoints: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: 'p1'}),
      getLocation: () => ({origin: ORIGIN, pathname: '/', search: ''}),
      navigate,
      replaceUrl: vi.fn(),
      withLock: (_name, task) => task(),
      locksAvailable: false,
    })
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))

    expect(await screen.findByTestId('oauth-login-error')).toHaveTextContent(message)
    expect(navigate).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
  })
})
