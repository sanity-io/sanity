import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../../studio/workspace'
import {TasksEnabledProvider} from './TasksEnabledProvider'
import {useTasksEnabled} from './useTasksEnabled'

vi.mock('../../../hooks/useFeatureEnabled', () => ({
  useFeatureEnabled: vi.fn().mockReturnValue({}),
}))

vi.mock('../../../studio/workspace', () => ({
  useWorkspace: vi.fn().mockReturnValue({}),
}))

const useFeatureEnabledMock = useFeatureEnabled as ReturnType<typeof vi.fn>
const useWorkspaceMock = useWorkspace as ReturnType<typeof vi.fn>

describe('TasksEnabledProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show tasks if user opt out and the feature is not enabled (any plan)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useWorkspaceMock.mockReturnValue({tasks: {enabled: false}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
  it('should not show tasks if user opt out and the feature is enabled (any plan)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({tasks: {enabled: false}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should show default mode if user hasnt opted out and the feature is enabled (growth or above)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: true, mode: 'default'})
  })

  it('should show upsell mode if user has not opt out and the feature is not enabled (free plans)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: true, mode: 'upsell'})
  })

  it('should not show tasks if it is loading the feature', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: true})
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should not show the plugin if useFeatureEnabled has an error', () => {
    useFeatureEnabledMock.mockReturnValue({
      enabled: false,
      isLoading: true,
      error: new Error('Something went wrong'),
    })
    useWorkspaceMock.mockReturnValue({tasks: {enabled: true}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should call "useFeatureEnabled" with "sanityTasks"', () => {
    useWorkspaceMock.mockReturnValue({tasks: {enabled: false}})

    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith('sanityTasks')
  })
})
