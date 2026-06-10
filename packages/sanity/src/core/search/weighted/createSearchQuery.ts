import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type CrossDatasetType, type SchemaType} from '@sanity/types'
import compact from 'lodash-es/compact.js'
import flatten from 'lodash-es/flatten.js'
import flow from 'lodash-es/flow.js'
import toLower from 'lodash-es/toLower.js'
import trim from 'lodash-es/trim.js'
import union from 'lodash-es/union.js'
import uniq from 'lodash-es/uniq.js'
import words from 'lodash-es/words.js'

import {
  compileSortExpression,
  deriveSearchWeightsFromType,
  ORDERINGS_PROJECTION_KEY,
  type SearchFactoryOptions,
  type SearchOptions,
  type SearchPath,
  type SearchSort,
  type SearchSpec,
  type SearchTerms,
} from '../common'
import {toOrderClause} from '../common/toOrderClause'
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

/**
 * @internal
 */
export function createSearchQuery(
  searchTerms: SearchTerms<SchemaType | CrossDatasetType>,
  searchOpts: SearchOptions & SearchFactoryOptions = {},
): SearchQuery {
  const {filter, params, tag, maxDepth, isCrossDataset, perspective, sort, limit, comments} =
    searchOpts

  const specs = searchTerms.types
    .map((schemaType) =>
      deriveSearchWeightsFromType({
        schemaType,
        maxDepth: maxDepth || DEFAULT_MAX_FIELD_DEPTH,
        isCrossDataset: isCrossDataset,
      }),
    )
    .filter(({paths}) => paths.length)

  // Extract search terms from string query, factoring in phrases wrapped in quotes
  const terms = extractTermsFromQuery(searchTerms.query)

  // Construct search filters used in this GROQ query
  const filters = [
    '_type in $__types',
    ...createConstraints(terms, specs),
    filter ? `(${filter})` : '',
    searchTerms.filter ? `(${searchTerms.filter})` : '',
  ].filter(Boolean)

  const selections = searchOpts.skipSortByScore
    ? []
    : specs.map((spec) => {
        const constraint = `_type == "${spec.typeName}" => `
        if (searchOpts.skipSortByScore) {
          return undefined
        }
        const selection = `{ ${spec.paths.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
        return `${constraint}${selection}`
      })

  // Default to `_id asc` (GROQ default) if no search sort is provided.
  const inputSortOrder: SearchSort[] = sort || [{field: '_id', direction: 'asc'}]

  const compiledSortEntries = inputSortOrder.map((entry, index) =>
    compileSortExpression(entry, index),
  )

  const resolvedSortOrder: SearchSort[] = inputSortOrder.map((entry, index) => ({
    ...entry,
    projectionIndex: compiledSortEntries[index].projectionIndex,
  }))

  const orderingsExpressions = compiledSortEntries.map((entry) => entry.expression)
  const orderingsProjection = `"${ORDERINGS_PROJECTION_KEY}": [${orderingsExpressions.join(', ')}]`
  const baseProjectionFields = ['_type', '_id', '_originalId']
  const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''

  const projection = [...baseProjectionFields, orderingsProjection, selection]
    .filter(Boolean)
    .join(', ')

  const query = [
    `*[${filters.join(' && ')}]`,
    `{${projection}}`,
    `| order(${toOrderClause(resolvedSortOrder)})`,
    `[0...$__limit]`,
  ].join(' ')

  // Prepend GROQ comments
  const groqComments = [`findability-mvi:${FINDABILITY_MVI}`]
    .concat(comments || [])
    .map((s) => `// ${s}`)
    .join('\n')

  const updatedQuery = groqComments ? `${groqComments}\n${query}` : query

  return {
    query: updatedQuery,
    params: {
      ...toGroqParams(terms),
      __types: specs.map((spec) => spec.typeName),
      __limit: limit ?? DEFAULT_LIMIT,
      ...params,
    },
    options: {
      tag,
      perspective,
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
