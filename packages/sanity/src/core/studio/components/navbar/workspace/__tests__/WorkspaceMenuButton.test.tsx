import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode, Suspense, use} from 'react'
import {type ObservablePromise} from 'react-rx'
import {defer, NEVER, type Observable, ReplaySubject} from 'rxjs'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../../../config/types'
import {WorkspaceMenuButton} from '../WorkspaceMenuButton'

const {mockProbeWorkspaceAuth, probeSubscriptions, projectName$, projectNameSubscriptions} =
  vi.hoisted(() => ({
    mockProbeWorkspaceAuth: vi.fn(),
    probeSubscriptions: {count: 0},
    projectName$: {current: null as null | Observable<string | null>},
    projectNameSubscriptions: {count: 0},
  }))

vi.mock('../../../../../store/authStore/probeWorkspaceAuth', () => ({
  probeWorkspaceAuth: mockProbeWorkspaceAuth,
}))
vi.mock('../../../../../store/datastores', () => {
  const projectStore = {
    getProjectName: () =>
      defer(() => {
        projectNameSubscriptions.count += 1
        return projectName$.current ?? NEVER
      }),
  }
  return {useProjectStore: () => projectStore}
})
vi.mock('../../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../ManageMenu', () => ({
  ManageMenu: ({projectNamePromise}: {projectNamePromise: ObservablePromise<string | null>}) => (
    <div data-testid="manage-menu">
      <Suspense fallback={<span data-testid="project-name-pending" />}>
        <ProjectNameProbe promise={projectNamePromise} />
      </Suspense>
    </div>
  ),
}))

function ProjectNameProbe({promise}: {promise: ObservablePromise<string | null>}) {
  return <span data-testid="project-name">{use(promise)}</span>
}

async function renderButton() {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the probe reads the promise with use() during the hidden menu's yielding pre-render, which React's sync act reports as an unflushed suspension
  await act(async () => {
    render(<WorkspaceMenuButton />, {wrapper})
  })
}

const workspaceA = {
  name: 'workspace-a',
  title: 'Workspace A',
  basePath: '/workspace-a',
  projectId: 'project-a',
  dataset: 'production',
  auth: {},
} as unknown as WorkspaceSummary
const workspaceB = {
  name: 'workspace-b',
  title: 'Workspace B',
  basePath: '/workspace-b',
  projectId: 'project-b',
  dataset: 'production',
  auth: {},
} as unknown as WorkspaceSummary

vi.mock('../../../../workspaces/useVisibleWorkspaces', () => ({
  useVisibleWorkspaces: () => ({visibleWorkspaces: [workspaceA, workspaceB]}),
}))
vi.mock('../../../../activeWorkspaceMatcher/useActiveWorkspace', () => ({
  useActiveWorkspace: () => ({activeWorkspace: workspaceA}),
}))

const theme = buildTheme()
// The active workspace's router: a sibling workspace's basePath is outside
// it, which is exactly what `navigateUrl` receives on a switch.
const router = route.create(workspaceA.basePath, [route.intents('/intent')])
const onNavigate = vi.fn()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>
      <RouterProvider onNavigate={onNavigate} router={router} state={{}}>
        {children}
      </RouterProvider>
    </LayerProvider>
  </ThemeProvider>
)

/** Opens the menu and returns the row for `name`, which is a real anchor. */
async function openMenuAndFindWorkspaceLink(name: RegExp) {
  await userEvent.click(screen.getByRole('button', {name: /Workspace A/}))
  const link = await screen.findByRole('menuitem', {name, hidden: true})
  expect(link.tagName).toBe('A')
  return link
}

/**
 * Clicks `link` and reports whether the anchor's own navigation was cancelled
 * by the time the event reached `window`, i.e. after React's handlers ran.
 * The listener then cancels it itself: jsdom cannot navigate, and would log
 * "Not implemented: navigation" for a click the browser is meant to handle.
 */
function clickAndReadDefaultPrevented(link: HTMLElement, init?: MouseEventInit): boolean {
  let defaultPrevented: boolean | undefined
  const observe = (event: Event) => {
    defaultPrevented = event.defaultPrevented
    event.preventDefault()
  }
  window.addEventListener('click', observe)
  try {
    // oxlint-disable-next-line testing-library/prefer-user-event -- a modified click needs the raw MouseEventInit (metaKey) that userEvent.click does not take
    fireEvent.click(link, init)
  } finally {
    window.removeEventListener('click', observe)
  }
  if (defaultPrevented === undefined) throw new Error('click never reached window')
  return defaultPrevented
}

describe('WorkspaceMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    probeSubscriptions.count = 0
    projectNameSubscriptions.count = 0
    const held$ = new ReplaySubject<string | null>(1)
    held$.next('Sanity Studio Test Data')
    projectName$.current = held$
    // One subscription = one would-be `/auth/id` request.
    // Creating the observable is free and happens during render;
    // only subscribing fires the request. So: count subscriptions.
    mockProbeWorkspaceAuth.mockImplementation(() =>
      defer(() => {
        probeSubscriptions.count += 1
        return NEVER
      }),
    )
  })

  it('does not render the closed menu content or subscribe any auth probe at boot', async () => {
    await renderButton()

    // Closed popovers render nothing until the menu opens or its button shows
    // intent to open it (@sanity/ui v4.4). So: zero requests at boot.
    expect(screen.queryByTestId('manage-menu')).not.toBeInTheDocument()
    expect(mockProbeWorkspaceAuth).not.toHaveBeenCalled()
    expect(probeSubscriptions.count).toBe(0)
  })

  it('pre-renders the closed menu content on hover without subscribing its auth probes', async () => {
    await renderButton()

    await userEvent.hover(screen.getByRole('button', {name: /Workspace A/}))

    // Hover is intent to open: the menu content pre-renders hidden
    // (`<Activity>`), so the item probe observables get created…
    expect(await screen.findByTestId('manage-menu')).toBeInTheDocument()
    expect(screen.getByText('Workspace B')).toBeInTheDocument()

    // …but the only subscriptions are the hover preload's, one per workspace.
    // Why: with an initialValue, react-rx skips its render-phase warm-up
    // (react-rx#506). The subscription waits for commit, and hidden
    // Activity defers commit until the menu opens.
    // Without the warm-up skip each hidden item would subscribe too.
    expect(probeSubscriptions.count).toBe(2)
  })

  it('subscribes the auth probes when the menu opens without a preceding hover or focus', async () => {
    await renderButton()

    // oxlint-disable-next-line testing-library/prefer-user-event -- userEvent.click emits hover and focus first, which would trigger the preload; this test needs a bare click so the only probe trigger is the reveal itself
    fireEvent.click(screen.getByRole('button', {name: /Workspace A/}))

    // Open → Activity flips visible → effects mount → each item subscribes.
    await waitFor(() => expect(probeSubscriptions.count).toBe(2))
  })

  it('settles the project name from the visible button while the menu is still closed', async () => {
    await renderButton()

    // Hover is intent to open, so the closed menu content pre-renders hidden.
    await userEvent.hover(screen.getByRole('button', {name: /Workspace A/}))

    expect(await screen.findByTestId('project-name')).toHaveTextContent('Sanity Studio Test Data')
    expect(screen.queryByTestId('project-name-pending')).not.toBeInTheDocument()
    expect(projectNameSubscriptions.count).toBe(1)
  })

  it('subscribes the auth probes on hover while the menu stays closed', async () => {
    await renderButton()

    await userEvent.hover(screen.getByRole('button', {name: /Workspace A/}))

    // Hover preload: one probe per workspace, buffered before the click.
    // The hidden menu items themselves still subscribe nothing.
    expect(probeSubscriptions.count).toBe(2)
  })

  it('switches workspace through the router instead of loading the document', async () => {
    await renderButton()
    const link = await openMenuAndFindWorkspaceLink(/Workspace B/)

    // The row keeps the real URL so "open in new tab" and "copy link" work.
    expect(link).toHaveAttribute('href', workspaceB.basePath)

    // A plain left click is an in-place navigation: the router receives the
    // other workspace's basePath and the anchor's own navigation (a full
    // document load, sanity-io/sanity#7228) is cancelled.
    expect(clickAndReadDefaultPrevented(link)).toBe(true)
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate).toHaveBeenCalledWith({path: workspaceB.basePath, replace: false})
  })

  it('leaves modified clicks to the browser so a workspace can open in a new tab', async () => {
    await renderButton()
    const link = await openMenuAndFindWorkspaceLink(/Workspace B/)

    expect(clickAndReadDefaultPrevented(link, {metaKey: true})).toBe(false)
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
