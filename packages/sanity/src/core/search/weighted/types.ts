import {type SanityClient} from '@sanity/client'
import {type ObjectSchemaType, type SearchStrategy} from '@sanity/types'
import {type Observable} from 'rxjs'

/**
 * @internal
 */
export interface SearchTerms {
  filter?: string
  query: string
  types: SearchableType[]
}

/**
 * @internal
 */
export interface SearchableType {
  name: string
  title?: string
  __experimental_search: ObjectSchemaType['__experimental_search']
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
  paths?: SearchPath[]
}

/**
 * @internal
 */
export interface SearchHit {
  _type: string
  _id: string
  [key: string]: unknown
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
export interface WeightedHit {
  hit: SearchHit
  resultIndex: number
  score: number
  stories: SearchStory[]
}

/**
 * @internal
 */
export interface WeightedSearchOptions {
  filter?: string
  params?: Record<string, unknown>
  tag?: string
  /* only return unique documents (e.g. not both draft and published) */
  unique?: boolean
}

/**
 * @internal
 */
export interface TextSearchResultCollection {
  strategy: 'text'
  hits: Observable<
    {
      hit: SearchHit
    }[]
  >
  nextCursor?: string
}

/**
 * @internal
 */
export interface WeightedSearchResultCollection {
  strategy: 'weighted'
  hits: Observable<WeightedHit[]>
  nextCursor?: never
}

/**
 * @internal
 */
export type SearchResultCollection = TextSearchResultCollection | WeightedSearchResultCollection

/**
 * @internal
 */
export type SearchStrategyFactory<Result extends SearchResultCollection = SearchResultCollection> =
  (
    types: SearchableType[],
    client: SanityClient,
    commonOpts: WeightedSearchOptions & {
      strategy: SearchStrategy
    },
  ) => (searchTerms: string | SearchTerms, searchOpts?: SearchOptions) => Observable<Result>

/**
 * @internal
 */
export interface OffsetPaginationOptions {
  limit?: number
  offset?: number
  cursor?: never
}

/**
 * @internal
 */
export interface CursorPaginationOptions {
  limit?: number
  cursor?: string
  offset?: never
}

/**
 * @internal
 */
export type SearchPaginationOptions = OffsetPaginationOptions | CursorPaginationOptions

/**
 * @internal
 */
export type SearchOptions = SearchPaginationOptions & {
  __unstable_extendedProjection?: string
  comments?: string[]
  includeDrafts?: boolean
  skipSortByScore?: boolean
  sort?: SearchSort[]
  cursor?: string
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
