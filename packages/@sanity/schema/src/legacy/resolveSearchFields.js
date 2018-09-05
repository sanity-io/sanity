const stringFieldsSymbol = Symbol('__cachedStringFields')

function reduceType(type, reducer, accumulator, path = [], maxDepth) {
  if (maxDepth < 0) {
    return accumulator
  }
  if (type.jsonType === 'array' && Array.isArray(type.of)) {
    return reduceArray(type, reducer, accumulator, path, maxDepth)
  }
  if (type.jsonType === 'object' && Array.isArray(type.fields)) {
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
    const segment = `${field.name}${field.type.jsonType === 'array' ? '[]' : ''}`
    return reduceType(field.type, reducer, acc, path.concat(segment), maxDepth - 1)
  }, accumulator)
}

function getCachedStringFieldPaths(type, maxDepth) {
  if (!type[stringFieldsSymbol]) {
    type[stringFieldsSymbol] = getStringFieldPaths(type, maxDepth)
  }
  return type[stringFieldsSymbol]
}

function getStringFieldPaths(type, maxDepth) {
  const reducer = (accumulator, childType, path) =>
    childType.jsonType === 'string' ? [...accumulator, path] : accumulator

  return reduceType(type, reducer, [], [], maxDepth)
}

export default function resolveSearchFields(type) {
  return getCachedStringFieldPaths(type, 4).map(path => path.join('.'))
}
