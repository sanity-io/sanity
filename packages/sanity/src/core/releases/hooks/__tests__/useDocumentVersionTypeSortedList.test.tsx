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

    expect(result.current.onlyHasVersions).toBe(false)
    expect(result.current.sortedDocumentList).toEqual([])
  })

  it('should return an empty array if no versions are found', async () => {
    mockUseDocumentVersions.mockReturnValue({...useDocumentVersionsReturn, data: []})

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
      wrapper,
    })

    expect(result.current.onlyHasVersions).toBe(false)
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

    it('should return onlyVersions true if only versions exist', async () => {
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

      expect(result.current.onlyHasVersions).toBe(true)
    })

    it('should return onlyVersions false if draft exists', async () => {
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
          'drafts.test',
        ],
      })

      const wrapper = await createTestProvider()
      const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
        wrapper,
      })

      expect(result.current.onlyHasVersions).toBe(false)
    })

    it('should return onlyVersions false if published exists', async () => {
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
          'test',
        ],
      })

      const wrapper = await createTestProvider()
      const {result} = renderHook(() => useDocumentVersionTypeSortedList({documentId: 'test'}), {
        wrapper,
      })

      expect(result.current.onlyHasVersions).toBe(false)
    })
  })
})
