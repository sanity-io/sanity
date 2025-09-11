import {type ReleaseDocument} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useHasCardinalityOneReleaseVersions} from '../useHasCardinalityOneReleaseVersions'

// Mock the dependencies
vi.mock('../useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(),
}))

vi.mock('../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

vi.mock('../../../util/draftUtils', () => ({
  getVersionFromId: vi.fn(),
}))

vi.mock('../../../util/releaseUtils', () => ({
  isCardinalityOneRelease: vi.fn(),
}))

vi.mock('../../util/getReleaseIdFromReleaseDocumentId', () => ({
  getReleaseIdFromReleaseDocumentId: vi.fn(),
}))

const mockUseDocumentVersions = vi.mocked(
  await import('../useDocumentVersions'),
).useDocumentVersions
const mockUseActiveReleases = vi.mocked(
  await import('../../store/useActiveReleases'),
).useActiveReleases
const mockGetVersionFromId = vi.mocked(await import('../../../util/draftUtils')).getVersionFromId
const mockIsCardinalityOneRelease = vi.mocked(
  await import('../../../util/releaseUtils'),
).isCardinalityOneRelease
const mockGetReleaseIdFromReleaseDocumentId = vi.mocked(
  await import('../../util/getReleaseIdFromReleaseDocumentId'),
).getReleaseIdFromReleaseDocumentId

describe('useHasCardinalityOneReleaseVersions', () => {
  const mockDocumentId = 'test-document'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false when no releases or document versions are available', () => {
    mockUseActiveReleases.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
      dispatch: vi.fn(),
    })
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      loading: false,
    })

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(false)
  })

  it('should return false when document has no versions in cardinality one releases', () => {
    const mockRelease: ReleaseDocument = {
      _id: '_.releases.test-release',
      _type: 'release',
      _createdAt: '2023-01-01T00:00:00Z',
      _updatedAt: '2023-01-01T00:00:00Z',
      _rev: '1',
      state: 'active',
      metadata: {
        title: 'Test Release',
        description: '',
        releaseType: 'scheduled',
        cardinality: 'many', // Not cardinality one
      },
    }

    mockUseActiveReleases.mockReturnValue({
      data: [mockRelease],
      loading: false,
      error: undefined,
      dispatch: vi.fn(),
    })
    mockUseDocumentVersions.mockReturnValue({
      data: ['versions.test-release.test-document'],
      loading: false,
    })
    mockGetVersionFromId.mockReturnValue('test-release')
    mockGetReleaseIdFromReleaseDocumentId.mockReturnValue('test-release')
    mockIsCardinalityOneRelease.mockReturnValue(false)

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(false)
  })

  it('should return true when document has versions in cardinality one releases', () => {
    const mockRelease: ReleaseDocument = {
      _id: '_.releases.scheduled-draft',
      _type: 'release',
      _createdAt: '2023-01-01T00:00:00Z',
      _updatedAt: '2023-01-01T00:00:00Z',
      _rev: '1',
      state: 'active',
      metadata: {
        title: 'Scheduled Draft',
        description: '',
        releaseType: 'scheduled',
        cardinality: 'one', // Cardinality one release
      },
    }

    mockUseActiveReleases.mockReturnValue({
      data: [mockRelease],
      loading: false,
      error: undefined,
      dispatch: vi.fn(),
    })
    mockUseDocumentVersions.mockReturnValue({
      data: ['versions.scheduled-draft.test-document'],
      loading: false,
    })
    mockGetVersionFromId.mockReturnValue('scheduled-draft')
    mockGetReleaseIdFromReleaseDocumentId.mockReturnValue('scheduled-draft')
    mockIsCardinalityOneRelease.mockReturnValue(true)

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(true)
  })

  it('should filter out non-version documents correctly', () => {
    const mockRelease: ReleaseDocument = {
      _id: '_.releases.test-release',
      _type: 'release',
      _createdAt: '2023-01-01T00:00:00Z',
      _updatedAt: '2023-01-01T00:00:00Z',
      _rev: '1',
      state: 'active',
      metadata: {
        title: 'Test Release',
        description: '',
        releaseType: 'scheduled',
        cardinality: 'one',
      },
    }

    mockUseActiveReleases.mockReturnValue({
      data: [mockRelease],
      loading: false,
      error: undefined,
      dispatch: vi.fn(),
    })
    mockUseDocumentVersions.mockReturnValue({
      data: ['versions.test-release.test-document', 'drafts.test-document', 'test-document'],
      loading: false,
    })

    // Mock getVersionFromId to return release ID only for version documents
    mockGetVersionFromId.mockImplementation((id: string) => {
      if (id.startsWith('versions.')) {
        return 'test-release'
      }
      return undefined
    })

    mockGetReleaseIdFromReleaseDocumentId.mockReturnValue('test-release')
    mockIsCardinalityOneRelease.mockReturnValue(true)

    const {result} = renderHook(() => useHasCardinalityOneReleaseVersions(mockDocumentId))

    expect(result.current).toBe(true)
    expect(mockGetVersionFromId).toHaveBeenCalledTimes(3)
  })
})
