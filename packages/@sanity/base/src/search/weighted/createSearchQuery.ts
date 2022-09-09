import {compact, flatten, flow, toLower, union, uniq} from 'lodash'
import {joinPath} from '../../util/searchUtils'
import {tokenize} from '../common/tokenize'
import type {
  SearchableType,
  SearchOptions,
  SearchPath,
  SearchSpec,
  SearchTerms,
  SortDirection,
  WeightedSearchOptions,
} from './types'

export interface SearchParams {
  __types: string[]
  __limit: number
  __offset: number
  [key: string]: unknown
}

export interface SearchQuery {
  query: string
  params: SearchParams
  options: Record<string, unknown>
  searchSpec: SearchSpec[]
  terms: string[]
}

export const DEFAULT_LIMIT = 1000

const combinePaths = flow([flatten, union, compact])

/**
 * Create an object containing all available document types and weighted paths, used to construct a GROQ query for search.
 * System fields `_id` and `_type` are included by default.
 *
 * If `optimizeIndexPaths` is true, this will will convert all `__experimental_search` paths containing numbers
 * into array syntax. E.g. ['cover', 0, 'cards', 0, 'title'] => "cover[].cards[].title"
 *
 * This optimization will yield more search results than may be intended, but offers better performance over arrays with indices.
 * (which are currently unoptimizable by Content Lake)
 */
function createSearchSpecs(types: SearchableType[], optimizeIndexedPaths) {
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

const pathWithMapper = ({mapWith, path}: SearchPath): string =>
  mapWith ? `${mapWith}(${path})` : path

function createConstraints(terms: string[], specs: SearchSpec[]) {
  const combinedSearchPaths = combinePaths(
    specs.map((configForType) => configForType.paths.map((opt) => pathWithMapper(opt)))
  )
  const constraints = terms
    .map((_term, i) => combinedSearchPaths.map((joinedPath) => `${joinedPath} match $t${i}`))
    .filter((constraint) => constraint.length > 0)

  return constraints.map((constraint) => `(${constraint.join(' || ')})`)
}

export function createSearchQuery(
  searchTerms: SearchTerms,
  searchOpts: SearchOptions & WeightedSearchOptions = {}
): SearchQuery {
  const {filter, params, tag} = searchOpts

  /**
   * First pass: create initial search specs and determine if this subset of types contains
   * any indexed paths in `__experimental_search`.
   * e.g. "authors.0.title" or ["authors", 0, "title"]
   */
  const {specs: exactSearchSpecs, hasIndexedPaths} = createSearchSpecs(searchTerms.types, false)

  /**
   * Convert search query into an array of deduped, sanitized tokens.
   * All white space and special characters are removed.
   * e.g. "The saint of Saint-Germain-des-Prés" => ['the', 'saint', 'of', 'germain', 'des', 'prés']
   */
  const terms = uniq(compact(tokenize(toLower(searchTerms.query))))

  /**
   * Second pass: create an optimized spec (with array indices removed), but only if types with any
   * indexed paths have been previously found. Otherwise, passthrough original search specs.
   *
   * These optimized specs are only used when building constraints in this search query.
   */
  const optimizedSpecs = hasIndexedPaths
    ? createSearchSpecs(searchTerms.types, true).specs
    : exactSearchSpecs

  // Construct search filters used in this GROQ query
  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    ...createConstraints(terms, optimizedSpecs),
    filter ? `(${filter})` : '',
  ].filter(Boolean)

  const selections = exactSearchSpecs.map((spec) => {
    const constraint = `_type == "${spec.typeName}" => `
    const selection = `{ ${spec.paths.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
    return `${constraint}${selection}`
  })

  const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''

  // Default to `_id asc` (GROQ default) if no search sort is provided
  const sortDirection = searchOpts?.sort?.direction || ('asc' as SortDirection)
  const sortField = searchOpts?.sort?.field || '_id'

  const query =
    `*[${filters.join(' && ')}]` +
    `| order(${sortField} ${sortDirection})` +
    `[$__offset...$__limit]` +
    // the following would improve search quality for paths-with-numbers, but increases the size of the query by up to 50%
    // `${hasIndexedPaths ? `[${createConstraints(terms, exactSearchSpec).join(' && ')}]` : ''}` +
    `{_type, _id, ${selection}}`

  const offset = searchOpts?.offset ?? 0
  const limit = (searchOpts?.limit ?? DEFAULT_LIMIT) + offset

  return {
    query,
    params: {
      ...toGroqParams(terms),
      __types: exactSearchSpecs.map((spec) => spec.typeName),
      __limit: limit,
      __offset: offset,
      ...(params || {}),
    },
    options: {tag},
    searchSpec: exactSearchSpecs,
    terms,
  }
}

const toGroqParams = (terms: string[]): Record<string, string> => {
  const params: Record<string, string> = {}
  return terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*` // "t" is short for term
    return acc
  }, params)
}
