import {renderHook} from '@testing-library/react'
import {getVersionId} from 'sanity'
import {beforeEach, describe, expect, it, vi, type Mock} from 'vitest'

import {useDocumentIdStack} from '../useDocumentIdStack'

vi.mock('../useFilteredReleases', () => ({
  useFilteredReleases: vi.fn(),
}))

import {useFilteredReleases} from '../useFilteredReleases'

const mockUseFilteredReleases = useFilteredReleases as Mock<typeof useFilteredReleases>

const baseEditState = {
  id: 'foo',
  published: {_id: 'foo'},
  draft: {_id: 'drafts.foo'},
}

describe('useDocumentIdStack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFilteredReleases.mockReturnValue({
      currentReleases: [],
      notCurrentReleases: [],
      inCreation: null,
    })
  })

  it('returns stack including release versions', () => {
    mockUseFilteredReleases.mockReturnValue({
      currentReleases: [{_id: '_.releases.r1'}],
      notCurrentReleases: [],
      inCreation: null,
    })

    const {result} = renderHook(() =>
      useDocumentIdStack({
        displayed: {_id: 'foo'},
        documentId: 'foo',
        editState: baseEditState,
      }),
    )

    expect(result.current.stack).toEqual([
      baseEditState.published._id,
      baseEditState.draft._id,
      getVersionId('foo', 'r1'),
    ])
    expect(result.current.previousId).toBeUndefined()
    expect(result.current.nextId).toBe('drafts.foo')
  })

  it('computes position for displayed document', () => {
    const {result} = renderHook(() =>
      useDocumentIdStack({
        displayed: {_id: baseEditState.draft._id},
        documentId: 'foo',
        editState: baseEditState,
      }),
    )

    expect(result.current.position).toBe(1)
    expect(result.current.previousId).toBe('foo')
    expect(result.current.nextId).toBeUndefined()
  })
})
