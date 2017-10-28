const stringFieldsSymbol = Symbol('__cachedStringFields')

function reduceType(type, reducer, accumulator, path = [], maxDepth = 10) {
  if (maxDepth < 0) {
    return accumulator
  }
  if (Array.isArray(type.fields)) {
    return type.fields.reduce(
      (acc, field, index) => reduceType(field.type, reducer, acc, path.concat(field.name), maxDepth - 1),
      reducer(accumulator, type, path)
    )
  }
  return reducer(accumulator, type, path)
}

function getCachedStringFieldPaths(type, maxDepth) {
  if (!type[stringFieldsSymbol]) {
    type[stringFieldsSymbol] = getStringFieldPaths(type, maxDepth)
  }
  return type[stringFieldsSymbol]
}

function getStringFieldPaths(type, maxDepth) {
  const reducer = (accumulator, childType, path) =>
    (childType.jsonType === 'string'
      ? [...accumulator, path]
      : accumulator
    )

  return reduceType(type, reducer, [], [], maxDepth)
}

export default function resolveSearchFields(type) {
  return getCachedStringFieldPaths(type, 4).map(path => path.join('.'))
}
