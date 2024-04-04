import {isFinite, uniqBy} from 'lodash'

export const DEFAULT_MAX_FIELD_DEPTH = 5

const stringFieldsSymbols = {} as Record<number, symbol>

const getStringFieldSymbol = (maxDepth: number) => {
  if (!stringFieldsSymbols[maxDepth]) {
    stringFieldsSymbols[maxDepth] = Symbol(`__cachedStringFields_${maxDepth}`)
  }

  return stringFieldsSymbols[maxDepth]
}

const isReference = (type: any) => type.type && type.type.name === 'reference'

const portableTextFields = ['style', 'list']
const isPortableTextBlock: any = (type: any) =>
  type.name === 'block' || (type.type && isPortableTextBlock(type.type))
const isPortableTextArray = (type: any) =>
  type.jsonType === 'array' && Array.isArray(type.of) && type.of.some(isPortableTextBlock)

function reduceType(type: any, reducer: any, acc: any, path = [], maxDepth: any) {
  if (maxDepth < 0) {
    return acc
  }

  const accumulator = reducer(acc, type, path)
  if (type.jsonType === 'array' && Array.isArray(type.of)) {
    return reduceArray(type, reducer, accumulator, path, maxDepth)
  }

  if (type.jsonType === 'object' && Array.isArray(type.fields) && !isReference(type)) {
    return reduceObject(type, reducer, accumulator, path, maxDepth)
  }

  return accumulator
}

function reduceArray(arrayType: any, reducer: any, accumulator: any, path: any, maxDepth: any) {
  return arrayType.of.reduce(
    (acc: any, ofType: any) => reduceType(ofType, reducer, acc, path, maxDepth - 1),
    accumulator,
  )
}

function reduceObject(objectType: any, reducer: any, accumulator: any, path: any, maxDepth: any) {
  const isPtBlock = isPortableTextBlock(objectType)
  return objectType.fields.reduce((acc: any, field: any) => {
    // Don't include styles and list types as searchable paths for portable text blocks
    if (isPtBlock && portableTextFields.includes(field.name)) {
      return acc
    }

    const segment = [field.name].concat(field.type.jsonType === 'array' ? [[]] : [])
    return reduceType(field.type, reducer, acc, path.concat(segment), maxDepth - 1)
  }, accumulator)
}

const BASE_WEIGHTS = [
  {weight: 1, path: ['_id']},
  {weight: 1, path: ['_type']},
]

const PREVIEW_FIELD_WEIGHT_MAP = {
  title: 10,
  subtitle: 5,
  description: 1.5,
}

/**
 * @internal
 */
export function deriveFromPreview(
  type: {
    preview: {select: Record<string, string>}
  },
  maxDepth: number,
): {weight?: number; path: (string | number)[]}[] {
  const select = type?.preview?.select

  if (!select) {
    return []
  }

  const fields: {weight: number; path: (string | number)[]}[] = []

  for (const fieldName of Object.keys(select)) {
    if (!(fieldName in PREVIEW_FIELD_WEIGHT_MAP)) {
      continue
    }

    const path = select[fieldName].split('.')

    if (maxDepth > -1 && path.length - 1 > maxDepth) {
      continue
    }

    fields.push({
      weight: (PREVIEW_FIELD_WEIGHT_MAP as any)[fieldName],
      path,
    })
  }

  return fields
}

function getCachedStringFieldPaths(type: any, maxDepth: number) {
  const symbol = getStringFieldSymbol(maxDepth)
  if (!type[symbol]) {
    type[symbol] = uniqBy(
      [
        ...BASE_WEIGHTS,
        ...deriveFromPreview(type, maxDepth),
        ...getStringFieldPaths(type, maxDepth).map((path: any) => ({weight: 1, path})),
        ...getPortableTextFieldPaths(type, maxDepth).map((path: any) => ({
          weight: 1,
          path,
          mapWith: 'pt::text',
        })),
      ],
      (spec) => spec.path.join('.'),
    )
  }
  return type[symbol]
}

function getCachedBaseFieldPaths(type: any, maxDepth: number) {
  const symbol = getStringFieldSymbol(maxDepth)
  if (!type[symbol]) {
    type[symbol] = uniqBy([...BASE_WEIGHTS, ...deriveFromPreview(type, maxDepth)], (spec) =>
      spec.path.join('.'),
    )
  }
  return type[symbol]
}

function getStringFieldPaths(type: any, maxDepth: number) {
  const reducer = (accumulator: any, childType: any, path: any) =>
    childType.jsonType === 'string' ? [...accumulator, path] : accumulator

  return reduceType(type, reducer, [], [], maxDepth)
}

function getPortableTextFieldPaths(type: any, maxDepth: any) {
  const reducer = (accumulator: any, childType: any, path: any) =>
    isPortableTextArray(childType) ? [...accumulator, path] : accumulator

  return reduceType(type, reducer, [], [], maxDepth)
}

export function resolveSearchConfigForBaseFieldPaths(type: any, maxDepth?: number) {
  return getCachedBaseFieldPaths(type, normalizeMaxDepth(maxDepth))
}

/**
 * @internal
 */
export function resolveSearchConfig(type: any, maxDepth?: number) {
  return getCachedStringFieldPaths(type, normalizeMaxDepth(maxDepth))
}

/**
 * Normalizes a one-indexed maxDepth to a zero-indexed maxDepth
 * 0 = all fields
 *
 * @internal
 */
function normalizeMaxDepth(maxDepth?: number) {
  if (!isFinite(maxDepth) || maxDepth! < 1 || maxDepth! > DEFAULT_MAX_FIELD_DEPTH) {
    return DEFAULT_MAX_FIELD_DEPTH - 1
  }

  return maxDepth! - 1
}
