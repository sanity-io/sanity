import {render, renderHook, screen} from '@testing-library/react'
import {act, Suspense} from 'react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type SettledFeatures, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../studio/workspace'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'
import {useTasksMode} from '../context/enabled/useTasksMode'
import {useTasksModePromise} from '../context/enabled/useTasksModePromise'
import {tasks} from './index'

vi.mock('../../studio/workspace', () => ({
  useWorkspace: vi.fn().mockReturnValue({tasks: {enabled: true}}),
}))
vi.mock('../../hooks/useFeatureEnabled', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureEnabledObservable: vi.fn(),
}))

const useWorkspaceMock = useWorkspace as ReturnType<typeof vi.fn>
const useFeatureEnabledObservableMock = vi.mocked(useFeatureEnabledObservable)

const TasksStudioProvider = tasks().studio!.components!.provider!

function Enabled() {
  return <span>enabled:{String(useTasksEnabled())}</span>
}

function Mode() {
  return <span>mode:{String(useTasksMode())}</span>
}

function Probe() {
  return (
    <>
      <Enabled />
      <Suspense fallback={<span>mode:pending</span>}>
        <Mode />
      </Suspense>
    </>
  )
}

async function renderProvider(features: Partial<SettledFeatures>) {
  useFeatureEnabledObservableMock.mockReturnValue(
    of({enabled: false, features: [], error: null, ...features}),
  )
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mode read suspends on a promise; React only resumes it inside an awaited act
  await act(async () => {
    render(<TasksStudioProvider renderDefault={() => <Probe />}>{null}</TasksStudioProvider>)
  })
}

describe('TasksStudioProvider', () => {
  beforeEach(() => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})
  })

  it('reports enabled synchronously and the default mode once the feature check answers', async () => {
    await renderProvider({enabled: true})

    expect(screen.getByText('enabled:true')).toBeInTheDocument()
    expect(await screen.findByText('mode:default')).toBeInTheDocument()
  })

  it('resolves the upsell mode when the plan lacks the feature', async () => {
    await renderProvider({enabled: false})

    expect(screen.getByText('enabled:true')).toBeInTheDocument()
    expect(await screen.findByText('mode:upsell')).toBeInTheDocument()
  })

  it('keeps tasks enabled but settles no mode when the feature check fails', async () => {
    await renderProvider({enabled: false, error: new Error('Something went wrong')})

    expect(screen.getByText('enabled:true')).toBeInTheDocument()
    expect(await screen.findByText('mode:null')).toBeInTheDocument()
  })

  it('disables tasks and settles no mode when the workspace opted out', async () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: false}})

    await renderProvider({enabled: true})

    expect(screen.getByText('enabled:false')).toBeInTheDocument()
    expect(await screen.findByText('mode:null')).toBeInTheDocument()
  })

  it('throws from the mode promise hook without the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(useTasksModePromise)).toThrow('TasksModePromise: missing context value')
    expect(renderHook(useTasksEnabled).result.current).toBe(false)

    consoleError.mockRestore()
  })
})
