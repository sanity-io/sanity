import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useFeatureEnabled} from '../../hooks'
import {useSource} from '../../studio/source'
import {
  SingleDocReleaseEnabledProvider,
  useSingleDocReleaseEnabled,
} from './SingleDocReleaseEnabledProvider'

vi.mock('../../hooks')

vi.mock('../../studio/source', () => ({
  useSource: vi.fn().mockReturnValue({}),
}))

const useFeatureEnabledMock = useFeatureEnabled as ReturnType<typeof vi.fn>
const useSourceMock = useSource as ReturnType<typeof vi.fn>

const featureFlagName = 'singleDocRelease'
describe('SingleDocReleaseEnabledProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show single doc releases if user opt out and the feature is not enabled (any plan)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useSourceMock.mockReturnValue({scheduledDrafts: {enabled: false}})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
  it('should not show single doc releases if user opt out and the feature is enabled (any plan)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useSourceMock.mockReturnValue({scheduledDrafts: {enabled: false}})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should show default mode if user hasnt opted out and the feature flag is enabled (growth or above)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useSourceMock.mockReturnValue({scheduledDrafts: {enabled: true}})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: true, mode: 'default'})
  })

  it('should show upsell mode if user has not opt out and the feature is not enabled (free plans)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useSourceMock.mockReturnValue({scheduledDrafts: {enabled: true}})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: true, mode: 'upsell'})
  })

  it('should not show single doc releases if it is loading the feature', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: true})
    useSourceMock.mockReturnValue({scheduledDrafts: {enabled: true}})

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
    useSourceMock.mockReturnValue({scheduledDrafts: {enabled: true}})

    const value = renderHook(useSingleDocReleaseEnabled, {wrapper: SingleDocReleaseEnabledProvider})

    expect(useFeatureEnabled).toHaveBeenCalledWith(featureFlagName)
    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
})
