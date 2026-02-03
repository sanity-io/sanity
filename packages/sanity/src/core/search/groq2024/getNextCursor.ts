import {type SanityDocumentLike} from '@sanity/types'

import {type SearchSort, type SortDirection} from '../common/types'

/**
 * @internal
 */
export function getNextCursor({
  lastResult,
  sortOrder,
}: {
  lastResult?: SanityDocumentLike
  sortOrder: SearchSort[]
}): string | undefined {
  if (!lastResult) {
    return undefined
  }

  const hasIdSort = sortOrder.some(({field}) => field === '_id')

  return (
    sortOrder
      // Content Lake always orders by `_id asc` as a tiebreaker.
      .concat(hasIdSort ? [] : {field: '_id', direction: 'asc'})
      .reduce<string | undefined>((cursor, sortEntry, index) => {
        const nextPredicate = sortOrder
          .slice(0, index)
          .map((previousSortEntry) => getCursorPredicate(previousSortEntry, lastResult, '=='))
          .concat(getCursorPredicate(sortEntry, lastResult))
          .filter((predicate) => typeof predicate !== 'undefined')
          .join(' && ')

        return [cursor, `(${nextPredicate})`]
          .filter((segment) => typeof segment !== 'undefined')
          .join(' || ')
      }, undefined)
  )
}

const sortComparators: Record<SortDirection, '>' | '<'> = {
  asc: '>',
  desc: '<',
}

/**
 * @internal
 */
export function getCursorPredicate(
  sort: SearchSort,
  lastEntry: SanityDocumentLike,
  comparator: '>' | '<' | '==' = sortComparators[sort.direction],
): string | undefined {
  if (sort.field == '_id' && comparator == '==') {
    return undefined
  }
  return [sort.field, comparator, JSON.stringify(lastEntry[sort.field])].join(' ')
}
