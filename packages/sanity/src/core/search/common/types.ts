import {type ClientPerspective, type SanityClient} from '@sanity/client'
import {
  type CrossDatasetType,
  type SanityDocumentLike,
  type SchemaType,
  type SearchStrategy,
} from '@sanity/types'
import {type Observable} from 'rxjs'

/**
 * The top-level projection key under which schema-resolved sort
 * expressions are exposed in search results. Sort values are
 * projected as an array at `orderings`, indexed by
 * `SearchSort.projectionIndex`.
 *
 * @internal
 */
export const ORDERINGS_PROJECTION_KEY = 'orderings'

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
  hit: SanityDocumentLike & {_originalId: string}
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
  maxDepth?: number
  comments?: string[]
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
  /**
   * The path/expression as authored by the developer (e.g.
   * `arrayOfReferences[0].favoriteBooks[0].title`). Used for stable
   * serialization (settings storage, listen-query SWR keys, etc.).
   * The projected value in result data is addressed via
   * `result.orderings[projectionIndex]`.
   */
  field: string
  /**
   * The schema type that this sort `field` is authored against. The
   * search strategy uses this to resolve the GROQ expression for
   * `field` (e.g. inserting `->` for reference traversals).
   *
   * Required when `field` traverses references, accesses arrays,
   * or otherwise depends on schema-aware compilation. Optional for
   * trivial fields like `_id` / `_createdAt` / `title`, where the
   * `field` value works as a literal GROQ expression.
   */
  schemaType?: SchemaType | CrossDatasetType
  /**
   * Index into the `orderings` projection array at which this
   * entry's value lives in the result. The projected value is
   * available at `result.orderings[projectionIndex]`.
   *
   * Populated by the search strategy after `compileSortExpression`
   * runs — not a caller-facing input. Direct callers of the search
   * strategy should leave this unset.
   */
  projectionIndex?: number
  mapWith?: string
  /**
   * Controls whether null/undefined values appear first or last in the sort order.
   *
   * Defaults match PostgreSQL behavior:
   * - `'desc'` direction → nulls first
   * - `'asc'` direction → nulls last
   *
   * **Note:** Overriding the default may have performance implications for document types
   * with lots of documents.
   */
  nulls?: 'first' | 'last'
}
