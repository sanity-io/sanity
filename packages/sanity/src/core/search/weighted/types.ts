import type {ObjectSchemaType} from '@sanity/types'

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
export interface SearchOptions {
  comments?: string[]
  includeDrafts?: boolean
  limit?: number
  offset?: number
  skipSortByScore?: boolean
  sort?: SearchSort
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
}
