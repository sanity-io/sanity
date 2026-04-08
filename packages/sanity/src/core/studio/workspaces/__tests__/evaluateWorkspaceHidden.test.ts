import {describe, expect, it, vi} from 'vitest'

import {type WorkspaceSummary} from '../../../config/types'
import {type AuthState} from '../../../store/_legacy/authStore/types'
import {evaluateWorkspaceHidden} from '../useVisibleWorkspaces'

function createWorkspace(
  overrides: Partial<Pick<WorkspaceSummary, 'name' | 'hidden'>>,
): WorkspaceSummary {
  return {name: 'test-workspace', ...overrides} as WorkspaceSummary
}

function createAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    authenticated: true,
    currentUser: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: '',
      roles: [],
    },
    client: {} as AuthState['client'],
    ...overrides,
  }
}

describe('evaluateWorkspaceHidden', () => {
  it('returns `false` when `hidden` is `undefined`', () => {
    const workspace = createWorkspace({hidden: undefined})
    expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(false)
  })

  it('returns `false` when `hidden` is `false`', () => {
    const workspace = createWorkspace({hidden: false})
    expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(false)
  })

  it('returns `true` when `hidden` is `true`', () => {
    const workspace = createWorkspace({hidden: true})
    expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(true)
  })

  describe('callback-based hidden', () => {
    it('returns `true` when the callback returns `true`', () => {
      const hiddenCallback = vi.fn().mockReturnValue(true)
      const workspace = createWorkspace({hidden: hiddenCallback})
      const authState = createAuthState({
        currentUser: {
          id: 'user-456',
          name: 'Regular User',
          email: 'regular@example.com',
          role: '',
          roles: [{name: 'viewer', title: 'Viewer'}],
        },
      })

      expect(evaluateWorkspaceHidden(workspace, authState)).toBe(true)
      expect(hiddenCallback).toHaveBeenCalledWith({currentUser: authState.currentUser})
    })

    it('returns `false` when the callback returns `false`', () => {
      const hiddenCallback = vi.fn().mockReturnValue(false)
      const workspace = createWorkspace({hidden: hiddenCallback})
      const authState = createAuthState({
        currentUser: {
          id: 'admin-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'administrator',
          roles: [{name: 'administrator', title: 'Administrator'}],
        },
      })

      expect(evaluateWorkspaceHidden(workspace, authState)).toBe(false)
      expect(hiddenCallback).toHaveBeenCalledWith({currentUser: authState.currentUser})
    })

    it('returns `false` when `authState` is `undefined` (fail-open before auth resolves)', () => {
      const hiddenCallback = vi.fn()
      const workspace = createWorkspace({hidden: hiddenCallback})

      expect(evaluateWorkspaceHidden(workspace, undefined)).toBe(false)
      expect(hiddenCallback).not.toHaveBeenCalled()
    })

    it('returns `false` when `currentUser` is `null` in the auth state', () => {
      const hiddenCallback = vi.fn().mockReturnValue(false)
      const workspace = createWorkspace({hidden: hiddenCallback})
      const authState = createAuthState({currentUser: null})

      expect(evaluateWorkspaceHidden(workspace, authState)).toBe(false)
      expect(hiddenCallback).toHaveBeenCalledWith({currentUser: null})
    })

    it('returns `false` and logs a warning when the callback throws an error', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const callbackError = new Error('callback failed')
      const hiddenCallback = vi.fn().mockImplementation(() => {
        throw callbackError
      })
      const workspace = createWorkspace({name: 'broken-workspace', hidden: hiddenCallback})

      expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Error evaluating `hidden` callback for workspace "broken-workspace":',
        callbackError,
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('mixed workspace hidden types', () => {
    it('correctly evaluates different hidden types across workspaces', () => {
      const authState = createAuthState()

      const staticVisible = createWorkspace({name: 'static-visible', hidden: false})
      const staticHidden = createWorkspace({name: 'static-hidden', hidden: true})
      const undefinedHidden = createWorkspace({name: 'undefined-hidden', hidden: undefined})
      const callbackVisible = createWorkspace({
        name: 'callback-visible',
        hidden: () => false,
      })
      const callbackHidden = createWorkspace({
        name: 'callback-hidden',
        hidden: () => true,
      })

      const workspaces = [
        staticVisible,
        staticHidden,
        undefinedHidden,
        callbackVisible,
        callbackHidden,
      ]
      const results = workspaces.map((workspace) => ({
        name: workspace.name,
        hidden: evaluateWorkspaceHidden(workspace, authState),
      }))

      expect(results).toEqual([
        {name: 'static-visible', hidden: false},
        {name: 'static-hidden', hidden: true},
        {name: 'undefined-hidden', hidden: false},
        {name: 'callback-visible', hidden: false},
        {name: 'callback-hidden', hidden: true},
      ])
    })
  })
})
