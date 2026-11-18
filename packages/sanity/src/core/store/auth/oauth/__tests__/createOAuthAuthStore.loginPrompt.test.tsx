import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {takeStashedAuthorizationResponse} from '../authorizationResponse'
import {getOAuthFlowStorageKey} from '../constants'
import {_createOAuthAuthStore} from '../createOAuthAuthStore'
import {createOAuthEndpoints} from '../oauthEndpoints'
import {
  createEnvironment,
  createMockClientFactory,
  createMockEndpoints,
  PROJECT_ID,
} from './fixtures'

// Persisted and shared by the tabs of this origin, like in a browser. In jsdom the store would
// otherwise keep everything in the tab.
vi.mock('../../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
}))

// A client ID per test: stores are never disposed, and a store left over from an earlier test
// would otherwise share this test's storage keys.
let testCount = 0
let CLIENT_ID = ''
let FLOW_KEY = ''

// Logging out revokes the OAuth tokens but leaves the sanity.io session alive, and the
// authorization server signs the user straight back in with it unless the request asks for the
// login form. Only the first sign-in after a logout asks for it.
describe('createOAuthAuthStore login prompt after logout', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    CLIENT_ID = `oc-login-prompt-${++testCount}`
    FLOW_KEY = getOAuthFlowStorageKey(PROJECT_ID, CLIENT_ID)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // A response no store took stays stashed for the page; tests share the page.
    takeStashedAuthorizationResponse()
  })

  function createTab(environment = createEnvironment()) {
    const {factory} = createMockClientFactory(new Set(['access-1']))
    const store = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId: CLIENT_ID,
      clientFactory: factory,
      endpoints: {
        ...createMockEndpoints(),
        authorizeUrl: createOAuthEndpoints({issuer: 'https://api.sanity.io', projectId: PROJECT_ID})
          .authorizeUrl,
      },
      ...environment,
    })
    return {store, environment}
  }

  /** Clicks the login screen's sign-in button, and returns the authorize URL it navigated to. */
  async function signIn({store, environment}: ReturnType<typeof createTab>): Promise<URL> {
    const {LoginComponent} = store
    if (!LoginComponent) throw new Error('expected a LoginComponent')
    const TestProvider = await createTestProvider()
    const calls = environment.navigate.mock.calls.length
    const {unmount} = render(
      <TestProvider>
        <LoginComponent projectId={PROJECT_ID} redirectPath="/" />
      </TestProvider>,
    )
    await userEvent.click(screen.getByRole('button', {name: 'Sign in with Sanity'}))
    await waitFor(() => expect(environment.navigate).toHaveBeenCalledTimes(calls + 1))
    unmount()
    return new URL(environment.navigate.mock.calls[calls][0])
  }

  /** Comes back from the authorization server with a code for the sign-in this tab started. */
  function completeSignIn({store, environment}: ReturnType<typeof createTab>) {
    const flow = JSON.parse(sessionStorage.getItem(FLOW_KEY)!)
    environment.location.search = `?code=the-code&state=${flow.state}`
    return store.handleCallbackUrl!()
  }

  it('does not ask for the login form on a first sign-in', async () => {
    const url = await signIn(createTab())
    expect(url.searchParams.has('prompt')).toBe(false)
  })

  it('asks for the login form on every sign-in attempt after a logout', async () => {
    const tab = createTab()
    await tab.store.logout!()

    expect((await signIn(tab)).searchParams.get('prompt')).toBe('login')
    // The user may abandon the redirect and try again.
    expect((await signIn(tab)).searchParams.get('prompt')).toBe('login')
  })

  it('stops asking for the login form once a sign-in completes', async () => {
    const tab = createTab()
    await tab.store.logout!()
    expect((await signIn(tab)).searchParams.get('prompt')).toBe('login')

    await expect(completeSignIn(tab)).resolves.toMatchObject({success: true})

    expect((await signIn(tab)).searchParams.has('prompt')).toBe(false)
  })

  it('asks for the login form in another tab after a logout in this one', async () => {
    const tabA = createTab()
    const tabB = createTab()
    await tabA.store.logout!()

    expect((await signIn(tabB)).searchParams.get('prompt')).toBe('login')

    // Once tab B has signed in, a later sign-in in tab A does not ask either.
    await expect(completeSignIn(tabB)).resolves.toMatchObject({success: true})
    expect((await signIn(tabA)).searchParams.has('prompt')).toBe(false)
  })

  it.each(['session-expired', 'session-not-found'] as const)(
    'does not ask for the login form after a forced logout (%s)',
    async (reason) => {
      // The session ended without the user asking: signing them back in with the sanity.io
      // session is what they want.
      const tab = createTab()
      await tab.store.logout!({reason})
      expect((await signIn(tab)).searchParams.has('prompt')).toBe(false)
    },
  )
})
