import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {
  type CrossDatasetType,
  type GlobalDocumentReferenceType,
  type SchemaType,
} from '@sanity/types'
import groupBy from 'lodash-es/groupBy.js'

import {compileSortExpression, type CompiledSortEntry} from '../common/compileSortExpression'
import {deriveSearchWeightsFromType2024} from '../common/deriveSearchWeightsFromType2024'
import {prefixLast} from '../common/token'
import {toOrderClause} from '../common/toOrderClause'
import {
  ORDERINGS_PROJECTION_KEY,
  type SearchFactoryOptions,
  type SearchOptions,
  type SearchSort,
  type SearchTerms,
} from '../common/types'

interface SearchParams extends Record<string, unknown> {
  __types: string[]
  __limit: number
  __query: string
}

const FINDABILITY_MVI = 5
const DEFAULT_LIMIT = 1_000

interface SearchQuery {
  query: string
  params: SearchParams
  options: Record<string, unknown>
  sortOrder: SearchSort[]
  /**
   * Compiled GROQ expressions corresponding to each entry in
   * `sortOrder`. Threaded through to `getNextCursor` so the cursor
   * predicate can address each sort field's source-document value
   * via the schema-resolved expression (e.g. `author->name`) rather
   * than the literal `field` (which would only match the projected
   * shape).
   */
  compiledSortEntries: CompiledSortEntry[]
}

function isSchemaType(
  maybeSchemaType: SchemaType | CrossDatasetType | undefined,
): maybeSchemaType is SchemaType {
  return typeof maybeSchemaType !== 'undefined' && 'name' in maybeSchemaType
}

/**
 * @internal
 */
export function createSearchQuery(
  searchTerms: SearchTerms<SchemaType | CrossDatasetType | GlobalDocumentReferenceType>,
  searchParams: string | SearchTerms,
  {
    perspective,
    sort,
    isCrossDataset,
    tag,
    maxDepth,
    cursor,
    limit,
    params,
    comments,
    filter,
  }: SearchOptions & SearchFactoryOptions = {},
): SearchQuery {
  const specs = searchTerms.types
    .map((schemaType) =>
      deriveSearchWeightsFromType2024({
        schemaType,
        maxDepth: maxDepth || DEFAULT_MAX_FIELD_DEPTH,
        isCrossDataset: isCrossDataset,
        processPaths: (paths) => paths.filter(({weight}) => weight !== 1),
      }),
    )
    .filter(({paths}) => paths.length !== 0)

  // Note: Computing this is unnecessary when `!isScored`.
  const flattenedSpecs = specs.flatMap(({typeName, paths}) =>
    paths.map((path) => ({...path, typeName})),
  )

  // Note: Computing this is unnecessary when `!isScored`.
  const groupedSpecs = groupBy(flattenedSpecs, (entry) => [entry.path, entry.weight].join(':'))

  const baseMatch = '([@, _id] match text::query($__query) || references($__rawQuery))'

  // Note: Computing this is unnecessary when `!isScored`.
  const score = Object.entries(groupedSpecs)
    .flatMap(([, entries]) => {
      if (entries.some(({weight}) => weight === 0)) {
        return []
      }
      return `boost(_type in ${JSON.stringify(entries.map((entry) => entry.typeName))} && ${entries[0].path} match text::query($__query), ${entries[0].weight})`
    })
    .concat(baseMatch)

  const inputSortOrder = sort ?? [{field: '_score', direction: 'desc'}]
  const isScored = inputSortOrder.some(({field}) => field === '_score')

  // Compile each sort entry into its `{expression, projectionIndex}`
  // shape. Every entry is projected into
  // `orderings[<projectionIndex>]` — see `compileSortExpression` for
  // why we always project rather than selectively.
  const compiledSortEntries = inputSortOrder.map((entry, index) =>
    compileSortExpression(entry, index),
  )
  const sortOrder: SearchSort[] = inputSortOrder.map((entry, index) => ({
    ...entry,
    projectionIndex: compiledSortEntries[index].projectionIndex,
  }))

  const filters: string[] = [
    '_type in $__types',
    // If the search request doesn't use scoring, directly filter documents.
    isScored ? [] : baseMatch,
    filter ? `(${filter})` : [],
    searchTerms.filter ? `(${searchTerms.filter})` : [],
    cursor ?? [],
  ].flat()

  const orderingsExpressions = compiledSortEntries.map((entry) => entry.expression)
  const orderingsProjection = `"${ORDERINGS_PROJECTION_KEY}": [${orderingsExpressions.join(', ')}]`
  const projection = ['_type', '_id', '_originalId', orderingsProjection].join(', ')

  const query = [
    `*[${filters.join(' && ')}]`,
    isScored ? ['|', `score(${score.join(', ')})`] : [],
    isScored ? `[_score > 0]` : [],
    `{${projection}}`,
    ['|', `order(${toOrderClause(sortOrder)})`],
    `[0...$__limit]`,
  ]
    .flat()
    .join(' ')

  const rawQuery = typeof searchParams === 'string' ? searchParams : searchParams.query

  const finalParams: SearchParams = {
    __types: searchTerms.types.map((type) => (isSchemaType(type) ? type.name : type.type)),
    // Overfetch by 1 to determine whether there is another page to fetch.
    __limit: (limit ?? DEFAULT_LIMIT) + 1,
    __query: prefixLast(rawQuery),
    __rawQuery: rawQuery,
    ...params,
  }

  const pragma = [`findability-mvi:${FINDABILITY_MVI}`]
    .concat(comments || [])
    .map((s) => `// ${s}`)
    .join('\n')

  return {
    query: [pragma, query].join('\n'),
    options: {
      tag: tag,
      perspective,
    },
    params: finalParams,
    sortOrder,
    compiledSortEntries,
  }
}
