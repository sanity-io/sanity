import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type CrossDatasetType, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {map} from 'rxjs/operators'

import {
  isReleasePerspective,
  RELEASES_STUDIO_CLIENT_OPTIONS,
} from '../../releases/util/releasesClient'
import {versionedClient} from '../../studioClient'
import {removeDupes} from '../../util/draftUtils'
import {
  deriveSearchWeightsFromType,
  isPerspectiveRaw,
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
import {prefixLast} from '../common/token'

const DEFAULT_LIMIT = 1000

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
  const isRaw = isPerspectiveRaw(perspective)
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
      // Versions are collated server-side using the `perspective` option. Therefore, they
      // must not be fetched individually.
      // This should only be added if the search needs to be narrow to the perspective
      isRaw ? '' : '!(_id in path("versions.**"))',
    ].filter((baseFilter): baseFilter is string => Boolean(baseFilter))

    const textSearchParams: TextSearchParams = {
      perspective: isRaw ? undefined : searchOptions.perspective,
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
      includeAttributes: ['_id', '_type'],
      fromCursor: searchOptions.cursor,
      limit: searchOptions.limit ?? DEFAULT_LIMIT,
    }
    const apiVersion = isReleasePerspective(searchOptions.perspective)
      ? RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion
      : undefined

    return versionedClient(client, apiVersion)
      .observable.request<TextSearchResponse<SanityDocumentLike>>({
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
