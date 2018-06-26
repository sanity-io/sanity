import client from 'part:@sanity/base/client'
import {map} from 'rxjs/operators'
import {flatten} from 'lodash'

import {observeForPreview} from 'part:@sanity/base/preview'

export function getPreviewSnapshot(value, referenceType) {
  return observeForPreview(value, referenceType).pipe(map(result => result.snapshot))
}

function wrapIn(chars = '') {
  const [start = '', end = start] = chars
  return value => start + value + end
}

const wrapInParens = wrapIn('()')

function buildConstraintFromType(type, terms) {
  const typeConstraint = `_type == '${type.name}'`

  const stringFieldPaths = type.__unstable_searchFields || []
  if (terms.length === 0 || stringFieldPaths.length === 0) {
    return typeConstraint
  }

  const stringFieldConstraints = flatten(
    stringFieldPaths.map(fieldPath => terms.map(term => `${fieldPath} match '${term}*'`))
  )

  return `${typeConstraint} && (${stringFieldConstraints.join(' || ')})`
}

export function search(textTerm, referenceType) {
  const terms = textTerm.split(/\s+/).filter(Boolean)
  const typeConstraints = referenceType.to.map(type => buildConstraintFromType(type, terms))

  const query = `*[!(_id in path('drafts.**')) && (${typeConstraints
    .map(wrapInParens)
    .join('||')})]`

  return client.observable.fetch(query, {term: `${textTerm}*`})
}
