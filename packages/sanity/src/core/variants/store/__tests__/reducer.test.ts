import {describe, expect, it} from 'vitest'

import {variantStoreReducer, type VariantStoreState} from '../reducer'
import {createVariant} from './testUtils'

describe('variantStoreReducer', () => {
  const initialState: VariantStoreState = {
    variants: new Map(),
    state: 'initialising',
  }

  it('sets variants by id', () => {
    const variants = [createVariant('a'), createVariant('b', 1)]

    const result = variantStoreReducer(initialState, {
      type: 'VARIANTS_SET',
      payload: variants,
    })

    expect(result.variants).toEqual(
      new Map([
        [variants[0]._id, variants[0]],
        [variants[1]._id, variants[1]],
      ]),
    )
  })

  it('clears variants when the payload is null', () => {
    const variant = createVariant('a')
    const state: VariantStoreState = {
      variants: new Map([[variant._id, variant]]),
      state: 'loaded',
    }

    const result = variantStoreReducer(state, {
      type: 'VARIANTS_SET',
      payload: null,
    })

    expect(result.variants.size).toBe(0)
  })

  it('removes a deleted variant without mutating the previous state', () => {
    const variantA = createVariant('a')
    const variantB = createVariant('b', 1)
    const state: VariantStoreState = {
      variants: new Map([
        [variantA._id, variantA],
        [variantB._id, variantB],
      ]),
      state: 'loaded',
    }

    const result = variantStoreReducer(state, {
      type: 'VARIANT_DELETED',
      payload: {id: variantA._id},
    })

    expect(result.variants).toEqual(new Map([[variantB._id, variantB]]))
    expect(state.variants).toEqual(
      new Map([
        [variantA._id, variantA],
        [variantB._id, variantB],
      ]),
    )
  })

  it('moves between loading, loaded, and error states', () => {
    const error = new Error('Failed to load variants')

    expect(
      variantStoreReducer(initialState, {
        type: 'LOADING_STATE_CHANGED',
        payload: {loading: true, error: undefined},
      }),
    ).toMatchObject({state: 'loading', error: undefined})

    expect(
      variantStoreReducer(initialState, {
        type: 'LOADING_STATE_CHANGED',
        payload: {loading: false, error: undefined},
      }),
    ).toMatchObject({state: 'loaded', error: undefined})

    expect(
      variantStoreReducer(initialState, {
        type: 'LOADING_STATE_CHANGED',
        payload: {loading: false, error},
      }),
    ).toMatchObject({state: 'error', error})
  })
})
