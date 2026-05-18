import {act, renderHook, waitFor} from '@testing-library/react'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type VariantStoreState} from '../reducer'
import {useAllVariants} from '../useAllVariants'
import {createVariant} from './testUtils'

const initialState: VariantStoreState = {
  variants: new Map(),
  state: 'initialising',
}

const mockState$ = new BehaviorSubject<VariantStoreState>(initialState)
const mockDispatch = vi.fn()

vi.mock('../useVariantsStore', () => ({
  useVariantsStore: () => ({
    state$: mockState$,
    dispatch: mockDispatch,
  }),
}))

describe('useAllVariants', () => {
  beforeEach(() => {
    mockState$.next(initialState)
    vi.clearAllMocks()
  })

  it('returns the initial loading state', async () => {
    const {result} = renderHook(() => useAllVariants())

    expect(result.current).toEqual({
      loading: true,
      data: [],
      error: undefined,
    })
  })

  it('returns variants from the store state', async () => {
    const variantA = createVariant('a')
    const variantB = createVariant('b', 1)

    const {result} = renderHook(() => useAllVariants())

    act(() => {
      mockState$.next({
        variants: new Map([
          [variantA._id, variantA],
          [variantB._id, variantB],
        ]),
        state: 'loaded',
      })
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        data: [variantA, variantB],
        error: undefined,
      })
    })
  })

  it('returns errors from the store state', async () => {
    const error = new Error('Failed to load variants')

    const {result} = renderHook(() => useAllVariants())

    act(() => {
      mockState$.next({
        variants: new Map(),
        state: 'error',
        error,
      })
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        data: [],
        error,
      })
    })
  })
})
