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

const stringFields = Symbol('__cachedStringFields')

function getCachedStringFieldPaths(type, maxDepth) {
  if (!type[stringFields]) {
    type[stringFields] = getStringFieldPaths(type, maxDepth)
  }
  return type[stringFields]
}

function getStringFieldPaths(type, maxDepth = 2) {
  if (maxDepth < 0) {
    return []
  }
  return (type.fields || [])
    .map(field => {
      if (field.type.jsonType === 'string') {
        return [[field.name]]
      }
      if (field.type.jsonType === 'object') {
        return getCachedStringFieldPaths(field.type, maxDepth - 1).map(path => [field.name, ...flatten(path)])
      }
      return null
    })
    .filter(Boolean)

}

function buildConstraintFromType(type, terms) {
  const typeConstraint = `_type == '${type.name}'`

  const stringFieldPaths = flatten(getCachedStringFieldPaths(type, 2))
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
