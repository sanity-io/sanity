import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react'

import {TasksEnabledProvider} from './TasksEnabledProvider'
import {useTasksEnabled} from './useTasksEnabled'

// Mocks for useFeatureEnabled and useWorkspace hooks
jest.mock('sanity', () => {
  return {
    useFeatureEnabled: jest.fn(),
    useWorkspace: jest.fn(),
  }
})

describe('TasksEnabledProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not show tasks if user opt out and the feature is not enabled (any plan)', () => {
    require('sanity').useFeatureEnabled.mockReturnValue({enabled: false, isLoading: false})
    require('sanity').useWorkspace.mockReturnValue({tasks: {enabled: false}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
  it('should not show tasks if user opt out and the feature is enabled (any plan)', () => {
    require('sanity').useFeatureEnabled.mockReturnValue({enabled: true, isLoading: false})
    require('sanity').useWorkspace.mockReturnValue({tasks: {enabled: false}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should show default mode if user hasnt opted out and the feature is enabled (growth or above)', () => {
    require('sanity').useFeatureEnabled.mockReturnValue({enabled: true, isLoading: false})
    require('sanity').useWorkspace.mockReturnValue({tasks: {enabled: true}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: true, mode: 'default'})
  })

  it('should show upsell mode if user has not opt out and the feature is not enabled (free plans)', () => {
    require('sanity').useFeatureEnabled.mockReturnValue({enabled: false, isLoading: false})
    require('sanity').useWorkspace.mockReturnValue({tasks: {enabled: true}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: true, mode: 'upsell'})
  })

  it('should not show tasks if it is loading the feature', () => {
    require('sanity').useFeatureEnabled.mockReturnValue({enabled: false, isLoading: true})
    require('sanity').useWorkspace.mockReturnValue({tasks: {enabled: true}})

    const value = renderHook(useTasksEnabled, {wrapper: TasksEnabledProvider})

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
})
