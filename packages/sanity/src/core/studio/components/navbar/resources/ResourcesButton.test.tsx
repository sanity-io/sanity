import {render, screen} from '@testing-library/react'
import {PackageVersionInfoContext} from 'sanity/_singletons'
import {SemVer} from 'semver'
import {afterEach, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {FEEDBACK_TUNNEL_URL} from '../../../../feedback/feedbackClient'
import {ResourcesButton} from './ResourcesButton'

// jsdom renders top-level, like a core-ui URL opened outside the Dashboard's frame.
vi.hoisted(() => {
  window.history.replaceState(
    null,
    '',
    `?_context=${encodeURIComponent(JSON.stringify({mode: 'core-ui', env: 'test'}))}`,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('skips the studio feedback probe when a core-ui URL is opened outside a frame', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {status: 200}))
  const TestProvider = await createTestProvider()
  render(
    <TestProvider>
      <PackageVersionInfoContext.Provider
        value={{
          isAutoUpdating: false,
          checkForUpdates: () => {},
          currentVersion: new SemVer('5.0.0'),
          versionCheckStatus: {lastCheckedAt: null, checking: false},
        }}
      >
        <ResourcesButton />
      </PackageVersionInfoContext.Provider>
    </TestProvider>,
  )

  expect(screen.getByTestId('button-resources-menu')).toBeVisible()
  expect(fetch).not.toHaveBeenCalledWith(FEEDBACK_TUNNEL_URL, expect.anything())
})
