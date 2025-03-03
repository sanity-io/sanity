import {renderHook} from '@testing-library/react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useFeatureEnabled} from '../../../hooks'
import {useClient} from '../../../hooks/useClient'
import {useWorkspace} from '../../../studio/workspace'
import {type Schedule} from '../../types'
import {
  ScheduledPublishingEnabledProvider,
  useScheduledPublishingEnabled,
} from './ScheduledPublishingEnabledProvider'
import {cachedUsedScheduledPublishing} from './useHasUsedScheduledPublishing'

vi.mock('../../../hooks/useFeatureEnabled', () => ({
  useFeatureEnabled: vi.fn().mockReturnValue({}),
}))

vi.mock('../../../studio/workspace', () => ({
  useWorkspace: vi.fn().mockReturnValue({}),
}))

vi.mock('../../../hooks/useClient')

const useClientMock = useClient as ReturnType<typeof vi.fn>
const mockObservableRequest = vi.fn((schedules) => of({schedules}))
const scheduleResponse: Schedule[] = [
  {
    id: 'sch-2scsu4bVs6S66HXyCb8LYqpsrA9',
    name: '2025-02-14T14:40:00.000Z',
    description: '',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    author: 'pzAhBTkNX',
    action: 'publish',
    state: 'scheduled',
    stateReason: 'created by user',
    documents: [{documentId: '195138c7-4e0e-4914-a9b0-c8b1ede66236', documentType: 'book'}],
    createdAt: '2025-02-05T14:40:16.423391Z',
    executeAt: '2025-02-24T14:40:00Z',
  },
]

const mockClient = (schedules: Schedule[]) => {
  useClientMock.mockReturnValue({
    config: () => ({dataset: 'dataset', projectId: 'projectId'}),
    observable: {
      request: () => mockObservableRequest(schedules),
    },
  })
}
const useFeatureEnabledMock = useFeatureEnabled as ReturnType<typeof vi.fn>
const useWorkspaceMock = useWorkspace as ReturnType<typeof vi.fn>

describe('ScheduledPublishingEnabledProvider - previously used', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient(scheduleResponse)
    cachedUsedScheduledPublishing.clear()
  })

  it('should not show scheduled publishing if user opt out and the feature is not enabled (any plan)', async () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: false}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      // Workspace is not enabled, so we won't do a request to check if they have used it or not.
      hasUsedScheduledPublishing: {used: false, loading: false},
    })
  })
  it('should not show scheduled publishing  if user opt out and the feature is enabled (any plan)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: false}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      // Workspace is not enabled, so we won't do a request to check if they have used it or not.
      hasUsedScheduledPublishing: {used: false, loading: false},
    })
  })

  it('should show default mode if user hasnt opted out and the feature is enabled (growth or above)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'default',
      hasUsedScheduledPublishing: {used: true, loading: false},
    })
  })

  it('should show upsell mode if user has not opt out and the feature is not enabled (free plans)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'upsell',
      hasUsedScheduledPublishing: {used: true, loading: false},
    })
  })

  it('should not show tasks if it is loading the feature', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: true})
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: {used: true, loading: false},
    })
  })

  it('should not show the plugin if useFeatureEnabled has an error', () => {
    useFeatureEnabledMock.mockReturnValue({
      enabled: false,
      isLoading: true,
      error: new Error('Something went wrong'),
    })
    useWorkspaceMock.mockReturnValue({scheduledPublishing: {enabled: true}})

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: {used: true, loading: false},
    })
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

describe('ScheduledPublishingEnabledProvider - not previously used', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient([])
    cachedUsedScheduledPublishing.clear()
  })

  it('should not show scheduled publishing  if user opt out and the feature is enabled (any plan)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({
      scheduledPublishing: {
        enabled: false,
        // eslint-disable-next-line camelcase
        scheduledPublishing: {enabled: true, __internal__workspaceEnabled: false},
      },
    })

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: {used: false, loading: false},
    })
  })

  it('should not show if they have not used it before and have not opted in', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({
      // eslint-disable-next-line camelcase
      scheduledPublishing: {enabled: true, __internal__workspaceEnabled: false},
    })

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: false,
      mode: null,
      hasUsedScheduledPublishing: {used: false, loading: false},
    })
  })

  it('should  show default mode if they have not used it before and opted in', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: true, isLoading: false})
    useWorkspaceMock.mockReturnValue({
      // eslint-disable-next-line camelcase
      scheduledPublishing: {enabled: true, __internal__workspaceEnabled: true},
    })

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'default',
      // Users have opted in, so we are not checking if they used it, we are just returning a default true value
      hasUsedScheduledPublishing: {used: true, loading: false},
    })
  })
  it('should  show upsell mode if they have not used it before and opted in, and feature is not available (free plans)', () => {
    useFeatureEnabledMock.mockReturnValue({enabled: false, isLoading: false})
    useWorkspaceMock.mockReturnValue({
      // eslint-disable-next-line camelcase
      scheduledPublishing: {enabled: true, __internal__workspaceEnabled: true},
    })

    const value = renderHook(useScheduledPublishingEnabled, {
      wrapper: ScheduledPublishingEnabledProvider,
    })

    expect(value.result.current).toEqual({
      enabled: true,
      mode: 'upsell',
      // Users have opted in, so we are not checking if they used it, we are just returning a default true value
      hasUsedScheduledPublishing: {used: true, loading: false},
    })
  })
})
