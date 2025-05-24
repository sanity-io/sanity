import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useDocumentIdStack} from '../useDocumentIdStack'
import {mockUseFilteredReleases} from './__mocks__/useFilteredReleases.mock'

vi.mock('../useFilteredReleases')

const mockFilteredReleasesReturn = {
  currentReleases: [{_id: '_.releases.r1'}],
  notCurrentReleases: [],
  inCreation: null,
}

describe('useDocumentIdStack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFilteredReleases.mockReturnValue(mockFilteredReleasesReturn as any)
  })

  it('returns stack positions based on filtered releases', () => {
    const editState = {
      id: 'foo',
      draft: {_id: 'drafts.foo'},
      published: {_id: 'foo'},
    }
    const {result} = renderHook(() =>
      useDocumentIdStack({displayed: {_id: 'drafts.foo'}, documentId: 'foo', editState}),
    )

    expect(result.current.stack).toEqual(['foo', 'drafts.foo', 'versions.r1.foo'])
    expect(result.current.position).toBe(1)
    expect(result.current.previousId).toBe('foo')
    expect(result.current.nextId).toBe('versions.r1.foo')
  })
})
