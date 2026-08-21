import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {defer, NEVER} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../../../config/types'
import {WorkspaceMenuButton} from '../WorkspaceMenuButton'

const {mockProbeWorkspaceAuth, probeSubscriptions} = vi.hoisted(() => ({
  mockProbeWorkspaceAuth: vi.fn(),
  probeSubscriptions: {count: 0},
}))

vi.mock('../../../../../store/authStore/probeWorkspaceAuth', () => ({
  probeWorkspaceAuth: mockProbeWorkspaceAuth,
}))
vi.mock('../../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../ManageMenu', () => ({
  ManageMenu: () => <div data-testid="manage-menu" />,
}))

const workspaceA = {
  name: 'workspace-a',
  title: 'Workspace A',
  projectId: 'project-a',
  dataset: 'production',
} as unknown as WorkspaceSummary
const workspaceB = {
  name: 'workspace-b',
  title: 'Workspace B',
  projectId: 'project-b',
  dataset: 'production',
} as unknown as WorkspaceSummary

vi.mock('../../../../workspaces/useVisibleWorkspaces', () => ({
  useVisibleWorkspaces: () => ({visibleWorkspaces: [workspaceA, workspaceB]}),
}))
vi.mock('../../../../activeWorkspaceMatcher/useActiveWorkspace', () => ({
  useActiveWorkspace: () => ({activeWorkspace: workspaceA}),
}))

const theme = buildTheme()
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

describe('WorkspaceMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    probeSubscriptions.count = 0
    // Each subscription of a probe observable stands in for one `/auth/id`
    // request — the accurate proxy for network activity, since building the
    // observable (calling `probeWorkspaceAuth`) is free and happens during
    // render, while the request only fires on subscribe.
    mockProbeWorkspaceAuth.mockImplementation(() =>
      defer(() => {
        probeSubscriptions.count += 1
        return NEVER
      }),
    )
  })

  it('keeps the closed menu content mounted without subscribing any auth probe', async () => {
    // From @sanity/ui v4, closed popovers keep their children mounted via
    // React `<Activity>`: the subtree renders (hidden) but effects are
    // deferred until reveal. The render-phase part is real — the menu content
    // is in the DOM and the probe observables get created…
    render(<WorkspaceMenuButton />, {wrapper})

    expect(await screen.findByTestId('manage-menu')).toBeInTheDocument()
    expect(screen.getByText('Workspace B')).toBeInTheDocument()
    expect(mockProbeWorkspaceAuth).toHaveBeenCalledTimes(2)

    // …but nothing subscribes them: with an initialValue, react-rx skips its
    // render-phase warm-up subscription (react-rx#506) and first subscribes on
    // commit, which the hidden `<Activity>` defers until the menu opens. This
    // keeps the per-workspace `/auth/id` probes off the studio boot path.
    // (Without the warm-up skip this count is 2 — one request per workspace
    // at mount.)
    expect(probeSubscriptions.count).toBe(0)
  })

  it('subscribes the auth probes when the menu opens without a preceding hover or focus', async () => {
    render(<WorkspaceMenuButton />, {wrapper})

    // oxlint-disable-next-line testing-library/prefer-user-event -- userEvent.click emits hover and focus first, which would trigger the preload; this test needs a bare click so the only probe trigger is the reveal itself
    fireEvent.click(screen.getByRole('button', {name: /Workspace A/}))

    // Opening flips the popover's <Activity> to visible, the deferred effects
    // mount, and each workspace item's store subscription starts its probe.
    await waitFor(() => expect(probeSubscriptions.count).toBe(2))
  })

  it('subscribes the auth probes on hover while the menu stays closed', async () => {
    render(<WorkspaceMenuButton />, {wrapper})

    await userEvent.hover(screen.getByRole('button', {name: /Workspace A/}))

    // The preload on the trigger fires one probe per workspace so results are
    // buffered by the time the user clicks — while the (still hidden) menu
    // items themselves remain unsubscribed.
    expect(probeSubscriptions.count).toBe(2)
  })
})
