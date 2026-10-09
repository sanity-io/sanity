import {render, screen} from '@testing-library/react'
import {PackageVersionInfoContext} from 'sanity/_singletons'
import {SemVer} from 'semver'
import {afterEach, expect, it, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {FEEDBACK_TUNNEL_URL} from '../../../../feedback/feedbackClient'
import type * as RenderingContextStoreModule from '../../../../store/renderingContext/createRenderingContextStore'
import {ResourcesButton} from './ResourcesButton'

// The URL query the rendering context store reads, so a test can render Studio in the Dashboard.
let renderingContextSearch: string | undefined

vi.mock(
  '../../../../store/renderingContext/createRenderingContextStore',
  async (importOriginal) => {
    const actual = await importOriginal<typeof RenderingContextStoreModule>()
    return {
      ...actual,
      createRenderingContextStore: () => actual.createRenderingContextStore(renderingContextSearch),
    }
  },
)

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

const PACKAGE_VERSION_INFO = {
  isAutoUpdating: false,
  checkForUpdates: () => {},
  currentVersion: new SemVer('5.0.0'),
  versionCheckStatus: {lastCheckedAt: null, checking: false},
}

async function renderResourcesButton() {
  const TestProvider = await createTestProvider()
  render(
    <TestProvider>
      <PackageVersionInfoContext.Provider value={PACKAGE_VERSION_INFO}>
        <ResourcesButton />
      </PackageVersionInfoContext.Provider>
    </TestProvider>,
  )
}

afterEach(() => {
  renderingContextSearch = undefined
  vi.restoreAllMocks()
})

it('probes the studio feedback tunnel outside a dashboard', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {status: 200}))

  await renderResourcesButton()

  expect(fetch.mock.calls.map(([input]) => input)).toContain(FEEDBACK_TUNNEL_URL)
})

it.each([
  {
    // jsdom renders top-level, like a core-ui URL opened outside the Dashboard's frame.
    host: 'a core-ui URL opened outside a frame',
    setup: () => {
      renderingContextSearch = CORE_UI_SEARCH
    },
  },
  {host: 'a message bus host', setup: () => stubMessageBusHost()},
])('skips the studio feedback probe for $host', async ({setup}) => {
  setup()
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {status: 200}))

  await renderResourcesButton()

  expect(screen.getByTestId('button-resources-menu')).toBeVisible()
  expect(fetch.mock.calls.map(([input]) => input)).not.toContain(FEEDBACK_TUNNEL_URL)
})
