import {render, screen} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../config/types'
import {type AuthState} from '../../../store/_legacy/authStore/types'
import {ActiveWorkspaceMatcher} from '../ActiveWorkspaceMatcher'

function LoadingComponent() {
  return <div data-testid="loading">Loading</div>
}

function NotFoundComponent({
  onNavigateToDefaultWorkspace,
}: {
  onNavigateToDefaultWorkspace: () => void
}) {
  return (
    <div data-testid="not-found" onClick={onNavigateToDefaultWorkspace}>
      Not found
    </div>
  )
}

function createWorkspace(
  overrides: {name: string; basePath: string} & Omit<
    Partial<WorkspaceSummary>,
    'name' | 'basePath'
  >,
): WorkspaceSummary {
  const {name, basePath, ...rest} = overrides
  return {
    type: 'workspace-summary',
    name,
    title: rest.title ?? name,
    basePath,
    projectId: 'test',
    dataset: 'test',
    schema: {} as WorkspaceSummary['schema'],
    i18n: {} as WorkspaceSummary['i18n'],
    theme: {} as WorkspaceSummary['theme'],
    icon: null,
    customIcon: false,
    auth: {state: {subscribe: vi.fn(), pipe: vi.fn()}} as unknown as WorkspaceSummary['auth'],
    __internal: {sources: []},
    ...rest,
  } as WorkspaceSummary
}

function createAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    authenticated: true,
    currentUser: {
      id: 'user1',
      name: 'Test User',
      email: 'test@test.com',
      role: 'administrator',
      roles: [{name: 'administrator', title: 'Administrator'}],
      profileImage: '',
    },
    client: {} as AuthState['client'],
    ...overrides,
  }
}

const mockUseWorkspaces = vi.fn<() => WorkspaceSummary[]>()
const mockUseWorkspaceAuthStates = vi.fn<() => [Record<string, AuthState> | null]>()

vi.mock('../../workspaces', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return {
    ...actual,
    useWorkspaces: () => mockUseWorkspaces(),
  }
})

vi.mock('../../components/navbar/workspace/hooks', () => ({
  useWorkspaceAuthStates: () => mockUseWorkspaceAuthStates(),
}))

describe('ActiveWorkspaceMatcher hidden workspace behaviour', () => {
  it('renders children when workspace is visible', () => {
    const workspace = createWorkspace({name: 'default', basePath: '/default'})
    const authState = createAuthState()

    mockUseWorkspaces.mockReturnValue([workspace])
    mockUseWorkspaceAuthStates.mockReturnValue([{default: authState}])

    const history = createMemoryHistory({initialEntries: ['/default']})

    render(
      <ActiveWorkspaceMatcher
        unstable_history={history}
        LoadingComponent={LoadingComponent}
        NotFoundComponent={NotFoundComponent}
      >
        <div data-testid="children">Workspace content</div>
      </ActiveWorkspaceMatcher>,
    )

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('not-found')).toBeNull()
    expect(screen.queryByTestId('loading')).toBeNull()
  })

  it('renders NotFoundComponent when callback-hidden workspace is matched', () => {
    const workspace = createWorkspace({
      name: 'admin',
      basePath: '/admin',
      hidden: () => true,
    })
    const authState = createAuthState()

    mockUseWorkspaces.mockReturnValue([workspace])
    mockUseWorkspaceAuthStates.mockReturnValue([{admin: authState}])

    const history = createMemoryHistory({initialEntries: ['/admin']})

    render(
      <ActiveWorkspaceMatcher
        unstable_history={history}
        LoadingComponent={LoadingComponent}
        NotFoundComponent={NotFoundComponent}
      >
        <div data-testid="children">Should not render</div>
      </ActiveWorkspaceMatcher>,
    )

    expect(screen.getByTestId('not-found')).toBeDefined()
    expect(screen.queryByTestId('children')).toBeNull()
  })

  it('renders LoadingComponent when callback-hidden workspace is matched but auth is loading', () => {
    const workspace = createWorkspace({
      name: 'admin',
      basePath: '/admin',
      hidden: () => true,
    })

    mockUseWorkspaces.mockReturnValue([workspace])
    mockUseWorkspaceAuthStates.mockReturnValue([null])

    const history = createMemoryHistory({initialEntries: ['/admin']})

    render(
      <ActiveWorkspaceMatcher
        unstable_history={history}
        LoadingComponent={LoadingComponent}
        NotFoundComponent={NotFoundComponent}
      >
        <div data-testid="children">Should not render</div>
      </ActiveWorkspaceMatcher>,
    )

    expect(screen.getByTestId('loading')).toBeDefined()
    expect(screen.queryByTestId('children')).toBeNull()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('renders NotFoundComponent for static hidden: true workspace URL', () => {
    const hiddenWorkspace = createWorkspace({
      name: 'hidden',
      basePath: '/hidden',
      hidden: true,
    })
    const visibleWorkspace = createWorkspace({name: 'visible', basePath: '/visible'})

    mockUseWorkspaces.mockReturnValue([hiddenWorkspace, visibleWorkspace])
    mockUseWorkspaceAuthStates.mockReturnValue([
      {
        hidden: createAuthState(),
        visible: createAuthState(),
      },
    ])

    const history = createMemoryHistory({initialEntries: ['/hidden']})

    render(
      <ActiveWorkspaceMatcher
        unstable_history={history}
        LoadingComponent={LoadingComponent}
        NotFoundComponent={NotFoundComponent}
      >
        <div data-testid="children">Should not render</div>
      </ActiveWorkspaceMatcher>,
    )

    expect(screen.getByTestId('not-found')).toBeDefined()
    expect(screen.queryByTestId('children')).toBeNull()
  })

  it('renders children when callback evaluates to false (visible)', () => {
    const workspace = createWorkspace({
      name: 'admin',
      basePath: '/admin',
      hidden: ({currentUser}) => {
        if (currentUser === null) return false
        return !currentUser.roles.some((role) => role.name === 'administrator')
      },
    })

    const authState = createAuthState({
      currentUser: {
        id: 'admin1',
        name: 'Admin',
        email: 'admin@test.com',
        role: 'administrator',
        roles: [{name: 'administrator', title: 'Administrator'}],
        profileImage: '',
      },
    })

    mockUseWorkspaces.mockReturnValue([workspace])
    mockUseWorkspaceAuthStates.mockReturnValue([{admin: authState}])

    const history = createMemoryHistory({initialEntries: ['/admin']})

    render(
      <ActiveWorkspaceMatcher
        unstable_history={history}
        LoadingComponent={LoadingComponent}
        NotFoundComponent={NotFoundComponent}
      >
        <div data-testid="children">Admin content</div>
      </ActiveWorkspaceMatcher>,
    )

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })
})
