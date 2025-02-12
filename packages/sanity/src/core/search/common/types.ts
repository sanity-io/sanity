import {type ClientPerspective, type SanityClient} from '@sanity/client'
import {
  type CrossDatasetType,
  type SanityDocumentLike,
  type SchemaType,
  type SearchStrategy,
} from '@sanity/types'
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
  strategy?: SearchStrategy
  perspective?: ClientPerspective
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
export interface Groq2024SearchResults {
  type: 'groq2024'
  hits: SearchHit[]
  nextCursor?: string
}

/**
 * @internal
 */
export type SearchStrategyFactory<TResult extends WeightedSearchResults | Groq2024SearchResults> = (
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
  perspective?: ClientPerspective
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
