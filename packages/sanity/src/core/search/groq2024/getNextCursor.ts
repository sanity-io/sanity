import {type SanityDocumentLike} from '@sanity/types'

import {type CompiledSortEntry} from '../common/compileSortExpression'
import {ORDERINGS_PROJECTION_KEY, type SearchSort, type SortDirection} from '../common/types'

/**
 * Builds the GROQ cursor predicate that selects documents past the
 * last result of the previous page.
 *
 * The cursor predicate runs against **source documents** in the next
 * query (it's used as a filter, not an `order(...)` argument), so
 * the comparator's left-hand side must be the schema-resolved GROQ
 * expression (e.g. `author->name`), not the projection target
 * (`orderings[0]`). The right-hand side is read from the
 * **projected** last result at
 * `lastResult.orderings[<projectionIndex>]`.
 *
 * `compiledSortEntries`, when provided, is the array of
 * `{ expression, projectionIndex }` returned by
 * `compileSortExpression` for the same sort order. When omitted
 * (direct callers / tests), the function falls back to treating
 * each sort entry's `field` as both the GROQ predicate target and
 * the result-reading key.
 *
 * @internal
 */
export function getNextCursor({
  lastResult,
  sortOrder,
  compiledSortEntries,
}: {
  lastResult?: SanityDocumentLike
  sortOrder: SearchSort[]
  compiledSortEntries?: CompiledSortEntry[]
}): string | undefined {
  if (!lastResult) {
    return undefined
  }

  const hasIdSort = sortOrder.some(({field}) => field === '_id')

  const fullSortOrder: SearchSort[] = hasIdSort
    ? sortOrder
    : sortOrder.concat({field: '_id', direction: 'asc'})

  return fullSortOrder.reduce<string | undefined>((cursor, sortEntry, index) => {
    const nextPredicate = fullSortOrder
      .slice(0, index)
      .map((previousSortEntry, previousIndex) =>
        getCursorPredicate(
          previousSortEntry,
          lastResult,
          '==',
          compiledSortEntries?.[previousIndex],
        ),
      )
      .concat(getCursorPredicate(sortEntry, lastResult, undefined, compiledSortEntries?.[index]))
      .filter((predicate) => typeof predicate !== 'undefined')
      .join(' && ')

    return [cursor, `(${nextPredicate})`]
      .filter((segment) => typeof segment !== 'undefined')
      .join(' || ')
  }, undefined)
}

const sortComparators: Record<SortDirection, '>' | '<'> = {
  asc: '>',
  desc: '<',
}

/**
 * @internal
 *
 * Builds a single comparator predicate for the cursor. The predicate
 * targets the source-document value (via the compiled `expression`),
 * compared against the projected last-result value.
 *
 * When a `compiled` entry is provided, the source-document target is
 * `compiled.expression` and the result-side value is read from
 * `lastEntry.orderings[compiled.projectionIndex]`. When `compiled`
 * is omitted (e.g. the implicit `_id` tiebreaker, or older
 * callers), the predicate falls back to using `sort.field` for
 * both sides.
 */
export function getCursorPredicate(
  sort: SearchSort,
  lastEntry: SanityDocumentLike,
  comparator: '>' | '<' | '==' = sortComparators[sort.direction],
  compiled?: CompiledSortEntry,
): string | undefined {
  if (sort.field === '_id' && comparator === '==') {
    return undefined
  }

  if (compiled) {
    const value = readOrderingsValue(lastEntry, compiled.projectionIndex)
    return [compiled.expression, comparator, JSON.stringify(value)].join(' ')
  }

  // Fallback for entries without a precomputed compiled value (e.g.
  // the implicit `_id` tiebreaker). The `field` doubles as both the
  // GROQ predicate target and the result-reading key.
  const value = (lastEntry as Record<string, unknown>)[sort.field]
  return [sort.field, comparator, JSON.stringify(value)].join(' ')
}

/**
 * Read a projected sort value from the last result at
 * `lastEntry.orderings[projectionIndex]`.
 */
function readOrderingsValue(lastEntry: SanityDocumentLike, projectionIndex: number): unknown {
  const orderings = (lastEntry as Record<string, unknown>)[ORDERINGS_PROJECTION_KEY]
  if (!Array.isArray(orderings)) {
    return undefined
  }
  return orderings[projectionIndex]
}
