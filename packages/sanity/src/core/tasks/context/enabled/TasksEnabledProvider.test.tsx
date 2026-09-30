import {renderHook} from '@testing-library/react'
import {type ObservablePromise} from 'react-rx'
import {TasksFeaturesPromiseContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type SettledFeatures} from '../../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../../studio/workspace'
import {TasksEnabledProvider} from './TasksEnabledProvider'
import {useTasksEnabled} from './useTasksEnabled'

vi.mock('../../../studio/workspace', () => ({
  useWorkspace: vi.fn().mockReturnValue({}),
}))

const useWorkspaceMock = useWorkspace as ReturnType<typeof vi.fn>

/** A settled feature check, the way `TasksStudioProvider` hands it over once resolved */
function settled(value: Partial<SettledFeatures>): ObservablePromise<SettledFeatures> {
  const features: SettledFeatures = {enabled: false, features: [], error: null, ...value}
  return Object.assign(Promise.resolve(features), {status: 'fulfilled' as const, value: features})
}

function renderTasksEnabled(featuresPromise: ObservablePromise<SettledFeatures>) {
  return renderHook(useTasksEnabled, {
    wrapper: ({children}) => (
      <TasksFeaturesPromiseContext.Provider value={featuresPromise}>
        <TasksEnabledProvider>{children}</TasksEnabledProvider>
      </TasksFeaturesPromiseContext.Provider>
    ),
  })
}

describe('TasksEnabledProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show tasks if user opt out and the feature is not enabled (any plan)', () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: false}})

    const value = renderTasksEnabled(settled({enabled: false}))

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
  it('should not show tasks if user opt out and the feature is enabled (any plan)', () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: false}})

    const value = renderTasksEnabled(settled({enabled: true}))

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should show default mode if user hasnt opted out and the feature is enabled (growth or above)', () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})

    const value = renderTasksEnabled(settled({enabled: true}))

    expect(value.result.current).toEqual({enabled: true, mode: 'default'})
  })

  it('should show upsell mode if user has not opt out and the feature is not enabled (free plans)', () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})

    const value = renderTasksEnabled(settled({enabled: false}))

    expect(value.result.current).toEqual({enabled: true, mode: 'upsell'})
  })

  it('should not show the plugin if the feature check has an error', () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})

    const value = renderTasksEnabled(
      settled({enabled: false, error: new Error('Something went wrong')}),
    )

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should fail loudly when rendered without the providers slot that starts the check', () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})).toThrow(
      /no parent TasksStudioProvider/,
    )

    consoleError.mockRestore()
  })
})
