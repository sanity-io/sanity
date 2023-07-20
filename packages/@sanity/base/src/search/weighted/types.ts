import {ExperimentalSearchPath} from '@sanity/types'

/**
 * @internal
 */
export interface SearchTerms {
  query: string
  types: SearchableType[]
}

/**
 * @internal
 */
export interface SearchableType {
  name: string
  title?: string
  // eslint-disable-next-line camelcase
  __experimental_search: ExperimentalSearchPath[]
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
  skippedPaths: SearchPath[]
}

/**
 * @internal
 */
export interface SearchHit {
  _type: string
  _id: string
  [key: string]: string
}

/**
 * @internal
 */
export interface SearchStory {
  indices?: number[]
  path: string
  score: number
  why: string
}

/**
 * @alpha
 */
export interface WeightedHit {
  hit: SearchHit
  resultIndex: number
  score: number
  stories: SearchStory[]
}

/**
 * @alpha
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
export interface SearchOptions {
  comments?: string[]
  includeDrafts?: boolean
  limit?: number
  offset?: number
  skipSortByScore?: boolean
  sort?: SearchSort
}

export type SortDirection = 'asc' | 'desc'

export type SearchSort = {
  direction: SortDirection
  field: string
}
