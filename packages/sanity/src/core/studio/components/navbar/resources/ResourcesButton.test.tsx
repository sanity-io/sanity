import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {defer, NEVER, type Observable, of, ReplaySubject, Subject, throwError} from 'rxjs'
import semver from 'semver'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ResourcesResponse} from './helper-functions/types'
import {ResourcesButton} from './ResourcesButton'

const {helpRequests, helpResponse$, LoadingBlock, usePackageVersionStatus} = vi.hoisted(() => ({
  helpRequests: {count: 0},
  helpResponse$: {current: null as null | Observable<ResourcesResponse>},
  LoadingBlock: vi.fn(() => <div data-testid="loading-block" />),
  // Called once per `ResourcesButton` render, so its call count is the button's render count
  usePackageVersionStatus: vi.fn(() => ({currentVersion: semver.parse('3.0.0')})),
}))

vi.mock('./helper-functions/helpResources', () => ({
  // Creating the observable is free; only a subscription is a `/help` request. So: count those.
  getHelpResources: () =>
    defer(() => {
      helpRequests.count += 1
      return helpResponse$.current ?? NEVER
    }),
}))
vi.mock('../../../../components/loadingBlock/LoadingBlock', () => ({LoadingBlock}))
vi.mock('../../../packageVersionStatus/usePackageVersionStatus', () => ({usePackageVersionStatus}))
vi.mock('../../../../hooks/useClient', () => {
  const client = {}
  return {useClient: () => client}
})
vi.mock('../../../../i18n/hooks/useLocale', () => ({useCurrentLocale: () => ({id: 'en-US'})}))
vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../../../../feedback/hooks/useFeedbackAvailable', () => ({
  useFeedbackAvailable: () => false,
}))
vi.mock('../../../../feedback/hooks/useFeedbackTelemetry', () => ({
  useFeedbackTelemetry: () => ({feedbackDialogOpened: () => {}, feedbackDialogDismissed: () => {}}),
}))
vi.mock('../../../../store/renderingContext/useRenderingContext', () => ({
  useRenderingContext: () => undefined,
}))
vi.mock('../../../hooks/useEnvAwareSanityWebsiteUrl', () => ({
  useEnvAwareSanityWebsiteUrl: () => 'https://www.sanity.io',
}))
vi.mock('../../../workspaces/useWorkspaces', () => ({useWorkspaces: () => []}))
vi.mock('../../../../store/datastores', () => ({
  useProjectStore: () => ({getGrants: () => of([])}),
}))

const response: ResourcesResponse = {
  resources: {
    sectionArray: [
      {
        _key: 'learn',
        items: [{_key: 'docs', _type: 'externalLink', title: 'Documentation', url: 'https://docs'}],
      },
    ],
  },
}

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

const buttonRenders = () => usePackageVersionStatus.mock.calls.length

async function openMenu() {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the click reveals a menu whose help sections read the promise with use(), and a sync act cannot flush that suspension
  await act(async () => {
    // oxlint-disable-next-line testing-library/prefer-user-event -- userEvent lowers IS_REACT_ACT_ENVIRONMENT while it runs, and the popover's layout updates inside this act scope would then warn
    fireEvent.click(screen.getByRole('button', {name: 'help-resources.title'}))
  })
}

describe('ResourcesButton', () => {
  beforeEach(() => {
    helpRequests.count = 0
    helpResponse$.current = null
  })

  it('requests the help resources when the button mounts, and the response does not re-render the button', async () => {
    const pending$ = new Subject<ResourcesResponse>()
    helpResponse$.current = pending$

    render(<ResourcesButton />, {wrapper})

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

    render(<ResourcesButton />, {wrapper})
    await openMenu()

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByTestId('menu-item-studio-version')).toBeInTheDocument()
    expect(LoadingBlock).not.toHaveBeenCalled()
    expect(helpRequests.count).toBe(1)
  })

  it('shows the loading block when opened before the response, then the sections, without a second request or a button re-render', async () => {
    const pending$ = new Subject<ResourcesResponse>()
    helpResponse$.current = pending$

    render(<ResourcesButton />, {wrapper})
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
    render(<ResourcesButton />, {wrapper})
    await openMenu()

    expect(screen.getByText('help-resources.action.help-and-support')).toBeInTheDocument()
    expect(screen.getByTestId('menu-item-studio-version')).toBeInTheDocument()
    expect(LoadingBlock).not.toHaveBeenCalled()
  })
})
