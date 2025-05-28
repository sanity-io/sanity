import {type ClientPerspective} from '@sanity/client'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {
  type CrossDatasetType,
  type GlobalDocumentReferenceType,
  type SchemaType,
} from '@sanity/types'
import {groupBy} from 'lodash'

import {deriveSearchWeightsFromType2024} from '../common/deriveSearchWeightsFromType2024'
import {isPerspectiveRaw} from '../common/isPerspectiveRaw'
import {prefixLast} from '../common/token'
import {
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
}

function isSchemaType(
  maybeSchemaType: SchemaType | CrossDatasetType | undefined,
): maybeSchemaType is SchemaType {
  return typeof maybeSchemaType !== 'undefined' && 'name' in maybeSchemaType
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
  searchTerms: SearchTerms<SchemaType | CrossDatasetType | GlobalDocumentReferenceType>,
  searchParams: string | SearchTerms<SchemaType>,
  {includeDrafts = true, perspective, ...options}: SearchOptions & SearchFactoryOptions = {},
): SearchQuery {
  const specs = searchTerms.types
    .map((schemaType) =>
      deriveSearchWeightsFromType2024({
        schemaType,
        maxDepth: options.maxDepth || DEFAULT_MAX_FIELD_DEPTH,
        isCrossDataset: options.isCrossDataset,
        processPaths: (paths) => paths.filter(({weight}) => weight !== 1),
      }),
    )
    .filter(({paths}) => paths.length !== 0)

  // Note: Computing this is unnecessary when `!isScored`.
  const flattenedSpecs = specs
    .map(({typeName, paths}) => paths.map((path) => ({...path, typeName})))
    .flat()

  // Note: Computing this is unnecessary when `!isScored`.
  const groupedSpecs = groupBy(flattenedSpecs, (entry) => [entry.path, entry.weight].join(':'))

  const baseMatch = '[@, _id] match text::query($__query)'

  // Note: Computing this is unnecessary when `!isScored`.
  const score = Object.entries(groupedSpecs)
    .flatMap(([, entries]) => {
      if (entries.some(({weight}) => weight === 0)) {
        return []
      }
      return `boost(_type in ${JSON.stringify(entries.map((entry) => entry.typeName))} && ${entries[0].path} match text::query($__query), ${entries[0].weight})`
    })
    .concat(baseMatch)

  const sortOrder = options?.sort ?? [{field: '_score', direction: 'desc'}]
  const isScored = sortOrder.some(({field}) => field === '_score')

  let activePerspective: ClientPerspective | undefined = perspective

  // No perspective, or empty perspective array, provided.
  if (
    typeof perspective === 'undefined' ||
    (Array.isArray(perspective) && perspective.length === 0)
  ) {
    activePerspective = 'raw'
  }

  const isRaw = isPerspectiveRaw(activePerspective)

  const filters: string[] = [
    '_type in $__types',
    // If the search request doesn't use scoring, directly filter documents.
    isScored ? [] : baseMatch,
    options.filter ? `(${options.filter})` : [],
    searchTerms.filter ? `(${searchTerms.filter})` : [],
    isRaw ? [] : '!(_id in path("versions.**"))',
    includeDrafts === false ? `!(_id in path('drafts.**'))` : [],
    options.cursor ?? [],
  ].flat()

  const projectionFields = sortOrder.map(({field}) => field).concat('_type', '_id', '_originalId')
  const projection = projectionFields.join(', ')

  const query = [
    `*[${filters.join(' && ')}]`,
    isScored ? ['|', `score(${score.join(', ')})`] : [],
    ['|', `order(${toOrderClause(sortOrder)})`],
    isScored ? `[_score > 0]` : [],
    `[0...$__limit]`,
    `{${projection}}`,
  ]
    .flat()
    .join(' ')

  const params: SearchParams = {
    __types: searchTerms.types.map((type) => (isSchemaType(type) ? type.name : type.type)),
    // Overfetch by 1 to determine whether there is another page to fetch.
    __limit: (options?.limit ?? DEFAULT_LIMIT) + 1,
    __query: prefixLast(typeof searchParams === 'string' ? searchParams : searchParams.query),
    ...options.params,
  }

  const pragma = [`findability-mvi:${FINDABILITY_MVI}`]
    .concat(options?.comments || [])
    .map((s) => `// ${s}`)
    .join('\n')

  return {
    query: [pragma, query].join('\n'),
    options: {
      tag: options.tag,
      perspective: activePerspective,
    },
    params,
    sortOrder,
  }
}
