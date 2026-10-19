import {renderHook, waitFor} from '@testing-library/react'
import {NEVER, type Observable, of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createMockAuthStore} from '../../../../../store/auth/mock/createMockAuthStore'
import {useWorkspaceLoginStatus} from '../hooks/useWorkspaceLoginStatus'

function workspaceWith(options: {currentUserId?: Observable<string | undefined>}) {
  const store = createMockAuthStore({client: createMockSanityClientAsClient({}), currentUser: null})
  return {
    auth: {
      ...store,
      ...(options.currentUserId ? {currentUserId: options.currentUserId} : {}),
    },
  }
}

describe('useWorkspaceLoginStatus', () => {
  it('is unknown when the auth store has no signed-in check', () => {
    const {result} = renderHook(() => useWorkspaceLoginStatus(workspaceWith({})))
    expect(result.current).toBe('unknown')
  })

  it('is loading until the store answers', () => {
    const workspace = workspaceWith({currentUserId: NEVER})
    const {result} = renderHook(() => useWorkspaceLoginStatus(workspace))
    expect(result.current).toBe('loading')
  })

  it('is logged in when the store answers with a user id', async () => {
    const workspace = workspaceWith({currentUserId: of('user-id')})
    const {result} = renderHook(() => useWorkspaceLoginStatus(workspace))
    await waitFor(() => expect(result.current).toBe('logged-in'))
  })

  it('is logged out when the store answers with no user', async () => {
    const workspace = workspaceWith({currentUserId: of(undefined)})
    const {result} = renderHook(() => useWorkspaceLoginStatus(workspace))
    await waitFor(() => expect(result.current).toBe('logged-out'))
  })
})
