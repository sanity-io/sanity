import {getPublishedId} from 'sanity'

import {type DocumentListPaneItem, type SortOrder} from './types'

/**
 * Reserved sentinel field name. A sort order using this field signals that the
 * list should be ordered to match the incoming `$ids` param rather than sorted
 * server-side, so the surrounding pane preserves the caller-provided ordering.
 *
 * @internal
 */
export const ORDER_BY_IDS_PARAM_FIELD = '__orderByIdsParam'

/**
 * @internal
 */
export const ORDER_BY_IDS_PARAM_SORT_ORDER: SortOrder = {
  by: [{field: ORDER_BY_IDS_PARAM_FIELD, direction: 'asc'}],
}

/**
 * @internal
 */
export function isOrderByIdsParam(sortOrder?: {by?: readonly {field: string}[]}): boolean {
  return sortOrder?.by?.length === 1 && sortOrder.by[0].field === ORDER_BY_IDS_PARAM_FIELD
}

/**
 * Reorders the list items to match the order of the provided published ids.
 * Items whose published id is absent from `ids` are appended after the matched
 * items, preserving the server-returned order amongst themselves.
 *
 * @internal
 */
export function reorderItemsByIdsParam(
  items: DocumentListPaneItem[],
  ids: string[],
): DocumentListPaneItem[] {
  const indexById = ids.reduce<Map<string, number>>((accumulatedIndex, id, index) => {
    if (!accumulatedIndex.has(id)) {
      accumulatedIndex.set(id, index)
    }
    return accumulatedIndex
  }, new Map())

  const positionOf = (item: DocumentListPaneItem): number => {
    const matchedIndex = indexById.get(getPublishedId(item._id))
    return matchedIndex === undefined ? Number.MAX_SAFE_INTEGER : matchedIndex
  }

  return items
    .map((item, originalIndex) => ({item, originalIndex}))
    .sort((first, second) => {
      const positionDifference = positionOf(first.item) - positionOf(second.item)
      if (positionDifference !== 0) return positionDifference
      return first.originalIndex - second.originalIndex
    })
    .map((entry) => entry.item)
}
