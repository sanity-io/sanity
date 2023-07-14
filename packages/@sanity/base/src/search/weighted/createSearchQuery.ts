import {compact, flatten, flow, toLower, trim, union, uniq, words} from 'lodash'
import {ExperimentalSearchPath} from '../../../../types'
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

interface IntermediateSearchType extends Omit<ExperimentalSearchPath, 'path'> {
  path: string
  pathLength: number
  typeName: string
}

// Default number of documents to fetch
export const DEFAULT_LIMIT = 1000

// Maximum number of unique searchable attributes to include in a single search query (across all document types)
const MAX_UNIQUE_ATTRIBUTES =
  // eslint-disable-next-line no-process-env
  Number(process.env.SANITY_STUDIO_UNSTABLE_SEARCH_ATTR_LIMIT) || 1000

const combinePaths = flow([flatten, union, compact])

/**
 * Create search specs from supplied searchable types.
 * Search specs contain weighted paths which are used to construct GROQ queries for search.
 *
 * @internal
 * @param types - Searchable document types to create specs from.
 * @param optimizedIndexPaths - If true, will will convert all `__experimental_search` paths containing numbers into array syntax.
 *  E.g. ['cover', 0, 'cards', 0, 'title'] => "cover[].cards[].title"
 *
 *  This optimization will yield more search results than may be intended, but offers better performance over arrays with indices.
 *  (which are currently unoptimizable by Content Lake)
 * @param maxAttributes - Maximum number of _unique_ searchable attributes to include across all types.
 *  User-provided paths (e.g. with __experimental_search) do not count towards this limit.
 * @returns All matching search specs and `hasIndexedPaths`, a boolean indicating whether any paths contain indices.
 */
export function createSearchSpecs(
  types: SearchableType[],
  optimizeIndexedPaths: boolean,
  maxAttributes: number
): {
  hasIndexedPaths: boolean
  specs: SearchSpec[]
} {
  let hasIndexedPaths = false
  const addedPaths = []

  const specsByType = types
    // Extract and flatten all paths
    .reduce<IntermediateSearchType[]>((acc, val) => {
      const newPaths = val.__experimental_search.map((config) => {
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
          ...config,
          path: joinPath(path),
          pathLength: path.length,
          typeName: val.name,
        }
      })
      return acc.concat(newPaths)
    }, [])
    // Sort by path length, typeName, path (asc)
    .sort((a, b) => {
      if (a.pathLength === b.pathLength) {
        if (a.typeName === b.typeName) return a.path > b.path ? 1 : -1
        return a.typeName > b.typeName ? 1 : -1
      }
      return a.pathLength > b.pathLength ? 1 : -1
    })
    // Reduce into specs (by type) and conditionally add unique paths up until the `maxAttributes` limit
    .reduce<Record<string, SearchSpec>>((acc, val) => {
      const isPathAdded = addedPaths.includes(val.path)
      // Include the current path if its already been added or within the `maxAttributes` limit.
      // User provided paths are always included by default.
      const includeSpec = isPathAdded || val.userProvided || addedPaths.length < maxAttributes
      if (!isPathAdded && addedPaths.length < maxAttributes) {
        addedPaths.push(val.path)
      }

      const searchPath: SearchPath = {
        mapWith: val.mapWith,
        path: val.path,
        weight: val.weight,
      }

      acc[val.typeName] = {
        ...acc[val.typeName],
        ...(includeSpec && {
          paths: (acc[val.typeName]?.paths || []).concat([searchPath]),
        }),
        ...(!includeSpec && {
          skippedPaths: (acc[val.typeName]?.skippedPaths || []).concat([searchPath]),
        }),
        typeName: val.typeName,
      }

      return acc
    }, {})

  return {
    specs: Object.values(specsByType),
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

  return constraints.map((constraint) => `(${constraint.join('||')})`)
}

/**
 * Convert a string into an array of tokenized terms.
 *
 * Any (multi word) text wrapped in double quotes will be treated as "phrases", or separate tokens that
 * will not have its special characters removed.
 * E.g.`"the" "fantastic mr" fox fox book` => ["the", `"fantastic mr"`, "fox", "book"]
 *
 * Phrases wrapped in quotes are assigned relevance scoring differently from regular words.
 *
 * @internal
 * @param query - A string to convert into individual tokens
 * @returns All extracted tokens
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

  /*
   * Convert (remaining) search query into an array of deduped, sanitized tokens.
   * All white space and special characters are removed.
   * e.g. "The saint of Saint-Germain-des-Prés" => ['the', 'saint', 'of', 'germain', 'des', 'pres']
   */
  const remainingTerms = uniq(compact(tokenize(toLower(unquotedQuery))))

  return [...quotedTerms, ...remainingTerms]
}

/**
 * Generate search query data based off provided search terms and options.
 *
 * @internal
 * @param searchTerms - SearchTerms containing a string query and any number of searchable document types.
 * @param searchOpts - Optional search configuration.
 * @returns GROQ query, params and options to be used to fetch search results.
 */
export function createSearchQuery(
  searchTerms: SearchTerms,
  searchOpts: SearchOptions & WeightedSearchOptions = {}
): SearchQuery {
  const {filter, params, tag} = searchOpts

  // Extract search terms from string query, factoring in phrases wrapped in quotes
  const terms = extractTermsFromQuery(searchTerms.query)

  /*
   * Create an optimized search spec which removes array indices from __experimental_search paths.
   * e.g. ["authors", 0, "title"] => "authors[].title"
   *
   * These optimized specs are used when building constraints in this search query and assigning
   * weight to search hits.
   */
  const optimizedSpecs = createSearchSpecs(searchTerms.types, true, MAX_UNIQUE_ATTRIBUTES).specs

  // Construct search filters used in this GROQ query
  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    ...createConstraints(terms, optimizedSpecs),
    filter ? `(${filter})` : '',
  ].filter(Boolean)

  // Construct individual type selections based on __experimental_search paths,
  // but ignore _id and _type keys (as these are included in all types)
  const selections = optimizedSpecs.map((spec) => {
    const constraint = `_type=="${spec.typeName}"=>`
    const selection = `{${spec.paths
      .filter((cfg) => !['_id', '_type'].includes(cfg.path))
      .map((cfg, i) => `"${i}":${pathWithMapper(cfg)}`)}}`
    return `${constraint}${selection}`
  })
  const selection = selections.length > 0 ? `...select(${selections.join(',')})` : ''

  // Default to `_id asc` (GROQ default) if no search sort is provided
  const sortDirection = searchOpts?.sort?.direction || ('asc' as SortDirection)
  const sortField = searchOpts?.sort?.field || '_id'

  const query =
    `*[${filters.join('&&')}]` +
    `| order(${sortField} ${sortDirection})` +
    `[$__offset...$__limit]` +
    // the following would improve search quality for paths-with-numbers, but increases the size of the query by up to 50%
    // `${hasIndexedPaths ? `[${createConstraints(terms, exactSearchSpec).join(' && ')}]` : ''}` +
    `{_type,_id,${selection}}`

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
