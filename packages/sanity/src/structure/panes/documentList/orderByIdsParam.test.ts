import {describe, expect, it} from 'vitest'

import {
  isOrderByIdsParam,
  ORDER_BY_IDS_PARAM_FIELD,
  ORDER_BY_IDS_PARAM_SORT_ORDER,
  reorderItemsByIdsParam,
} from './orderByIdsParam'
import {type DocumentListPaneItem, type SortOrder} from './types'

const createItem = (id: string): DocumentListPaneItem => ({
  _id: id,
  _type: 'page',
  hasPublished: true,
  hasDraft: false,
})

describe('isOrderByIdsParam', () => {
  it('returns true for the sentinel sort order', () => {
    expect(isOrderByIdsParam(ORDER_BY_IDS_PARAM_SORT_ORDER)).toBe(true)
  })

  it('returns false for a regular field sort order', () => {
    const updatedAtOrder: SortOrder = {by: [{field: '_updatedAt', direction: 'desc'}]}
    expect(isOrderByIdsParam(updatedAtOrder)).toBe(false)
  })

  it('returns false when no sort order is provided', () => {
    expect(isOrderByIdsParam(undefined)).toBe(false)
  })

  it('returns false for a multi-field sort order', () => {
    const multiFieldOrder: SortOrder = {
      by: [
        {field: ORDER_BY_IDS_PARAM_FIELD, direction: 'asc'},
        {field: '_updatedAt', direction: 'desc'},
      ],
    }
    expect(isOrderByIdsParam(multiFieldOrder)).toBe(false)
  })
})

describe('reorderItemsByIdsParam', () => {
  it('reorders items to match the ids order', () => {
    const items = [createItem('alpha'), createItem('beta'), createItem('gamma')]
    const reordered = reorderItemsByIdsParam(items, ['gamma', 'alpha', 'beta'])

    expect(reordered.map((item) => item._id)).toEqual(['gamma', 'alpha', 'beta'])
  })

  it('maps draft ids onto their published id', () => {
    const items = [createItem('drafts.alpha'), createItem('beta')]
    const reordered = reorderItemsByIdsParam(items, ['beta', 'alpha'])

    expect(reordered.map((item) => item._id)).toEqual(['beta', 'drafts.alpha'])
  })

  it('appends absent items at the end preserving server order', () => {
    const items = [createItem('alpha'), createItem('beta'), createItem('gamma')]
    const reordered = reorderItemsByIdsParam(items, ['gamma'])

    expect(reordered.map((item) => item._id)).toEqual(['gamma', 'alpha', 'beta'])
  })

  it('handles empty inputs', () => {
    expect(reorderItemsByIdsParam([], [])).toEqual([])
    expect(reorderItemsByIdsParam([], ['alpha'])).toEqual([])
    expect(reorderItemsByIdsParam([createItem('alpha')], [])).toEqual([createItem('alpha')])
  })

  it('does not mutate the input array', () => {
    const items = [createItem('alpha'), createItem('beta')]
    const snapshot = [...items]
    reorderItemsByIdsParam(items, ['beta', 'alpha'])

    expect(items).toEqual(snapshot)
  })
})
