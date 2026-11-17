import {render, renderHook, screen} from '@testing-library/react'
import {act, Suspense, use} from 'react'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type SettledFeatures, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useTasksMode} from '../context/enabled/useTasksMode'
import {tasks} from './index'

vi.mock('../../hooks/useFeatureEnabled', async (importOriginal) => ({
  ...(await importOriginal()),
  useFeatureEnabledObservable: vi.fn(),
}))

const useFeatureEnabledObservableMock = vi.mocked(useFeatureEnabledObservable)

const TasksStudioProvider = tasks().studio!.components!.provider!

function Mode() {
  // The leaf that renders differently per mode reads the promise with `use()`
  return <span>mode:{String(use(useTasksMode()))}</span>
}

function Probe() {
  return (
    <Suspense fallback={<span>mode:pending</span>}>
      <Mode />
    </Suspense>
  )
}

const laterFallbackRendered = vi.fn()
function LaterFallback() {
  laterFallbackRendered()
  return <span>later:pending</span>
}
function Later() {
  return <span>later:{String(use(useTasksMode()))}</span>
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

  it('settles the mode in place, so a leaf that mounts later reads it without suspending', async () => {
    useFeatureEnabledObservableMock.mockReturnValue(of({enabled: true, features: [], error: null}))
    // Nothing reads the mode while the check answers (the studio paints without waiting for it)
    const {rerender} = render(
      <TasksStudioProvider renderDefault={() => <span>no leaf</span>}>{null}</TasksStudioProvider>,
    )
    await act(() => Promise.resolve())

    // The sidebar, the create action's dialog and so on mount long after the check answered;
    // the promise the context carries is the one that settled, so `use()` reads it synchronously
    rerender(
      <TasksStudioProvider
        renderDefault={() => (
          <Suspense fallback={<LaterFallback />}>
            <Later />
          </Suspense>
        )}
      >
        {null}
      </TasksStudioProvider>,
    )

    expect(screen.getByText('later:default')).toBeInTheDocument()
    expect(laterFallbackRendered).not.toHaveBeenCalled()
  })

  it('throws from the mode hook without the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(useTasksMode)).toThrow('TasksModePromise: missing context value')

    consoleError.mockRestore()
  })
})
