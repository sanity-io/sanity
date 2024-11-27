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

// TODO: Remove.
const TEMP_ENABLE_PATH_EXCLUSION = false

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

  // TODO: Unnecessary when `!isScored`.
  const groupedSpecs = groupBy(flattenedSpecs, (entry) => [entry.path, entry.weight].join(':'))

  const zeroWeightedSpecs = flattenedSpecs.filter(({weight}) => weight === 0)
  const zeroWeightedSpecsByType = groupBy(zeroWeightedSpecs, 'typeName')
  const zeroWeightedTypes = Object.keys(zeroWeightedSpecsByType)
  const hasZeroWeightedSpec = zeroWeightedSpecs.length !== 0

  // Construct a GROQ expression that:
  // 1. Matches all attributes if the type has no excluded attributes.
  // 2. Matches all non-excluded attributes if the type has excluded attributes.
  const conditionalMatches = Object.entries(zeroWeightedSpecsByType)
    .map(([typeName, spec]) => {
      const excludedPath = spec.map(({path}) => path).join(', ')
      return [
        // [2]
        `(`,
        `_type == ${JSON.stringify(typeName)}`,
        ['&&', `@ match text::query($__query, { "exclude": (${excludedPath}) })`],
        ')',
      ]
        .flat()
        .join('')
    })
    .join(' || ')

  // The initial negation (1) could be removed if types containing zero weights equal the types being searched for.
  const _baseMatch = hasZeroWeightedSpec
    ? [
        '(',
        [
          // [1]
          '(',
          `!(_type in ${JSON.stringify(zeroWeightedTypes)})`,
          '&&',
          '@ match text::query($__query)',
          ')',
        ],
        ['||', conditionalMatches],
        ')',
      ]
        .flat()
        .join('')
    : '@ match text::query($__query)'

  // TODO: Remove.
  const baseMatch = TEMP_ENABLE_PATH_EXCLUSION ? _baseMatch : '@ match text::query($__query)'

  // TODO: Unnecessary when `!isScored`.
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

  const filters: string[] = [
    '_type in $__types',
    // If the search request doesn't use scoring, directly filter documents.
    isScored ? [] : baseMatch,
    options.filter ? `(${options.filter})` : [],
    searchTerms.filter ? `(${searchTerms.filter})` : [],
    '!(_id in path("versions.**"))',
    options.cursor ?? [],
  ].flat()

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
