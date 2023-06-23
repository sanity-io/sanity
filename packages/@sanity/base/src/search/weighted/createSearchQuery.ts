import {compact, flatten, flow, toLower, trim, union, uniq, words} from 'lodash'
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

const MAX_ATTRIBUTES = 1000

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

  const paths: {
    path: string
    pathLength: number
    typeName: string
    pathObj: {
      weight: number
      path: string
      mapWith: string
    }
  }[] = []

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

      const joinedPath = joinPath(path)
      paths.push({
        typeName: type.name,
        path: joinedPath,
        pathLength: joinedPath.split('.').length,
        pathObj: {
          weight: config.weight,
          path: joinedPath,
          mapWith: config.mapWith,
        },
      })

      return {
        weight: config.weight,
        path: joinedPath,
        mapWith: config.mapWith,
      }
    }),
  }))

  // @todo: refactor!

  // Sorting paths by pathLength, largest first
  const sortedPaths = paths.sort((a, b) => {
    if (a.pathLength === b.pathLength) {
      if (a.typeName === b.typeName) {
        return a.path > b.path ? 1 : -1
      }
      return a.typeName > b.typeName ? 1 : -1
    }
    return a.pathLength > b.pathLength ? 1 : -1
  })

  // Limiting the number of paths
  const allowedPaths = sortedPaths.slice(0, MAX_ATTRIBUTES).reduce((acc, val) => {
    if (!acc[val.typeName]) {
      acc[val.typeName] = []
    }
    acc[val.typeName].push({
      ...val.pathObj,
    })
    return acc
  }, {})

  // Create a flat list of all paths
  const newSpecs = specs.reduce((acc, val) => {
    const hasPaths = !!allowedPaths[val.typeName]?.length
    if (hasPaths) {
      const spec = {...val, paths: allowedPaths[val.typeName]}
      acc.push(spec)
    }
    return acc
  }, [])

  return {
    specs: newSpecs,
    hasIndexedPaths,
  }
}

const pathWithMapper = ({mapWith, path}: SearchPath): string =>
  mapWith ? `${mapWith}(${path})` : path

/**
 * Create GROQ constraints, given search terms and the full spec of available document types and fields.
 * Essentially a large list of all possible fields (joined by logical OR) to match our search terms against.
 */
function createConstraints(terms: string[], specs: SearchSpec[]) {
  const combinedSearchPaths = combinePaths(
    specs.map((configForType) => configForType.paths.map((opt) => pathWithMapper(opt)))
  )
  const constraints = terms
    .map((_term, i) => combinedSearchPaths.map((joinedPath) => `${joinedPath} match $t${i}`))
    .filter((constraint) => constraint.length > 0)

  return constraints.map((constraint) => `(${constraint.join(' || ')})`)
}

/**
 * Convert a string into an array of tokenized terms.
 *
 * Any (multi word) text wrapped in double quotes will be treated as "phrases", or separate tokens that
 * will not have its special characters removed.
 * E.g.`"the" "fantastic mr" fox fox book` => ["the", `"fantastic mr"`, "fox", "book"]
 *
 * Phrases wrapped in quotes are assigned relevance scoring differently from regular words.
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
   * e.g. "The saint of Saint-Germain-des-Prés" => ['the', 'saint', 'of', 'germain', 'des', 'pres']
   */
  const remainingTerms = uniq(compact(tokenize(toLower(unquotedQuery))))

  return [...quotedTerms, ...remainingTerms]
}

export function createSearchQuery(
  searchTerms: SearchTerms,
  searchOpts: SearchOptions & WeightedSearchOptions = {}
): SearchQuery {
  const {filter, params, tag} = searchOpts

  // Extract search terms from string query, factoring in phrases wrapped in quotes
  const terms = extractTermsFromQuery(searchTerms.query)

  /**
   * Create an optimized search spec which removes array indices from __experimental_search paths.
   * e.g. ["authors", 0, "title"] => "authors[].title"
   *
   * These optimized specs are used when building constraints in this search query and assigning
   * weight to search hits.
   */
  const optimizedSpecs = createSearchSpecs(searchTerms.types, true).specs

  // Construct search filters used in this GROQ query
  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    ...createConstraints(terms, optimizedSpecs),
    filter ? `(${filter})` : '',
  ].filter(Boolean)

  const selections = optimizedSpecs.map((spec) => {
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

  // Prepend optional GROQ comments to query
  const groqComments = (searchOpts?.comments || []).map((s) => `// ${s}`).join('\n')
  const updatedQuery = groqComments ? `${groqComments}\n${query}` : query

  const offset = searchOpts?.offset ?? 0
  const limit = (searchOpts?.limit ?? DEFAULT_LIMIT) + offset

  return {
    query: updatedQuery,
    params: {
      ...toGroqParams(terms),
      __types: optimizedSpecs.map((spec) => spec.typeName),
      __limit: limit,
      __offset: offset,
      ...(params || {}),
    },
    options: {tag},
    searchSpec: optimizedSpecs,
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
