import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getPerspectiveParam, useSetPerspective} from '../useSetPerspective'

const mockNavigate = vi.fn()

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({navigate: mockNavigate})),
}))

vi.mock('../useGetDefaultPerspective', () => ({
  useGetDefaultPerspective: vi.fn(() => 'drafts'),
}))

describe('getPerspectiveParam', () => {
  it('returns an empty string when no perspective is provided', () => {
    expect(getPerspectiveParam(undefined, 'drafts')).toBe('')
  })

  it('returns an empty string when the perspective equals the default perspective', () => {
    expect(getPerspectiveParam('drafts', 'drafts')).toBe('')
    expect(getPerspectiveParam('published', 'published')).toBe('')
  })

  it('returns the perspective when it differs from the default perspective', () => {
    expect(getPerspectiveParam('published', 'drafts')).toBe('published')
    expect(getPerspectiveParam('rSomeRelease', 'drafts')).toBe('rSomeRelease')
  })
})

describe('useSetPerspective', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('clears the perspective param when setting the default perspective', () => {
    const {result} = renderHook(() => useSetPerspective())

    result.current('drafts')

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        excludedPerspectives: null,
        perspective: '',
      },
    })
  })

  it('sets the perspective param for non-default perspectives', () => {
    const {result} = renderHook(() => useSetPerspective())

    result.current('rSomeRelease')

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        excludedPerspectives: null,
        perspective: 'rSomeRelease',
      },
    })
  })
})
