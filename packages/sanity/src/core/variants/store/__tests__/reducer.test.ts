import {describe, expect, it} from 'vitest'

import {createMockVariant} from '../../__fixtures__/createMockVariant'
import {legacyVariantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantStoreReducer, type VariantStoreState} from '../reducer'

describe('variantStoreReducer', () => {
  const initialState: VariantStoreState = {
    variants: new Map(),
    state: 'initialising',
  }

  it('sets variants by id', () => {
    const variants = [createMockVariant('a'), createMockVariant('b', 1)]
    const state: VariantStoreState = {
      variants: new Map(),
      state: 'loading',
    }

    const result = variantStoreReducer(state, {
      type: 'VARIANTS_SET',
      payload: variants,
    })

    expect(result.variants).toEqual(
      new Map([
        [variants[0]._id, variants[0]],
        [variants[1]._id, variants[1]],
      ]),
    )
    expect(result.state).toBe('loading')
    expect(result.error).toBeUndefined()
  })

  it('sets variants and marks the fetch as loaded when fetch succeeds', () => {
    const variants = [createMockVariant('a'), createMockVariant('b', 1)]
    const error = new Error('Previous failure')
    const state: VariantStoreState = {
      variants: new Map(),
      state: 'error',
      error,
    }

    const result = variantStoreReducer(state, {
      type: 'FETCH_SUCCEEDED',
      payload: variants,
    })

    expect(result.variants).toEqual(
      new Map([
        [variants[0]._id, variants[0]],
        [variants[1]._id, variants[1]],
      ]),
    )
    expect(result).toMatchObject({state: 'loaded', error: undefined})
  })

  it('clears variants when the payload is null', () => {
    const variant = createMockVariant('a')
    const state: VariantStoreState = {
      variants: new Map([[variant._id, variant]]),
      state: 'loaded',
    }

    const result = variantStoreReducer(state, {
      type: 'VARIANTS_SET',
      payload: null,
    })

    expect(result.variants.size).toBe(0)
    expect(result).toMatchObject({state: 'loaded'})
  })

  it('removes a deleted variant without mutating the previous state', () => {
    const variantA = createMockVariant('a')
    const variantB = createMockVariant('b', 1)
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

  it('normalizes legacy object conditions and flags them as needing migration', () => {
    const result = variantStoreReducer(initialState, {
      type: 'FETCH_SUCCEEDED',
      payload: [legacyVariantAlphaAudience, createMockVariant('a')],
    })

    expect(result.variants.get(legacyVariantAlphaAudience._id)).toMatchObject({
      conditions: [
        {_key: 'audience', condition: 'audience', value: 'alpha'},
        {_key: 'locale', condition: 'locale', value: 'en-US'},
      ],
      needsMigration: true,
    })
    expect(result.variants.get(createMockVariant('a')._id)).toMatchObject({needsMigration: false})
  })

  it('marks migrated variants as no longer needing migration', () => {
    const fetched = variantStoreReducer(initialState, {
      type: 'FETCH_SUCCEEDED',
      payload: [legacyVariantAlphaAudience],
    })
    const legacy = fetched.variants.get(legacyVariantAlphaAudience._id)

    const result = variantStoreReducer(fetched, {
      type: 'VARIANTS_MIGRATED',
      payload: {ids: [legacyVariantAlphaAudience._id, '_.variants.missing']},
    })

    expect(result.variants.get(legacyVariantAlphaAudience._id)).toEqual({
      ...legacy,
      needsMigration: false,
    })
    expect(result.variants.size).toBe(1)
    expect(legacy?.needsMigration).toBe(true)
  })
})
