import {act, renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {BehaviorSubject, Subject} from 'rxjs'
import {WorkspacesContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'

import {type WorkspaceSummary} from '../../../config/types'
import {type AuthState} from '../../../store/authStore/types'
import {useVisibleWorkspaces} from '../useVisibleWorkspaces'
import {VisibleWorkspacesProvider} from '../VisibleWorkspacesProvider'

function createAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    authenticated: true,
    currentUser: {
      id: 'u1',
      name: 'User',
      email: 'u@example.com',
      role: '',
      roles: [],
      profileImage: '',
    },
    client: {} as AuthState['client'],
    ...overrides,
  }
}

interface TestWorkspace extends WorkspaceSummary {
  authSubscriptionCount: () => number
}

function createWorkspace(options: {
  name: string
  hidden?: WorkspaceSummary['hidden']
  state$?: Subject<AuthState>
}): TestWorkspace {
  const subject = options.state$ ?? new BehaviorSubject<AuthState>(createAuthState())

  // Count every subscription, including those created transitively by
  // `.pipe(...)` / `combineLatest`. These all end up calling `_subscribe`
  // on the source Subject, so spying there gives us an accurate count.
  let count = 0
  const withSpy = subject as unknown as {
    _subscribe: (...args: unknown[]) => unknown
  }
  const original = withSpy._subscribe.bind(subject)
  withSpy._subscribe = (...args: unknown[]) => {
    count++
    return original(...args)
  }

  const workspace = {
    type: 'workspace-summary',
    name: options.name,
    title: options.name,
    basePath: `/${options.name}`,
    hidden: options.hidden,
    projectId: 'p',
    dataset: 'd',
    schema: {} as WorkspaceSummary['schema'],
    i18n: {} as WorkspaceSummary['i18n'],
    theme: {} as WorkspaceSummary['theme'],
    icon: null,
    customIcon: false,
    auth: {state: subject.asObservable()} as unknown as WorkspaceSummary['auth'],
    __internal: {sources: []},
  } as unknown as WorkspaceSummary

  return Object.assign(workspace, {authSubscriptionCount: () => count})
}

function renderProvider(workspaces: WorkspaceSummary[]) {
  const wrapper = ({children}: {children: ReactNode}) => (
    <WorkspacesContext.Provider value={workspaces}>
      <VisibleWorkspacesProvider>{children}</VisibleWorkspacesProvider>
    </WorkspacesContext.Provider>
  )
  return renderHook(() => useVisibleWorkspaces(), {wrapper})
}

describe('VisibleWorkspacesProvider', () => {
  it('does not subscribe to workspace auth for workspaces without a callback-based hidden', () => {
    // Regression guard: before this fix the provider subscribed to
    // `workspace.auth.state` for every configured workspace at studio
    // boot, producing a thundering herd of `/users/me` requests that
    // caused Firefox e2e `page.goto` timeouts.
    const plain = createWorkspace({name: 'default'})
    const staticallyHidden = createWorkspace({name: 'admin', hidden: true})
    const staticallyVisible = createWorkspace({name: 'guest', hidden: false})

    const view = renderProvider([plain, staticallyHidden, staticallyVisible])

    expect(plain.authSubscriptionCount()).toBe(0)
    expect(staticallyHidden.authSubscriptionCount()).toBe(0)
    expect(staticallyVisible.authSubscriptionCount()).toBe(0)

    expect(view.result.current.workspaceAuthStates).toEqual({})
    expect(view.result.current.visibleWorkspaces.map((w) => w.name)).toEqual(['default', 'guest'])
  })

  it('subscribes only to workspaces with a callback-based hidden', () => {
    const plain = createWorkspace({name: 'default'})
    const callback = createWorkspace({name: 'admin', hidden: () => false})

    const view = renderProvider([plain, callback])

    expect(plain.authSubscriptionCount()).toBe(0)
    expect(callback.authSubscriptionCount()).toBeGreaterThan(0)
    expect(view.result.current.visibleWorkspaces.map((w) => w.name)).toEqual(['default', 'admin'])
  })

  it('resolves workspaceAuthStates for a callback-hidden workspace once auth emits', () => {
    const state$ = new Subject<AuthState>()
    const plain = createWorkspace({name: 'default'})
    const callback = createWorkspace({
      name: 'admin',
      hidden: ({currentUser}) =>
        currentUser !== null && !currentUser.roles.some((role) => role.name === 'administrator'),
      state$,
    })

    const view = renderProvider([plain, callback])

    expect(view.result.current.workspaceAuthStates.admin).toBeUndefined()
    // Fail-open: callback-hidden workspaces are included optimistically
    // while auth is still resolving.
    expect(view.result.current.visibleWorkspaces.map((w) => w.name)).toEqual(['default', 'admin'])

    act(() => {
      state$.next(
        createAuthState({
          currentUser: {
            id: 'editor',
            name: 'Editor',
            email: 'editor@example.com',
            role: 'editor',
            roles: [{name: 'editor', title: 'Editor'}],
            profileImage: '',
          },
        }),
      )
    })

    expect(view.result.current.workspaceAuthStates.admin).toBeDefined()
    expect(view.result.current.visibleWorkspaces.map((w) => w.name)).toEqual(['default'])
  })

  it('progressively resolves workspaceAuthStates as each workspace auth emits', () => {
    const firstState$ = new Subject<AuthState>()
    const secondState$ = new Subject<AuthState>()
    const firstWorkspace = createWorkspace({
      name: 'first',
      hidden: () => false,
      state$: firstState$,
    })
    const secondWorkspace = createWorkspace({
      name: 'second',
      hidden: () => false,
      state$: secondState$,
    })

    const view = renderProvider([firstWorkspace, secondWorkspace])

    expect(view.result.current.workspaceAuthStates).toEqual({})

    const firstAuthState = createAuthState()
    act(() => {
      firstState$.next(firstAuthState)
    })

    expect(view.result.current.workspaceAuthStates.first).toBe(firstAuthState)
    expect(view.result.current.workspaceAuthStates.second).toBeUndefined()

    const secondAuthState = createAuthState()
    act(() => {
      secondState$.next(secondAuthState)
    })

    expect(view.result.current.workspaceAuthStates.first).toBe(firstAuthState)
    expect(view.result.current.workspaceAuthStates.second).toBe(secondAuthState)
  })
})
