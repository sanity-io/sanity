import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useFeatureEnabled} from '../../hooks/useFeatureEnabled'
import {
  SingleDocReleaseEnabledProvider,
  useSingleDocReleaseEnabled,
} from './SingleDocReleaseEnabledProvider'

vi.mock('../../hooks/useFeatureEnabled')

const useFeatureEnabledMock = useFeatureEnabled as ReturnType<typeof vi.fn>

const featureFlagName = 'singleDocRelease'

// The provider only renders inside the plugin, which is only loaded when the workspace has
// scheduled drafts enabled, so there is no opted-out case to cover here
describe('SingleDocReleaseEnabledProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show default mode if the feature flag is enabled (growth or above)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: true, mode: 'default'})
  })

  it('should show upsell mode if the feature is not enabled (free plans)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: true, mode: 'upsell'})
  })

  it('should not show single doc releases if it is loading the feature', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: true})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should not show the plugin if useFeatureEnabled has an error', () => {
    useFeatureEnabledMock.mockReturnValue({
      enabled: false,
      isLoading: true,
      error: new Error('Something went wrong'),
    })

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
})
