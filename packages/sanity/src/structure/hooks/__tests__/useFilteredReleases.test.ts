import {renderHook} from '@testing-library/react'
import {useActiveReleases, useArchivedReleases, useDocumentVersions, usePerspective} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, type MockedFunction, vi} from 'vitest'

import {usePaneRouter} from '../components/paneRouter/usePaneRouter'
import {useFilteredReleases} from '../useFilteredReleases'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(),
  useArchivedReleases: vi.fn(),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
}))

vi.mock('../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(),
}))

const mockUseActiveReleases = useActiveReleases as MockedFunction<typeof useActiveReleases>
const mockUseArchivedReleases = useArchivedReleases as MockedFunction<typeof useArchivedReleases>
const mockUseDocumentVersions = useDocumentVersions as MockedFunction<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as MockedFunction<typeof usePerspective>
const mockUsePaneRouter = usePaneRouter as Mock<typeof usePaneRouter>

describe('useFilteredReleases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActiveReleases.mockReturnValue({data: [], loading: false} as any)
    mockUseArchivedReleases.mockReturnValue({data: [], loading: false} as any)
    mockUseDocumentVersions.mockReturnValue({data: undefined, loading: false} as any)
    mockUsePerspective.mockReturnValue({selectedReleaseId: undefined} as any)
    mockUsePaneRouter.mockReturnValue({params: {}} as any)
  })

  it('returns empty arrays when no document versions', () => {
    const {result} = renderHook(() =>
      useFilteredReleases({displayed: {_id: 'foo'}, documentId: 'foo'}),
    )

    expect(result.current).toEqual({
      notCurrentReleases: [],
      currentReleases: [],
      inCreation: null,
    })
  })

  it('groups releases and adds archived release when historyVersion matches', () => {
    const releases = [{_id: '_.releases.r1'}, {_id: '_.releases.r2'}]
    const archived = [{_id: '_.releases.r3', state: 'archived'}]
    mockUseActiveReleases.mockReturnValue({data: releases, loading: false} as any)
    mockUseArchivedReleases.mockReturnValue({data: archived, loading: false} as any)
    mockUseDocumentVersions.mockReturnValue({
      data: ['versions.r1.foo'],
      loading: false,
    } as any)
    mockUsePaneRouter.mockReturnValue({params: {historyVersion: 'r3'}} as any)

    const {result} = renderHook(() =>
      useFilteredReleases({displayed: {_id: 'foo', _createdAt: 't'}, documentId: 'foo'}),
    )

    expect(result.current.currentReleases).toEqual([releases[0], archived[0]])
    expect(result.current.notCurrentReleases).toEqual([releases[1]])
    expect(result.current.inCreation).toBe(null)
  })
})
