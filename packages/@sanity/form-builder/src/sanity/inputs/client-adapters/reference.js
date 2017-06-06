import client from 'part:@sanity/base/client'

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

function buildConstraintFromType(type) {
  const typeConstraint = `_type == '${type.name}'`

  const stringFields = type.fields
    .filter(field => field.type.jsonType === 'string')

  if (stringFields.length === 0) {
    return typeConstraint
  }

  const stringFieldConstraints = stringFields
    .map(field => `${field.name} match $term`)

  return `${typeConstraint} && (${stringFieldConstraints.join(' || ')})`
}

export function search(textTerm, referenceType) {

  const typeConstraints = referenceType.to.map(buildConstraintFromType)

  const query = `*[!(_id in path('drafts.**')) && ${typeConstraints.map(wrapInParens).join('||')}]`

  return client.observable.fetch(query, {term: `${textTerm}*`})
}
