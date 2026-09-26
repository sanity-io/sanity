import {type SanityClient} from '@sanity/client'
import {act, render, screen} from '@testing-library/react'
import {of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {defineConfig} from '../../config/defineConfig'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {type LocaleResourceRecord} from '../../i18n/types'
import {type AuthStore} from '../../store/authStore/types'
import {promiseWithResolvers} from '../../util/promiseWithResolvers'
import {Studio} from '../Studio'

const client = createMockSanityClient() as unknown as SanityClient

// Logged out, with a login component that marks the screen so the test can wait for it
const loggedOutAuth: AuthStore = {
  state: of({authenticated: false, client, currentUser: null}),
  LoginComponent: () => <div data-testid="login-screen" />,
}

describe('StudioProvider', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('shows the loading block until the studio locale bundle has loaded, then the login screen', async () => {
    // The studio's own strings load on demand. The login screen translates (`WorkspaceAuth`,
    // `LoggedOutToast`) but renders before `LocaleProvider` and its Suspense boundary mount, so
    // when the namespace is still loading as the auth state resolves to logged-out, the studio
    // must keep showing its loading block (the boundary in StudioProvider) and render the login
    // screen once the strings are there, without rendering raw keys or reporting an error. An
    // extra `studio` bundle whose resources resolve only when told keeps the namespace loading
    // for as long as the test needs.
    const {promise: resources, resolve: resolveResources} =
      promiseWithResolvers<LocaleResourceRecord>()
    const config = defineConfig({
      projectId: 'test',
      dataset: 'test',
      auth: loggedOutAuth,
      i18n: {
        bundles: [{locale: 'en-US', namespace: studioLocaleNamespace, resources: () => resources}],
      },
    })

    render(<Studio config={config} />)

    // The auth state is logged-out right away; the login screen waits for the strings. (While
    // the fallback shows, React keeps the previously committed loading block hidden in the tree,
    // so there can be more than one.)
    expect(await screen.findAllByTestId('loading-block')).not.toHaveLength(0)
    expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument()

    await act(async () => {
      resolveResources({})
      await resources
    })

    expect(await screen.findByTestId('login-screen')).toBeInTheDocument()
    expect(consoleError).not.toHaveBeenCalled()
  })
})
