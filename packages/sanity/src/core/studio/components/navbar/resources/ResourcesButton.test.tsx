import {act, fireEvent, render, screen} from '@testing-library/react'
import {defer, NEVER, type Observable, ReplaySubject, Subject, throwError} from 'rxjs'
import {PackageVersionInfoContext, WorkspacesContext} from 'sanity/_singletons'
import {SemVer} from 'semver'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {stubMessageBusHost} from '../../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {type WorkspaceSummary} from '../../../../config/types'
import {FEEDBACK_TUNNEL_URL} from '../../../../feedback/feedbackClient'
import type * as RenderingContextStoreModule from '../../../../store/renderingContext/createRenderingContextStore'
import {usePackageVersionStatus} from '../../../packageVersionStatus/usePackageVersionStatus'
import {type ResourcesResponse} from './helper-functions/types'
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

const {helpRequests, helpResponse$} = vi.hoisted(() => ({
  helpRequests: {count: 0},
  helpResponse$: {current: null as null | Observable<ResourcesResponse>},
}))

vi.mock('./helper-functions/helpResources', () => ({
  // Creating the observable is free; only a subscription is a `/help` request. So: count those.
  getHelpResources: () =>
    defer(() => {
      helpRequests.count += 1
      return helpResponse$.current ?? NEVER
    }),
}))
// The real hook behind a spy: it is called once per `ResourcesButton` render, so its call count
// is the button's render count.
vi.mock('../../../packageVersionStatus/usePackageVersionStatus', async (importOriginal) => {
  const actual = await importOriginal<{usePackageVersionStatus: typeof usePackageVersionStatus}>()
  return {usePackageVersionStatus: vi.fn(actual.usePackageVersionStatus)}
})
// A mock records whether the help sections' fallback ever rendered, not only whether it is still
// in the DOM when a test looks.
vi.mock('../../../../components/loadingBlock/LoadingBlock', () => ({
  LoadingBlock: vi.fn(() => <div data-testid="loading-block" />),
}))

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

const PACKAGE_VERSION_INFO = {
  isAutoUpdating: false,
  checkForUpdates: () => {},
  currentVersion: new SemVer('5.0.0'),
  versionCheckStatus: {lastCheckedAt: null, checking: false},
}

// `StudioRegistration` reads the workspaces once the menu opens
const NO_WORKSPACES: WorkspaceSummary[] = []

async function renderResourcesButton() {
  const TestProvider = await createTestProvider()
  render(
    <TestProvider>
      <WorkspacesContext.Provider value={NO_WORKSPACES}>
        <PackageVersionInfoContext.Provider value={PACKAGE_VERSION_INFO}>
          <ResourcesButton />
        </PackageVersionInfoContext.Provider>
      </WorkspacesContext.Provider>
    </TestProvider>,
  )
  // `useFeedbackAvailable` sets state from the probe's `fetch().then()`: settle it here, so its
  // re-render of the button does not land in the middle of a later assertion
  await flushMicrotasksThisIsACodeSmell()
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

describe('help resources', () => {
  const response: ResourcesResponse = {
    resources: {
      sectionArray: [
        {
          _key: 'learn',
          items: [
            {_key: 'docs', _type: 'externalLink', title: 'Documentation', url: 'https://docs'},
          ],
        },
      ],
    },
  }

  const buttonRenders = () => vi.mocked(usePackageVersionStatus).mock.calls.length

  async function openMenu() {
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the click reveals a menu whose help sections read the promise with use(), and a sync act cannot flush that suspension
    await act(async () => {
      // oxlint-disable-next-line testing-library/prefer-user-event -- userEvent lowers IS_REACT_ACT_ENVIRONMENT while it runs, and the popover's layout updates inside this act scope would then warn
      fireEvent.click(screen.getByTestId('button-resources-menu'))
    })
  }

  beforeEach(() => {
    helpRequests.count = 0
    helpResponse$.current = null
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {status: 200}))
  })

  it('requests the help resources when the button mounts, and the response does not re-render the button', async () => {
    const pending$ = new Subject<ResourcesResponse>()
    helpResponse$.current = pending$

    await renderResourcesButton()

    expect(helpRequests.count).toBe(1)
    expect(screen.queryByTestId('menu-button-resources')).not.toBeInTheDocument()

    const rendersBeforeResponse = buttonRenders()
    await act(async () => pending$.next(response))
    expect(buttonRenders()).toBe(rendersBeforeResponse)
  })

  it('opens with the settled sections in one pass when the response arrived before the menu opened', async () => {
    const settled$ = new ReplaySubject<ResourcesResponse>(1)
    settled$.next(response)
    helpResponse$.current = settled$

    await renderResourcesButton()
    await openMenu()

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByTestId('menu-item-studio-version')).toBeInTheDocument()
    expect(LoadingBlock).not.toHaveBeenCalled()
    expect(helpRequests.count).toBe(1)
  })

  it('shows the loading block when opened before the response, then the sections, without a second request or a button re-render', async () => {
    const pending$ = new Subject<ResourcesResponse>()
    helpResponse$.current = pending$

    await renderResourcesButton()
    await openMenu()

    expect(screen.getByTestId('menu-item-studio-version')).toBeInTheDocument()
    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
    expect(screen.queryByText('Documentation')).not.toBeInTheDocument()

    const rendersBeforeResponse = buttonRenders()
    await act(async () => pending$.next(response))

    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(helpRequests.count).toBe(1)
    expect(buttonRenders()).toBe(rendersBeforeResponse)
  })

  it('renders the static fallback links when the /help request errors', async () => {
    helpResponse$.current = throwError(() => new Error('/help is down'))

    // No error boundary in this tree: a promise that rejected instead of settling as `undefined`
    // would throw out of the menu and fail the test
    await renderResourcesButton()
    await openMenu()

    expect(screen.getByText('Help and support')).toBeInTheDocument()
    expect(screen.getByTestId('menu-item-studio-version')).toBeInTheDocument()
    expect(LoadingBlock).not.toHaveBeenCalled()
  })
})
