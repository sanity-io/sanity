import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {sortBy} from 'lodash'
import {type Observable} from 'rxjs'
import {map, tap} from 'rxjs/operators'

import {removeDupes} from '../../util/draftUtils'
import {type TextSearchResponse} from '../text-search'
import {calculateScore} from '../weighted/applyWeights'
import {extractTermsFromQuery} from '../weighted/createSearchQuery'
import {
  type SearchableType,
  type SearchOptions,
  type SearchTerms,
  type WeightedSearchOptions,
} from '../weighted/types'

function getSearchTerms(searchParams: string | SearchTerms, types: SearchableType[]) {
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
export function createHybridSearch(
  types: SearchableType[],
  client: SanityClient,
  commonOpts: WeightedSearchOptions = {},
): (
  searchTerms: string | SearchTerms,
  searchOpts?: SearchOptions,
) => Observable<{hit: SanityDocument}[]> {
  // Search currently supports both strings (reference + cross dataset reference inputs)
  // or a SearchTerms object (omnisearch).
  return function search(searchParams, searchOpts = {}) {
    const searchTerms = getSearchTerms(searchParams, types)

    // const attributePaths = Array.from(
    //   new Set(
    //     types.flatMap((type) =>
    //       type.__experimental_search.map((config) =>
    //         // TODO: update `joinPath` implementation to default to `[]` paths
    //         joinPath(config.path.map((p) => (typeof p === 'number' ? [] : p))),
    //       ),
    //     ),
    //   ),
    // )

    const filters = [
      '_type in $__types',
      searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
      searchTerms.filter ? `(${searchTerms.filter})` : false,
    ].filter((baseFilter): baseFilter is string => Boolean(baseFilter))

    const terms = extractTermsFromQuery(searchTerms.query)

    const searchRequest = client.observable.request<TextSearchResponse>({
      uri: `/data/textsearch/${client.config().dataset}`,
      method: 'POST',
      json: true,
      body: {
        query: {string: terms.join(' ')},
        filter: filters.join(' && '),
        params: {
          __types: searchTerms.types.map((type) => type.name),
        },
        // // TODO: this currently causes the backend to 500
        // includeAttributes: attributePaths,
        limit: 1000,
      },
    })

    return searchRequest.pipe(
      map((i) => i.hits.map((hit) => hit.attributes)),
      commonOpts.unique ? map(removeDupes) : tap(),
      map((documents) => applyWeights({types, documents, terms})),
      map((hits) => sortBy(hits, ({hit}) => -hit.score)),
    )
  }
}

interface Options {
  types: SearchableType[]
  documents: SanityDocument[]
  terms: string[]
}

function getPtText(
  ptData: Array<{_type: 'block'; children: Array<{_type: 'span'; text: string}>}>,
) {
  return ptData
    .flatMap((block) =>
      block._type === 'block'
        ? block.children.flatMap((child) => (child._type === 'span' ? [child.text] : []))
        : [],
    )
    .join(' ')
}

function applyWeights({documents, terms, types}: Options) {
  const typesByName = types.reduce<Record<string, SearchableType>>((acc, next) => {
    acc[next.name] = next
    return acc
  }, {})

  function getValues(value: unknown, [current, ...rest]: (string | number | [])[]): unknown[] {
    if (typeof current === 'undefined') return [value]
    if (typeof value !== 'object') return []
    if (!value) return []
    if (Array.isArray(current)) {
      if (!Array.isArray(value)) return []
      return value.flatMap((nestedValue) => getValues(nestedValue, rest))
    }
    if (current in value) return getValues(value[current as keyof typeof value], rest)
    return []
  }

  return documents
    .map((doc) => ({
      ...doc,
      score: typesByName[doc._type].__experimental_search
        .map(({path, weight, mapWith}) => {
          let values = getValues(doc, path)

          switch (mapWith) {
            case undefined: {
              break
            }
            case 'pt::text': {
              values = [getPtText(values as any)]
              break
            }
            case 'lower': {
              values = values.map((value) =>
                typeof value === 'string' ? value.toLowerCase() : value,
              )
              break
            }
            case 'upper': {
              values = values.map((value) =>
                typeof value === 'string' ? value.toUpperCase() : value,
              )
              break
            }
            default: {
              throw new Error(`${mapWith}() not supported`)
            }
          }

          const score = calculateScore(
            terms,
            values.filter((value): value is string => typeof value === 'string').join(' '),
          )[0]

          return score * weight
        })
        .reduce((sum, next) => sum + next, 0),
    }))
    .map((x) => ({hit: x}))
}
