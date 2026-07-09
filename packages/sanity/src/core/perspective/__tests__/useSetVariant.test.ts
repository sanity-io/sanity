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

    result.current(variantAlphaAudience)

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
      },
    })
  })

  it('clears the variant sticky param when no variant is provided', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current(undefined)

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: null,
      },
    })
  })

  it('sets the variant and perspective sticky params in a single navigation', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current(variantAlphaAudience, {perspective: 'published'})

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
        perspective: 'published',
      },
    })
  })

  it('clears the perspective sticky param when the perspective is the default perspective', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current(variantAlphaAudience, {perspective: 'drafts'})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
        perspective: '',
      },
    })
  })

  it('sets a release id as the perspective sticky param', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current(variantAlphaAudience, {perspective: 'rSomeRelease'})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'alpha-audience',
        perspective: 'rSomeRelease',
      },
    })
  })
})
