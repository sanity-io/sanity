import {type ReleaseDocument} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {useHasCardinalityOneReleaseVersions} from '../useHasCardinalityOneReleaseVersions'

vi.mock('../useDocumentVersions')
vi.mock('../../store/useActiveReleases')
vi.mock('../../../util/draftUtils')
vi.mock('../../../util/releaseUtils')
vi.mock('../../util/getReleaseIdFromReleaseDocumentId')

const {useDocumentVersions} = vi.mocked(await import('../useDocumentVersions'))
const {useActiveReleases} = vi.mocked(await import('../../store/useActiveReleases'))
const {getVersionFromId} = vi.mocked(await import('../../../util/draftUtils'))
const {isCardinalityOneRelease} = vi.mocked(await import('../../../util/releaseUtils'))
const {getReleaseIdFromReleaseDocumentId} = vi.mocked(
  await import('../../util/getReleaseIdFromReleaseDocumentId'),
)

const cardinalityOneRelease: ReleaseDocument = {
  ...activeScheduledRelease,
  _id: '_.releases.scheduled-draft',
  name: 'scheduled-draft',
  metadata: {
    ...activeScheduledRelease.metadata,
    title: 'Scheduled Draft',
    cardinality: 'one',
  },
}

const mockActiveReleasesReturn = {
  loading: false,
  error: undefined,
  dispatch: vi.fn(),
}

const mockDocumentVersionsReturn = {
  loading: false,
  error: null,
}

describe('useHasCardinalityOneReleaseVersions', () => {
  const mockDocumentId = 'test-document'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false when no releases or document versions are available', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [],
    })
    useDocumentVersions.mockReturnValue({
      ...mockDocumentVersionsReturn,
      data: [],
    })

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(false)
  })

  it('should return false when document has no versions in cardinality one releases', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [activeASAPRelease], // This has cardinality 'many'
    })
    useDocumentVersions.mockReturnValue({
      ...mockDocumentVersionsReturn,
      data: ['versions.rASAP.test-document'],
    })
    getVersionFromId.mockReturnValue('rASAP')
    getReleaseIdFromReleaseDocumentId.mockReturnValue('rASAP')
    isCardinalityOneRelease.mockReturnValue(false)

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(false)
  })

  it('should return true when document has versions in cardinality one releases', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [cardinalityOneRelease],
    })
    useDocumentVersions.mockReturnValue({
      ...mockDocumentVersionsReturn,
      data: ['versions.scheduled-draft.test-document'],
    })
    getVersionFromId.mockReturnValue('scheduled-draft')
    getReleaseIdFromReleaseDocumentId.mockReturnValue('scheduled-draft')
    isCardinalityOneRelease.mockReturnValue(true)

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(true)
  })

  it('should filter out non-version documents correctly', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [cardinalityOneRelease],
    })
    useDocumentVersions.mockReturnValue({
      ...mockDocumentVersionsReturn,
      data: ['versions.scheduled-draft.test-document', 'drafts.test-document', 'test-document'],
    })

    // Mock getVersionFromId to return release ID only for version documents
    getVersionFromId.mockImplementation((id: string) => {
      if (id.startsWith('versions.')) {
        return 'scheduled-draft'
      }
      return undefined
    })

    getReleaseIdFromReleaseDocumentId.mockReturnValue('scheduled-draft')
    isCardinalityOneRelease.mockReturnValue(true)

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(true)
    expect(getVersionFromId).toHaveBeenCalledTimes(3)
  })
})
