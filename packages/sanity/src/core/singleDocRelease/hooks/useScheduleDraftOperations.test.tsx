import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {useAllReleasesMockReturn} from '../../releases/store/__tests__/__mocks/useAllReleases.mock'
import {useReleaseOperationsMockReturn} from '../../releases/store/__tests__/__mocks/useReleaseOperations.mock'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

vi.mock('../../releases/store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../releases/store/useAllReleases', () => ({
  useAllReleases: vi.fn(() => useAllReleasesMockReturn),
}))

const mockReleaseId = '_.releases.mock-scheduled'
vi.mock('../../releases/util/createReleaseId', () => ({
  createReleaseId: vi.fn(() => mockReleaseId),
}))

describe('useScheduleDraftOperations', () => {
  const mockPublishAt = new Date('2024-12-31T10:00:00Z')

  beforeEach(() => {
    vi.clearAllMocks()
    useAllReleasesMockReturn.data = [
      scheduledRelease,
      activeScheduledRelease,
      archivedScheduledRelease,
    ]
  })

  it('should create a scheduled draft successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    const releaseDocumentId = await act(async () => {
      return result.current.createScheduledDraft('documentId', mockPublishAt)
    })

    expect(useReleaseOperationsMockReturn.createRelease).toHaveBeenCalledWith(
      {
        _id: mockReleaseId,
        metadata: {
          title: 'Scheduled publish',
          description: '',
          releaseType: 'scheduled',
          cardinality: 'one',
          intendedPublishAt: '2024-12-31T10:00:00.000Z',
        },
      },
      undefined,
    )
    expect(useReleaseOperationsMockReturn.createVersion).toHaveBeenCalledWith(
      getReleaseIdFromReleaseDocumentId(mockReleaseId),
      'drafts.documentId',
      undefined,
    )
    expect(useReleaseOperationsMockReturn.schedule).toHaveBeenCalledWith(
      mockReleaseId,
      mockPublishAt,
      undefined,
    )
    expect(releaseDocumentId).toBe(mockReleaseId)
  })

  it('should create scheduled draft with default title when no title provided', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    await act(async () => {
      await result.current.createScheduledDraft('documentId', mockPublishAt)
    })

    expect(useReleaseOperationsMockReturn.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: 'Scheduled publish',
        }),
      }),
      undefined,
    )
  })

  it('should publish scheduled draft when release is scheduled', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    await act(async () => {
      await result.current.publishScheduledDraft(scheduledRelease)
    })

    expect(useReleaseOperationsMockReturn.unschedule).toHaveBeenCalledWith(
      scheduledRelease._id,
      undefined,
    )
    expect(useReleaseOperationsMockReturn.publishRelease).toHaveBeenCalledWith(
      scheduledRelease._id,
      undefined,
    )
  })

  it('should publish active scheduled draft without unscheduling', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    await act(async () => {
      await result.current.publishScheduledDraft(activeScheduledRelease)
    })

    expect(useReleaseOperationsMockReturn.unschedule).not.toHaveBeenCalled()
    expect(useReleaseOperationsMockReturn.publishRelease).toHaveBeenCalledWith(
      activeScheduledRelease._id,
      undefined,
    )
  })

  it('should delete scheduled draft with proper state transitions', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    await act(async () => {
      await result.current.deleteScheduledDraft(scheduledRelease._id, false, '')
    })

    expect(useReleaseOperationsMockReturn.unschedule).toHaveBeenCalledWith(
      scheduledRelease._id,
      undefined,
    )
    expect(useReleaseOperationsMockReturn.archive).toHaveBeenCalledWith(
      scheduledRelease._id,
      undefined,
    )
    expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
      scheduledRelease._id,
      undefined,
    )
  })

  it('should delete archived release without unscheduling or archiving', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    await act(async () => {
      await result.current.deleteScheduledDraft(archivedScheduledRelease._id, false, '')
    })

    expect(useReleaseOperationsMockReturn.unschedule).not.toHaveBeenCalled()
    expect(useReleaseOperationsMockReturn.archive).not.toHaveBeenCalled()
    expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
      archivedScheduledRelease._id,
      undefined,
    )
  })

  it('should delete published release without archiving', async () => {
    useAllReleasesMockReturn.data = [publishedASAPRelease]

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    await act(async () => {
      await result.current.deleteScheduledDraft(publishedASAPRelease._id, false, '')
    })

    expect(useReleaseOperationsMockReturn.unschedule).not.toHaveBeenCalled()
    expect(useReleaseOperationsMockReturn.archive).not.toHaveBeenCalled()
    expect(useReleaseOperationsMockReturn.deleteRelease).toHaveBeenCalledWith(
      publishedASAPRelease._id,
      undefined,
    )
  })

  it('should handle delete when release is not found', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    useAllReleasesMockReturn.data = []

    await expect(
      act(async () => {
        await result.current.deleteScheduledDraft('non-existent-id', false, '')
      }),
    ).rejects.toThrow('Release with ID non-existent-id not found')
  })

  it('should reschedule scheduled draft successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    const newPublishAt = new Date('2025-01-15T12:00:00Z')

    await act(async () => {
      await result.current.rescheduleScheduledDraft(scheduledRelease, newPublishAt)
    })

    expect(useReleaseOperationsMockReturn.unschedule).not.toHaveBeenCalled()
    expect(useReleaseOperationsMockReturn.updateRelease).toHaveBeenCalledWith(
      {
        _id: scheduledRelease._id,
        metadata: {
          ...scheduledRelease.metadata,
          intendedPublishAt: newPublishAt.toISOString(),
        },
      },
      undefined,
    )
    expect(useReleaseOperationsMockReturn.schedule).toHaveBeenCalledWith(
      scheduledRelease._id,
      newPublishAt,
      undefined,
    )
  })

  it('should reschedule paused draft successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    const newPublishAt = new Date('2025-01-15T12:00:00Z')

    await act(async () => {
      await result.current.rescheduleScheduledDraft(activeScheduledRelease, newPublishAt)
    })

    expect(useReleaseOperationsMockReturn.updateRelease).toHaveBeenCalledWith(
      {
        _id: activeScheduledRelease._id,
        metadata: {
          ...activeScheduledRelease.metadata,
          intendedPublishAt: newPublishAt.toISOString(),
        },
      },
      undefined,
    )
    expect(useReleaseOperationsMockReturn.schedule).toHaveBeenCalledWith(
      activeScheduledRelease._id,
      newPublishAt,
      undefined,
    )
  })

  it('should pause scheduled draft successfully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    await act(async () => {
      await result.current.pauseScheduledDraft(scheduledRelease)
    })

    expect(useReleaseOperationsMockReturn.unschedule).toHaveBeenCalledWith(
      scheduledRelease._id,
      undefined,
    )
  })

  it('should handle createScheduledDraft errors gracefully', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useScheduleDraftOperations(), {wrapper})

    const error = new Error('Create release failed')
    useReleaseOperationsMockReturn.createRelease.mockRejectedValueOnce(error)

    await expect(
      act(async () => {
        await result.current.createScheduledDraft('documentId', mockPublishAt)
      }),
    ).rejects.toThrow('Create release failed')

    expect(useReleaseOperationsMockReturn.createVersion).not.toHaveBeenCalled()
    expect(useReleaseOperationsMockReturn.schedule).not.toHaveBeenCalled()
  })
})
