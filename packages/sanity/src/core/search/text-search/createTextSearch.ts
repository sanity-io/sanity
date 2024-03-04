import {type SanityDocumentLike} from '@sanity/types'
import {map} from 'rxjs/operators'

import {removeDupes} from '../../util/draftUtils'
import {
  type SearchableType,
  type SearchStrategyFactory,
  type SearchTerms,
  type TextSearchParams,
  type TextSearchResponse,
  type TextSearchResults,
} from '../common'

const DEFAULT_LIMIT = 20

function normalizeSearchTerms(searchParams: string | SearchTerms, fallbackTypes: SearchableType[]) {
  if (typeof searchParams === 'string') {
    return {
      query: searchParams,
      types: fallbackTypes,
    }
  }

  return {
    ...searchParams,
    types: searchParams.types.length ? searchParams.types : fallbackTypes,
  }
}

/**
 * @internal
 */
export const createTextSearch: SearchStrategyFactory<TextSearchResults> = (
  typesFromFactory,
  client,
  factoryOptions,
) => {
  // Search currently supports both strings (reference + cross dataset reference inputs)
  // or a SearchTerms object (omnisearch).
  return function search(searchParams, searchOptions = {}) {
    const searchTerms = normalizeSearchTerms(searchParams, typesFromFactory)

    // Construct search filters used in this GROQ query
    const filters = [
      '_type in $__types',
      searchOptions.includeDrafts === false && "!(_id in path('drafts.**'))",
      factoryOptions.filter ? `(${factoryOptions.filter})` : false,
      searchTerms.filter ? `(${searchTerms.filter})` : false,
    ].filter((baseFilter): baseFilter is string => Boolean(baseFilter))

    const textSearchParams: TextSearchParams = {
      query: {string: searchTerms.query},
      filter: filters.join(' && '),
      params: {
        __types: searchTerms.types.map((type) => type.name),
        ...factoryOptions.params,
        ...searchTerms.params,
      },
      includeAttributes: ['_id', '_type'],
      fromCursor: searchOptions.cursor,
      limit: searchOptions.limit ?? DEFAULT_LIMIT,
    }

    return client.observable
      .request<TextSearchResponse<SanityDocumentLike>>({
        uri: `/data/textsearch/${client.config().dataset}`,
        method: 'POST',
        json: true,
        body: textSearchParams,
      })
      .pipe(
        map((response) => {
          let documents = response.hits.map((hit) => hit.attributes)
          if (factoryOptions.unique) {
            documents = removeDupes(documents)
          }

          return {
            type: 'text',
            hits: documents.map((hit) => ({hit})),
            nextCursor: response.nextCursor,
          }
        }),
      )
  }
}
