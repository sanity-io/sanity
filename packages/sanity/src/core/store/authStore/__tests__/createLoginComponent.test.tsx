import {type SanityClient} from '@sanity/client'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {createLoginComponent, getProviders} from '../createLoginComponent'

interface MockClient {
  config: Record<string, unknown>
  request: ReturnType<typeof vi.fn>
  withConfig: (next: Record<string, unknown>) => MockClient
}

interface MockClientFactory {
  client: MockClient
  /** Configs captured at the moment each request was made. */
  requestConfigs: Array<Record<string, unknown>>
}

function createMockClient(initialConfig: Record<string, unknown>): MockClientFactory {
  const requestConfigs: Array<Record<string, unknown>> = []
  const make = (config: Record<string, unknown>): MockClient => {
    const client: MockClient = {
      config,
      request: vi.fn(() => {
        requestConfigs.push(client.config)
        return Promise.resolve({providers: [], thirdPartyLogin: true})
      }),
      withConfig: (next) => make({...client.config, ...next}),
    }
    return client
  }
  return {client: make(initialConfig), requestConfigs}
}

describe('getProviders', () => {
  it('requests /auth/providers without sending the auth credential', async () => {
    // Regression: when a Studio session expires, sending the now-stale token
    // (or session cookie) with /auth/providers causes the server to reject
    // the request, which surfaces as a generic "An error occurred" screen via
    // StudioErrorBoundary instead of routing the user back through the login
    // flow. /auth/providers is public, so the fix is to strip credentials —
    // an anonymous request can't trip the rejection path.
    const {client, requestConfigs} = createMockClient({
      token: 'expired-token',
      withCredentials: true,
    })

    await getProviders({
      client: client as unknown as SanityClient,
      mode: 'append',
      providers: [],
    })

    expect(requestConfigs).toHaveLength(1)
    expect(requestConfigs[0]?.token).toBeUndefined()
    expect(requestConfigs[0]?.withCredentials).toBe(false)
  })

  it('skips /auth/providers entirely in replace mode with a provider array', async () => {
    const {client, requestConfigs} = createMockClient({token: 'expired-token'})
    const customProviders = [{name: 'github', title: 'GitHub', url: 'https://example.com/login'}]

    const result = await getProviders({
      client: client as unknown as SanityClient,
      mode: 'replace',
      providers: customProviders,
    })

    expect(result).toEqual(customProviders)
    expect(requestConfigs).toHaveLength(0)
  })
})

describe('LoginComponent redirectOnSingle', () => {
  const ORIGINAL_HREF = window.location.href
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location')

  afterEach(() => {
    // Restore the original window.location so this suite doesn't leak the
    // overridden descriptor into other tests sharing the jsdom global.
    if (originalLocationDescriptor) {
      Object.defineProperty(window, 'location', originalLocationDescriptor)
    }
    vi.restoreAllMocks()
  })

  function renderLogin(opts: {isHandlingCallback: () => boolean}) {
    // Capture writes to window.location.href without navigating jsdom.
    const setHref = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        origin: 'https://studio.example',
        get href() {
          return ORIGINAL_HREF
        },
        set href(value: string) {
          setHref(value)
        },
      },
    })

    // A single provider so redirectOnSingle would normally fire.
    const client = {
      withConfig: () => client,
      request: vi.fn(() =>
        Promise.resolve({
          providers: [{name: 'saml', title: 'SSO', url: 'https://api.example/auth/saml/login'}],
          thirdPartyLogin: true,
        }),
      ),
    } as unknown as SanityClient

    const LoginComponent = createLoginComponent({
      client$: of(client),
      loginMethod: 'dual',
      redirectOnSingle: true,
      mode: 'append',
      providers: [],
      wasLogout: () => false,
      isHandlingCallback: opts.isHandlingCallback,
    })

    render(
      <ThemeProvider theme={studioTheme}>
        <LoginComponent projectId="p" basePath="/" />
      </ThemeProvider>,
    )
    return {setHref}
  }

  it('does NOT redirect to the single provider while a callback exchange is in flight', async () => {
    // Regression for an "extra cycle": redirectOnSingle must hold off while
    // handleCallbackUrl is still exchanging the sid, otherwise the studio
    // bounces back to the provider before the freshly exchanged credential is
    // applied, wasting a full round-trip before login finally sticks.
    const {setHref} = renderLogin({isHandlingCallback: () => true})

    // Wait for a deterministic signal that providers resolved and the chooser
    // rendered (rather than redirecting) — the heading only shows once the
    // provider effect has run. Then assert no redirect was attempted.
    await screen.findByText('Choose login provider')
    expect(setHref).not.toHaveBeenCalled()
  })

  it('DOES redirect to the single provider when no callback is in flight', async () => {
    const {setHref} = renderLogin({isHandlingCallback: () => false})

    await waitFor(() => expect(setHref).toHaveBeenCalledTimes(1))
    expect(setHref).toHaveBeenCalledWith(expect.stringContaining('/auth/saml/login'))
  })
})

function createEmptyProviderLogin() {
  const client = {
    withConfig: () => client,
    request: vi.fn(() => Promise.resolve({providers: [], thirdPartyLogin: true})),
  } as unknown as SanityClient

  return createLoginComponent({
    client$: of(client),
    loginMethod: 'dual',
    providers: [],
    wasLogout: () => false,
    isHandlingCallback: () => false,
  })
}

describe('LoginComponent with no providers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a warning instead of an empty chooser when providers resolve empty', async () => {
    // `providers: []` replaces the default providers with none (rather than
    // falling back to defaults), so the chooser would otherwise render an empty,
    // dead-end dialog. We surface a caution card explaining the misconfiguration.
    const LoginComponent = createEmptyProviderLogin()

    render(
      <ThemeProvider theme={studioTheme}>
        <LoginComponent projectId="p" basePath="/" />
      </ThemeProvider>,
    )

    await screen.findByText('No login providers available')
    expect(screen.queryByText('Choose login provider')).toBeNull()
  })

  it('offers to switch workspaces when onChooseAnotherWorkspace is provided', async () => {
    const onChooseAnotherWorkspace = vi.fn()
    const LoginComponent = createEmptyProviderLogin()
    // The button label is translated, so render inside the i18n provider to
    // resolve the key rather than asserting on the raw key.
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <LoginComponent
          projectId="p"
          basePath="/"
          onChooseAnotherWorkspace={onChooseAnotherWorkspace}
        />
      </TestProvider>,
    )

    const button = await screen.findByText('Choose another workspace')
    button.click()
    expect(onChooseAnotherWorkspace).toHaveBeenCalledTimes(1)
  })

  it('hides the switch action when onChooseAnotherWorkspace is not provided', async () => {
    // There's only one workspace to use, so there's nothing to switch to.
    const LoginComponent = createEmptyProviderLogin()

    render(
      <ThemeProvider theme={studioTheme}>
        <LoginComponent projectId="p" basePath="/" />
      </ThemeProvider>,
    )

    await screen.findByText('No login providers available')
    expect(screen.queryByText('Choose another workspace')).toBeNull()
  })
})
