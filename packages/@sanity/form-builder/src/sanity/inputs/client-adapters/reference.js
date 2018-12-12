import client from 'part:@sanity/base/client'
import {joinPath, parseQuery, sortResultsByScore} from 'part:@sanity/base/util/search-utils'
import {observeForPreview} from 'part:@sanity/base/preview'
import {map} from 'rxjs/operators'

export function getPreviewSnapshot(value, referenceType) {
  return observeForPreview(value, referenceType).pipe(map(result => result.snapshot))
}

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
  const {filters, terms} = parseQuery(textTerm)

  const termParams = terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*`
    return acc
  }, {})

  const typeConstraints = referenceType.to.map(type => buildConstraintFromType(type, termParams))

  filters.push(typeConstraints.join('||'))

  const query = `*[!(_id in path('drafts.**')) && (${filters.join(') && (')})][0..1000]`

  return client.observable
    .fetch(query, termParams)
    .pipe(map(data => sortResultsByScore(data, terms).slice(0, 20)))
}
