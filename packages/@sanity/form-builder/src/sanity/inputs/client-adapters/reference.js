import client from 'part:@sanity/base/client'
import {flatten} from 'lodash'

import {observeForPreview} from 'part:@sanity/base/preview'

export function valueToString(value, referenceType) {
  return observeForPreview(value, referenceType)
    .map(result => result.snapshot.title)
}

function wrapIn(chars = '') {
  const [start = '', end = start] = chars
  return value => start + value + end
}

const wrapInParens = wrapIn('()')

const stringFieldsSymbol = Symbol('__cachedStringFields')

function getCachedStringFieldPaths(type, maxDepth) {
  if (!type[stringFieldsSymbol]) {
    type[stringFieldsSymbol] = getStringFieldPaths(type, maxDepth)
  }
  return type[stringFieldsSymbol]
}

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

function getStringFieldPaths(type, maxDepth) {
  const reducer = (accumulator, childType, path) =>
    (childType.jsonType === 'string'
      ? [...accumulator, path]
      : accumulator
    )

  return reduceType(type, reducer, [], [], maxDepth)
}

function buildConstraintFromType(type, terms) {
  const typeConstraint = `_type == '${type.name}'`

  const stringFieldPaths = getCachedStringFieldPaths(type, 4)
  if (stringFieldPaths.length === 0) {
    return typeConstraint
  }

  const stringFieldConstraints = flatten(
    stringFieldPaths.map(fieldPath => terms.map(term => `${fieldPath.join('.')} match '${term}*'`))
  )

  return `${typeConstraint} && (${stringFieldConstraints.join(' || ')})`
}

export function search(textTerm, referenceType) {

  const terms = textTerm.split(/\s+/)
  const typeConstraints = referenceType.to.map(type => buildConstraintFromType(type, terms))

  const query = `*[!(_id in path('drafts.**')) && ${typeConstraints.map(wrapInParens).join('||')}]`

  return client.observable.fetch(query, {term: `${textTerm}*`})
}
