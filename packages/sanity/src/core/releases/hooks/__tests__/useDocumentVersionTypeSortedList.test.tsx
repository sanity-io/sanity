import {renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {getVersionId} from '../../../util/draftUtils'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../__fixtures__/release.fixture'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {useDocumentVersionTypeSortedList} from '../useDocumentVersionTypeSortedList'

vi.mock('../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [],
    error: null,
    loading: false,
  })),
}))

vi.mock('../useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(() => ({
    data: [],
    error: null,
    loading: false,
  })),
}))

const defaultActiveReleasesReturn = {
  data: [],
  error: null,
  loading: false,
}

const defaultDocumentVersionsReturn = {
  data: [],
  error: null,
  loading: false,
}

describe('useDocumentVersionTypeSortedList', () => {
  it('should return initial state', async () => {
    const {useActiveReleases} = await import('../../store/useActiveReleases')
    const {useDocumentVersions} = await import('../useDocumentVersions')
    
    vi.mocked(useActiveReleases).mockReturnValue(defaultActiveReleasesReturn)
    vi.mocked(useDocumentVersions).mockReturnValue(defaultDocumentVersionsReturn)

    const wrapper = await createTestProvider()

    const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
      wrapper,
    })

    expect(result.current.sortedDocumentList).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    const {useActiveReleases} = await import('../../store/useActiveReleases')
    const {useDocumentVersions} = await import('../useDocumentVersions')
    
    vi.mocked(useActiveReleases).mockReturnValue(defaultActiveReleasesReturn)
    vi.mocked(useDocumentVersions).mockReturnValue({...defaultDocumentVersionsReturn, data: []})

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
      wrapper,
    })

    expect(result.current.sortedDocumentList).toEqual([])
  })

  describe('when versions are found', () => {
    it('should return the sorted releases (asap, timed, undecided) if versions are found', async () => {
      const {useActiveReleases} = await import('../../store/useActiveReleases')
      const {useDocumentVersions} = await import('../useDocumentVersions')
      
      vi.mocked(useActiveReleases).mockReturnValue({
        ...defaultActiveReleasesReturn,
        data: [activeUndecidedRelease, activeScheduledRelease, activeASAPRelease],
      })

      vi.mocked(useDocumentVersions).mockReturnValue({
        ...defaultDocumentVersionsReturn,
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
      const {useActiveReleases} = await import('../../store/useActiveReleases')
      const {useDocumentVersions} = await import('../useDocumentVersions')
      
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

      vi.mocked(useActiveReleases).mockReturnValue({
        ...defaultActiveReleasesReturn,
        data: [scheduledLaterRelease, activeScheduledRelease],
      })

      vi.mocked(useDocumentVersions).mockReturnValue({
        ...defaultDocumentVersionsReturn,
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
