import {uniqBy} from 'lodash'
import {
  ArraySchemaType,
  isArraySchemaType,
  isObjectSchemaType,
  isBlockSchemaType,
  isReferenceSchemaType,
  ObjectSchemaType,
  SchemaType,
} from '@sanity/types'
import {stringsToNumbers} from './normalize'

interface SearchPath {
  path: (string | number | [])[]
  weight: number
  mapWith?: string
}

export const stringFieldsSymbol = Symbol('__cachedStringFields')
export const pathCountSymbol = Symbol('__cachedPathCount')

// Max number of levels to traverse per root-level object
// eslint-disable-next-line no-process-env
const MAX_TRAVERSAL_DEPTH = Number(process.env.SANITY_STUDIO_UNSTABLE_SEARCH_DEPTH) || 15

// Max number of search paths to extract per root-level object
// eslint-disable-next-line no-process-env
const MAX_OBJECT_SEARCH_PATHS = Number(process.env.SANITY_STUDIO_UNSTABLE_SEARCH_PATH_LIMIT) || 500

const BASE_WEIGHTS = [
  {weight: 1, path: ['_id']},
  {weight: 1, path: ['_type']},
]

const PREVIEW_FIELD_WEIGHT_MAP = {
  title: 10,
  subtitle: 5,
  description: 1.5,
}

const PORTABLE_TEXT_FIELDS = ['style', 'list']

const isPortableTextArray = (type) =>
  isArraySchemaType(type) && Array.isArray(type.of) && type.of.some(isBlockSchemaType)

type SchemaTypeReducer = (
  acc: SearchPath[],
  type: SchemaType,
  path: SearchPath['path']
) => SearchPath[]

// eslint-disable-next-line max-params
function reduceType(
  parentType: ObjectSchemaType,
  type: SchemaType,
  reducer: SchemaTypeReducer,
  acc: SearchPath[],
  path = [],
  maxDepth: number
) {
  if (maxDepth < 0 || parentType[pathCountSymbol] < 0) {
    return acc
  }

  const accumulator = reducer(acc, type, path)
  if (isArraySchemaType(type) && Array.isArray(type.of)) {
    return reduceArray(parentType, type, reducer, accumulator, path, maxDepth)
  }

  if (isObjectSchemaType(type) && Array.isArray(type.fields) && !isReferenceSchemaType(type)) {
    return reduceObject(parentType, type, reducer, accumulator, path, maxDepth)
  }

  parentType[pathCountSymbol] -= 1
  return accumulator
}

// eslint-disable-next-line max-params
function reduceArray(
  parentType: ObjectSchemaType,
  arrayType: ArraySchemaType,
  reducer: SchemaTypeReducer,
  accumulator: SearchPath[],
  path: SearchPath['path'],
  maxDepth: number
) {
  return arrayType.of.reduce(
    (acc, ofType) => reduceType(parentType, ofType, reducer, acc, path, maxDepth - 1),
    accumulator
  )
}

// eslint-disable-next-line max-params
function reduceObject(
  parentType: ObjectSchemaType,
  objectType: ObjectSchemaType,
  reducer: SchemaTypeReducer,
  accumulator: SearchPath[],
  path: SearchPath['path'],
  maxDepth: number
) {
  return Array.from(objectType.fields)
    .sort((a, b) => {
      // Object fields with these types will be pushed to the end
      const sortTypes = ['array', 'object']

      const aIsObjectOrArray = sortTypes.includes(a.type.jsonType)
      const bIsObjectOrArray = sortTypes.includes(b.type.jsonType)

      // Sort by name when either both (or neither) comparators are objects and/or arrays
      if (aIsObjectOrArray) {
        return bIsObjectOrArray ? a.name.localeCompare(b.name) : 1
      }
      return bIsObjectOrArray ? -1 : a.name.localeCompare(b.name)
    })
    .reduce((acc, field) => {
      // Don't include styles and list types as searchable paths for portable text blocks
      if (isBlockSchemaType(objectType) && PORTABLE_TEXT_FIELDS.includes(field.name)) {
        return acc
      }
      const segment = ([field.name] as SearchPath['path']).concat(
        isArraySchemaType(field.type) ? [[]] : []
      )
      return reduceType(parentType, field.type, reducer, acc, path.concat(segment), maxDepth - 1)
    }, accumulator)
}

/**
 * @internal
 */
export function deriveFromPreview(type: ObjectSchemaType): SearchPath[] {
  const select = type?.preview?.select

  if (!select) {
    return []
  }

  return Object.keys(select)
    .filter((fieldName) => fieldName in PREVIEW_FIELD_WEIGHT_MAP)
    .map((fieldName) => ({
      weight: PREVIEW_FIELD_WEIGHT_MAP[fieldName],
      path: select[fieldName].split('.').map(stringsToNumbers),
    }))
}

export function getCachedStringFieldPaths(
  type: ObjectSchemaType,
  maxDepth: number,
  maxSearchPaths: number
): SearchPath[] {
  type[pathCountSymbol] = maxSearchPaths

  if (!type[stringFieldsSymbol]) {
    type[stringFieldsSymbol] = uniqBy(
      [...BASE_WEIGHTS, ...deriveFromPreview(type), ...getFieldSearchPaths(type, maxDepth)],
      (spec) => spec.path.join('.')
    ).slice(0, maxSearchPaths)
  }
  return type[stringFieldsSymbol]
}

function getCachedBaseFieldPaths(type: ObjectSchemaType) {
  if (!type[stringFieldsSymbol]) {
    type[stringFieldsSymbol] = uniqBy([...BASE_WEIGHTS, ...deriveFromPreview(type)], (spec) =>
      spec.path.join('.')
    )
  }
  return type[stringFieldsSymbol]
}

function getFieldSearchPaths(type: ObjectSchemaType, maxDepth: number) {
  const reducer: SchemaTypeReducer = (acc, childType, path) => {
    if (childType.jsonType === 'string') {
      return [...acc, {path, weight: 1}]
    }
    if (isPortableTextArray(childType)) {
      return [...acc, {mapWith: 'pt::text', path, weight: 1}]
    }
    return acc
  }

  return reduceType(type, type, reducer, [], [], maxDepth)
}

export function resolveSearchConfigForBaseFieldPaths(type: ObjectSchemaType): SearchPath[] {
  return getCachedBaseFieldPaths(type)
}

export default function resolveSearchConfig(type: ObjectSchemaType): SearchPath[] {
  return getCachedStringFieldPaths(type, MAX_TRAVERSAL_DEPTH, MAX_OBJECT_SEARCH_PATHS)
}
