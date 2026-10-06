import {render, renderHook, screen} from '@testing-library/react'
import {act, Suspense} from 'react'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type SettledFeatures, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useTasksMode} from '../context/enabled/useTasksMode'
import {useTasksModePromise} from '../context/enabled/useTasksModePromise'
import {tasks} from './index'

vi.mock('../../hooks/useFeatureEnabled', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureEnabledObservable: vi.fn(),
}))

const useFeatureEnabledObservableMock = vi.mocked(useFeatureEnabledObservable)

const TasksStudioProvider = tasks().studio!.components!.provider!

function Mode() {
  return <span>mode:{String(useTasksMode())}</span>
}

function Probe({mounted = true}: {mounted?: boolean}) {
  return <Suspense fallback={<span>mode:pending</span>}>{mounted ? <Mode /> : null}</Suspense>
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
  it('settles the default mode once the feature check answers', async () => {
    await renderProvider({enabled: true})

    expect(await screen.findByText('mode:default')).toBeInTheDocument()
  })

  it('settles the upsell mode when the plan lacks the feature', async () => {
    await renderProvider({enabled: false})

    expect(await screen.findByText('mode:upsell')).toBeInTheDocument()
  })

  it('settles no mode when the feature check fails', async () => {
    await renderProvider({enabled: false, error: new Error('Something went wrong')})

    expect(await screen.findByText('mode:null')).toBeInTheDocument()
  })

  it('does not suspend a consumer mounted after the feature check settled', async () => {
    useFeatureEnabledObservableMock.mockReturnValue(of({enabled: true, features: [], error: null}))
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mode read suspends on a promise; React only resumes it inside an awaited act
    const {rerender} = await act(async () =>
      render(
        <TasksStudioProvider renderDefault={() => <Probe mounted={false} />}>
          {null}
        </TasksStudioProvider>,
      ),
    )

    rerender(<TasksStudioProvider renderDefault={() => <Probe />}>{null}</TasksStudioProvider>)

    expect(screen.queryByText('mode:pending')).not.toBeInTheDocument()
    expect(screen.getByText('mode:default')).toBeInTheDocument()
  })

  it('throws from the mode promise hook without the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(useTasksModePromise)).toThrow('TasksModePromise: missing context value')

    consoleError.mockRestore()
  })
})
