import {type CrossDatasetType, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {map} from 'rxjs'

import {
  type Groq2024SearchResults,
  type SearchSort,
  type SearchStrategyFactory,
  type SearchTerms,
  type SortDirection,
} from '../common/types'
import {createSearchQuery} from './createSearchQuery'

function getSearchTerms(
  searchParams: string | SearchTerms,
  types: (SchemaType | CrossDatasetType)[],
) {
  if (typeof searchParams === 'string') {
    return {
      query: searchParams,
      types: types,
    }
  }
  return searchParams.types.length ? searchParams : {...searchParams, types}
}

/**
 * @internal
 */
export const createGroq2024Search: SearchStrategyFactory<Groq2024SearchResults> = (
  typesFromFactory,
  client,
  factoryOptions,
) => {
  return function search(searchParams, searchOptions = {}) {
    const searchTerms = getSearchTerms(searchParams, typesFromFactory)

    const mergedOptions = {
      ...factoryOptions,
      ...searchOptions,
    }

    const {query, params, options, sortOrder} = createSearchQuery(
      searchTerms,
      searchParams,
      mergedOptions,
    )

    return client.observable
      .withConfig({
        // TODO: Use stable API version.
        apiVersion: 'vX',
      })
      .fetch<SanityDocumentLike[]>(query, params, options)
      .pipe(
        map((hits) => {
          const hasNextPage =
            typeof searchOptions.limit !== 'undefined' && hits.length > searchOptions.limit

          // Search overfetches by 1 to determine whether there is another page to fetch. Therefore,
          // the penultimate result must be used to determine the start of the next page.
          const lastResult = hasNextPage ? hits.at(-2) : hits.at(-1)

          return {
            type: 'groq2024',
            // Search overfetches by 1 to determine whether there is another page to fetch. Therefore,
            // exclude the final result if it's beyond the limit.
            hits: hits.map((hit) => ({hit})).slice(0, searchOptions.limit),
            nextCursor: hasNextPage ? getNextCursor({lastResult, sortOrder}) : undefined,
          }
        }),
      )
  }
}

function getNextCursor({
  lastResult,
  sortOrder,
}: {
  lastResult?: SanityDocumentLike
  sortOrder: SearchSort[]
}): string | undefined {
  if (!lastResult) {
    return undefined
  }

  return (
    sortOrder
      // Content Lake always orders by `_id asc` as a tiebreaker.
      .concat({field: '_id', direction: 'asc'})
      .reduce<string | undefined>((cursor, sortEntry, index) => {
        const nextPredicate = sortOrder
          .slice(0, index)
          .map((previousSortEntry) => getCursorPredicate(previousSortEntry, lastResult, '=='))
          .concat(getCursorPredicate(sortEntry, lastResult))
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

function getCursorPredicate(
  sort: SearchSort,
  lastEntry: SanityDocumentLike,
  comparator: '>' | '<' | '==' = sortComparators[sort.direction],
): string {
  return [sort.field, comparator, JSON.stringify(lastEntry[sort.field])].join(' ')
}
