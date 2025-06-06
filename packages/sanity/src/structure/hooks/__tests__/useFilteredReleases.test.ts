import {renderHook} from '@testing-library/react'
import {
  getVersionId,
  useActiveReleases,
  useArchivedReleases,
  useDocumentVersions,
  usePerspective,
} from 'sanity'
import {beforeEach, describe, expect, it, vi, type Mock} from 'vitest'

import {useFilteredReleases} from '../useFilteredReleases'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(),
  useArchivedReleases: vi.fn(),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
}))
vi.mock('../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseArchivedReleases = useArchivedReleases as Mock<typeof useArchivedReleases>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUsePaneRouter = usePaneRouter as Mock<typeof usePaneRouter>

const releaseA = {_id: '_.releases.ra', _type: 'system.release', state: 'draft'}
const releaseB = {_id: '_.releases.rb', _type: 'system.release', state: 'draft'}

describe('useFilteredReleases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePaneRouter.mockReturnValue({params: {}})
  })

  it('categorizes current and non-current releases', () => {
    mockUseActiveReleases.mockReturnValue({data: [releaseA, releaseB]})
    mockUseArchivedReleases.mockReturnValue({data: []})
    mockUseDocumentVersions.mockReturnValue({data: [getVersionId('foo', 'rb')]})
    mockUsePerspective.mockReturnValue({selectedReleaseId: undefined} as any)

    const {result} = renderHook(() =>
      useFilteredReleases({displayed: {_id: 'foo'}, documentId: 'foo'}),
    )

    expect(result.current.currentReleases).toEqual([releaseB])
    expect(result.current.notCurrentReleases).toEqual([releaseA])
    expect(result.current.inCreation).toBeNull()
  })

  it('returns inCreation when creating new document for release', () => {
    mockUseActiveReleases.mockReturnValue({data: [releaseA]})
    mockUseArchivedReleases.mockReturnValue({data: []})
    mockUseDocumentVersions.mockReturnValue({data: []})
    mockUsePerspective.mockReturnValue({selectedReleaseId: 'ra'} as any)

    const displayed = {_id: getVersionId('foo', 'ra')} as any
    const {result} = renderHook(() => useFilteredReleases({displayed, documentId: 'foo'}))

    expect(result.current.inCreation).toEqual(releaseA)
  })
})
