import {type CrossDatasetType, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {map} from 'rxjs'

import {
  type Groq2024SearchResults,
  type SearchStrategyFactory,
  type SearchTerms,
} from '../common/types'
import {createSearchQuery} from './createSearchQuery'
import {getNextCursor} from './getNextCursor'

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
 * Note: When using the `raw` persepctive, `groq2024` may emit uncollated documents, manifesting as
 * duplicate search results. Consumers must collate the results.
 *
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
        // The GROQ functions that power `groq2024` are currently only available using API `vX`.
        // TODO: Switch to stable API version before `groq2024` general availability.
        // TODO: When moving to stable API version, consider that the version should work with releases.
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
