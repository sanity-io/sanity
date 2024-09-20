import {renderHook} from '@testing-library/react'
import {useWorkspace} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useFeatureEnabled} from '../../../hooks'
import {
  ScheduledPublishingEnabledProvider,
  useScheduledPublishingEnabled,
} from './ScheduledPublishingEnabledProvider'

vi.mock('../../../hooks/useFeatureEnabled', () => ({
  ...(vi.importActual('sanity') || {}),
  useFeatureEnabled: vi.fn().mockReturnValue({}),
}))

vi.mock('../../../studio/workspace', () => ({
  ...(vi.importActual('sanity') || {}),
  useWorkspace: vi.fn().mockReturnValue({}),
}))

const useFeatureEnabledMock = useFeatureEnabled as ReturnType<typeof vi.fn>
const useWorkspaceMock = useWorkspace as ReturnType<typeof vi.fn>

describe('ScheduledPublishingEnabledProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show scheduled publishing if user opt out and the feature is not enabled (any plan)', async () => {
    useFeatureEnabledMock.mockReturnValue({
      enabled: false,
      isLoading: false,
    })
    useWorkspaceMock.mockReturnValue({
      scheduledPublishing: {enabled: false},
    })

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })
  it('should not show scheduled publishing  if user opt out and the feature is enabled (any plan)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: false}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should show default mode if user hasnt opted out and the feature is enabled (growth or above)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({enabled: true, mode: 'default'})
  })

  it('should show upsell mode if user has not opt out and the feature is not enabled (free plans)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({enabled: true, mode: 'upsell'})
  })

  it('should not show tasks if it is loading the feature', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: true})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({enabled: false, mode: null})
  })

  it('should call "useFeatureEnabled" with "scheduledPublishing"', () => {
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: false}})
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})

    renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(useFeatureEnabled).toHaveBeenCalledWith('scheduledPublishing')
  })
})
