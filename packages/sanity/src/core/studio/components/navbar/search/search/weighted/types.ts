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

export interface SearchOptions {
  includeDrafts?: boolean
  limit?: number
}
