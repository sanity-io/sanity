import {describe, expect, it, vi} from 'vitest'

import {type WorkspaceHiddenContext, type WorkspaceSummary} from '../../../config/types'
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

describe('useVisibleWorkspaces', () => {
  describe('evaluateWorkspaceHidden', () => {
    it('returns false when hidden is undefined', () => {
      const workspace = createWorkspace({hidden: undefined})
      expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(false)
    })

    it('returns false when hidden is false', () => {
      const workspace = createWorkspace({hidden: false})
      expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(false)
    })

    it('returns true when hidden is true', () => {
      const workspace = createWorkspace({hidden: true})
      expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(true)
    })

    describe('callback-based hidden', () => {
      it('calls the callback with currentUser and returns its result', () => {
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

      it('returns false when callback returns false', () => {
        const workspace = createWorkspace({hidden: () => false})
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
      })

      it('returns false when authState is undefined (fail-open before auth resolves)', () => {
        const hiddenCallback = vi.fn()
        const workspace = createWorkspace({hidden: hiddenCallback})

        expect(evaluateWorkspaceHidden(workspace, undefined)).toBe(false)
        expect(hiddenCallback).not.toHaveBeenCalled()
      })

      it('passes null currentUser to the callback when user is not authenticated', () => {
        const hiddenCallback = vi.fn().mockReturnValue(false)
        const workspace = createWorkspace({hidden: hiddenCallback})
        const authState = createAuthState({currentUser: null})

        expect(evaluateWorkspaceHidden(workspace, authState)).toBe(false)
        expect(hiddenCallback).toHaveBeenCalledWith({currentUser: null})
      })

      it('returns false and logs a warning when the callback throws', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const callbackError = new Error('callback failed')
        const workspace = createWorkspace({
          name: 'broken-workspace',
          hidden: () => {
            throw callbackError
          },
        })

        expect(evaluateWorkspaceHidden(workspace, createAuthState())).toBe(false)
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Error evaluating `hidden` callback for workspace "broken-workspace":',
          callbackError,
        )

        consoleWarnSpy.mockRestore()
      })
    })

    describe('filtering across mixed hidden types', () => {
      it('correctly evaluates a mix of static, callback, and undefined hidden values', () => {
        const authState = createAuthState()

        const workspaces = [
          createWorkspace({name: 'visible-static', hidden: false}),
          createWorkspace({name: 'hidden-static', hidden: true}),
          createWorkspace({name: 'visible-default', hidden: undefined}),
          createWorkspace({name: 'visible-callback', hidden: () => false}),
          createWorkspace({name: 'hidden-callback', hidden: () => true}),
        ]

        const results = workspaces.map((workspace) => ({
          name: workspace.name,
          hidden: evaluateWorkspaceHidden(workspace, authState),
        }))

        expect(results).toEqual([
          {name: 'visible-static', hidden: false},
          {name: 'hidden-static', hidden: true},
          {name: 'visible-default', hidden: false},
          {name: 'visible-callback', hidden: false},
          {name: 'hidden-callback', hidden: true},
        ])
      })

      it('treats all callback workspaces as visible when auth has not resolved', () => {
        const workspaces = [
          createWorkspace({name: 'visible-static', hidden: false}),
          createWorkspace({name: 'hidden-static', hidden: true}),
          createWorkspace({name: 'hidden-callback', hidden: () => true}),
        ]

        const results = workspaces.map((workspace) => ({
          name: workspace.name,
          hidden: evaluateWorkspaceHidden(workspace, undefined),
        }))

        expect(results).toEqual([
          {name: 'visible-static', hidden: false},
          {name: 'hidden-static', hidden: true},
          {name: 'hidden-callback', hidden: false},
        ])
      })
    })

    describe('role-based filtering pattern', () => {
      const adminOnlyCallback = ({currentUser}: WorkspaceHiddenContext) => {
        if (currentUser === null) return false
        return !currentUser.roles.some((role) => role.name === 'administrator')
      }

      it('hides workspace from non-admin users', () => {
        const workspace = createWorkspace({hidden: adminOnlyCallback})
        const authState = createAuthState({
          currentUser: {
            id: 'editor',
            name: 'Editor',
            email: 'editor@example.com',
            role: 'editor',
            roles: [{name: 'editor', title: 'Editor'}],
          },
        })

        expect(evaluateWorkspaceHidden(workspace, authState)).toBe(true)
      })

      it('shows workspace to admin users', () => {
        const workspace = createWorkspace({hidden: adminOnlyCallback})
        const authState = createAuthState({
          currentUser: {
            id: 'admin',
            name: 'Admin',
            email: 'admin@example.com',
            role: 'administrator',
            roles: [{name: 'administrator', title: 'Administrator'}],
          },
        })

        expect(evaluateWorkspaceHidden(workspace, authState)).toBe(false)
      })

      it('shows workspace when currentUser is null (fail-open during auth)', () => {
        const workspace = createWorkspace({hidden: adminOnlyCallback})
        const authState = createAuthState({currentUser: null})

        expect(evaluateWorkspaceHidden(workspace, authState)).toBe(false)
      })
    })
  })
})
