import {compact, toLower, trim, uniq, words} from 'lodash'

import {joinPath} from '../../../core/util/searchUtils'
import {tokenize} from '../common/tokenize'
import {
  type SearchableType,
  type SearchOptions,
  type SearchTerms,
  type WeightedSearchOptions,
} from '../weighted/types'

export interface SearchParams {
  __types: string[]
}

export interface SearchQuery {
  filters: string[]
  params: SearchParams
}

export const DEFAULT_LIMIT = 1000

/**
 * Create an object containing all available document types and weighted paths, used to construct a GROQ query for search.
 * System fields `_id` and `_type` are included by default.
 *
 * If `optimizeIndexPaths` is true, this will will convert all `__experimental_search` paths containing numbers
 * into array syntax. E.g. ['cover', 0, 'cards', 0, 'title'] =\> "cover[].cards[].title"
 *
 * This optimization will yield more search results than may be intended, but offers better performance over arrays with indices.
 * (which are currently unoptimizable by Content Lake)
 */
function createSearchSpecs(types: SearchableType[], optimizeIndexedPaths: boolean) {
  let hasIndexedPaths = false

  const specs = types.map((type) => ({
    typeName: type.name,
    paths: type.__experimental_search.map((config) => {
      const path = config.path.map((p) => {
        if (typeof p === 'number') {
          hasIndexedPaths = true
          if (optimizeIndexedPaths) {
            return [] as []
          }
        }
        return p
      })
      return {
        weight: config.weight,
        path: joinPath(path),
        mapWith: config.mapWith,
      }
    }),
  }))
  return {
    specs,
    hasIndexedPaths,
  }
}

// const pathWithMapper = ({mapWith, path}: SearchPath): string =>
//   mapWith ? `${mapWith}(${path})` : path

/**
 * Convert a string into an array of tokenized terms.
 *
 * Any (multi word) text wrapped in double quotes will be treated as "phrases", or separate tokens that
 * will not have its special characters removed.
 * E.g.`"the" "fantastic mr" fox fox book` =\> ["the", `"fantastic mr"`, "fox", "book"]
 *
 * Phrases wrapped in quotes are assigned relevance scoring differently from regular words.
 *
 * @internal
 */
export function extractTermsFromQuery(query: string): string[] {
  const quotedQueries = [] as string[]
  const unquotedQuery = query.replace(/("[^"]*")/g, (match) => {
    if (words(match).length > 1) {
      quotedQueries.push(match)
      return ''
    }
    return match
  })

  // Lowercase and trim quoted queries
  const quotedTerms = quotedQueries.map((str) => trim(toLower(str)))

  /**
   * Convert (remaining) search query into an array of deduped, sanitized tokens.
   * All white space and special characters are removed.
   * e.g. "The saint of Saint-Germain-des-Prés" =\> ['the', 'saint', 'of', 'germain', 'des', 'pres']
   */
  const remainingTerms = uniq(compact(tokenize(toLower(unquotedQuery))))

  return [...quotedTerms, ...remainingTerms]
}

/**
 * @internal
 */
export function createSearchQuery(
  searchTerms: SearchTerms,
  searchOpts: SearchOptions & WeightedSearchOptions = {},
): SearchQuery {
  const {filter, params} = searchOpts

  /**
   * First pass: create initial search specs and determine if this subset of types contains
   * any indexed paths in `__experimental_search`.
   * e.g. "authors.0.title" or ["authors", 0, "title"]
   */
  const {specs: exactSearchSpecs} = createSearchSpecs(searchTerms.types, false)

  // Construct search filters used in this GROQ query
  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    filter ? `(${filter})` : false,
    searchTerms.filter ? `(${searchTerms.filter})` : false,
  ].filter((baseFilter): baseFilter is string => Boolean(baseFilter))

  // const selections = exactSearchSpecs.map((spec) => {
  //   const constraint = `_type == "${spec.typeName}" => `
  //   const selection = `{ ${spec.paths.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
  //   return `${constraint}${selection}`
  // })
  //
  // const projectionFields = ['_type', '_id']
  // const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''
  // const finalProjection = projectionFields.join(', ') + (selection ? `, ${selection}` : '')

  const baseParams = {
    __types: exactSearchSpecs.map((spec) => spec.typeName),
    ...(params || {}),
  }

  return {
    filters: filters,
    params: baseParams,
  }
}
