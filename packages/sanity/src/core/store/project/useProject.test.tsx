import {act, render, renderHook, screen, waitFor} from '@testing-library/react'
import {Activity} from 'react'
import {NEVER, type Observable, of, ReplaySubject, Subject} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useProjectStore} from '../datastores'
import {type ProjectData, type ProjectStore} from './types'
import {useProject} from './useProject'

vi.mock('../datastores', () => ({useProjectStore: vi.fn()}))

const projectData = {id: 'abc123', displayName: 'Test project'} as ProjectData

function setup(project$: Observable<ProjectData | null>) {
  const get = vi.fn<ProjectStore['get']>(() => NEVER)
  vi.mocked(useProjectStore).mockReturnValue({
    get,
    getProject: () => project$,
  } as unknown as ProjectStore)
  return {get}
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useProject', () => {
  it('renders a project the store already holds on the very first render', () => {
    const project$ = new ReplaySubject<ProjectData | null>(1)
    project$.next(projectData)
    const {get} = setup(project$)

    const renders: Array<ProjectData | null> = []
    renderHook(() => {
      const value = useProject()
      renders.push(value)
      return value
    })

    // The workspace menu header sizes itself from this value. Returning the
    // replayed project one commit late would paint a frame without the name
    // and shift the header once it arrives.
    expect(renders[0]).toEqual(projectData)
    expect(get).not.toHaveBeenCalled()
  })

  it('returns null until the store emits, then the project', async () => {
    const project$ = new Subject<ProjectData | null>()
    setup(project$)

    const {result} = renderHook(() => useProject())
    expect(result.current).toBeNull()

    act(() => project$.next(projectData))
    await waitFor(() => expect(result.current).toEqual(projectData))
  })

  it('returns null when the store has no project', () => {
    setup(of(null))

    const {result} = renderHook(() => useProject())
    expect(result.current).toBeNull()
  })

  it('renders the held project the moment a hidden Activity is revealed', async () => {
    const project$ = new ReplaySubject<ProjectData | null>(1)
    project$.next(projectData)
    setup(project$)

    function ProjectName() {
      const value = useProject()
      return <span data-testid="project-name">{value ? value.displayName : 'unresolved'}</span>
    }
    const view = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <ProjectName />
      </Activity>
    )

    const {rerender} = render(view('hidden'))
    expect(await screen.findByTestId('project-name')).toHaveTextContent('Test project')

    rerender(view('visible'))
    expect(screen.getByTestId('project-name')).toHaveTextContent('Test project')
  })
})
