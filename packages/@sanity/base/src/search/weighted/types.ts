/**
 * @internal
 */
export interface SearchSpec {
  typeName: string
  paths: {weight: number; path: string}[]
}

/**
 * @internal
 */
export interface SearchHit {
  _type: string
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
  includeDrafts?: boolean
}
