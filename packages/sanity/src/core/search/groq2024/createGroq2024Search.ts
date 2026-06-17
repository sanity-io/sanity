import {getPublishedId} from '@sanity/client/csm'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type CrossDatasetType, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {map, mergeMap, type Observable} from 'rxjs'

import {deriveReferenceSearchSpecs} from '../common/deriveReferenceSearchSpecs'
import {
  type Groq2024SearchResults,
  type SearchStrategyFactory,
  type SearchTerms,
} from '../common/types'
import {createReferenceResolveQuery} from './createReferenceResolveQuery'
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

    const rawQuery = typeof searchParams === 'string' ? searchParams : searchParams.query

    // Phase-one reference resolution is skipped when there is no term or no
    // reference-traversing preview path, leaving the query identical to a plain search.
    const referenceSpecs = searchTerms.types.flatMap((schemaType) =>
      deriveReferenceSearchSpecs({
        schemaType,
        maxDepth: mergedOptions.maxDepth || DEFAULT_MAX_FIELD_DEPTH,
      }),
    )
    const maxReferenceWeight = referenceSpecs.reduce(
      (highest, spec) => Math.max(highest, spec.weight),
      0,
    )

    const runMainSearch = (referenceIds?: string[]): Observable<Groq2024SearchResults> => {
      const {query, params, options, sortOrder, compiledSortEntries} = createSearchQuery(
        searchTerms,
        searchParams,
        mergedOptions,
        {referenceIds, referenceWeight: maxReferenceWeight},
      )

      return client.observable.fetch<SanityDocumentLike[]>(query, params, options).pipe(
        map((hits) => {
          const hasNextPage =
            typeof searchOptions.limit !== 'undefined' && hits.length > searchOptions.limit

          // Search overfetches by 1 to determine whether there is another page to fetch. Therefore,
          // the penultimate result must be used to determine the start of the next page.
          const lastResult = hasNextPage ? hits.at(-2) : hits.at(-1)

          return {
            type: 'groq2024' as const,
            // Search overfetches by 1 to determine whether there is another page to fetch. Therefore,
            // exclude the final result if it's beyond the limit.
            hits: hits.map((hit) => ({hit})).slice(0, searchOptions.limit),
            nextCursor: hasNextPage
              ? getNextCursor({lastResult, sortOrder, compiledSortEntries})
              : undefined,
          }
        }),
      )
    }

    const resolveQuery = rawQuery
      ? createReferenceResolveQuery(referenceSpecs, rawQuery)
      : undefined

    if (resolveQuery === undefined) {
      return runMainSearch()
    }

    return client.observable
      .fetch<string[]>(resolveQuery.query, resolveQuery.params, {
        tag: mergedOptions.tag,
        perspective: mergedOptions.perspective,
      })
      .pipe(
        mergeMap((resolvedIds) => {
          // References always point at the published id, so normalise resolved
          // (possibly draft/version) ids before matching with `references()`.
          const publishedIds = Array.from(
            new Set(
              (resolvedIds ?? [])
                .filter((resolvedId): resolvedId is string => typeof resolvedId === 'string')
                .map((resolvedId) => getPublishedId(resolvedId)),
            ),
          )
          return runMainSearch(publishedIds.length > 0 ? publishedIds : undefined)
        }),
      )
  }
}
