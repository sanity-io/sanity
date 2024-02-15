import {type SanityDocument} from '@sanity/types'

type Primitive = string | number | boolean

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
  params?: Record<string, Primitive | Primitive[]>
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
}

export type TextSearchResponse = {
  ms: number
  stats: {
    estimatedTotalCount: number
  }
  hits: TextSearchHit[]
  nextCursor: string
}

export type TextSearchHit = {
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
  attributes: SanityDocument
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
