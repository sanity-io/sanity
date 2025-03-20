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
import {useOnlyHasVersions} from '../useOnlyHasVersions'
import {
  mockUseDocumentVersions,
  useDocumentVersionsReturn,
} from './__mocks__/useDocumentVersions.mock'

vi.mock('../useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(() => useDocumentVersionsReturn),
}))

describe('useOnlyHasVersions', () => {
  it('should return initial state', async () => {
    const wrapper = await createTestProvider()

    const {result} = renderHook(() => useOnlyHasVersions({documentId: 'test'}), {
      wrapper,
    })

    expect(result.current).toBe(false)
  })

  it('should return an empty array if no versions are found', async () => {
    mockUseDocumentVersions.mockReturnValue({...useDocumentVersionsReturn, data: []})

    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useOnlyHasVersions({documentId: 'test'}), {
      wrapper,
    })

    expect(result.current).toBe(false)
  })

  describe('when versions are found', () => {
    it('should return onlyVersions true if only versions exist', async () => {
      mockUseDocumentVersions.mockReturnValue({
        ...useDocumentVersionsReturn,
        data: [
          getVersionId('test', getReleaseIdFromReleaseDocumentId(activeScheduledRelease._id)),
          getVersionId('test', getReleaseIdFromReleaseDocumentId(activeUndecidedRelease._id)),
          getVersionId('test', getReleaseIdFromReleaseDocumentId(activeASAPRelease._id)),
        ],
      })

      const wrapper = await createTestProvider()
      const {result} = renderHook(() => useOnlyHasVersions({documentId: 'test'}), {
        wrapper,
      })

      expect(result.current).toBe(true)
    })

    it('should return onlyVersions false if draft exists', async () => {
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
      const {result} = renderHook(() => useOnlyHasVersions({documentId: 'test'}), {
        wrapper,
      })

      expect(result.current).toBe(false)
    })

    it('should return onlyVersions false if published exists', async () => {
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
      const {result} = renderHook(() => useOnlyHasVersions({documentId: 'test'}), {
        wrapper,
      })

      expect(result.current).toBe(false)
    })
  })
})
