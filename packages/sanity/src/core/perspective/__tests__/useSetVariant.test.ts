import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {useSetVariant} from '../useSetVariant'

const mockNavigate = vi.fn()

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({navigate: mockNavigate})),
}))

vi.mock('../useGetDefaultPerspective', () => ({
  useGetDefaultPerspective: vi.fn(() => 'drafts'),
}))

describe('useSetVariant', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('sets the variant sticky param without touching the perspective', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current({variantId: variantAlphaAudience._id})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
      },
    })
  })

  it('clears the variant sticky param when no variant is provided', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current({variantId: undefined})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: null,
      },
    })
  })

  it('sets the variant and perspective sticky params in a single navigation', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current({variantId: variantAlphaAudience._id, perspective: 'published'})

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
        excludedPerspectives: null,
        perspective: 'published',
      },
    })
  })

  it('clears the perspective sticky param when the perspective is the default perspective', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current({variantId: variantAlphaAudience._id, perspective: 'drafts'})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
        excludedPerspectives: null,
        perspective: '',
      },
    })
  })

  it('sets a release id as the perspective sticky param', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current({variantId: variantAlphaAudience._id, perspective: 'rSomeRelease'})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
        excludedPerspectives: null,
        perspective: 'rSomeRelease',
      },
    })
  })
})
