import client from 'part:@sanity/base/client'
import {joinPath} from 'part:@sanity/base/util/search-utils'
import {map} from 'rxjs/operators'
import {observeForPreview} from 'part:@sanity/base/preview'

export function getPreviewSnapshot(value, referenceType) {
  return observeForPreview(value, referenceType).pipe(map(result => result.snapshot))
}

function wrapIn(chars = '') {
  const [start = '', end = start] = chars
  return value => start + value + end
}

const wrapInParens = wrapIn('()')

function buildConstraintFromType(type, termParams) {
  const typeConstraint = `_type == '${type.name}'`

  const termParamNames = Object.keys(termParams)

  const stringFieldPaths = type.__unstable_searchFields || []
  if (termParamNames.length === 0 || stringFieldPaths.length === 0) {
    return typeConstraint
  }

  const stringFieldConstraints = stringFieldPaths.map((fieldPath /*array*/) =>
    termParamNames.map(paramName => `${joinPath(fieldPath)} match $${paramName}`).join(' && ')
  )

  return `${typeConstraint} && (${stringFieldConstraints.join(' || ')})`
}
export function search(textTerm, referenceType) {
  const terms = textTerm.split(/\s+/).filter(Boolean)
  const termParams = terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*`
    return acc
  }, {})

  const typeConstraints = referenceType.to.map(type => buildConstraintFromType(type, termParams))

  const query = `*[!(_id in path('drafts.**')) && (${typeConstraints
    .map(wrapInParens)
    .join('||')})][0...100]`

  return client.observable.fetch(query, termParams)
}
