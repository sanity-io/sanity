import {render, renderHook, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act, type ReactElement, Suspense, useState} from 'react'
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

/** Records whether reading the mode suspended */
const onModeFallback = vi.fn()
function ModeFallback() {
  onModeFallback()
  return <span>mode:pending</span>
}

function Probe() {
  return (
    <>
      <Enabled />
      <Suspense fallback={<ModeFallback />}>
        <Mode />
      </Suspense>
    </>
  )
}

/** The sidebar: it mounts on a click, long after the feature check has answered */
function LateProbe() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        open
      </button>
      {open && (
        <Suspense fallback={<ModeFallback />}>
          <Mode />
        </Suspense>
      )}
    </>
  )
}

async function renderProvider(
  features: Partial<SettledFeatures>,
  children: ReactElement = <Probe />,
) {
  useFeatureEnabledObservableMock.mockReturnValue(
    of({enabled: false, features: [], error: null, ...features}),
  )
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the mode read suspends on a promise; React only resumes it inside an awaited act
  await act(async () => {
    render(<TasksStudioProvider renderDefault={() => children}>{null}</TasksStudioProvider>)
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

  it('reads an already settled mode without suspending the UI that opens later', async () => {
    await renderProvider({enabled: true}, <LateProbe />)

    await userEvent.click(screen.getByRole('button', {name: 'open'}))

    expect(screen.getByText('mode:default')).toBeInTheDocument()
    expect(onModeFallback).not.toHaveBeenCalled()
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
