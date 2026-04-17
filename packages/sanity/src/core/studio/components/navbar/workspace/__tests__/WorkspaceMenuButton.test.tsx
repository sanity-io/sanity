import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render, screen} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../../../config'

const mockWorkspaces: WorkspaceSummary[] = [
  {
    name: 'default',
    title: 'Default',
    basePath: '/',
    icon: undefined,
    subtitle: undefined,
    auth: {
      state: {pipe: vi.fn(() => ({subscribe: vi.fn()}))},
      LoginComponent: undefined,
    },
  } as unknown as WorkspaceSummary,
  {
    name: 'staging',
    title: 'Staging',
    basePath: '/staging',
    icon: undefined,
    subtitle: undefined,
    auth: {
      state: {pipe: vi.fn(() => ({subscribe: vi.fn()}))},
      LoginComponent: undefined,
    },
  } as unknown as WorkspaceSummary,
]

const mockUseWorkspaceAuthStates = vi.fn(() => [undefined])

vi.mock('../../../../workspaces', () => ({
  useVisibleWorkspaces: () => ({visibleWorkspaces: mockWorkspaces}),
}))

vi.mock('../../../../activeWorkspaceMatcher', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: mockWorkspaces[0],
  }),
}))

vi.mock('../hooks', () => ({
  useWorkspaceAuthStates: (...args: unknown[]) => mockUseWorkspaceAuthStates(...args),
}))

vi.mock('../ManageMenu', () => ({
  ManageMenu: () => <div data-testid="manage-menu">ManageMenu</div>,
}))

function Wrapper({children}: PropsWithChildren) {
  return (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}

// Dynamically import after mocks are set up
const {WorkspaceMenuButton} = await import('../WorkspaceMenuButton')

describe('WorkspaceMenuButton', () => {
  it('does not call useWorkspaceAuthStates on initial render', () => {
    render(<WorkspaceMenuButton />, {wrapper: Wrapper})

    // The button should be rendered and enabled
    expect(screen.getByText('Default')).toBeInTheDocument()

    // Auth states should NOT have been fetched yet
    expect(mockUseWorkspaceAuthStates).not.toHaveBeenCalled()
  })

  it('calls useWorkspaceAuthStates after the menu is opened', async () => {
    const authStates = {
      default: {authenticated: true},
      staging: {authenticated: false},
    }
    mockUseWorkspaceAuthStates.mockReturnValue([authStates])

    render(<WorkspaceMenuButton />, {wrapper: Wrapper})

    expect(mockUseWorkspaceAuthStates).not.toHaveBeenCalled()

    // Open the menu by clicking the button
    const button = screen.getByText('Default').closest('button')
    expect(button).toBeTruthy()
    await act(async () => {
      button!.click()
    })

    // After opening, the auth states hook should be called
    expect(mockUseWorkspaceAuthStates).toHaveBeenCalledWith(mockWorkspaces)
  })

  it('shows a spinner while auth states are loading', async () => {
    mockUseWorkspaceAuthStates.mockReturnValue([undefined])

    render(<WorkspaceMenuButton />, {wrapper: Wrapper})

    // Open the menu
    const button = screen.getByText('Default').closest('button')
    await act(async () => {
      button!.click()
    })

    // Should show a spinner while loading
    expect(document.querySelector('[data-ui="Spinner"]')).toBeInTheDocument()
  })

  it('shows workspace list with auth states once loaded', async () => {
    const authStates = {
      default: {authenticated: true},
      staging: {authenticated: false},
    }
    mockUseWorkspaceAuthStates.mockReturnValue([authStates])

    render(<WorkspaceMenuButton />, {wrapper: Wrapper})

    // Open the menu
    const button = screen.getByText('Default').closest('button')
    await act(async () => {
      button!.click()
    })

    // Should show workspace names in the menu
    expect(screen.getByText('Staging')).toBeInTheDocument()
  })
})
