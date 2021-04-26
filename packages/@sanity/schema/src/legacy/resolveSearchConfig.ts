import {uniqBy} from 'lodash'

const stringFieldsSymbol = Symbol('__cachedStringFields')

const isReference = (type) => type.type && type.type.name === 'reference'

function reduceType(type, reducer, accumulator, path = [], maxDepth) {
  if (maxDepth < 0) {
    return accumulator
  }
  if (type.jsonType === 'array' && Array.isArray(type.of)) {
    return reduceArray(type, reducer, accumulator, path, maxDepth)
  }
  if (type.jsonType === 'object' && Array.isArray(type.fields) && !isReference(type)) {
    return reduceObject(type, reducer, accumulator, path, maxDepth)
  }
  return reducer(accumulator, type, path)
}

function reduceArray(arrayType, reducer, accumulator, path, maxDepth) {
  return arrayType.of.reduce(
    (acc, ofType) => reduceType(ofType, reducer, acc, path, maxDepth - 1),
    accumulator
  )
}

function reduceObject(objectType, reducer, accumulator, path, maxDepth) {
  return objectType.fields.reduce((acc, field) => {
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

function deriveFromPreview(type) {
  const select = type.preview.select
  return Object.keys(select)
    .filter((fieldName) => fieldName in PREVIEW_FIELD_WEIGHT_MAP)
    .map((fieldName) => ({
      weight: PREVIEW_FIELD_WEIGHT_MAP[fieldName],
      path: select[fieldName].split('.'),
    }))
}

function getCachedStringFieldPaths(type, maxDepth) {
  if (!type[stringFieldsSymbol]) {
    type[stringFieldsSymbol] = uniqBy(
      [
        ...BASE_WEIGHTS,
        ...deriveFromPreview(type),
        ...getStringFieldPaths(type, maxDepth).map((path) => ({weight: 1, path})),
      ],
      (spec) => spec.path.join('.')
    )
  }
  return type[stringFieldsSymbol]
}

function getStringFieldPaths(type, maxDepth) {
  const reducer = (accumulator, childType, path) =>
    childType.jsonType === 'string' ? [...accumulator, path] : accumulator

  return reduceType(type, reducer, [], [], maxDepth)
}

export default function resolveSearchConfig(type) {
  return getCachedStringFieldPaths(type, 4)
}
