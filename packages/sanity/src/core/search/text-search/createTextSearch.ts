import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type CrossDatasetType, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {map} from 'rxjs/operators'

import {removeDupes} from '../../util/draftUtils'
import {
  deriveSearchWeightsFromType,
  type SearchOptions,
  type SearchPath,
  type SearchSort,
  type SearchStrategyFactory,
  type SearchTerms,
  type TextSearchDocumentTypeConfiguration,
  type TextSearchOrder,
  type TextSearchParams,
  type TextSearchResponse,
  type TextSearchResults,
} from '../common'

const DEFAULT_LIMIT = 1000
const WILDCARD_TOKEN = '*'
const NEGATION_TOKEN = '-'
const TOKEN_REGEX = /(?:[^\s"]+|"[^"]*")+/g

function normalizeSearchTerms(
  searchParams: string | SearchTerms,
  fallbackTypes: (SchemaType | CrossDatasetType)[],
) {
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

function optimizeSearchWeights(paths: SearchPath[]): SearchPath[] {
  return paths.filter((path) => path.weight !== 1)
}

export function getDocumentTypeConfiguration(
  searchOptions: SearchOptions,
  searchTerms: ReturnType<typeof normalizeSearchTerms>,
): Record<string, TextSearchDocumentTypeConfiguration> {
  const specs = searchTerms.types
    .map((schemaType) =>
      deriveSearchWeightsFromType({
        schemaType,
        maxDepth: searchOptions.maxDepth || DEFAULT_MAX_FIELD_DEPTH,
        processPaths: optimizeSearchWeights,
      }),
    )
    .filter(({paths}) => paths.length)

  return specs.reduce<Record<string, TextSearchDocumentTypeConfiguration>>((nextTypes, spec) => {
    return {
      ...nextTypes,
      [spec.typeName]: spec.paths.reduce<TextSearchDocumentTypeConfiguration>(
        (nextType, {path, weight}) => {
          return {
            ...nextType,
            weights: {
              ...nextType.weights,
              [path]: weight,
            },
          }
        },
        {},
      ),
    }
  }, {})
}

export function getOrder(sort: SearchSort[] = []): TextSearchOrder[] {
  return sort.map<TextSearchOrder>(
    ({field, direction}) => ({
      attribute: field,
      direction,
    }),
    {},
  )
}

export function isNegationToken(token: string | undefined): boolean {
  return typeof token !== 'undefined' && token.trim().at(0) === NEGATION_TOKEN
}

export function isPrefixToken(token: string | undefined): boolean {
  return typeof token !== 'undefined' && token.trim().at(-1) === WILDCARD_TOKEN
}

export function prefixLast(query: string): string {
  const tokens = (query.match(TOKEN_REGEX) ?? []).map((token) => token.trim())
  const finalNonNegationTokenIndex = tokens.findLastIndex((token) => !isNegationToken(token))
  const finalNonNegationToken = tokens[finalNonNegationTokenIndex]

  if (tokens.length === 0) {
    return WILDCARD_TOKEN
  }

  if (isPrefixToken(finalNonNegationToken) || typeof finalNonNegationToken === 'undefined') {
    return tokens.join(' ')
  }

  const prefixedTokens = [...tokens]
  prefixedTokens.splice(finalNonNegationTokenIndex, 1, `${finalNonNegationToken}${WILDCARD_TOKEN}`)
  return prefixedTokens.join(' ')
}

export function getQueryString(
  query: string,
  {queryType = 'prefixLast'}: Pick<SearchOptions, 'queryType'>,
): string {
  if (queryType === 'prefixLast') {
    return prefixLast(query)
  }

  return query
}

/**
 * @internal
 */
export const createTextSearch: SearchStrategyFactory<TextSearchResults> = (
  typesFromFactory,
  client,
  factoryOptions,
) => {
  const {perspective} = factoryOptions
  const isRaw = perspective === 'raw'

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
      // Versions are collated server-side using the `bundlePerspective` option. Therefore, they
      // must not be fetched individually.
      // This should only be added if the search needs to be narrow to the perspective
      isRaw ? '' : '!(_id in path("versions.**"))',
    ].filter((baseFilter): baseFilter is string => Boolean(baseFilter))

    const textSearchParams: TextSearchParams = {
      perspective: isRaw ? undefined : searchOptions.perspective,
      bundlePerspective: isRaw ? undefined : searchOptions.bundlePerspective,
      query: {
        string: getQueryString(searchTerms.query, searchOptions),
      },
      filter: filters.join(' && '),
      params: {
        __types: searchTerms.types.map((type) => ('name' in type ? type.name : type.type)),
        ...factoryOptions.params,
        ...searchTerms.params,
      },
      types: getDocumentTypeConfiguration(searchOptions, searchTerms),
      ...(searchOptions.sort ? {order: getOrder(searchOptions.sort)} : {}),
      // Note: Text Search API does not currently expose fields containing an empty object, so
      // we're not yet able to retrieve `_version` here.
      includeAttributes: ['_id', '_type', '_version'],
      fromCursor: searchOptions.cursor,
      limit: searchOptions.limit ?? DEFAULT_LIMIT,
    }

    return client.observable
      .request<TextSearchResponse<SanityDocumentLike>>({
        uri: `/data/textsearch/${client.config().dataset}`,
        method: 'POST',
        json: true,
        body: textSearchParams,
        tag: factoryOptions.tag,
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
