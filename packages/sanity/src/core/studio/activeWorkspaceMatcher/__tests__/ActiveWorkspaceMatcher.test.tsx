import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {createMemoryHistory} from 'history'
import {type ReactNode} from 'react'
import {VisibleWorkspacesContext, WorkspacesContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../config/types'
import {type AuthState} from '../../../store/authStore/types'
import {evaluateWorkspaceHidden} from '../../workspaces/useVisibleWorkspaces'
import {type VisibleWorkspacesContextValue} from '../../workspaces/VisibleWorkspacesProvider'
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

function createContextValue(
  workspaces: WorkspaceSummary[],
  authStates: Record<string, AuthState> | undefined,
): VisibleWorkspacesContextValue {
  const workspaceAuthStates: Record<string, AuthState | undefined> = authStates ?? {}
  return {
    visibleWorkspaces: workspaces.filter(
      (workspace) => !evaluateWorkspaceHidden(workspace, workspaceAuthStates[workspace.name]),
    ),
    workspaceAuthStates,
  }
}

function TestWrapper({
  children,
  contextValue,
  allWorkspaces,
}: {
  children: ReactNode
  contextValue: VisibleWorkspacesContextValue
  allWorkspaces: WorkspaceSummary[]
}) {
  return (
    <WorkspacesContext.Provider value={allWorkspaces}>
      <VisibleWorkspacesContext.Provider value={contextValue}>
        {children}
      </VisibleWorkspacesContext.Provider>
    </WorkspacesContext.Provider>
  )
}

describe('ActiveWorkspaceMatcher hidden workspace behaviour', () => {
  it('renders children when workspace is visible', () => {
    const workspace = createWorkspace({name: 'default', basePath: '/default'})
    const authState = createAuthState()
    const workspaces = [workspace]
    const contextValue = createContextValue(workspaces, {default: authState})

    const history = createMemoryHistory({initialEntries: ['/default']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Workspace content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
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
    const workspaces = [workspace]
    const contextValue = createContextValue(workspaces, {admin: authState})

    const history = createMemoryHistory({initialEntries: ['/admin']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Should not render</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
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
    const workspaces = [workspace]
    const contextValue = createContextValue(workspaces, undefined)

    const history = createMemoryHistory({initialEntries: ['/admin']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Should not render</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
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

    const workspaces = [hiddenWorkspace, visibleWorkspace]
    const contextValue = createContextValue(workspaces, {
      hidden: createAuthState(),
      visible: createAuthState(),
    })

    const history = createMemoryHistory({initialEntries: ['/hidden']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Should not render</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
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

    const workspaces = [workspace]
    const contextValue = createContextValue(workspaces, {admin: authState})

    const history = createMemoryHistory({initialEntries: ['/admin']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Admin content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('redirects from root to first visible workspace when first workspace is statically hidden', async () => {
    const hiddenWorkspace = createWorkspace({
      name: 'hidden',
      basePath: '/hidden',
      hidden: true,
    })
    const visibleWorkspace = createWorkspace({name: 'visible', basePath: '/visible'})

    const workspaces = [hiddenWorkspace, visibleWorkspace]
    const contextValue = createContextValue(workspaces, {
      hidden: createAuthState(),
      visible: createAuthState(),
    })

    const history = createMemoryHistory({initialEntries: ['/']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Visible workspace content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    await waitFor(() => {
      expect(history.location.pathname).toBe('/visible')
    })

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('redirects from root to first workspace when all workspaces are visible', async () => {
    const workspaceA = createWorkspace({name: 'a', basePath: '/a'})
    const workspaceB = createWorkspace({name: 'b', basePath: '/b'})

    const workspaces = [workspaceA, workspaceB]
    const contextValue = createContextValue(workspaces, {
      a: createAuthState(),
      b: createAuthState(),
    })

    const history = createMemoryHistory({initialEntries: ['/']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">First workspace content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    await waitFor(() => {
      expect(history.location.pathname).toBe('/a')
    })

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('renders LoadingComponent at root while hidden workspaces are still resolving', () => {
    const functionHiddenWorkspace = createWorkspace({
      name: 'function-hidden',
      basePath: '/function-hidden',
      hidden: () => true,
    })
    const visibleWorkspace = createWorkspace({name: 'visible', basePath: '/visible'})

    const workspaces = [functionHiddenWorkspace, visibleWorkspace]
    const contextValue = createContextValue(workspaces, undefined)

    const history = createMemoryHistory({initialEntries: ['/']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Should not render</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    expect(screen.getByTestId('loading')).toBeDefined()
    expect(screen.queryByTestId('children')).toBeNull()
    expect(screen.queryByTestId('not-found')).toBeNull()
    expect(history.location.pathname).toBe('/')
  })

  it('renders NotFoundComponent without crashing when all workspaces are statically hidden', () => {
    const hiddenOne = createWorkspace({name: 'hidden-one', basePath: '/hidden-one', hidden: true})
    const hiddenTwo = createWorkspace({name: 'hidden-two', basePath: '/hidden-two', hidden: true})

    const workspaces = [hiddenOne, hiddenTwo]
    const contextValue = createContextValue(workspaces, {
      'hidden-one': createAuthState(),
      'hidden-two': createAuthState(),
    })

    const history = createMemoryHistory({initialEntries: ['/hidden-one']})

    expect(() =>
      render(
        <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
          <ActiveWorkspaceMatcher
            unstable_history={history}
            LoadingComponent={LoadingComponent}
            NotFoundComponent={NotFoundComponent}
          >
            <div data-testid="children">Should not render</div>
          </ActiveWorkspaceMatcher>
        </TestWrapper>,
      ),
    ).not.toThrow()

    expect(screen.getByTestId('not-found')).toBeDefined()
    expect(screen.queryByTestId('children')).toBeNull()
  })

  it('renders LoadingComponent on match while matched workspace auth is still resolving', () => {
    const fnHidden = createWorkspace({
      name: 'fn-hidden',
      basePath: '/fn-hidden',
      hidden: () => false,
    })

    const workspaces = [fnHidden]
    const contextValue = createContextValue(workspaces, {})

    const history = createMemoryHistory({initialEntries: ['/fn-hidden']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Should not render yet</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    expect(screen.getByTestId('loading')).toBeDefined()
    expect(screen.queryByTestId('children')).toBeNull()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('renders matched workspace once its auth resolves and hidden() returns false', () => {
    const fnHidden = createWorkspace({
      name: 'fn-hidden',
      basePath: '/fn-hidden',
      hidden: () => false,
    })

    const workspaces = [fnHidden]
    const contextValue = createContextValue(workspaces, {'fn-hidden': createAuthState()})

    const history = createMemoryHistory({initialEntries: ['/fn-hidden']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Workspace content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('loading')).toBeNull()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('does not wait on other workspaces auth when matching a statically-visible workspace', () => {
    const fnHiddenOther = createWorkspace({
      name: 'fn-hidden-other',
      basePath: '/fn-hidden-other',
      hidden: () => true,
    })
    const staticVisible = createWorkspace({name: 'static-visible', basePath: '/static-visible'})

    const workspaces = [fnHiddenOther, staticVisible]
    const contextValue = createContextValue(workspaces, {})

    const history = createMemoryHistory({initialEntries: ['/static-visible']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Visible workspace content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('loading')).toBeNull()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('redirects from root past statically-hidden workspace to next visible without waiting on later function-hidden workspaces', async () => {
    const staticHidden = createWorkspace({
      name: 'static-hidden',
      basePath: '/static-hidden',
      hidden: true,
    })
    const staticVisible = createWorkspace({name: 'static-visible', basePath: '/static-visible'})
    const fnHidden = createWorkspace({
      name: 'fn-hidden',
      basePath: '/fn-hidden',
      hidden: () => true,
    })

    const workspaces = [staticHidden, staticVisible, fnHidden]
    const contextValue = createContextValue(workspaces, {})

    const history = createMemoryHistory({initialEntries: ['/']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Visible workspace content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    await waitFor(() => {
      expect(history.location.pathname).toBe('/static-visible')
    })

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('loading')).toBeNull()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })

  it('navigates to first visible workspace when go-to-default is clicked from NotFoundComponent', async () => {
    const staticHidden = createWorkspace({
      name: 'static-hidden',
      basePath: '/static-hidden',
      hidden: true,
    })
    const staticVisible = createWorkspace({name: 'static-visible', basePath: '/static-visible'})

    const workspaces = [staticHidden, staticVisible]
    const contextValue = createContextValue(workspaces, {
      'static-hidden': createAuthState(),
      'static-visible': createAuthState(),
    })

    const history = createMemoryHistory({initialEntries: ['/static-hidden']})

    render(
      <TestWrapper contextValue={contextValue} allWorkspaces={workspaces}>
        <ActiveWorkspaceMatcher
          unstable_history={history}
          LoadingComponent={LoadingComponent}
          NotFoundComponent={NotFoundComponent}
        >
          <div data-testid="children">Visible workspace content</div>
        </ActiveWorkspaceMatcher>
      </TestWrapper>,
    )

    expect(screen.getByTestId('not-found')).toBeDefined()

    await userEvent.click(screen.getByTestId('not-found'))

    await waitFor(() => {
      expect(history.location.pathname).toBe('/static-visible')
    })

    expect(screen.getByTestId('children')).toBeDefined()
    expect(screen.queryByTestId('not-found')).toBeNull()
  })
})
