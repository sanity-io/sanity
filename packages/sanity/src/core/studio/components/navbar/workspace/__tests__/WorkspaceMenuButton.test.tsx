import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {fireEvent, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {NEVER} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../../../config/types'
import {WorkspaceMenuButton} from '../WorkspaceMenuButton'

const {mockProbeWorkspaceAuth} = vi.hoisted(() => ({
  mockProbeWorkspaceAuth: vi.fn(),
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
vi.mock('../WorkspaceMenuItem', () => ({
  WorkspaceMenuItem: ({workspace}: {workspace: WorkspaceSummary}) => (
    <div data-testid={`workspace-item-${workspace.name}`} />
  ),
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
    mockProbeWorkspaceAuth.mockReturnValue(NEVER)
  })

  it('does not mount menu content or probe workspace auth on mount', () => {
    // From @sanity/ui v4, closed popovers keep their children mounted, which
    // would put the /auth/id probes and ManageMenu requests on the studio
    // boot path. The menu content must stay unmounted until interaction.
    render(<WorkspaceMenuButton />, {wrapper})

    expect(screen.queryByTestId('manage-menu')).not.toBeInTheDocument()
    expect(screen.queryByTestId('workspace-item-workspace-b')).not.toBeInTheDocument()
    expect(mockProbeWorkspaceAuth).not.toHaveBeenCalled()
  })

  it('mounts menu content and preloads auth probes on hover', async () => {
    render(<WorkspaceMenuButton />, {wrapper})

    await userEvent.hover(screen.getByRole('button', {name: /Workspace A/}))

    expect(await screen.findByTestId('manage-menu')).toBeInTheDocument()
    expect(await screen.findByTestId('workspace-item-workspace-b')).toBeInTheDocument()
    expect(mockProbeWorkspaceAuth).toHaveBeenCalledTimes(2)
  })

  it('mounts menu content when opened without a preceding hover or focus', async () => {
    // Safari does not focus buttons on click, so the open itself must also
    // latch the content mount (via MenuButton onOpen).
    render(<WorkspaceMenuButton />, {wrapper})

    // oxlint-disable-next-line testing-library/prefer-user-event -- userEvent.click emits hover and focus first, which would flip the latch before the open; this test needs a bare click to exercise the onOpen fallback
    fireEvent.click(screen.getByRole('button', {name: /Workspace A/}))

    expect(await screen.findByTestId('manage-menu')).toBeInTheDocument()
  })
})
