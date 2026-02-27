import {type ReleaseDocument} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {useHasCardinalityOneReleaseVersions} from './useHasCardinalityOneReleaseVersions'

vi.mock('../../releases/hooks/useDocumentVersions')
vi.mock('../../releases/store/useActiveReleases')

const {useDocumentVersions} = vi.mocked(await import('../../releases/hooks/useDocumentVersions'))
const {useActiveReleases} = vi.mocked(await import('../../releases/store/useActiveReleases'))

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

  it('should return false when document only has cardinality many releases', () => {
    useActiveReleases.mockReturnValue({
      ...mockActiveReleasesReturn,
      data: [activeASAPRelease], // This has cardinality 'many'
    })
    useDocumentVersions.mockReturnValue({
      ...mockDocumentVersionsReturn,
      data: ['versions.rASAP.test-document'],
    })

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

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(true)
  })
})
