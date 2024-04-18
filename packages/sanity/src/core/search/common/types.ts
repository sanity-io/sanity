import {type SanityClient} from '@sanity/client'
import {type CrossDatasetType, type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {type Observable} from 'rxjs'

/**
 * @internal
 */
export interface SearchTerms<Type extends SchemaType | CrossDatasetType = SchemaType> {
  filter?: string
  params?: Record<string, unknown>
  query: string
  types: Type[]
}

/**
 * @internal
 */
export interface SearchPath {
  weight: number
  path: string
  mapWith?: string
}

/**
 * @internal
 */
export interface SearchSpec {
  typeName: string
  paths: SearchPath[]
}

/**
 * @internal
 */
export interface SearchStory {
  path: string
  score: number
  why: string
}

/**
 * @internal
 */
export interface SearchHit {
  hit: SanityDocumentLike
}

/**
 * @internal
 */
export interface WeightedHit extends SearchHit {
  resultIndex: number
  score: number
  stories: SearchStory[]
}

/**
 * @internal
 */
export interface SearchFactoryOptions {
  maxDepth?: number
  filter?: string
  params?: Record<string, unknown>
  tag?: string
  /* only return unique documents (e.g. not both draft and published) */
  unique?: boolean
  enableLegacySearch?: boolean
}

/**
 * @internal
 */
export interface TextSearchResults {
  type: 'text'
  hits: SearchHit[]
  nextCursor?: string
}

/**
 * @internal
 */
export interface WeightedSearchResults {
  type: 'weighted'
  hits: WeightedHit[]
  nextCursor?: never
}

/**
 * @internal
 */
export type SearchStrategyFactory<TResult extends TextSearchResults | WeightedSearchResults> = (
  types: (SchemaType | CrossDatasetType)[],
  client: SanityClient,
  commonOpts: SearchFactoryOptions,
) => (searchTerms: string | SearchTerms, searchOpts?: SearchOptions) => Observable<TResult>

/**
 * @internal
 */
export type SearchOptions = {
  __unstable_extendedProjection?: string
  maxDepth?: number
  comments?: string[]
  includeDrafts?: boolean
  skipSortByScore?: boolean
  sort?: SearchSort[]
  cursor?: string
  limit?: number
  isCrossDataset?: boolean
  queryType?: 'prefixLast' | 'prefixNone'
}

/**
 * @internal
 */
export type SortDirection = 'asc' | 'desc'

/**
 * @internal
 */
export type SearchSort = {
  direction: SortDirection
  field: string
  mapWith?: string
}

/**
 * @internal
 */
export interface TextSearchDocumentTypeConfiguration {
  weights?: Record<string, number>
}

/**
 * @internal
 */
export interface TextSearchOrder {
  attribute: string
  direction: SortDirection
}

export type TextSearchParams = {
  query: {
    string: string
  }
  /**
   * A GROQ filter expression you can use to limit the scope of the search.
   * See https://www.sanity.io/docs/query-cheat-sheet for tips.
   *
   * Example:
   *
   * ```
   * "_type in ['book', 'author'] && select(_type == 'book' => publishedAt != null, true)"
   * ```
   */
  filter?: string
  /**
   * Parameters for the GROQ filter expression.
   */
  params?: Record<string, unknown>
  /**
   * A list of document paths to include in the response. If not provided, all
   * attributes are returned.
   *
   * Example:
   *
   * ```
   * ["title", "author.name", "skus[]._ref", "skus[]._type"]
   * ```
   *
   */
  includeAttributes?: string[]
  /**
   * The number of results to return. See API documentation for default value.
   */
  limit?: number
  /**
   * The cursor to start from. This is returned in the `nextCursor` field of the
   * response, if there are more results than the `limit` parameter. Use this
   * parameter to paginate, keeping the query the same, but changing the cursor.
   */
  fromCursor?: string
  /**
   * Configuration for individual document types.
   */
  types?: Record<string, TextSearchDocumentTypeConfiguration>
  /**
   * Result ordering.
   */
  order?: TextSearchOrder[]
}

export type TextSearchResponse<Attributes = Record<string, unknown>> = {
  ms: number
  stats: {
    estimatedTotalCount: number
  }
  hits: TextSearchHit<Attributes>[]
  nextCursor: string
}

export type TextSearchHit<Attributes = Record<string, unknown>> = {
  /**
   * The document ID
   */
  id: string
  rankingInfo: {
    matchScore: number
  }
  /**
   * The document attributes, limited to `includeAttributes` list if provided in
   * the query.
   */
  attributes: Attributes
  /**
   * The highlights are a map of document paths to SearchResultHighlight
   * objects. This tells you which field matched the query.
   */
  highlights: Record<string, TextSearchHighlight>
}

export type TextSearchHighlight = {
  value: string
  matchLevel: 'full' | 'partial'
  matchedWords: string[]
}
