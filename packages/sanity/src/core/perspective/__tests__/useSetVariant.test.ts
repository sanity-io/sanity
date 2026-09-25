import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {useSetVariant} from '../useSetVariant'

const mockNavigate = vi.fn()

const mockRouter = {
  navigate: mockNavigate,
  stickyParams: {} as {variant?: string},
}

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => mockRouter),
}))

vi.mock('../useGetDefaultPerspective', () => ({
  useGetDefaultPerspective: vi.fn(() => 'drafts'),
}))

describe('useSetVariant', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockRouter.stickyParams = {}
  })

  it('sets the variant sticky param without touching the perspective', () => {
    const {result} = renderHook(() => useSetVariant())

    result.current({variantId: variantAlphaAudience._id})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'variant:alpha-audience',
      },
    })
  })

  it('updates one type and keeps the other', () => {
    mockRouter.stickyParams = {variant: 'language:Fr12'}
    const {result} = renderHook(() => useSetVariant())

    result.current({variantId: variantAlphaAudience._id})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'language:Fr12,variant:alpha-audience',
      },
    })
  })

  it('clears one type and keeps the other', () => {
    mockRouter.stickyParams = {variant: 'language:Fr12,variant:alpha-audience'}
    const {result} = renderHook(() => useSetVariant())

    result.current({type: 'language', variantId: undefined})

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: 'variant:alpha-audience',
      },
    })
  })

  it('removes the sticky param after each selected type is cleared', () => {
    mockRouter.stickyParams = {variant: 'language:Fr12,variant:alpha-audience'}
    const {result} = renderHook(() => useSetVariant())

    result.current({type: 'language', variantId: undefined})
    mockRouter.stickyParams = {variant: 'variant:alpha-audience'}
    result.current({variantId: undefined})

    expect(mockNavigate).toHaveBeenNthCalledWith(1, {
      stickyParams: {
        variant: 'variant:alpha-audience',
      },
    })
    expect(mockNavigate).toHaveBeenNthCalledWith(2, {
      stickyParams: {
        variant: null,
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
        variant: 'variant:alpha-audience',
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
        variant: 'variant:alpha-audience',
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
        variant: 'variant:alpha-audience',
        excludedPerspectives: null,
        perspective: 'rSomeRelease',
      },
    })
  })
})
