import {renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {getVersionId} from '../../../util/draftUtils'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../__fixtures__/release.fixture'
import {
  mockUseActiveReleases,
  useActiveReleasesMockReturn,
} from '../../store/__tests__/__mocks/useActiveReleases.mock'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {useDocumentVersionTypeSortedList} from '../useDocumentVersionTypeSortedList'
import {
  mockUseDocumentVersions,
  useDocumentVersionsReturn,
} from './__mocks__/useDocumentVersions.mock'

vi.mock('../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => useActiveReleasesMockReturn),
}))

vi.mock('../useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(() => useDocumentVersionsReturn),
}))

describe('useDocumentVersionTypeSortedList', () => {
  it('should return initial state', async () => {
    const wrapper = await createTestProvider()

    const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
      wrapper,
    })

    expect(result.current.sortedDocumentList).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    mockUseDocumentVersions.mockReturnValue({...useDocumentVersionsReturn, data: []})

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
      wrapper,
    })

    expect(result.current.sortedDocumentList).toEqual([])
  })

  describe('when versions are found', () => {
    it('should return the sorted releases (asap, timed, undecided) if versions are found', async () => {
      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [activeUndecidedRelease, activeScheduledRelease, activeASAPRelease],
      })

      mockUseDocumentVersions.mockReturnValue({
        ...useDocumentVersionsReturn,
        data: [
          getVersionId('test', getReleaseIdFromReleaseDocumentId(activeScheduledRelease._id)),
          getVersionId('test', getReleaseIdFromReleaseDocumentId(activeUndecidedRelease._id)),
          getVersionId('test', getReleaseIdFromReleaseDocumentId(activeASAPRelease._id)),
        ],
      })

      const wrapper = await createTestProvider()
      const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
        wrapper,
      })

      expect(result.current.sortedDocumentList).toEqual([
        activeASAPRelease,
        activeScheduledRelease,
        activeUndecidedRelease,
      ])
    })

    it('when multiple timed releases exist, should return them in the expected order', async () => {
      const scheduledLaterRelease = {
        ...activeScheduledRelease,
        _id: '_.releases.rScheduled2',
        createdAt: '2025-02-17T00:26:59Z',
        updatedAt: '2025-02-17T00:26:59Z',
        metadata: {
          ...activeScheduledRelease.metadata,
          intendedPublishAt: '2025-04-01T00:00:00.000Z',
        },
      }

      mockUseActiveReleases.mockReturnValue({
        ...useActiveReleasesMockReturn,
        data: [scheduledLaterRelease, activeScheduledRelease],
      })

      mockUseDocumentVersions.mockReturnValue({
        ...useDocumentVersionsReturn,
        data: [
          getVersionId('test', getReleaseIdFromReleaseDocumentId(scheduledLaterRelease._id)),
          getVersionId('test', getReleaseIdFromReleaseDocumentId(activeScheduledRelease._id)),
        ],
      })

      const wrapper = await createTestProvider()
      const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
        wrapper,
      })

      expect(result.current.sortedDocumentList).toEqual([
        activeScheduledRelease,
        scheduledLaterRelease,
      ])
    })
  })
})
