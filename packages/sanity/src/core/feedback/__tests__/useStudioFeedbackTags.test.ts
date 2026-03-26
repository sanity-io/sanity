import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('../../hooks', () => ({
  useClient: vi.fn(),
}))
vi.mock('../../store/user/hooks', () => ({
  useCurrentUser: vi.fn(),
}))
vi.mock('../../studio/workspace', () => ({
  useWorkspace: vi.fn(),
}))
vi.mock('sanity/router', () => ({
  useRouterState: vi.fn(),
}))
vi.mock('../../version', () => ({
  SANITY_VERSION: '3.0.0-test',
}))

import {useRouterState} from 'sanity/router'

import {useClient} from '../../hooks'
import {useCurrentUser} from '../../store/user/hooks'
import {useWorkspace} from '../../studio/workspace'
import {useStudioFeedbackTags} from '../hooks/useStudioFeedbackTags'

describe('useStudioFeedbackTags', () => {
  const mockWorkspace = {
    name: 'default',
    projectId: 'proj-abc',
    dataset: 'production',
    __internal: {
      options: {
        plugins: [
          {name: 'plugin-a', plugins: []},
          {name: 'plugin-b', plugins: [{name: 'plugin-b-child', plugins: []}]},
          {name: 'plugin-c'},
        ],
      },
    },
  }

  beforeEach(() => {
    vi.mocked(useClient).mockReturnValue({
      config: () => ({projectId: 'proj-abc'}),
    } as never)

    vi.mocked(useCurrentUser).mockReturnValue({
      id: 'user-42',
      name: 'Jane Doe',
      email: 'jane@example.com',
    } as never)

    vi.mocked(useWorkspace).mockReturnValue(mockWorkspace as never)

    vi.mocked(useRouterState).mockImplementation(((selector: (state: {tool?: string}) => unknown) =>
      selector({tool: 'desk'})) as never)
  })

  it('returns base tags with expected static values', () => {
    const {result} = renderHook(() => useStudioFeedbackTags())
    const {baseTags} = result.current

    expect(baseTags.studioVersion).toBe('3.0.0-test')
    expect(baseTags.projectId).toBe('proj-abc')
    expect(baseTags.userId).toBe('user-42')
    expect(baseTags.reactVersion).toBeTruthy()
    expect(baseTags.sessionId).toBeTruthy()
  })

  it('returns dynamic tags reflecting current navigation state', () => {
    const {result} = renderHook(() => useStudioFeedbackTags())
    const {dynamicTags} = result.current

    expect(dynamicTags.activeTool).toBe('desk')
    expect(dynamicTags.activeWorkspace).toBe('default')
    expect(dynamicTags.activeProjectId).toBe('proj-abc')
    expect(dynamicTags.activeDataset).toBe('production')
  })

  it('merges base and dynamic tags into allTags', () => {
    const {result} = renderHook(() => useStudioFeedbackTags())
    const {allTags, baseTags, dynamicTags} = result.current

    expect(allTags).toEqual({...baseTags, ...dynamicTags})
  })

  it('returns user name and email', () => {
    const {result} = renderHook(() => useStudioFeedbackTags())

    expect(result.current.userName).toBe('Jane Doe')
    expect(result.current.userEmail).toBe('jane@example.com')
  })

  it('collects leaf plugin names recursively', () => {
    const {result} = renderHook(() => useStudioFeedbackTags())
    const {baseTags} = result.current

    expect(baseTags.plugins).toBe('plugin-a,plugin-b-child,plugin-c')
    expect(baseTags.pluginsCount).toBe(3)
  })

  it('handles missing current user gracefully', () => {
    vi.mocked(useCurrentUser).mockReturnValue(null as never)

    const {result} = renderHook(() => useStudioFeedbackTags())

    expect(result.current.userId).toBe('unknown')
    expect(result.current.userName).toBeUndefined()
    expect(result.current.userEmail).toBeUndefined()
  })

  it('handles workspace with no plugins', () => {
    vi.mocked(useWorkspace).mockReturnValue({
      ...mockWorkspace,
      __internal: {options: {plugins: []}},
    } as never)

    const {result} = renderHook(() => useStudioFeedbackTags())

    expect(result.current.baseTags.plugins).toBe('')
    expect(result.current.baseTags.pluginsCount).toBe(0)
  })

  it('handles missing projectId from client config', () => {
    vi.mocked(useClient).mockReturnValue({
      config: () => ({projectId: undefined}),
    } as never)

    const {result} = renderHook(() => useStudioFeedbackTags())

    expect(result.current.baseTags.projectId).toBe('')
  })

  it('updates dynamic tags when the active tool changes', () => {
    const {result, rerender} = renderHook(() => useStudioFeedbackTags())
    expect(result.current.dynamicTags.activeTool).toBe('desk')

    vi.mocked(useRouterState).mockImplementation(((selector: (state: {tool?: string}) => unknown) =>
      selector({tool: 'vision'})) as never)

    rerender()
    expect(result.current.dynamicTags.activeTool).toBe('vision')
  })
})
