import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type CrossDatasetType, type SchemaType} from '@sanity/types'
import {compact, flatten, flow, toLower, trim, union, uniq, words} from 'lodash'

import {
  deriveSearchWeightsFromType,
  isPerspectiveRaw,
  type SearchFactoryOptions,
  type SearchOptions,
  type SearchPath,
  type SearchSort,
  type SearchSpec,
  type SearchTerms,
} from '../common'
import {FINDABILITY_MVI} from '../constants'

export interface SearchParams {
  __types: string[]
  __limit: number
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

const combinePaths: (paths: string[][]) => string[] = flow([flatten, union, compact])

const pathWithMapper = ({mapWith, path}: SearchPath): string =>
  mapWith ? `${mapWith}(${path})` : path

/**
 * Create GROQ constraints, given search terms and the full spec of available document types and fields.
 * Essentially a large list of all possible fields (joined by logical OR) to match our search terms against.
 */
function createConstraints(terms: string[], specs: SearchSpec[]) {
  const combinedSearchPaths = combinePaths(
    specs.map((configForType) => (configForType.paths || []).map((opt) => pathWithMapper(opt))),
  )

  const constraints = terms
    .map((_term, i) => combinedSearchPaths.map((joinedPath) => `${joinedPath} match $t${i}`))
    .filter((constraint) => constraint.length > 0)

  return constraints.map((constraint) => `(${constraint.join(' || ')})`)
}

const SPECIAL_CHARS = /([^!@#$%^&*(),\\/?";:{}|[\]+<>\s-])+/g
const STRIP_EDGE_CHARS = /(^[.]+)|([.]+$)/

export function tokenize(string: string): string[] {
  return (string.match(SPECIAL_CHARS) || []).map((token) => token.replace(STRIP_EDGE_CHARS, ''))
}

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

function toOrderClause(orderBy: SearchSort[]): string {
  function wrapFieldWithFn(ordering: SearchSort): string {
    return ordering.mapWith ? `${ordering.mapWith}(${ordering.field})` : ordering.field
  }

  return (orderBy || [])
    .map((ordering) =>
      [wrapFieldWithFn(ordering), (ordering.direction || '').toLowerCase()]
        .map((str) => str.trim())
        .filter(Boolean)
        .join(' '),
    )
    .join(',')
}

/**
 * @internal
 */
export function createSearchQuery(
  searchTerms: SearchTerms<SchemaType | CrossDatasetType>,
  searchOpts: SearchOptions & SearchFactoryOptions = {},
): SearchQuery {
  const {filter, params, tag} = searchOpts

  const specs = searchTerms.types
    .map((schemaType) =>
      deriveSearchWeightsFromType({
        schemaType,
        maxDepth: searchOpts.maxDepth || DEFAULT_MAX_FIELD_DEPTH,
        isCrossDataset: searchOpts.isCrossDataset,
      }),
    )
    .filter(({paths}) => paths.length)

  // Extract search terms from string query, factoring in phrases wrapped in quotes
  const terms = extractTermsFromQuery(searchTerms.query)
  const {perspective} = searchOpts
  const isRaw = isPerspectiveRaw(perspective)

  // Construct search filters used in this GROQ query
  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    ...createConstraints(terms, specs),
    filter ? `(${filter})` : '',
    searchTerms.filter ? `(${searchTerms.filter})` : '',
    // Versions are collated server-side using the `perspective` option. Therefore, they must
    // not be fetched individually. This should only be added if the search needs to be narrow to the perspective
    isRaw ? '' : '!(_id in path("versions.**"))',
  ].filter(Boolean)

  const selections = specs.map((spec) => {
    const constraint = `_type == "${spec.typeName}" => `
    const selection = `{ ${spec.paths.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
    return `${constraint}${selection}`
  })

  // Default to `_id asc` (GROQ default) if no search sort is provided
  const sortOrder = toOrderClause(searchOpts?.sort || [{field: '_id', direction: 'asc'}])

  const projectionFields = ['_type', '_id', '_originalId']
  const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''
  const finalProjection = projectionFields.join(', ') + (selection ? `, ${selection}` : '')

  let query =
    `*[${filters.join(' && ')}]` +
    `| order(${sortOrder})` +
    `[0...$__limit]` +
    `{${finalProjection}}`

  // Optionally prepend our query with an 'extended' projection.
  // Required if we want to sort on nested object or reference fields.
  // In future, creating the extended projection should be handled internally by `createSearchQuery`.
  if (searchOpts?.__unstable_extendedProjection) {
    const extendedProjection = searchOpts?.__unstable_extendedProjection
    const firstProjection = projectionFields.concat(extendedProjection).join(', ')

    query = [
      `*[${filters.join(' && ')}]{${firstProjection}}`,
      `order(${sortOrder})[0...$__limit]{${finalProjection}}`,
    ].join('|')
  }

  // Prepend GROQ comments
  const groqComments = [`findability-mvi:${FINDABILITY_MVI}`]
    .concat(searchOpts?.comments || [])
    .map((s) => `// ${s}`)
    .join('\n')
  const updatedQuery = groqComments ? `${groqComments}\n${query}` : query

  const limit = searchOpts?.limit ?? DEFAULT_LIMIT

  return {
    query: updatedQuery,
    params: {
      ...toGroqParams(terms),
      __types: specs.map((spec) => spec.typeName),
      __limit: limit,
      ...(params || {}),
    },
    options: {
      tag,
      perspective: isRaw || !searchOpts.perspective?.length ? 'raw' : searchOpts.perspective,
    },
    searchSpec: specs,
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
