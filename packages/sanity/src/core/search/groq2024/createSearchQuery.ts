import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type CrossDatasetType, type SchemaType} from '@sanity/types'
import {groupBy} from 'lodash'

import {deriveSearchWeightsFromType2024} from '../common/deriveSearchWeightsFromType2024'
import {
  type SearchFactoryOptions,
  type SearchOptions,
  type SearchSort,
  type SearchTerms,
} from '../common/types'
import {prefixLast} from '../text-search/createTextSearch'

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
  searchTerms: SearchTerms<SchemaType | CrossDatasetType>,
  searchParams: string | SearchTerms<SchemaType>,
  {includeDrafts = true, ...options}: SearchOptions & SearchFactoryOptions = {},
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

  // TODO: Unnecessary when `!isScored`.
  const flattenedSpecs = specs
    .map(({typeName, paths}) => paths.map((path) => ({...path, typeName})))
    .flat()
    .filter(({weight}) => weight !== 0)

  // TODO: Unnecessary when `!isScored`.
  const groupedSpecs = groupBy(
    flattenedSpecs,
    (entry) => `${entry.path} match text::query($__query), ${entry.weight}`,
  )

  // TODO: Unnecessary when `!isScored`.
  const score = Object.entries(groupedSpecs)
    .map(
      ([args, entries]) =>
        `boost(_type in ${JSON.stringify(entries.map((entry) => entry.typeName))} && ${args})`,
    )
    .concat([`@ match text::query($__query)`])

  const sortOrder = options?.sort ?? [{field: '_score', direction: 'desc'}]
  const isScored = sortOrder.some(({field}) => field === '_score')

  const filters = [
    '_type in $__types',
    // TODO: It will be necessary to omit zero-weighted paths when `!isScored`.
    isScored ? false : `@ match text::query($__query)`,
    options.filter ? `(${options.filter})` : false,
    searchTerms.filter ? `(${searchTerms.filter})` : false,
    '!(_id in path("versions.**"))',
    options.cursor,
  ].filter((baseFilter) => typeof baseFilter === 'string')

  const projectionFields = sortOrder.map(({field}) => field).concat('_type', '_id')
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

  // if (searchOptions?.__unstable_extendedProjection) {
  //   debugger
  // }

  const params: SearchParams = {
    __types: searchTerms.types.map((type) => (isSchemaType(type) ? type.name : type.type)),
    // Overfetch by 1 to determine whether there is another page to fetch.
    __limit: (options?.limit ?? DEFAULT_LIMIT) + 1,
    // TODO: Move `prefixLast` to common file path.
    __query: prefixLast(typeof searchParams === 'string' ? searchParams : searchParams.query),
    ...options.params,
    // ...searchOptions.params,
  }

  const pragma = [`findability-mvi:${FINDABILITY_MVI}`]
    .concat(options?.comments || [])
    .map((s) => `// ${s}`)
    .join('\n')

  return {
    query: [pragma, query].join('\n'),
    options: {
      tag: options.tag,
      perspective: includeDrafts ? 'previewDrafts' : 'published',
    },
    params,
    sortOrder,
  }
}
